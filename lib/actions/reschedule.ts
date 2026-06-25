"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type RescheduleActionState = { error?: string; success?: boolean };

export async function requestReschedule(
  _prev: RescheduleActionState,
  formData: FormData,
): Promise<RescheduleActionState> {
  await requireRole("student");
  const supabase = await createClient();

  const lessonId = formData.get("lessonId")?.toString();
  const proposedStart = formData.get("proposedStart")?.toString();
  const proposedEnd = formData.get("proposedEnd")?.toString();

  if (!lessonId || !proposedStart || !proposedEnd) {
    return { error: "Missing required fields." };
  }

  // Accept 'confirmed' OR 'reschedule_requested' (Pitfall 3: student can update their proposal)
  const { data: lesson } = await supabase
    .from("lessons")
    .select("status")
    .eq("id", lessonId)
    .in("status", ["confirmed", "reschedule_requested"])
    .single();

  if (!lesson) return { error: "Lesson not found or not in a reschedulable state." };

  const { error } = await supabase
    .from("lessons")
    .update({
      status: "reschedule_requested",
      reschedule_proposed_start: proposedStart,
      reschedule_proposed_end: proposedEnd,
      reschedule_requested_by: "student",
      updated_at: new Date().toISOString(),
    })
    .eq("id", lessonId);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: true };
}

export async function approveReschedule(
  _prev: RescheduleActionState,
  formData: FormData,
): Promise<RescheduleActionState> {
  await requireRole("teacher");
  const supabase = await createClient();

  const lessonId = formData.get("lessonId")?.toString();
  if (!lessonId) return { error: "Missing lesson ID." };

  // Atomic: cancels original + creates new confirmed lesson — NO credit change (RESC-03)
  const { error } = await supabase.rpc("approve_reschedule", { p_lesson_id: lessonId });
  if (error) {
    if (error.message?.includes("lesson_not_found")) return { error: "Lesson not found." };
    if (error.message?.includes("invalid_lesson_status")) return { error: "Lesson is not in reschedule_requested state." };
    if (error.message?.includes("no_proposed_time")) return { error: "No proposed time set." };
    return { error: error.message };
  }
  revalidatePath("/", "layout");
  return { success: true };
}

export async function rejectReschedule(
  _prev: RescheduleActionState,
  formData: FormData,
): Promise<RescheduleActionState> {
  await requireRole("teacher");
  const supabase = await createClient();

  const lessonId = formData.get("lessonId")?.toString();
  if (!lessonId) return { error: "Missing lesson ID." };

  const { error } = await supabase.rpc("reject_reschedule", { p_lesson_id: lessonId });
  if (error) {
    if (error.message?.includes("lesson_not_found")) return { error: "Lesson not found." };
    if (error.message?.includes("invalid_lesson_status")) return { error: "Lesson is not in reschedule_requested state." };
    return { error: error.message };
  }
  revalidatePath("/", "layout");
  return { success: true };
}
