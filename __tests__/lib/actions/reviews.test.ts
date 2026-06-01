/**
 * Unit tests for lib/actions/reviews.ts — submitReview
 * RED phase: lib/actions/reviews.ts does not exist yet.
 * Tests will fail with "Cannot find module" until Plan 03-09 creates the file.
 * Covers: REV-01
 */

const mocks = {
  supabase: {
    from: jest.fn(),
  },
  requireRole: jest.fn(),
  revalidatePath: jest.fn(),
};

// makeChainable factory for Supabase fluent API — consistent with Phase 1/2 pattern
function makeChainable(resolves: unknown) {
  const chain: Record<string, jest.Mock> = {};
  const methods = ["select", "insert", "update", "delete", "upsert", "eq", "neq", "in", "is", "gte", "lte", "order", "limit", "maybeSingle", "single"];
  methods.forEach(m => { chain[m] = jest.fn(() => chain); });
  chain["then"] = jest.fn((cb: (v: unknown) => unknown) => Promise.resolve(cb(resolves)));
  return chain;
}

jest.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => mocks.revalidatePath(...args) }));
jest.mock("@/lib/auth/session", () => ({ requireRole: (...args: unknown[]) => mocks.requireRole(...args) }));
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mocks.supabase)),
}));

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(entries).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("submitReview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: "student-uuid" });
  });

  it("submitReview inserts review with rating and optional comment", async () => {
    const { submitReview } = await import("@/lib/actions/reviews");
    mocks.supabase.from.mockReturnValue(
      makeChainable({ data: { id: "review-uuid" }, error: null })
    );
    const fd = makeFormData({
      bookingId: "booking-uuid",
      rating: "5",
      comment: "Excellent teacher, very patient!",
    });
    const result = await submitReview({} as any, fd);
    expect(result).toBeDefined();
    expect(mocks.supabase.from).toHaveBeenCalledWith("reviews");
  });

  it("submitReview returns error when booking already has a review (unique constraint violation)", async () => {
    const { submitReview } = await import("@/lib/actions/reviews");
    mocks.supabase.from.mockReturnValue(
      makeChainable({
        data: null,
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      })
    );
    const fd = makeFormData({ bookingId: "booking-uuid", rating: "4" });
    const result = await submitReview({} as any, fd);
    expect(result).toHaveProperty("error");
  });

  it("submitReview returns error when booking status is not completed", async () => {
    const { submitReview } = await import("@/lib/actions/reviews");
    // Booking lookup returns non-completed status
    mocks.supabase.from.mockReturnValue(
      makeChainable({ data: { id: "booking-uuid", status: "confirmed" }, error: null })
    );
    const fd = makeFormData({ bookingId: "booking-uuid", rating: "5" });
    const result = await submitReview({} as any, fd);
    expect(result).toHaveProperty("error");
  });
});
