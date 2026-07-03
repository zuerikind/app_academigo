"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type LessonActionState = { error?: string; success?: boolean };

export async function completeLesson(
  _prev: LessonActionState,
  formData: FormData,
): Promise<LessonActionState> {
  await requireRole("teacher");
  const supabase = await createClient();

  const lessonId = formData.get("lessonId")?.toString();
  if (!lessonId) return { error: "Missing lesson ID." };

  const { error } = await supabase.rpc("complete_lesson", { p_lesson_id: lessonId });
  if (error) {
    if (error.message?.includes("lesson_not_found")) return { error: "Lesson not found." };
    if (error.message?.includes("invalid_lesson_status")) return { error: "Lesson cannot be completed in its current state." };
    return { error: error.message };
  }
  revalidatePath("/", "layout");
  return { success: true };
}

export async function cancelLesson(
  _prev: LessonActionState,
  formData: FormData,
): Promise<LessonActionState> {
  // Both students and teachers can cancel — just require auth (ponytail: no per-role cancel RPC; zero credit change per CRED-03)
  await requireProfile();
  const supabase = await createClient();

  const lessonId = formData.get("lessonId")?.toString();
  if (!lessonId) return { error: "Missing lesson ID." };

  // Only cancellable states — completed/cancelled lessons must stay untouched.
  // RLS (lessons_update participant policy) enforces ownership.
  const { data: updated, error } = await supabase
    .from("lessons")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", lessonId)
    .in("status", ["pending", "confirmed", "reschedule_requested"])
    .select("id");

  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "Lesson not found or cannot be cancelled in its current state." };
  }
  revalidatePath("/", "layout");
  return { success: true };
}
