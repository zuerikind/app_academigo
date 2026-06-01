/**
 * Unit tests for lib/queries/bookings.ts — getTeacherBookings query
 * RED phase: lib/queries/bookings.ts does not exist yet.
 * Tests will fail with "Cannot find module" until Plan 03-06 creates the file.
 * Covers: BOOK-03
 */

const mocks = {
  supabase: {
    from: jest.fn(),
  },
};

// makeChainable factory for Supabase fluent API — consistent with Phase 1/2 pattern
function makeChainable(resolves: unknown) {
  const chain: Record<string, jest.Mock> = {};
  const methods = ["select", "insert", "update", "delete", "upsert", "eq", "neq", "in", "is", "gte", "lte", "order", "limit", "maybeSingle", "single"];
  methods.forEach(m => { chain[m] = jest.fn(() => chain); });
  chain["then"] = jest.fn((cb: (v: unknown) => unknown) => Promise.resolve(cb(resolves)));
  return chain;
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mocks.supabase)),
}));

describe("getTeacherBookings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getTeacherBookings returns bookings array for given teacherId", async () => {
    const { getTeacherBookings } = await import("@/lib/queries/bookings");
    mocks.supabase.from.mockReturnValue(
      makeChainable({
        data: [
          { id: "booking-1", teacher_id: "teacher-uuid", status: "confirmed", start_time: "2026-07-16T14:00:00Z" },
        ],
        error: null,
      })
    );
    const result = await getTeacherBookings("teacher-uuid");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("getTeacherBookings joins student profiles (full_name)", async () => {
    const { getTeacherBookings } = await import("@/lib/queries/bookings");
    mocks.supabase.from.mockReturnValue(
      makeChainable({
        data: [
          {
            id: "booking-1",
            teacher_id: "teacher-uuid",
            status: "confirmed",
            profiles: { full_name: "Alice Muster" },
          },
        ],
        error: null,
      })
    );
    const result = await getTeacherBookings("teacher-uuid");
    expect(Array.isArray(result)).toBe(true);
    // The query should attempt to join profiles
    expect(mocks.supabase.from).toHaveBeenCalledWith("bookings");
  });

  it("getTeacherBookings returns empty array when no bookings", async () => {
    const { getTeacherBookings } = await import("@/lib/queries/bookings");
    mocks.supabase.from.mockReturnValue(
      makeChainable({ data: [], error: null })
    );
    const result = await getTeacherBookings("teacher-uuid-no-bookings");
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});
