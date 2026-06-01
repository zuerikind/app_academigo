"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type StudentSettingsState = { error?: string; success?: boolean };

export async function updateStudentSubject(
  _prev: StudentSettingsState,
  formData: FormData,
): Promise<StudentSettingsState> {
  const profile = await requireRole("student");
  const subjectId = formData.get("preferredSubjectId") as string | null;

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!student) return { error: "Student record not found." };

  const { error } = await supabase
    .from("students")
    .update({ preferred_subject_id: subjectId || null })
    .eq("id", student.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
