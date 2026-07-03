/**
 * Unit tests for app/api/webhooks/stripe/route.ts
 * RED phase: app/api/webhooks/stripe/route.ts does not exist yet.
 * Tests will fail with "Cannot find module" until Plan 03-04 creates the handler.
 * Covers: PAY-03
 */

const mocks = {
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
  constructEvent: jest.fn(),
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
jest.mock("@/lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => mocks.supabase),
}));
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: (...args: unknown[]) => mocks.constructEvent(...args),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: "https://checkout.stripe.com/test" }),
      },
    },
  }));
});

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.supabase.from.mockReturnValue(makeChainable({ data: null, error: null }));
    mocks.supabase.rpc.mockResolvedValue({ data: null, error: null });
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const req = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    mocks.constructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature");
    });
    const req = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: "raw-body",
      headers: { "stripe-signature": "invalid-sig" },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("returns 200 and marks idempotent when stripe_session_id already processed", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const sessionId = "cs_test_already_processed";
    mocks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: sessionId,
          metadata: { student_id: "student-uuid", package_id: "pkg-uuid" },
        },
      },
    });
    // Simulate already-processed: from().select().eq() resolves with existing record
    mocks.supabase.from.mockReturnValue(
      makeChainable({ data: { id: sessionId }, error: null })
    );
    const req = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: "raw-body",
      headers: { "stripe-signature": "valid-sig" },
    });
    const response = await POST(req);
    expect(response.status).toBe(200);
  });

  it("calls grant_credits RPC on checkout.session.completed for one-off package", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    mocks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_new",
          metadata: { student_id: "student-uuid", package_id: "pkg-uuid" },
        },
      },
    });
    // Not already processed
    mocks.supabase.from.mockReturnValue(
      makeChainable({ data: null, error: null })
    );
    mocks.supabase.rpc.mockResolvedValue({ data: null, error: null });
    const req = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: "raw-body",
      headers: { "stripe-signature": "valid-sig" },
    });
    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(mocks.supabase.rpc).toHaveBeenCalledWith(
      "grant_credits",
      expect.any(Object)
    );
  });

  it("ignores invoice.paid (handler removed — no subscription checkout exists)", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    mocks.constructEvent.mockReturnValue({
      type: "invoice.paid",
      data: {
        object: {
          id: "inv_test_new",
          billing_reason: "subscription_cycle",
          subscription: "sub_test123",
          metadata: { student_id: "student-uuid", package_id: "pkg-sub-uuid" },
        },
      },
    });
    mocks.supabase.rpc.mockResolvedValue({ data: null, error: null });
    const req = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: "raw-body",
      headers: { "stripe-signature": "valid-sig" },
    });
    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(mocks.supabase.rpc).not.toHaveBeenCalled();
  });
});
