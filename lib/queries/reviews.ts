import { createClient } from "@/lib/supabase/server";

export type ReviewWithStudent = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  student: { profiles: { full_name: string } };
};

export async function getTeacherReviews(teacherId: string): Promise<ReviewWithStudent[]> {
  const supabase = await createClient();

  // reviewer_name is snapshotted at insert time — RLS hides other students'
  // profiles, so a live join would render every name as "Student".
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, reviewer_name")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    student: { profiles: { full_name: r.reviewer_name ?? "Student" } },
  }));
}

export async function getReviewAggregate(
  teacherId: string,
): Promise<{ averageRating: number; totalCount: number }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("rating")
    .eq("teacher_id", teacherId);

  if (!data || data.length === 0) return { averageRating: 0, totalCount: 0 };

  const totalCount = data.length;
  const averageRating = data.reduce((sum, r) => sum + r.rating, 0) / totalCount;
  return { averageRating: Math.round(averageRating * 10) / 10, totalCount };
}
