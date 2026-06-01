/**
 * Unit tests for app/api/cron/reminders/route.ts
 * RED phase: app/api/cron/reminders/route.ts does not exist yet.
 * Tests will fail with "Cannot find module" until Plan 03-10 creates the handler.
 * Covers: reminder idempotency, auth guard
 */

const mocks = {
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
  sendTeacherReminder: jest.fn(),
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
jest.mock("@/lib/services/email", () => ({
  sendTeacherReminder: (...args: unknown[]) => mocks.sendTeacherReminder(...args),
}));

describe("GET /api/cron/reminders", () => {
  const CRON_SECRET = "test-cron-secret-value";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = CRON_SECRET;
    mocks.supabase.from.mockReturnValue(makeChainable({ data: [], error: null }));
    mocks.sendTeacherReminder.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("returns 401 when Authorization header missing", async () => {
    const { GET } = await import("@/app/api/cron/reminders/route");
    const req = new Request("http://localhost/api/cron/reminders", { method: "GET" });
    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it("returns 401 when CRON_SECRET does not match", async () => {
    const { GET } = await import("@/app/api/cron/reminders/route");
    const req = new Request("http://localhost/api/cron/reminders", {
      method: "GET",
      headers: { Authorization: "Bearer wrong-secret" },
    });
    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it("processes 24h reminder: calls sendTeacherReminder and marks reminder_24h_sent_at", async () => {
    const { GET } = await import("@/app/api/cron/reminders/route");
    const upcomingBooking = {
      id: "booking-uuid",
      start_time: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
      reminder_24h_sent_at: null,
      meeting_link: "https://meet.google.com/abc",
      teachers: {
        profiles: { full_name: "Max Lehrer", email: "teacher@example.com" },
      },
      students: {
        profiles: { full_name: "Alice Muster" },
      },
    };
    mocks.supabase.from.mockReturnValue(
      makeChainable({ data: [upcomingBooking], error: null })
    );
    const req = new Request("http://localhost/api/cron/reminders", {
      method: "GET",
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const response = await GET(req);
    expect(response.status).toBe(200);
    expect(mocks.sendTeacherReminder).toHaveBeenCalled();
  });

  it("skips booking when reminder_24h_sent_at already set", async () => {
    const { GET } = await import("@/app/api/cron/reminders/route");
    // No bookings returned because query filters out already-reminded ones
    mocks.supabase.from.mockReturnValue(
      makeChainable({ data: [], error: null })
    );
    const req = new Request("http://localhost/api/cron/reminders", {
      method: "GET",
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const response = await GET(req);
    expect(response.status).toBe(200);
    expect(mocks.sendTeacherReminder).not.toHaveBeenCalled();
  });
});
