export const LESSON_DURATION_MINUTES = 50;
export const SLOT_INCREMENT_MINUTES = 15;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

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

  if (dateBlockers.some((b) => b.start_time === null || b.end_time === null)) return [];
  if (ranges.length === 0) return [];

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
      const overlaps = bookedRanges.some(
        (booked) => candidate < booked.end && candidateEnd > booked.start,
      );
      if (!overlaps) slots.push(minutesToTime(candidate));
      candidate += SLOT_INCREMENT_MINUTES;
    }
  }

  return slots;
}
