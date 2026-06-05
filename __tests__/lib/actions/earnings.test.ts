/**
 * Unit tests for lib/actions/earnings.ts — requestPayout
 * RED phase: lib/actions/earnings.ts does not exist yet.
 * Tests will fail with "Cannot find module" until Plan 03-11 creates the file.
 * Covers: EARN-03
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

describe("requestPayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: "teacher-uuid" });
  });

  it("requestPayout inserts payout_requests row with full pending balance", async () => {
    const { requestPayout } = await import("@/lib/actions/earnings");
    // Call order: teachers → teacher_earnings → payout_requests (insert) → teacher_earnings (update)
    let callCount = 0;
    mocks.supabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // teachers lookup
        return makeChainable({ data: { id: "teacher-uuid", payout_info_placeholder: "IBAN CH12 3456 7890" }, error: null });
      }
      if (callCount === 2) {
        // teacher_earnings select (returns array)
        return makeChainable({ data: [{ amount: 150.0 }], error: null });
      }
      // payout_requests insert + teacher_earnings update
      return makeChainable({ data: { id: "payout-uuid" }, error: null });
    });
    const fd = makeFormData({});
    const result = await requestPayout({} as any, fd);
    expect(result).toBeDefined();
    expect(mocks.supabase.from).toHaveBeenCalledWith("payout_requests");
  });

  it("requestPayout returns error when no pending earnings exist", async () => {
    const { requestPayout } = await import("@/lib/actions/earnings");
    mocks.supabase.from.mockReturnValue(
      makeChainable({ data: { pending_amount_chf: 0 }, error: null })
    );
    const fd = makeFormData({});
    const result = await requestPayout({} as any, fd);
    expect(result).toHaveProperty("error");
  });

  it("requestPayout returns error when payout already pending", async () => {
    const { requestPayout } = await import("@/lib/actions/earnings");
    // existing pending payout
    mocks.supabase.from.mockReturnValue(
      makeChainable({
        data: null,
        error: { code: "P0001", message: "payout_already_pending" },
      })
    );
    const fd = makeFormData({});
    const result = await requestPayout({} as any, fd);
    expect(result).toHaveProperty("error");
  });
});
