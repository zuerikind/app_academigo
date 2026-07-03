import { createClient } from "@/lib/supabase/server";
import { generateAllSlots, generateSlots, LESSON_DURATION_MINUTES } from "@/lib/utils/slots";
import { zurichNow } from "@/lib/utils/zurich";

/** Slot times are Zurich wall-clock; hide slots already in the past for today. */
function isPastSlot(dateStr: string, slotTime: string): boolean {
  const now = zurichNow();
  return dateStr < now.date || (dateStr === now.date && slotTime <= now.time);
}

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
  }).filter((slot) => !isPastSlot(dateStr, slot));
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
    available: allSlots
      .filter((s) => !s.blocked && !isPastSlot(dateStr, s.time))
      .map((s) => s.time),
    unavailable: allSlots
      .filter((s) => s.blocked || (!s.blocked && isPastSlot(dateStr, s.time)))
      .map((s) => s.time),
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

  const daysInMonth = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, "0");
  const monthStart = `${year}-${mm}-01T00:00:00.000Z`;
  const monthEnd = `${year}-${mm}-${String(daysInMonth).padStart(2, "0")}T23:59:59.999Z`;

  // Three queries for the whole month instead of ~3 per day
  const [{ data: rangesRaw }, { data: blockersRaw }, { data: bookingsRaw }] = await Promise.all([
    supabase
      .from("teacher_availability_ranges")
      .select("day_of_week, start_time, end_time")
      .eq("teacher_id", teacherId),
    supabase
      .from("teacher_availability_blockers")
      .select("blocked_date, start_time, end_time")
      .eq("teacher_id", teacherId),
    supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("teacher_id", teacherId)
      .in("status", ["confirmed", "pending"])
      .gte("start_time", monthStart)
      .lte("start_time", monthEnd),
  ]);

  const rangesByDow = new Map<number, Array<{ start: string; end: string }>>();
  for (const r of rangesRaw ?? []) {
    const dow = r.day_of_week as number;
    if (!rangesByDow.has(dow)) rangesByDow.set(dow, []);
    rangesByDow.get(dow)!.push({ start: r.start_time as string, end: r.end_time as string });
  }
  if (rangesByDow.size === 0) return [];

  const blockers = (blockersRaw ?? []).map((b) => ({
    date: b.blocked_date as string,
    start_time: b.start_time as string | null,
    end_time: b.end_time as string | null,
  }));

  const bookedByDate = new Map<string, Array<{ start: string; end: string }>>();
  for (const b of bookingsRaw ?? []) {
    const start = new Date(b.start_time as string);
    const end = new Date(b.end_time as string);
    const dateKey = (b.start_time as string).slice(0, 10);
    if (!bookedByDate.has(dateKey)) bookedByDate.set(dateKey, []);
    bookedByDate.get(dateKey)!.push({
      start: `${String(start.getUTCHours()).padStart(2, "0")}:${String(start.getUTCMinutes()).padStart(2, "0")}`,
      end: `${String(end.getUTCHours()).padStart(2, "0")}:${String(end.getUTCMinutes()).padStart(2, "0")}`,
    });
  }

  const availableDays: number[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${mm}-${String(d).padStart(2, "0")}`;
    const dow = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
    const ranges = rangesByDow.get(dow);
    if (!ranges) continue;

    const slots = generateSlots({
      date: dateStr,
      ranges,
      blockers,
      bookedSlots: bookedByDate.get(dateStr) ?? [],
      durationMinutes: LESSON_DURATION_MINUTES,
    }).filter((slot) => !isPastSlot(dateStr, slot));

    if (slots.length > 0) availableDays.push(d);
  }

  return availableDays;
}
