import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/lib/types/index";

export type LedgerEntry = {
  id: string;
  type: "purchase" | "session";
  label: string;
  delta: number;
  date: string;
  balanceAfter: number;
};

export async function getStudentCreditLedger(profileId: string): Promise<LedgerEntry[]> {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!student) return [];

  const [{ data: payments }, { data: sessions }] = await Promise.all([
    supabase
      .from("payments")
      .select("id, created_at, credit_packages ( name, credits )")
      .eq("student_id", student.id)
      .eq("status", "completed"),
    supabase
      .from("bookings")
      .select("id, end_time, teachers ( profiles ( full_name ) )")
      .eq("student_id", student.id)
      .eq("status", "completed"),
  ]);

  type RawEntry = { id: string; type: "purchase" | "session"; label: string; delta: number; date: string };
  const raw: RawEntry[] = [];

  for (const p of payments ?? []) {
    const pkg = p.credit_packages as unknown as { name: string; credits: number } | null;
    raw.push({
      id: `payment-${p.id}`,
      type: "purchase",
      label: pkg?.name ?? "Package",
      delta: pkg?.credits ?? 0,
      date: p.created_at,
    });
  }

  for (const b of sessions ?? []) {
    const teacher = b.teachers as unknown as { profiles: { full_name: string } | { full_name: string }[] } | null;
    const name = teacher
      ? Array.isArray(teacher.profiles)
        ? teacher.profiles[0]?.full_name
        : teacher.profiles?.full_name
      : null;
    raw.push({
      id: `session-${b.id}`,
      type: "session",
      label: name ?? "Teacher",
      delta: -1,
      date: b.end_time,
    });
  }

  // Sort oldest → newest to compute running balance
  raw.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let balance = 0;
  const withBalance: LedgerEntry[] = raw.map((e) => {
    balance += e.delta;
    return { ...e, balanceAfter: balance };
  });

  // Return newest first for display
  return withBalance.reverse();
}

export type PaymentHistoryItem = {
  id: string;
  packageName: string;
  packageSlug: string;
  amountChf: number;
  paidAt: string;
};

export type StudentBillingInfo = {
  activePlan: {
    packageName: string;
    packageSlug: string;
    purchasedAt: string;
  } | null;
  paymentHistory: PaymentHistoryItem[];
  creditsRemaining: number;
  availableCredits: number;
};

export async function getStudentBillingInfo(profileId: string): Promise<StudentBillingInfo> {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  const empty: StudentBillingInfo = {
    activePlan: null,
    paymentHistory: [],
    creditsRemaining: 0,
    availableCredits: 0,
  };

  if (!student) return empty;

  const [{ data: credits }, { data: rpcTotal }, { data: payments }] = await Promise.all([
    supabase
      .from("student_credits")
      .select("extra_credits, used_credits, reserved_credits")
      .eq("student_id", student.id)
      .maybeSingle(),
    supabase.rpc("student_available_credits"),
    supabase
      .from("payments")
      .select("id, amount, created_at, credit_packages ( name, slug )")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false }),
  ]);

  const extra = credits?.extra_credits ?? 0;
  const used = credits?.used_credits ?? 0;
  const availableCredits = typeof rpcTotal === "number" ? rpcTotal : Math.max(0, extra - used);
  const creditsRemaining = Math.max(0, extra - used);

  const history: PaymentHistoryItem[] = (payments ?? []).map((p: any) => ({
    id: p.id,
    packageName: p.credit_packages?.name ?? "Package",
    packageSlug: p.credit_packages?.slug ?? "",
    amountChf: Number(p.amount),
    paidAt: p.created_at,
  }));

  if (history.length === 0) return { ...empty, availableCredits, creditsRemaining };

  const latest = history[0];
  const activePlan = {
    packageName: latest.packageName,
    packageSlug: latest.packageSlug,
    purchasedAt: latest.paidAt,
  };

  return { activePlan, paymentHistory: history, availableCredits, creditsRemaining };
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

export async function getStudentPendingReviewCount(studentId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("id, reviews(id)")
    .eq("student_id", studentId)
    .eq("status", "completed");

  if (!data) return 0;
  return data.filter((b: any) => !b.reviews || b.reviews.length === 0).length;
}

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
      upcomingBookings: [] as UpcomingStudentBooking[],
      purchasedPackages: [] as { name: string; credits: number }[],
    };
  }

  const [{ data: credits }, { data: rpcTotal }] = await Promise.all([
    supabase
      .from("student_credits")
      .select("extra_credits, used_credits, reserved_credits")
      .eq("student_id", student.id)
      .maybeSingle(),
    supabase.rpc("student_available_credits"),
  ]);

  const extra = credits?.extra_credits ?? 0;
  const used = credits?.used_credits ?? 0;
  const availableCredits = typeof rpcTotal === "number" ? rpcTotal : Math.max(0, extra - used);

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
    upcomingBookings,
    purchasedPackages: [] as { name: string; credits: number }[],
    studentId: student.id,
  };
}
