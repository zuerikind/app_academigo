import { createClient } from "@/lib/supabase/server";
import type { Subject } from "@/lib/types";

export async function getSubjects(): Promise<Subject[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("*")
    .order("is_coming_soon", { ascending: true })
    .order("name", { ascending: true });
  return data ?? [];
}

export async function getActiveSubjects(): Promise<Subject[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("*")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

type TeacherSubjectRow = {
  subjects: { slug: string } | null;
  teachers: { is_approved: boolean; is_active: boolean } | null;
};

/** Subject slugs taught by at least one approved, active teacher. */
export async function getSubjectSlugsWithApprovedTeachers(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teacher_subjects")
    .select("subjects ( slug ), teachers ( is_approved, is_active )");

  const slugs = new Set<string>();
  for (const row of (data ?? []) as unknown as TeacherSubjectRow[]) {
    if (
      row.subjects?.slug &&
      row.teachers?.is_approved &&
      row.teachers?.is_active
    ) {
      slugs.add(row.subjects.slug);
    }
  }
  return slugs;
}
