import { createServiceClient } from "@/lib/supabase/service";
import type { TeacherListItem } from "@/lib/types";

type TeacherRow = {
  id: string;
  bio: string | null;
  experience: string | null;
  is_verified: boolean;
  offers_online: boolean;
  offers_in_person: boolean;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  teacher_subjects: {
    subjects: { id: string; name: string; slug: string } | null;
  }[];
};

function mapTeacher(
  row: TeacherRow,
  avg_rating: number | null = null,
  review_count: number = 0,
): TeacherListItem {
  return {
    id: row.id,
    fullName: row.profiles?.full_name ?? "Teacher",
    avatarUrl: row.profiles?.avatar_url ?? null,
    bio: row.bio,
    experience: row.experience,
    isVerified: row.is_verified,
    offersOnline: row.offers_online,
    offersInPerson: row.offers_in_person,
    subjects: row.teacher_subjects
      .map((ts) => ts.subjects)
      .filter((s): s is { id: string; name: string; slug: string } => s != null),
    avg_rating,
    review_count,
  };
}

export async function getApprovedTeachers(): Promise<TeacherListItem[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("teachers")
    .select(
      `
      id,
      bio,
      experience,
      is_verified,
      offers_online,
      offers_in_person,
      profiles ( full_name, avatar_url ),
      teacher_subjects ( subjects ( id, name, slug ) )
    `,
    )
    .eq("is_approved", true)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const teachers = data as unknown as TeacherRow[];

  // Fetch review aggregates for all approved teachers
  const teacherIds = teachers.map((t) => t.id);
  let ratingMap = new Map<string, { sum: number; count: number }>();

  if (teacherIds.length > 0) {
    const { data: reviewsRaw } = await supabase
      .from("reviews")
      .select("teacher_id, rating")
      .in("teacher_id", teacherIds);

    for (const r of reviewsRaw ?? []) {
      const entry = ratingMap.get(r.teacher_id as string) ?? { sum: 0, count: 0 };
      entry.sum += r.rating as number;
      entry.count++;
      ratingMap.set(r.teacher_id as string, entry);
    }
  }

  return teachers.map((row) => {
    const agg = ratingMap.get(row.id);
    const avg_rating = agg ? Math.round((agg.sum / agg.count) * 10) / 10 : null;
    const review_count = agg?.count ?? 0;
    return mapTeacher(row, avg_rating, review_count);
  });
}

export async function getTeacherById(
  teacherId: string,
): Promise<TeacherListItem | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("teachers")
    .select(
      `
      id,
      bio,
      experience,
      is_verified,
      offers_online,
      offers_in_person,
      profiles ( full_name, avatar_url ),
      teacher_subjects ( subjects ( id, name, slug ) )
    `,
    )
    .eq("id", teacherId)
    .eq("is_approved", true)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return mapTeacher(data as unknown as TeacherRow);
}

export type TeacherProfileDetail = TeacherListItem & {
  education: string | null;
  teachingStyle: string | null;
  location: string | null;
  languages: string[];
};

export async function getTeacherProfileDetail(
  teacherId: string,
): Promise<TeacherProfileDetail | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("teachers")
    .select(
      `
      id,
      bio,
      experience,
      education,
      teaching_style,
      location,
      languages,
      is_verified,
      offers_online,
      offers_in_person,
      profiles ( full_name, avatar_url ),
      teacher_subjects ( subjects ( id, name, slug ) )
    `,
    )
    .eq("id", teacherId)
    .eq("is_approved", true)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as TeacherRow & {
    education: string | null;
    teaching_style: string | null;
    location: string | null;
    languages: string[];
  };

  return {
    ...mapTeacher(row),
    education: row.education,
    teachingStyle: row.teaching_style,
    location: row.location,
    languages: row.languages ?? [],
  };
}
