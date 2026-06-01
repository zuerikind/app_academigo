/**
 * Unit tests for lib/actions/payments.ts — createCheckoutSession
 * RED phase: lib/actions/payments.ts does not exist yet.
 * Tests will fail with "Cannot find module" until Plan 03-04 creates the file.
 * Covers: PAY-02
 */

const mocks = {
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
  requireRole: jest.fn(),
  redirect: jest.fn(),
};

// makeChainable factory for Supabase fluent API — consistent with Phase 1/2 pattern
function makeChainable(resolves: unknown) {
  const chain: Record<string, jest.Mock> = {};
  const methods = ["select", "insert", "update", "delete", "upsert", "eq", "neq", "in", "is", "gte", "lte", "order", "limit", "maybeSingle", "single"];
  methods.forEach(m => { chain[m] = jest.fn(() => chain); });
  chain["then"] = jest.fn((cb: (v: unknown) => unknown) => Promise.resolve(cb(resolves)));
  return chain;
}

jest.mock("next/navigation", () => ({ redirect: (...args: unknown[]) => mocks.redirect(...args) }));
jest.mock("@/lib/auth/session", () => ({ requireRole: (...args: unknown[]) => mocks.requireRole(...args) }));
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mocks.supabase)),
}));
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: "https://checkout.stripe.com/test" }),
      },
    },
  }));
});

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(entries).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("createCheckoutSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: "student-uuid" });
    mocks.redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
  });

  it("createCheckoutSession creates Stripe session and redirects", async () => {
    const { createCheckoutSession } = await import("@/lib/actions/payments");
    mocks.supabase.from.mockReturnValue(
      makeChainable({
        data: { id: "pkg-uuid", stripe_price_id: "price_test123", name: "Single Session" },
        error: null,
      })
    );
    const fd = makeFormData({ packageId: "pkg-uuid" });
    await createCheckoutSession({} as any, fd).catch((e) => {
      // redirect() throws NEXT_REDIRECT — that's expected on success
      if (!String(e.message).includes("NEXT_REDIRECT")) throw e;
    });
    expect(mocks.redirect).toHaveBeenCalledWith("https://checkout.stripe.com/test");
  });

  it("createCheckoutSession returns error when package not found", async () => {
    const { createCheckoutSession } = await import("@/lib/actions/payments");
    mocks.supabase.from.mockReturnValue(
      makeChainable({ data: null, error: { message: "Not found" } })
    );
    const fd = makeFormData({ packageId: "nonexistent-pkg" });
    const result = await createCheckoutSession({} as any, fd);
    expect(result).toHaveProperty("error");
  });
});
