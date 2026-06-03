import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/types/database";

const VALID_BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
];

export async function getAdminStats() {
  const supabase = await createClient();

  const [
    { count: teacherCount },
    { count: studentCount },
    { count: bookingCount },
    { count: pendingTeachers },
    { count: pendingPromotions },
    { count: pendingPayouts },
  ] = await Promise.all([
    supabase.from("teachers").select("*", { count: "exact", head: true }),
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase
      .from("teachers")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", false)
      .eq("is_active", true),
    supabase
      .from("level_promotion_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("payout_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return {
    teacherCount: teacherCount ?? 0,
    studentCount: studentCount ?? 0,
    bookingCount: bookingCount ?? 0,
    pendingTeachers: pendingTeachers ?? 0,
    pendingPromotions: pendingPromotions ?? 0,
    pendingPayouts: pendingPayouts ?? 0,
  };
}

export async function getAdminTeachers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select(
      `
      id,
      is_approved,
      is_active,
      is_verified,
      teacher_level,
      created_at,
      profiles ( full_name, email )
    `,
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function getAdminTeacherDetail(teacherId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select(
      `
      id,
      is_approved,
      is_verified,
      is_active,
      teacher_level,
      bio,
      education,
      experience,
      teaching_style,
      location,
      languages,
      offers_online,
      offers_in_person,
      payout_info_placeholder,
      created_at,
      profiles ( full_name, email, avatar_url ),
      teacher_subjects ( subjects ( id, name, slug ) )
    `,
    )
    .eq("id", teacherId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function getAdminStudents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id,
      created_at,
      profiles ( full_name, email ),
      student_credits ( total_credits, used_credits, reserved_credits )
    `,
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function getAdminBookings(status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("bookings")
    .select(
      `
      id,
      status,
      start_time,
      end_time,
      credits_reserved,
      created_at,
      students ( profiles ( full_name ) ),
      teachers ( profiles ( full_name ) )
    `,
    )
    .order("created_at", { ascending: false });

  if (status && (VALID_BOOKING_STATUSES as string[]).includes(status)) {
    query = query.eq("status", status as BookingStatus);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data;
}

export async function getAdminPayouts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payout_requests")
    .select(
      `
      id,
      amount_chf,
      status,
      note,
      created_at,
      teachers ( profiles ( full_name, email ) )
    `,
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function getAdminPayoutsWithEarnings() {
  const supabase = await createClient();

  const { data: payouts, error } = await supabase
    .from("payout_requests")
    .select(
      `
      id,
      amount_chf,
      status,
      note,
      created_at,
      teachers ( profiles ( full_name, email ) )
    `,
    )
    .order("created_at", { ascending: false });

  if (error || !payouts) return [];

  // Fetch earnings linked to these payouts (requires migration 20260603000007).
  // If the column doesn't exist yet the query errors gracefully and earnings
  // are omitted rather than breaking the whole page.
  const payoutIds = payouts.map((p) => p.id);
  const { data: earnings } = payoutIds.length
    ? await supabase
        .from("teacher_earnings")
        .select(
          `
          id,
          amount,
          payout_request_id,
          bookings (
            start_time,
            students ( profiles ( full_name ) ),
            subjects ( name )
          )
        `,
        )
        .in("payout_request_id", payoutIds)
    : { data: [] };

  type EarningItem = NonNullable<typeof earnings>[number];
  const earningsByPayout = (earnings ?? []).reduce<Record<string, EarningItem[]>>((acc, e) => {
    const pid = (e as any).payout_request_id as string;
    if (!acc[pid]) acc[pid] = [];
    acc[pid]!.push(e);
    return acc;
  }, {});

  return payouts.map((p) => ({
    ...p,
    teacher_earnings: earningsByPayout[p.id] ?? [],
  }));
}

// EARN-04/05 confirmed: this query reads rows inserted by requestPayout (lib/actions/earnings.ts).
// requestPayout inserts: { teacher_id, amount_chf, status: 'pending' }
// Column alignment verified in Phase 3 plan 03-11.
export async function getPayoutRequests() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payout_requests")
    .select(
      `
      id,
      teacher_id,
      amount_chf,
      status,
      created_at,
      teachers ( profiles ( full_name ) )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAdminSessions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      start_time,
      end_time,
      session_rating,
      teacher_private_notes,
      students ( profiles ( full_name ) ),
      teachers ( profiles ( full_name ) ),
      reviews ( rating, comment )
    `,
    )
    .eq("status", "completed")
    .order("start_time", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function getMissingMeetLinks() {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id, start_time,
      teachers ( id, profiles ( full_name ) ),
      students ( profiles ( full_name ) )
    `,
    )
    .eq("status", "confirmed")
    .is("meeting_link", null)
    .gte("start_time", now)
    .order("start_time", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getPlatformSettings(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("platform_settings").select("key, value");
  if (!data) return {};
  return Object.fromEntries((data as Array<{ key: string; value: string }>).map((r) => [r.key, r.value]));
}

export async function getAdminPromotions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("level_promotion_requests")
    .select(
      `
      id,
      requested_level,
      status,
      note,
      created_at,
      teachers (
        id,
        teacher_level,
        profiles ( full_name, email )
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}
