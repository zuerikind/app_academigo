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
    { data: paymentsData },
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
    supabase.from("payments").select("amount"),
  ]);

  const totalRevenue = (paymentsData ?? []).reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0,
  );

  return {
    teacherCount: teacherCount ?? 0,
    studentCount: studentCount ?? 0,
    bookingCount: bookingCount ?? 0,
    pendingTeachers: pendingTeachers ?? 0,
    pendingPromotions: pendingPromotions ?? 0,
    pendingPayouts: pendingPayouts ?? 0,
    totalRevenue,
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
      teachers ( payout_info_placeholder, profiles ( full_name, email ) )
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
      teachers ( payout_info_placeholder, profiles ( full_name, email ) )
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

export async function getTeacherPerformance(from?: string, to?: string) {
  const supabase = await createClient();

  // Query 1: completed bookings in period, with earnings, teacher info, and reviews
  let bookingsQuery = supabase
    .from("bookings")
    .select(`
      id,
      start_time,
      credits_reserved,
      teacher_id,
      teachers (
        id,
        teacher_level,
        profiles ( full_name )
      ),
      teacher_earnings ( amount ),
      reviews ( rating )
    `)
    .eq("status", "completed")
    .order("start_time", { ascending: false });

  if (from) bookingsQuery = bookingsQuery.gte("start_time", from);
  if (to) bookingsQuery = bookingsQuery.lte("start_time", to);

  // Query 2: all-time payments with package credits to compute WAC
  // WAC (weighted average credit value) is intentionally global — a student
  // may buy credits in month A and consume them in month B.
  const paymentsQuery = supabase
    .from("payments")
    .select("amount, credit_packages ( credits )")
    .in("status", ["completed", "pending"]);

  const [{ data: bookings }, { data: payments }] = await Promise.all([
    bookingsQuery,
    paymentsQuery,
  ]);

  // Compute WAC: total CHF paid / total credits issued
  let totalPaid = 0;
  let totalCreditsIssued = 0;
  for (const p of payments ?? []) {
    totalPaid += Number(p.amount);
    const pkg = Array.isArray(p.credit_packages) ? p.credit_packages[0] : p.credit_packages;
    totalCreditsIssued += (pkg as { credits: number } | null)?.credits ?? 0;
  }
  const avgCreditValue = totalCreditsIssued > 0 ? totalPaid / totalCreditsIssued : 0;

  // Aggregate per teacher
  type TeacherAcc = {
    id: string;
    name: string;
    level: "junior" | "academigo_teacher" | "verified";
    sessions: number;
    teacherPayout: number;
    studentRevenue: number;
    ratings: number[];
  };
  const teacherMap: Record<string, TeacherAcc> = {};

  for (const b of bookings ?? []) {
    const teacherRaw = Array.isArray(b.teachers) ? b.teachers[0] : b.teachers;
    if (!teacherRaw || !b.teacher_id) continue;

    if (!teacherMap[b.teacher_id]) {
      const profilesRaw = Array.isArray(teacherRaw.profiles)
        ? teacherRaw.profiles[0]
        : teacherRaw.profiles;
      teacherMap[b.teacher_id] = {
        id: b.teacher_id,
        name: (profilesRaw as { full_name: string | null } | null)?.full_name ?? "—",
        level: teacherRaw.teacher_level as TeacherAcc["level"],
        sessions: 0,
        teacherPayout: 0,
        studentRevenue: 0,
        ratings: [],
      };
    }

    const acc = teacherMap[b.teacher_id]!;
    acc.sessions += 1;

    // Teacher payout: sum of teacher_earnings for this booking
    const earningsArr = Array.isArray(b.teacher_earnings)
      ? b.teacher_earnings
      : b.teacher_earnings
        ? [b.teacher_earnings]
        : [];
    acc.teacherPayout += earningsArr.reduce(
      (s: number, e: { amount: number }) => s + Number(e.amount),
      0,
    );

    // Revenue: credits consumed × WAC
    acc.studentRevenue += b.credits_reserved * avgCreditValue;

    // Ratings
    const reviewsArr = Array.isArray(b.reviews)
      ? b.reviews
      : b.reviews
        ? [b.reviews]
        : [];
    for (const r of reviewsArr as { rating: number }[]) {
      if (r?.rating) acc.ratings.push(r.rating);
    }
  }

  const teacherRows = Object.values(teacherMap).map((t) => ({
    id: t.id,
    name: t.name,
    level: t.level,
    sessions: t.sessions,
    teacherPayout: t.teacherPayout,
    studentRevenue: t.studentRevenue,
    platformMargin: t.studentRevenue - t.teacherPayout,
    marginPct:
      t.studentRevenue > 0
        ? ((t.studentRevenue - t.teacherPayout) / t.studentRevenue) * 100
        : 0,
    avgRating:
      t.ratings.length > 0
        ? t.ratings.reduce((s, r) => s + r, 0) / t.ratings.length
        : null,
    reviewCount: t.ratings.length,
  }));

  const summary = {
    sessions: teacherRows.reduce((s, t) => s + t.sessions, 0),
    studentRevenue: teacherRows.reduce((s, t) => s + t.studentRevenue, 0),
    teacherPayout: teacherRows.reduce((s, t) => s + t.teacherPayout, 0),
    platformMargin: teacherRows.reduce((s, t) => s + t.platformMargin, 0),
  };

  return { teacherRows, summary, avgCreditValue };
}

export async function getPlatformRevenue() {
  const supabase = await createClient();

  const [{ data: paymentsData }, { data: payoutsData }] = await Promise.all([
    supabase
      .from("payments")
      .select("amount, created_at")
      .in("status", ["completed", "pending"]),
    supabase
      .from("payout_requests")
      .select("amount_chf, created_at")
      .in("status", ["processed", "paid"]),
  ]);

  const payments = paymentsData ?? [];
  const payouts = payoutsData ?? [];

  const grossRevenue = payments.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalPayouts = payouts.reduce((sum, r) => sum + Number(r.amount_chf), 0);
  const platformMargin = grossRevenue - totalPayouts;

  // Monthly breakdown grouped by YYYY-MM
  const monthlyMap: Record<string, { revenue: number; payouts: number }> = {};

  for (const p of payments) {
    const month = p.created_at.slice(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { revenue: 0, payouts: 0 };
    monthlyMap[month]!.revenue += Number(p.amount);
  }
  for (const p of payouts) {
    const month = p.created_at.slice(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { revenue: 0, payouts: 0 };
    monthlyMap[month]!.payouts += Number(p.amount_chf);
  }

  const monthly = Object.entries(monthlyMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, { revenue, payouts: p }]) => ({
      id: month,
      month,
      revenue,
      payouts: p,
      margin: revenue - p,
    }));

  return { grossRevenue, totalPayouts, platformMargin, monthly };
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
