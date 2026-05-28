import { createClient } from "@/lib/supabase/server";

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
      upcomingBookings: [] as { id: string; start_time: string; status: string }[],
      purchasedPackages: [] as { name: string; credits: number }[],
    };
  }

  const { data: credits } = await supabase
    .from("student_credits")
    .select("total_credits, used_credits, reserved_credits")
    .eq("student_id", student.id)
    .maybeSingle();

  const availableCredits = credits
    ? credits.total_credits - credits.used_credits - credits.reserved_credits
    : 0;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, start_time, status")
    .eq("student_id", student.id)
    .in("status", ["pending", "confirmed"])
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(5);

  return {
    availableCredits,
    upcomingBookings: bookings ?? [],
    purchasedPackages: [] as { name: string; credits: number }[],
    studentId: student.id,
  };
}
