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

  const { count: pendingCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", teacher.id)
    .eq("status", "pending");

  const { count: upcomingCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", teacher.id)
    .eq("status", "confirmed")
    .gte("start_time", new Date().toISOString());

  const { count: completedCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", teacher.id)
    .eq("status", "completed");

  return {
    pendingRequests: pendingCount ?? 0,
    upcomingLessons: upcomingCount ?? 0,
    completedLessons: completedCount ?? 0,
    profileCompletion: teacherProfileCompletion(teacher),
    isApproved: teacher.is_approved,
    isVerified: teacher.is_verified,
  };
}
