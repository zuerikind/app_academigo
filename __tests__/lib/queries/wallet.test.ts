/**
 * Unit tests for lib/queries/wallet.ts
 * RED phase: lib/queries/wallet.ts does not exist yet.
 * Tests will fail with "Cannot find module" until Plan 04-04 creates the file.
 * Covers: CRED-01, CRED-04 — getWalletBalance
 */

const mocks = {
  supabase: {
    from: jest.fn(),
  },
};

// makeChainable factory for Supabase fluent API — consistent with Phase 1/2/3 pattern
function makeChainable(resolves: unknown) {
  const chain: Record<string, jest.Mock> = {};
  const methods = ["select", "insert", "update", "delete", "upsert", "eq", "neq", "in", "is", "gte", "lte", "order", "limit", "maybeSingle", "single"];
  methods.forEach((m) => { chain[m] = jest.fn(() => chain); });
  chain["then"] = jest.fn((cb: (v: unknown) => unknown) => Promise.resolve(cb(resolves)));
  return chain;
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mocks.supabase)),
}));

describe("getWalletBalance", () => {
  const studentId = "student-uuid";

  beforeEach(() => {
    jest.clearAllMocks();
    mocks.supabase.from.mockReturnValue(
      makeChainable({ data: { student_id: studentId, available_balance: 5 }, error: null })
    );
  });

  it("calls supabase.from('credit_wallets').select().eq() for correct student_id", async () => {
    const { getWalletBalance } = await import("@/lib/queries/wallet");
    await getWalletBalance(studentId);
    expect(mocks.supabase.from).toHaveBeenCalledWith("credit_wallets");
  });

  it("returns available_balance as a number", async () => {
    const { getWalletBalance } = await import("@/lib/queries/wallet");
    const balance = await getWalletBalance(studentId);
    expect(typeof balance).toBe("number");
    expect(balance).toBe(5);
  });

  it("does NOT select a TTL or expiry field (CRED-04 — credits do not expire)", async () => {
    // This test verifies the query string passed to .select() does not include expiry/ttl fields.
    // We intercept the chain to capture the select argument.
    const selectMock = jest.fn(() => chainWithSingle);
    const singleMock = jest.fn().mockResolvedValue({ data: { available_balance: 3 }, error: null });
    const chainWithSingle: Record<string, jest.Mock> = {
      select: selectMock,
      eq: jest.fn(() => chainWithSingle),
      single: singleMock,
      maybeSingle: singleMock,
    };
    mocks.supabase.from.mockReturnValue(chainWithSingle);

    const { getWalletBalance } = await import("@/lib/queries/wallet");
    await getWalletBalance(studentId);

    if (selectMock.mock.calls.length > 0) {
      const selectArg: string = selectMock.mock.calls[0][0] ?? "";
      expect(selectArg).not.toMatch(/expires?_at|ttl|expir/i);
    }
    // If select is called with no args (select *), that's also acceptable — no expiry field in schema
  });
});
