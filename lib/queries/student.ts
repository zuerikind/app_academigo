import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/lib/types/index";

export type PaymentHistoryItem = {
  id: string;
  packageName: string;
  packageSlug: string;
  amountChf: number;
  paidAt: string;
  isSubscription: boolean;
};

export type StudentBillingInfo = {
  activePlan: {
    packageName: string;
    isSubscription: boolean;
    nextRenewalAt: string | null;
    packageSlug: string;
    purchasedAt: string;
  } | null;
  paymentHistory: PaymentHistoryItem[];
  subscriptionRemaining: number;
  extraRemaining: number;
  availableCredits: number;
  stripeCustomerId: string | null;
};

function computeNextRenewal(lastPaymentIso: string): string {
  const last = new Date(lastPaymentIso);
  const dayOfMonth = last.getUTCDate();
  const today = new Date();
  const todayMs = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  let year = today.getUTCFullYear();
  let month = today.getUTCMonth();

  const clampDay = (y: number, m: number) =>
    Math.min(dayOfMonth, new Date(y, m + 1, 0).getDate());

  const candidateMs = Date.UTC(year, month, clampDay(year, month));
  if (candidateMs <= todayMs) {
    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }
  return new Date(Date.UTC(year, month, clampDay(year, month))).toISOString();
}

export async function getStudentBillingInfo(profileId: string): Promise<StudentBillingInfo> {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, stripe_customer_id")
    .eq("profile_id", profileId)
    .maybeSingle();

  const empty: StudentBillingInfo = {
    activePlan: null,
    paymentHistory: [],
    subscriptionRemaining: 0,
    extraRemaining: 0,
    availableCredits: 0,
    stripeCustomerId: null,
  };

  if (!student) return empty;

  const [{ data: credits }, { data: rpcTotal }, { data: payments }] = await Promise.all([
    supabase
      .from("student_credits")
      .select("subscription_credits, extra_credits, used_credits, reserved_credits")
      .eq("student_id", student.id)
      .maybeSingle(),
    supabase.rpc("student_available_credits"),
    supabase
      .from("payments")
      .select("id, amount, created_at, credit_packages ( name, slug, is_subscription )")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false }),
  ]);

  const sub = credits?.subscription_credits ?? 0;
  const extra = credits?.extra_credits ?? 0;
  const used = credits?.used_credits ?? 0;
  const reserved = credits?.reserved_credits ?? 0;
  const availableCredits = typeof rpcTotal === "number" ? rpcTotal : Math.max(0, sub + extra - used - reserved);
  // For display, only deduct permanently used credits — reservations are temporary
  // holds for pending bookings and the credits still belong to the student.
  const subscriptionRemaining = Math.max(0, sub - used);
  const extraRemaining = Math.max(0, extra - Math.max(0, used - sub));

  const history: PaymentHistoryItem[] = (payments ?? []).map((p: any) => ({
    id: p.id,
    packageName: p.credit_packages?.name ?? "Package",
    packageSlug: p.credit_packages?.slug ?? "",
    amountChf: Number(p.amount),
    paidAt: p.created_at,
    isSubscription: p.credit_packages?.is_subscription ?? false,
  }));

  const stripeCustomerId = student.stripe_customer_id ?? null;

  if (history.length === 0) return { ...empty, availableCredits, subscriptionRemaining, extraRemaining, stripeCustomerId };

  const latest = history[0];
  const activePlan = {
    packageName: latest.packageName,
    isSubscription: latest.isSubscription,
    packageSlug: latest.packageSlug,
    nextRenewalAt: latest.isSubscription ? computeNextRenewal(latest.paidAt) : null,
    purchasedAt: latest.paidAt,
  };

  return { activePlan, paymentHistory: history, availableCredits, subscriptionRemaining, extraRemaining, stripeCustomerId };
}

export async function getStudentRecord(profileId: string): Promise<Student | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data as Student | null;
}

export type UpcomingStudentBooking = {
  id: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed";
  meeting_link: string | null;
  topic_note: string | null;
  teacherName: string;
  subjects: { id: string; name: string; slug: string }[];
};

export async function getStudentDashboardData(profileId: string) {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!student) {
    return {
      availableCredits: 0,
      subscriptionRemaining: 0,
      extraRemaining: 0,
      upcomingBookings: [] as UpcomingStudentBooking[],
      purchasedPackages: [] as { name: string; credits: number }[],
    };
  }

  const [{ data: credits }, { data: rpcTotal }] = await Promise.all([
    supabase
      .from("student_credits")
      .select("subscription_credits, extra_credits, used_credits, reserved_credits")
      .eq("student_id", student.id)
      .maybeSingle(),
    supabase.rpc("student_available_credits"),
  ]);

  const sub = credits?.subscription_credits ?? 0;
  const extra = credits?.extra_credits ?? 0;
  const used = credits?.used_credits ?? 0;
  const reserved = credits?.reserved_credits ?? 0;
  const availableCredits = typeof rpcTotal === "number" ? rpcTotal : Math.max(0, sub + extra - used - reserved);
  const subscriptionRemaining = Math.max(0, sub - used);
  const extraRemaining = Math.max(0, extra - Math.max(0, used - sub));

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, start_time, end_time, status, meeting_link, topic_note,
      teachers ( id, profiles ( full_name ) ),
      booking_subjects ( subjects ( id, name, slug ) )
    `)
    .eq("student_id", student.id)
    .in("status", ["pending", "confirmed"])
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(5);

  const upcomingBookings: UpcomingStudentBooking[] = (bookings ?? []).map((b: any) => ({
    id: b.id,
    start_time: b.start_time,
    end_time: b.end_time,
    status: b.status,
    meeting_link: b.meeting_link ?? null,
    topic_note: b.topic_note ?? null,
    teacherName: b.teachers
      ? (Array.isArray(b.teachers.profiles)
          ? b.teachers.profiles[0]?.full_name
          : b.teachers.profiles?.full_name) ?? "Teacher"
      : "Teacher",
    subjects: (Array.isArray(b.booking_subjects) ? b.booking_subjects : [])
      .map((bs: any) => bs.subjects)
      .filter(Boolean),
  }));

  return {
    availableCredits,
    subscriptionRemaining,
    extraRemaining,
    upcomingBookings,
    purchasedPackages: [] as { name: string; credits: number }[],
    studentId: student.id,
  };
}
