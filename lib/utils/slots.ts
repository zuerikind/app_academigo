export const LESSON_DURATION_MINUTES = 50;
export const SLOT_INCREMENT_MINUTES = 15;

/**
 * Pure function that generates available lesson start times for a given date.
 *
 * @param date - Date string in "YYYY-MM-DD" format
 * @param ranges - Array of availability ranges with start/end in "HH:MM" format
 * @param blockedDates - Array of "YYYY-MM-DD" strings to exclude entirely
 * @param bookedSlots - Array of already-booked slots with start/end in "HH:MM" format
 * @param durationMinutes - Lesson duration in minutes (default: LESSON_DURATION_MINUTES)
 * @returns Array of available start times in "HH:MM" format
 */
export function generateSlots({
  date,
  ranges,
  blockedDates,
  bookedSlots,
  durationMinutes = LESSON_DURATION_MINUTES,
}: {
  date: string;
  ranges: Array<{ start: string; end: string }>;
  blockedDates: string[];
  bookedSlots: Array<{ start: string; end: string }>;
  durationMinutes?: number;
}): string[] {
  // If the date is blocked, return no slots
  if (blockedDates.includes(date)) return [];

  // If no ranges defined, no slots available
  if (ranges.length === 0) return [];

  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // Convert booked slots to minutes for overlap checking
  const bookedRanges = bookedSlots.map((s) => ({
    start: timeToMinutes(s.start),
    end: timeToMinutes(s.end),
  }));

  const slots: string[] = [];

  for (const range of ranges) {
    const rangeStart = timeToMinutes(range.start);
    const rangeEnd = timeToMinutes(range.end);

    let candidate = rangeStart;
    while (candidate + durationMinutes <= rangeEnd) {
      const candidateEnd = candidate + durationMinutes;

      // Check if candidate overlaps with any booked slot
      const overlaps = bookedRanges.some(
        (booked) => candidate < booked.end && candidateEnd > booked.start,
      );

      if (!overlaps) {
        slots.push(minutesToTime(candidate));
      }

      candidate += SLOT_INCREMENT_MINUTES;
    }
  }

  return slots;
}
