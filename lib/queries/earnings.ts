import { createClient } from "@/lib/supabase/server";

export type EarningWithBooking = {
  id: string;
  amount_chf: number;
  created_at: string;
  booking: {
    student: { profiles: { full_name: string } };
  };
};

export async function getTeacherEarnings(teacherId: string): Promise<EarningWithBooking[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teacher_earnings")
    .select(`
      id, amount_chf, created_at,
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
      amount_chf: e.amount_chf,
      created_at: e.created_at,
      booking: {
        student: { profiles: { full_name: fullName } },
      },
    };
  });
}

export async function getTeacherPendingBalance(teacherId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teacher_earnings")
    .select("amount_chf")
    .eq("teacher_id", teacherId)
    .is("payout_request_id", null);

  if (error || !data) return 0;

  const total = (data as Array<{ amount_chf: number }>).reduce(
    (sum, row) => sum + (row.amount_chf ?? 0),
    0,
  );

  return Math.round(total * 100) / 100;
}
