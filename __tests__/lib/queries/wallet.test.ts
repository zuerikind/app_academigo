/**
 * Unit tests for lib/queries/wallet.ts
 * getWalletBalance reads the real ledger via the student_available_credits RPC
 * (credit_wallets was stale — never credited by purchases).
 */

const mocks = {
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
};

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mocks.supabase)),
}));

describe("getWalletBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.supabase.rpc.mockResolvedValue({ data: 5, error: null });
  });

  it("calls the student_available_credits RPC (session-scoped, no param)", async () => {
    const { getWalletBalance } = await import("@/lib/queries/wallet");
    await getWalletBalance();
    expect(mocks.supabase.rpc).toHaveBeenCalledWith("student_available_credits");
  });

  it("returns the balance as a number", async () => {
    const { getWalletBalance } = await import("@/lib/queries/wallet");
    const balance = await getWalletBalance();
    expect(typeof balance).toBe("number");
    expect(balance).toBe(5);
  });

  it("returns 0 on error or missing data", async () => {
    mocks.supabase.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const { getWalletBalance } = await import("@/lib/queries/wallet");
    expect(await getWalletBalance()).toBe(0);
  });
});
