import { createClient } from "@/lib/supabase/server";

export function teacherProfileCompletion(teacher: {
  bio: string | null;
  education: string | null;
  experience: string | null;
  teaching_style: string | null;
  payout_info_placeholder: string | null;
} | null): number {
  if (!teacher) return 0;
  const fields = [
    teacher.bio,
    teacher.education,
    teacher.experience,
    teacher.teaching_style,
    teacher.payout_info_placeholder,
  ];
  const filled = fields.filter((f) => f && f.trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

export async function getTeacherDashboardData(profileId: string) {
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!teacher) {
    return {
      pendingRequests: 0,
      upcomingLessons: 0,
      completedLessons: 0,
      profileCompletion: 0,
      isApproved: false,
      isVerified: false,
    };
  }

  const now = new Date().toISOString();

  const [pendingResult, upcomingResult, completedResult, bookingsResult] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("teacher_id", teacher.id).eq("status", "pending"),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("teacher_id", teacher.id).eq("status", "confirmed").gte("start_time", now),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("teacher_id", teacher.id).eq("status", "completed"),
    supabase.from("bookings").select(`id, start_time, end_time, meeting_link, topic_note, students ( id, profiles ( full_name ) ), booking_subjects ( subjects ( id, name, slug ) )`).eq("teacher_id", teacher.id).eq("status", "confirmed").gte("start_time", now).order("start_time", { ascending: true }).limit(5),
  ]);

  const upcomingBookings = (bookingsResult.data ?? []).map((b: any) => ({
    id: b.id as string,
    start_time: b.start_time as string,
    end_time: b.end_time as string,
    meeting_link: (b.meeting_link ?? null) as string | null,
    topic_note: (b.topic_note ?? null) as string | null,
    studentName: b.students ? (Array.isArray(b.students.profiles) ? b.students.profiles[0]?.full_name : b.students.profiles?.full_name) ?? "Student" : "Student",
    subjects: (Array.isArray(b.booking_subjects) ? b.booking_subjects : []).map((bs: any) => bs.subjects).filter(Boolean) as { id: string; name: string; slug: string }[],
  }));

  return {
    pendingRequests: pendingResult.count ?? 0,
    upcomingLessons: upcomingResult.count ?? 0,
    completedLessons: completedResult.count ?? 0,
    profileCompletion: teacherProfileCompletion(teacher),
    isApproved: teacher.is_approved,
    isVerified: teacher.is_verified,
    upcomingBookings,
  };
}
