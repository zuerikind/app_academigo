/**
 * Unit tests for lib/utils/schedule.ts
 * RED phase: lib/utils/schedule.ts does not exist yet.
 * Tests will fail with "Cannot find module" until Plan 04-03 creates the file.
 * Covers: LES-01, LES-02 — computeOccurrences unit tests
 */

describe("computeOccurrences", () => {
  // Monday = weekday 0 (ISO: 0=Mon, 1=Tue, … 6=Sun)
  // JS Date.getDay(): 0=Sun, 1=Mon, … 6=Sat
  // Conversion: isoDay = (jsDay + 6) % 7

  const schedule = {
    id: "sched-uuid",
    student_id: "student-uuid",
    teacher_id: "teacher-uuid",
    weekday: 0, // Monday
    start_time: "14:00",
    end_time: "14:50",
  };

  it("returns only dates that fall on the correct ISO weekday (Monday)", async () => {
    const { computeOccurrences } = await import("@/lib/utils/schedule");
    // from = a Sunday, so the first Monday is the next day
    const from = new Date("2026-07-05T00:00:00Z"); // Sunday
    const to = new Date("2026-07-19T00:00:00Z");   // 2 weeks later
    const results = computeOccurrences(schedule, from, to);
    // Mondays in window: 2026-07-06, 2026-07-13
    expect(results.length).toBe(2);
    results.forEach((r) => {
      const d = new Date(r.start_time);
      const isoDay = (d.getUTCDay() + 6) % 7;
      expect(isoDay).toBe(0); // Monday
    });
  });

  it("returns all matching weekday occurrences in a 6-week window (no more, no less)", async () => {
    const { computeOccurrences } = await import("@/lib/utils/schedule");
    const from = new Date("2026-07-06T00:00:00Z"); // Monday
    const to = new Date(from.getTime() + 42 * 24 * 60 * 60 * 1000); // 6 weeks
    const results = computeOccurrences(schedule, from, to);
    // 6 weeks = 6 Mondays; from is a Monday but start_time 14:00 > from (midnight), so all 6 included
    expect(results.length).toBe(6);
  });

  it("returns empty array if no matching weekdays in window", async () => {
    const { computeOccurrences } = await import("@/lib/utils/schedule");
    const saturdaySchedule = { ...schedule, weekday: 5 }; // Saturday
    const from = new Date("2026-07-06T00:00:00Z"); // Monday
    const to = new Date("2026-07-10T23:59:59Z");   // Friday — no Saturday
    const results = computeOccurrences(saturdaySchedule, from, to);
    expect(results.length).toBe(0);
  });

  it("results include schedule_id, student_id, teacher_id, start_time (ISO), end_time (ISO), status='confirmed'", async () => {
    const { computeOccurrences } = await import("@/lib/utils/schedule");
    const from = new Date("2026-07-05T00:00:00Z");
    const to = new Date("2026-07-08T00:00:00Z");
    const results = computeOccurrences(schedule, from, to);
    expect(results.length).toBeGreaterThan(0);
    const r = results[0];
    expect(r).toHaveProperty("schedule_id", "sched-uuid");
    expect(r).toHaveProperty("student_id", "student-uuid");
    expect(r).toHaveProperty("teacher_id", "teacher-uuid");
    expect(r).toHaveProperty("start_time");
    expect(r).toHaveProperty("end_time");
    expect(r).toHaveProperty("status", "confirmed");
    // ISO string check
    expect(() => new Date(r.start_time)).not.toThrow();
    expect(() => new Date(r.end_time)).not.toThrow();
  });

  it("does not return occurrences in the past (start_time <= from)", async () => {
    const { computeOccurrences } = await import("@/lib/utils/schedule");
    // from = Monday 15:00 — the 14:00 slot on the same day is already past
    const from = new Date("2026-07-06T15:00:00Z");
    const to = new Date("2026-07-13T23:59:59Z");
    const results = computeOccurrences(schedule, from, to);
    results.forEach((r) => {
      expect(new Date(r.start_time).getTime()).toBeGreaterThan(from.getTime());
    });
  });

  it("ISO weekday conversion is correct — getDay()=1 (Monday in JS) maps to isoDay=0", async () => {
    const { computeOccurrences } = await import("@/lib/utils/schedule");
    // 2026-07-06 is a Monday (getDay()=1 in JS)
    const from = new Date("2026-07-05T23:59:59Z");
    const to = new Date("2026-07-07T00:00:00Z");
    const results = computeOccurrences(schedule, from, to);
    expect(results.length).toBe(1);
    const d = new Date(results[0].start_time);
    expect(d.getUTCHours()).toBe(14);
    expect(d.getUTCMinutes()).toBe(0);
  });
});
