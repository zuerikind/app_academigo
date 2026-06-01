import { createClient } from "@/lib/supabase/server";
import { generateSlots, LESSON_DURATION_MINUTES } from "@/lib/utils/slots";

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
    .select("id, blocked_date")
    .eq("teacher_id", teacherId)
    .order("blocked_date");

  if (error) throw error;
  return (data ?? []) as Array<{ id: string; blocked_date: string }>;
}

/**
 * Returns available slot times (HH:MM) for a specific date.
 */
export async function getAvailableSlotsForDay(
  teacherId: string,
  targetDate: Date,
): Promise<string[]> {
  const supabase = await createClient();

  const dayOfWeek = targetDate.getDay(); // 0=Sunday, 1=Monday, ...

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

  // Fetch blockers
  const { data: blockersRaw } = await supabase
    .from("teacher_availability_blockers")
    .select("blocked_date")
    .eq("teacher_id", teacherId);

  const blockedDates = (blockersRaw ?? []).map(
    (b) => b.blocked_date as string,
  );

  // Build date string for the target date
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  // Fetch confirmed/pending bookings for this teacher on this date
  const dayStart = `${dateStr}T00:00:00.000Z`;
  const dayEnd = `${dateStr}T23:59:59.999Z`;

  const { data: bookingsRaw } = await supabase
    .from("bookings")
    .select("starts_at, ends_at")
    .eq("teacher_id", teacherId)
    .in("status", ["confirmed", "pending"])
    .gte("starts_at", dayStart)
    .lte("starts_at", dayEnd);

  const bookedSlots = (bookingsRaw ?? []).map((b) => {
    const start = new Date(b.starts_at as string);
    const end = new Date(b.ends_at as string);
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
    blockedDates,
    bookedSlots,
    durationMinutes: LESSON_DURATION_MINUTES,
  });
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
    const targetDate = new Date(year, month - 1, d);
    if (coveredDows.has(targetDate.getDay())) {
      const slots = await getAvailableSlotsForDay(teacherId, targetDate);
      if (slots.length > 0) {
        availableDays.push(d);
      }
    }
  }

  return availableDays;
}
