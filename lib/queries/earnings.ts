import { createClient } from "@/lib/supabase/server";

export type EarningWithBooking = {
  id: string;
  amount_chf: number;
  created_at: string;
  booking: {
    student: { profiles: { full_name: string } };
  };
};

export type PayoutRequestRow = {
  id: string;
  amount_chf: number;
  status: string;
  created_at: string;
};

export async function getTeacherMonthlyEarnings(teacherId: string): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const { data, error } = await supabase
    .from("teacher_earnings")
    .select("amount")
    .eq("teacher_id", teacherId)
    .gte("created_at", monthStart);

  if (error || !data) return 0;

  return Math.round(
    (data as Array<{ amount: number }>).reduce((sum, row) => sum + (row.amount ?? 0), 0) * 100,
  ) / 100;
}

export async function getTeacherPayoutHistory(teacherId: string): Promise<PayoutRequestRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payout_requests")
    .select("id, amount_chf, status, created_at")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data as PayoutRequestRow[];
}

export async function getTeacherEarnings(teacherId: string): Promise<EarningWithBooking[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teacher_earnings")
    .select(`
      id, amount, created_at,
      bookings (
        students ( id, profiles ( full_name ) )
      )
    `)
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((e: any) => {
    const studentProfiles = e.bookings?.students?.profiles;
    const fullName = Array.isArray(studentProfiles)
      ? studentProfiles[0]?.full_name ?? "Student"
      : studentProfiles?.full_name ?? "Student";

    return {
      id: e.id,
      amount_chf: e.amount ?? 0,
      created_at: e.created_at,
      booking: {
        student: { profiles: { full_name: fullName } },
      },
    };
  });
}

export async function getTeacherTotalEarned(teacherId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_earnings")
    .select("amount")
    .eq("teacher_id", teacherId);
  if (error || !data) return 0;
  return Math.round(
    (data as Array<{ amount: number }>).reduce((sum, row) => sum + (row.amount ?? 0), 0) * 100,
  ) / 100;
}

export async function getTeacherPendingBalance(teacherId: string): Promise<number> {
  const supabase = await createClient();

  // "available" = earned but not yet requested for payout
  const { data, error } = await supabase
    .from("teacher_earnings")
    .select("amount")
    .eq("teacher_id", teacherId)
    .eq("status", "available");

  if (error || !data) return 0;

  const total = (data as Array<{ amount: number }>).reduce(
    (sum, row) => sum + (row.amount ?? 0),
    0,
  );

  return Math.round(total * 100) / 100;
}
