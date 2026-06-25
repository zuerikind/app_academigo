export interface ScheduleInput {
  id: string;
  student_id: string;
  teacher_id: string;
  weekday: number; // 0=Monday … 6=Sunday (ISO weekday)
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
}

export interface LessonOccurrence {
  schedule_id: string;
  student_id: string;
  teacher_id: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
  status: "confirmed";
}

export function computeOccurrences(
  schedule: ScheduleInput,
  from: Date,
  to: Date,
): LessonOccurrence[] {
  const results: LessonOccurrence[] = [];

  // Start cursor at UTC midnight of the `from` date
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);

  const [startH, startM] = schedule.start_time.split(":").map(Number);
  const [endH, endM] = schedule.end_time.split(":").map(Number);

  while (cursor <= to) {
    // Convert JS weekday (0=Sun) to ISO weekday (0=Mon)
    const isoDay = (cursor.getUTCDay() + 6) % 7;

    if (isoDay === schedule.weekday) {
      const startTs = new Date(cursor);
      startTs.setUTCHours(startH, startM, 0, 0);

      const endTs = new Date(cursor);
      endTs.setUTCHours(endH, endM, 0, 0);

      // Only future occurrences strictly inside the window
      if (startTs > from && startTs <= to) {
        results.push({
          schedule_id: schedule.id,
          student_id: schedule.student_id,
          teacher_id: schedule.teacher_id,
          start_time: startTs.toISOString(),
          end_time: endTs.toISOString(),
          status: "confirmed",
        });
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return results;
}
