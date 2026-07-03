"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ScheduleActionState = { error?: string; success?: boolean };

export async function createSchedule(
  _prev: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const profile = await requireRole("student");
  const supabase = await createClient();

  const teacherId = formData.get("teacherId")?.toString();
  const weekdayStr = formData.get("weekday")?.toString();
  const startTime = formData.get("startTime")?.toString();
  const endTime = formData.get("endTime")?.toString();

  if (!teacherId || weekdayStr === undefined || !startTime || !endTime) {
    return { error: "Missing required fields." };
  }

  const weekday = parseInt(weekdayStr, 10);
  if (isNaN(weekday) || weekday < 0 || weekday > 6) {
    return { error: "Invalid weekday." };
  }

  // recurring_schedules.student_id references students.id, not profiles.id
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!student?.id) return { error: "Student record not found." };

  const { error } = await supabase.from("recurring_schedules").insert({
    student_id: student.id,
    teacher_id: teacherId,
    weekday,
    start_time: startTime,
    end_time: endTime,
    // ponytail: 'pending' per CONTEXT.md approval flow — teacher must approve before cron generates lessons
    status: "pending",
  });

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateScheduleStatus(
  _prev: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  // Both students and teachers call this (pause/resume/cancel/approve).
  // requireRole("student") redirected teachers away — requireProfile + RLS
  // participant policy on recurring_schedules is the correct gate.
  await requireProfile();
  const supabase = await createClient();

  const scheduleId = formData.get("scheduleId")?.toString();
  const newStatus = formData.get("status")?.toString();

  if (!scheduleId || !newStatus || !["active", "paused", "cancelled"].includes(newStatus)) {
    return { error: "Invalid request." };
  }

  const { data: updated, error } = await supabase
    .from("recurring_schedules")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", scheduleId)
    .select("id");

  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "Schedule not found." };
  }
  revalidatePath("/", "layout");
  return { success: true };
}
