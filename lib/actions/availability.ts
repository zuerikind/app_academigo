"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  getAvailableDaysForMonth,
  getAvailableSlotsForDay,
  getSlotsByStatusForDay,
} from "@/lib/queries/availability";

export type AvailabilityActionState = { error?: string; saved?: boolean };

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

const blockerSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
    startTime: z.string().regex(timePattern).optional().or(z.literal("")),
    endTime: z.string().regex(timePattern).optional().or(z.literal("")),
  })
  .refine(
    (v) => {
      const hasStart = v.startTime && v.startTime !== "";
      const hasEnd = v.endTime && v.endTime !== "";
      return hasStart === hasEnd; // both set or both absent
    },
    { message: "Both start time and end time must be set together" },
  );

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

export async function saveWeeklySchedule(
  _prev: AvailabilityActionState,
  formData: FormData,
): Promise<AvailabilityActionState> {
  let profile: Awaited<ReturnType<typeof requireRole>>;
  try {
    profile = await requireRole("teacher");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Not authenticated" };
  }

  const raw = (formData.get("schedule") as string)?.trim();
  if (!raw) return { error: "No schedule data provided." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Invalid schedule format." };
  }

  const scheduleSchema = z.array(
    z.object({
      day: z.number().int().min(0).max(6),
      slots: z
        .array(
          z.object({
            start: z.string().regex(timePattern, "Invalid start time"),
            end: z.string().regex(timePattern, "Invalid end time"),
          }),
        )
        .min(1),
    }),
  );

  const result = scheduleSchema.safeParse(parsed);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid schedule." };
  }

  for (const entry of result.data) {
    for (const slot of entry.slots) {
      if (slot.end <= slot.start) {
        return { error: `End time must be after start time (${slot.start} – ${slot.end}).` };
      }
    }
  }

  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!teacher) return { error: "Teacher record not found." };

  // Insert first, delete old rows after — a failed insert must not wipe the schedule
  const { data: oldRows } = await supabase
    .from("teacher_availability_ranges")
    .select("id")
    .eq("teacher_id", teacher.id);

  const rows = result.data.flatMap((entry) =>
    entry.slots.map((slot) => ({
      teacher_id: teacher.id,
      day_of_week: entry.day,
      start_time: slot.start,
      end_time: slot.end,
    })),
  );

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("teacher_availability_ranges")
      .insert(rows);
    if (insertError) return { error: insertError.message };
  }

  const oldIds = (oldRows ?? []).map((r) => r.id);
  if (oldIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("teacher_availability_ranges")
      .delete()
      .in("id", oldIds);
    if (deleteError) return { error: deleteError.message };
  }

  revalidatePath("/", "layout");
  return { saved: true };
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
    startTime: formData.get("startTime") ?? "",
    endTime: formData.get("endTime") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!teacher) return { error: "Teacher record not found." };

  const hasTimeRange = parsed.data.startTime && parsed.data.startTime !== "";

  const { error } = await supabase
    .from("teacher_availability_blockers")
    .insert({
      teacher_id: teacher.id,
      blocked_date: parsed.data.date,
      start_time: hasTimeRange ? (parsed.data.startTime ?? null) : null,
      end_time: hasTimeRange ? (parsed.data.endTime ?? null) : null,
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

/**
 * Server Action wrapper: returns available day-of-month numbers for a given month.
 * Called client-side when student navigates calendar months.
 */
export async function getAvailableDaysAction(
  teacherId: string,
  year: number,
  month: number,
): Promise<number[]> {
  return getAvailableDaysForMonth(teacherId, year, month);
}

/**
 * Server Action wrapper: returns available slot times (HH:MM) for a given date.
 * @param dateStr - Date in "YYYY-MM-DD" format (no timezone conversion)
 */
export async function getAvailableSlotsAction(
  teacherId: string,
  dateStr: string,
): Promise<string[]> {
  return getAvailableSlotsForDay(teacherId, dateStr);
}

/**
 * Server Action wrapper: returns all slots for a day split into available and unavailable.
 * Unavailable slots belong to the teacher's recurring schedule but are blocked by a booking or blocker.
 */
export async function getSlotsByStatusAction(
  teacherId: string,
  dateStr: string,
): Promise<{ available: string[]; unavailable: string[] }> {
  return getSlotsByStatusForDay(teacherId, dateStr);
}
