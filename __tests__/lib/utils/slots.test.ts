/**
 * Unit tests for lib/utils/slots.ts — generateSlots algorithm
 * RED phase: lib/utils/slots.ts does not exist yet.
 * Tests will fail with "Cannot find module" until Plan 03-03 creates the file.
 * Covers: AVAIL-03
 */

describe("generateSlots", () => {
  it("returns empty array when date is in blockedDates", async () => {
    const { generateSlots } = await import("@/lib/utils/slots");
    const result = generateSlots({
      date: "2026-07-15",
      ranges: [{ start: "10:00", end: "12:00" }],
      blockedDates: ["2026-07-15"],
      bookedSlots: [],
      durationMinutes: 50,
    });
    expect(result).toEqual([]);
  });

  it("returns 15-min increment slots for a simple range (14:00-15:00 → 14:00 slot for 50-min duration)", async () => {
    const { generateSlots } = await import("@/lib/utils/slots");
    const result = generateSlots({
      date: "2026-07-16",
      ranges: [{ start: "14:00", end: "15:00" }],
      blockedDates: [],
      bookedSlots: [],
      durationMinutes: 50,
    });
    // A 50-min session starting at 14:00 ends at 14:50, fits within 15:00
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toBe("14:00");
  });

  it("excludes booked slots that overlap with candidate", async () => {
    const { generateSlots } = await import("@/lib/utils/slots");
    const result = generateSlots({
      date: "2026-07-16",
      ranges: [{ start: "10:00", end: "12:00" }],
      blockedDates: [],
      bookedSlots: [{ start: "10:00", end: "10:50" }],
      durationMinutes: 50,
    });
    // 10:00 slot is booked, 10:15 also overlaps — should be excluded
    expect(Array.isArray(result)).toBe(true);
    expect(result).not.toContain("10:00");
  });

  it("returns empty array when no ranges provided", async () => {
    const { generateSlots } = await import("@/lib/utils/slots");
    const result = generateSlots({
      date: "2026-07-16",
      ranges: [],
      blockedDates: [],
      bookedSlots: [],
      durationMinutes: 50,
    });
    expect(result).toEqual([]);
  });
});
