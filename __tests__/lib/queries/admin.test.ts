/**
 * Unit tests for lib/queries/admin.ts — getPayoutRequests query
 * Covers: EARN-04, EARN-05
 *
 * NOTE: The existing lib/queries/admin.ts exports getAdminPayouts (Phase 2).
 * The getPayoutRequests function is expected from Phase 3 (Plan 03-11).
 * These tests will be RED until 03-11 adds getPayoutRequests, confirming the EARN-04/05 column contract.
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

describe("getPayoutRequests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getPayoutRequests returns payout_requests rows including teacher_id, amount_chf, status", async () => {
    const { getPayoutRequests } = await import("@/lib/queries/admin");
    mocks.supabase.from.mockReturnValue(
      makeChainable({
        data: [
          {
            id: "payout-uuid",
            teacher_id: "teacher-uuid",
            amount_chf: 200.0,
            status: "pending",
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
        error: null,
      })
    );
    const result = await getPayoutRequests();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("amount_chf");
    expect(result[0]).toHaveProperty("status");
  });

  it("getPayoutRequests joins teacher name via profiles", async () => {
    const { getPayoutRequests } = await import("@/lib/queries/admin");
    mocks.supabase.from.mockReturnValue(
      makeChainable({
        data: [
          {
            id: "payout-uuid",
            amount_chf: 150.0,
            status: "pending",
            teachers: { profiles: { full_name: "Max Muster" } },
          },
        ],
        error: null,
      })
    );
    const result = await getPayoutRequests();
    expect(Array.isArray(result)).toBe(true);
    expect(mocks.supabase.from).toHaveBeenCalledWith("payout_requests");
  });

  it("getPayoutRequests returns empty array when no payout requests exist", async () => {
    const { getPayoutRequests } = await import("@/lib/queries/admin");
    mocks.supabase.from.mockReturnValue(
      makeChainable({ data: [], error: null })
    );
    const result = await getPayoutRequests();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});
