"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type AvailabilityActionState = { error?: string };

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const rangeSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z
    .string()
    .regex(timePattern, "startTime must be HH:MM (00:00–23:59)"),
  endTime: z
    .string()
    .regex(timePattern, "endTime must be HH:MM (00:00–23:59)"),
});

const blockerSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

export async function setAvailabilityRange(
  _prev: AvailabilityActionState,
  formData: FormData,
): Promise<AvailabilityActionState> {
  let profile: Awaited<ReturnType<typeof requireRole>>;
  try {
    profile = await requireRole("teacher");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Not authenticated" };
  }

  const parsed = rangeSchema.safeParse({
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { dayOfWeek, startTime, endTime } = parsed.data;

  const supabase = await createClient();

  // Look up teacher record
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!teacher) return { error: "Teacher record not found." };

  const { error } = await supabase.from("teacher_availability_ranges").insert({
    teacher_id: teacher.id,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function removeAvailabilityRange(
  _prev: AvailabilityActionState,
  formData: FormData,
): Promise<AvailabilityActionState> {
  try {
    await requireRole("teacher");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Not authenticated" };
  }

  const rangeId = (formData.get("rangeId") as string)?.trim();
  if (!rangeId) return { error: "rangeId is required." };

  const supabase = await createClient();

  // RLS policies enforce ownership at the DB level
  const { error } = await supabase
    .from("teacher_availability_ranges")
    .delete()
    .eq("id", rangeId);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function setAvailabilityBlocker(
  _prev: AvailabilityActionState,
  formData: FormData,
): Promise<AvailabilityActionState> {
  let profile: Awaited<ReturnType<typeof requireRole>>;
  try {
    profile = await requireRole("teacher");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Not authenticated" };
  }

  const parsed = blockerSchema.safeParse({
    date: formData.get("date"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid date" };
  }

  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!teacher) return { error: "Teacher record not found." };

  const { error } = await supabase
    .from("teacher_availability_blockers")
    .insert({
      teacher_id: teacher.id,
      blocked_date: parsed.data.date,
    });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function removeAvailabilityBlocker(
  _prev: AvailabilityActionState,
  formData: FormData,
): Promise<AvailabilityActionState> {
  try {
    await requireRole("teacher");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Not authenticated" };
  }

  const blockerId = (formData.get("blockerId") as string)?.trim();
  if (!blockerId) return { error: "blockerId is required." };

  const supabase = await createClient();

  // RLS policies enforce ownership at the DB level
  const { error } = await supabase
    .from("teacher_availability_blockers")
    .delete()
    .eq("id", blockerId);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}
