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

  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id, rating, comment, created_at,
      students ( id, profiles ( full_name ) )
    `)
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((r: any) => {
    const studentProfiles = r.students?.profiles;
    const fullName = Array.isArray(studentProfiles)
      ? studentProfiles[0]?.full_name ?? "Student"
      : studentProfiles?.full_name ?? "Student";

    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      student: { profiles: { full_name: fullName } },
    };
  });
}

export async function getReviewAggregate(
  teacherId: string,
): Promise<{ averageRating: number; totalCount: number }> {
  const reviews = await getTeacherReviews(teacherId);

  if (reviews.length === 0) {
    return { averageRating: 0, totalCount: 0 };
  }

  const totalCount = reviews.length;
  const averageRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount;

  return { averageRating: Math.round(averageRating * 10) / 10, totalCount };
}
