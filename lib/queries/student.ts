import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/lib/types/index";

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
      upcomingBookings: [] as UpcomingStudentBooking[],
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
