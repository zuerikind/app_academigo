/**
 * Unit tests for app/api/cron/generate-lessons/route.ts
 * RED phase: app/api/cron/generate-lessons/route.ts does not exist yet.
 * Tests will fail with "Cannot find module" until Plan 04-05 creates the handler.
 * Covers: SCHED-03, LES-02 — cron auth guard, skips paused/cancelled schedules
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

// Cron route uses createServiceClient() (not createClient()) — service role bypasses RLS
jest.mock("@/lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => mocks.supabase),
}));

describe("GET /api/cron/generate-lessons", () => {
  const CRON_SECRET = "test-cron-secret-value";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = CRON_SECRET;
    mocks.supabase.from.mockReturnValue(makeChainable({ data: [], error: null }));
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("returns 401 when Authorization header is missing", async () => {
    const { GET } = await import("@/app/api/cron/generate-lessons/route");
    const req = new Request("http://localhost/api/cron/generate-lessons", { method: "GET" });
    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it("returns 401 when CRON_SECRET does not match", async () => {
    const { GET } = await import("@/app/api/cron/generate-lessons/route");
    const req = new Request("http://localhost/api/cron/generate-lessons", {
      method: "GET",
      headers: { Authorization: "Bearer wrong-secret" },
    });
    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it("returns 200 with { ok: true } when correct CRON_SECRET is provided", async () => {
    const { GET } = await import("@/app/api/cron/generate-lessons/route");
    const req = new Request("http://localhost/api/cron/generate-lessons", {
      method: "GET",
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const response = await GET(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("ok", true);
  });

  it("only queries schedules with status='active' (SCHED-03 — paused/cancelled skipped)", async () => {
    const eqMock = jest.fn(() => makeChainable({ data: [], error: null }));
    const selectMock = jest.fn(() => ({ eq: eqMock }));
    mocks.supabase.from.mockImplementation((table: string) => {
      if (table === "recurring_schedules") return { select: selectMock };
      return makeChainable({ data: null, error: null });
    });

    const { GET } = await import("@/app/api/cron/generate-lessons/route");
    const req = new Request("http://localhost/api/cron/generate-lessons", {
      method: "GET",
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    await GET(req);

    // The cron must filter by status='active'
    expect(eqMock).toHaveBeenCalledWith("status", "active");
  });
});
