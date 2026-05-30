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
