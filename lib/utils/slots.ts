export const LESSON_DURATION_MINUTES = 50;
export const SLOT_INCREMENT_MINUTES = 15;

/**
 * Returns all candidate slots from ranges, each tagged as blocked or not.
 * Blocked = overlaps with a booking, a time-ranged blocker, or a whole-day blocker.
 */
export function generateAllSlots({
  date,
  ranges,
  blockers = [],
  bookedSlots,
  durationMinutes = LESSON_DURATION_MINUTES,
}: {
  date: string;
  ranges: Array<{ start: string; end: string }>;
  blockers?: Array<{ date: string; start_time: string | null; end_time: string | null }>;
  bookedSlots: Array<{ start: string; end: string }>;
  durationMinutes?: number;
}): { time: string; blocked: boolean }[] {
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

  const dateBlockers = blockers.filter((b) => b.date === date);
  const wholeDayBlocked = dateBlockers.some((b) => b.start_time === null || b.end_time === null);

  const blockedRanges = [
    ...bookedSlots.map((s) => ({
      start: timeToMinutes(s.start),
      end: timeToMinutes(s.end),
    })),
    ...dateBlockers
      .filter((b) => b.start_time !== null && b.end_time !== null)
      .map((b) => ({
        start: timeToMinutes(b.start_time!),
        end: timeToMinutes(b.end_time!),
      })),
  ];

  const result: { time: string; blocked: boolean }[] = [];

  for (const range of ranges) {
    const rangeStart = timeToMinutes(range.start);
    const rangeEnd = timeToMinutes(range.end);

    let candidate = rangeStart;
    while (candidate + durationMinutes <= rangeEnd) {
      const candidateEnd = candidate + durationMinutes;
      const isBlocked =
        wholeDayBlocked ||
        blockedRanges.some((b) => candidate < b.end && candidateEnd > b.start);
      result.push({ time: minutesToTime(candidate), blocked: isBlocked });
      candidate += SLOT_INCREMENT_MINUTES;
    }
  }

  return result;
}

export function generateSlots({
  date,
  ranges,
  blockers = [],
  bookedSlots,
  durationMinutes = LESSON_DURATION_MINUTES,
}: {
  date: string;
  ranges: Array<{ start: string; end: string }>;
  blockers?: Array<{ date: string; start_time: string | null; end_time: string | null }>;
  bookedSlots: Array<{ start: string; end: string }>;
  durationMinutes?: number;
}): string[] {
  const dateBlockers = blockers.filter((b) => b.date === date);

  // If any blocker covers the whole day (null times), return no slots
  if (dateBlockers.some((b) => b.start_time === null || b.end_time === null)) return [];

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

  // Convert booked slots + time-ranged blockers to minutes for overlap checking
  const bookedRanges = [
    ...bookedSlots.map((s) => ({
      start: timeToMinutes(s.start),
      end: timeToMinutes(s.end),
    })),
    ...dateBlockers
      .filter((b) => b.start_time !== null && b.end_time !== null)
      .map((b) => ({
        start: timeToMinutes(b.start_time!),
        end: timeToMinutes(b.end_time!),
      })),
  ];

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
