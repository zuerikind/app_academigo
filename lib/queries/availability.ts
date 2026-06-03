import { createClient } from "@/lib/supabase/server";
import { generateAllSlots, generateSlots, LESSON_DURATION_MINUTES } from "@/lib/utils/slots";

export async function getTeacherAvailabilityRanges(teacherId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_availability_ranges")
    .select("id, day_of_week, start_time, end_time")
    .eq("teacher_id", teacherId)
    .order("day_of_week")
    .order("start_time");

  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
}

export async function getTeacherAvailabilityBlockers(teacherId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_availability_blockers")
    .select("id, blocked_date, start_time, end_time")
    .eq("teacher_id", teacherId)
    .order("blocked_date")
    .order("start_time");

  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    blocked_date: string;
    start_time: string | null;
    end_time: string | null;
  }>;
}

/**
 * Returns available slot times (HH:MM) for a specific date.
 * @param dateStr - Date in "YYYY-MM-DD" format (caller's local date, no timezone conversion)
 */
export async function getAvailableSlotsForDay(
  teacherId: string,
  dateStr: string,
): Promise<string[]> {
  const supabase = await createClient();

  // Use UTC date interpretation so "2026-06-03" → Tuesday regardless of server timezone
  const dayOfWeek = new Date(`${dateStr}T00:00:00Z`).getUTCDay(); // 0=Sunday, 1=Monday, ...

  // Fetch ranges for this day of week
  const { data: rangesRaw } = await supabase
    .from("teacher_availability_ranges")
    .select("start_time, end_time")
    .eq("teacher_id", teacherId)
    .eq("day_of_week", dayOfWeek);

  const ranges = (rangesRaw ?? []).map((r) => ({
    start: r.start_time as string,
    end: r.end_time as string,
  }));

  if (ranges.length === 0) return [];

  // Fetch blockers (with optional time ranges)
  const { data: blockersRaw } = await supabase
    .from("teacher_availability_blockers")
    .select("blocked_date, start_time, end_time")
    .eq("teacher_id", teacherId);

  const blockers = (blockersRaw ?? []).map((b) => ({
    date: b.blocked_date as string,
    start_time: b.start_time as string | null,
    end_time: b.end_time as string | null,
  }));

  // Fetch confirmed/pending bookings for this teacher on this date
  const dayStart = `${dateStr}T00:00:00.000Z`;
  const dayEnd = `${dateStr}T23:59:59.999Z`;

  const { data: bookingsRaw } = await supabase
    .from("bookings")
    .select("start_time, end_time")
    .eq("teacher_id", teacherId)
    .in("status", ["confirmed", "pending"])
    .gte("start_time", dayStart)
    .lte("start_time", dayEnd);

  const bookedSlots = (bookingsRaw ?? []).map((b) => {
    const start = new Date(b.start_time as string);
    const end = new Date(b.end_time as string);
    const startH = String(start.getUTCHours()).padStart(2, "0");
    const startM = String(start.getUTCMinutes()).padStart(2, "0");
    const endH = String(end.getUTCHours()).padStart(2, "0");
    const endM = String(end.getUTCMinutes()).padStart(2, "0");
    return {
      start: `${startH}:${startM}`,
      end: `${endH}:${endM}`,
    };
  });

  return generateSlots({
    date: dateStr,
    ranges,
    blockers,
    bookedSlots,
    durationMinutes: LESSON_DURATION_MINUTES,
  });
}

/**
 * Returns all slots for a day split by availability.
 * "unavailable" slots belong to the teacher's schedule but are blocked by a booking or blocker.
 */
export async function getSlotsByStatusForDay(
  teacherId: string,
  dateStr: string,
): Promise<{ available: string[]; unavailable: string[] }> {
  const supabase = await createClient();

  const dayOfWeek = new Date(`${dateStr}T00:00:00Z`).getUTCDay();

  const { data: rangesRaw } = await supabase
    .from("teacher_availability_ranges")
    .select("start_time, end_time")
    .eq("teacher_id", teacherId)
    .eq("day_of_week", dayOfWeek);

  const ranges = (rangesRaw ?? []).map((r) => ({
    start: r.start_time as string,
    end: r.end_time as string,
  }));

  if (ranges.length === 0) return { available: [], unavailable: [] };

  const { data: blockersRaw } = await supabase
    .from("teacher_availability_blockers")
    .select("blocked_date, start_time, end_time")
    .eq("teacher_id", teacherId);

  const blockers = (blockersRaw ?? []).map((b) => ({
    date: b.blocked_date as string,
    start_time: b.start_time as string | null,
    end_time: b.end_time as string | null,
  }));

  const dayStart = `${dateStr}T00:00:00.000Z`;
  const dayEnd = `${dateStr}T23:59:59.999Z`;

  const { data: bookingsRaw } = await supabase
    .from("bookings")
    .select("start_time, end_time")
    .eq("teacher_id", teacherId)
    .in("status", ["confirmed", "pending"])
    .gte("start_time", dayStart)
    .lte("start_time", dayEnd);

  const bookedSlots = (bookingsRaw ?? []).map((b) => {
    const start = new Date(b.start_time as string);
    const end = new Date(b.end_time as string);
    return {
      start: `${String(start.getUTCHours()).padStart(2, "0")}:${String(start.getUTCMinutes()).padStart(2, "0")}`,
      end: `${String(end.getUTCHours()).padStart(2, "0")}:${String(end.getUTCMinutes()).padStart(2, "0")}`,
    };
  });

  const allSlots = generateAllSlots({
    date: dateStr,
    ranges,
    blockers,
    bookedSlots,
    durationMinutes: LESSON_DURATION_MINUTES,
  });

  return {
    available: allSlots.filter((s) => !s.blocked).map((s) => s.time),
    unavailable: allSlots.filter((s) => s.blocked).map((s) => s.time),
  };
}

/**
 * Returns array of day-of-month numbers that have at least one available slot for a given month.
 */
export async function getAvailableDaysForMonth(
  teacherId: string,
  year: number,
  month: number,
): Promise<number[]> {
  const supabase = await createClient();

  // Fetch all ranges to know which day-of-weeks have coverage
  const { data: rangesRaw } = await supabase
    .from("teacher_availability_ranges")
    .select("day_of_week")
    .eq("teacher_id", teacherId);

  const coveredDows = new Set(
    (rangesRaw ?? []).map((r) => r.day_of_week as number),
  );

  if (coveredDows.size === 0) return [];

  const daysInMonth = new Date(year, month, 0).getDate();
  const availableDays: number[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
    if (coveredDows.has(dow)) {
      const slots = await getAvailableSlotsForDay(teacherId, dateStr);
      if (slots.length > 0) {
        availableDays.push(d);
      }
    }
  }

  return availableDays;
}
