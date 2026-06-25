import { createClient } from "@/lib/supabase/server";
import { getTeacherMonthlyEarnings, getTeacherTotalEarned } from "@/lib/queries/earnings";
import { getReviewAggregate } from "@/lib/queries/reviews";

type TeacherFields = {
  bio: string | null;
  education: string | null;
  experience: string | null;
  teaching_style: string | null;
  payout_info_placeholder: string | null;
};

export type ProfileFieldKey = "bio" | "education" | "experience" | "teaching_style" | "payout_info_placeholder";

export function teacherProfileCompletion(teacher: TeacherFields | null): number {
  if (!teacher) return 0;
  const fields = [teacher.bio, teacher.education, teacher.experience, teacher.teaching_style, teacher.payout_info_placeholder];
  return Math.round((fields.filter((f) => f && f.trim().length > 0).length / fields.length) * 100);
}

export function teacherMissingFields(teacher: TeacherFields | null): ProfileFieldKey[] {
  if (!teacher) return ["bio", "education", "experience", "teaching_style", "payout_info_placeholder"];
  const checks: [ProfileFieldKey, string | null][] = [
    ["bio", teacher.bio],
    ["education", teacher.education],
    ["experience", teacher.experience],
    ["teaching_style", teacher.teaching_style],
    ["payout_info_placeholder", teacher.payout_info_placeholder],
  ];
  return checks.filter(([, v]) => !v || !v.trim()).map(([k]) => k);
}

function mapBooking(b: any) {
  return {
    id: b.id as string,
    start_time: b.start_time as string,
    end_time: b.end_time as string,
    meeting_link: (b.meeting_link ?? null) as string | null,
    topic_note: (b.topic_note ?? null) as string | null,
    studentName: b.students
      ? (Array.isArray(b.students.profiles) ? b.students.profiles[0]?.full_name : b.students.profiles?.full_name) ?? "Student"
      : "Student",
    subjects: (Array.isArray(b.booking_subjects) ? b.booking_subjects : [])
      .map((bs: any) => bs.subjects)
      .filter(Boolean) as { id: string; name: string; slug: string }[],
  };
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
      missingFields: teacherMissingFields(null),
      isActive: true,
      isApproved: false,
      isVerified: false,
      teacherLevel: "junior" as string,
      averageRating: 0,
      reviewCount: 0,
      totalEarned: 0,
      monthlyEarnings: 0,
      upcomingBookings: [] as ReturnType<typeof mapBooking>[],
      pendingEvals: 0,
    };
  }

  const now = new Date().toISOString();

  const [pendingResult, upcomingResult, completedResult, bookingsResult, reviewStats, totalEarned, monthlyEarnings, pendingEvalResult] =
    await Promise.all([
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("teacher_id", teacher.id).eq("status", "pending"),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("teacher_id", teacher.id).eq("status", "confirmed").gte("start_time", now),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("teacher_id", teacher.id).eq("status", "completed"),
      supabase.from("bookings").select(`id, start_time, end_time, meeting_link, topic_note, students ( id, profiles ( full_name ) ), booking_subjects ( subjects ( id, name, slug ) )`).eq("teacher_id", teacher.id).eq("status", "confirmed").gte("start_time", now).order("start_time", { ascending: true }).limit(5),
      getReviewAggregate(teacher.id),
      getTeacherTotalEarned(teacher.id),
      getTeacherMonthlyEarnings(teacher.id),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("teacher_id", teacher.id).eq("status", "completed").is("teacher_private_notes", null),
    ]);

  const upcomingBookings = (bookingsResult.data ?? []).map(mapBooking);

  return {
    pendingRequests: pendingResult.count ?? 0,
    upcomingLessons: upcomingResult.count ?? 0,
    completedLessons: completedResult.count ?? 0,
    profileCompletion: teacherProfileCompletion(teacher),
    missingFields: teacherMissingFields(teacher),
    isActive: teacher.is_active as boolean,
    isApproved: teacher.is_approved,
    isVerified: teacher.is_verified,
    teacherLevel: teacher.teacher_level as string,
    averageRating: reviewStats.averageRating,
    reviewCount: reviewStats.totalCount,
    totalEarned,
    monthlyEarnings,
    upcomingBookings,
    pendingEvals: pendingEvalResult.count ?? 0,
  };
}
