/**
 * Unit tests for lib/actions/schedules.ts
 * RED phase: lib/actions/schedules.ts does not exist yet.
 * Tests will fail with "Cannot find module" until Plan 04-04 creates the file.
 * Covers: SCHED-01, SCHED-02, CRED-03
 */

const mocks = {
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
  revalidatePath: jest.fn(),
  requireRole: jest.fn(),
  requireProfile: jest.fn(),
};

// makeChainable factory for Supabase fluent API — consistent with Phase 1/2/3 pattern
function makeChainable(resolves: unknown) {
  const chain: Record<string, jest.Mock> = {};
  const methods = ["select", "insert", "update", "delete", "upsert", "eq", "neq", "in", "is", "gte", "lte", "order", "limit", "maybeSingle", "single"];
  methods.forEach((m) => { chain[m] = jest.fn(() => chain); });
  chain["then"] = jest.fn((cb: (v: unknown) => unknown) => Promise.resolve(cb(resolves)));
  return chain;
}

jest.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => mocks.revalidatePath(...args) }));
jest.mock("@/lib/auth/session", () => ({
  requireRole: (...args: unknown[]) => mocks.requireRole(...args),
  requireProfile: (...args: unknown[]) => mocks.requireProfile(...args),
}));
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mocks.supabase)),
}));

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(entries).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("createSchedule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: "student-uuid" });
    mocks.supabase.from.mockReturnValue(makeChainable({ data: { id: "sched-uuid" }, error: null }));
  });

  it("requires role='student' (calls requireRole with 'student')", async () => {
    const { createSchedule } = await import("@/lib/actions/schedules");
    const fd = makeFormData({
      teacherId: "teacher-uuid",
      weekday: "0",
      startTime: "14:00",
      endTime: "14:50",
    });
    await createSchedule({} as any, fd);
    expect(mocks.requireRole).toHaveBeenCalledWith("student");
  });

  it("calls supabase insert on recurring_schedules with correct shape", async () => {
    const { createSchedule } = await import("@/lib/actions/schedules");
    const fd = makeFormData({
      teacherId: "teacher-uuid",
      weekday: "0",
      startTime: "14:00",
      endTime: "14:50",
    });
    await createSchedule({} as any, fd);
    expect(mocks.supabase.from).toHaveBeenCalledWith("recurring_schedules");
  });

  it("returns error if teacherId is missing", async () => {
    const { createSchedule } = await import("@/lib/actions/schedules");
    const fd = makeFormData({
      weekday: "0",
      startTime: "14:00",
      endTime: "14:50",
    });
    const result = await createSchedule({} as any, fd);
    expect(result).toHaveProperty("error");
  });

  it("does NOT touch credit_wallets or call complete_lesson RPC (CRED-03)", async () => {
    const { createSchedule } = await import("@/lib/actions/schedules");
    const fd = makeFormData({
      teacherId: "teacher-uuid",
      weekday: "0",
      startTime: "14:00",
      endTime: "14:50",
    });
    await createSchedule({} as any, fd);
    expect(mocks.supabase.rpc).not.toHaveBeenCalledWith("complete_lesson", expect.anything());
    // credit_wallets table must never be touched during schedule creation
    const fromCalls: string[] = mocks.supabase.from.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(fromCalls).not.toContain("credit_wallets");
  });
});

describe("updateScheduleStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireProfile.mockResolvedValue({ id: "user-uuid" });
    mocks.supabase.from.mockReturnValue(makeChainable({ data: [{ id: "sched-uuid" }], error: null }));
  });

  it("updates status to 'paused'", async () => {
    const { updateScheduleStatus } = await import("@/lib/actions/schedules");
    const fd = makeFormData({ scheduleId: "sched-uuid", status: "paused" });
    const result = await updateScheduleStatus({} as any, fd);
    expect(mocks.supabase.from).toHaveBeenCalledWith("recurring_schedules");
    expect(result).toBeDefined();
  });

  it("updates status to 'cancelled'", async () => {
    const { updateScheduleStatus } = await import("@/lib/actions/schedules");
    const fd = makeFormData({ scheduleId: "sched-uuid", status: "cancelled" });
    const result = await updateScheduleStatus({} as any, fd);
    expect(mocks.supabase.from).toHaveBeenCalledWith("recurring_schedules");
    expect(result).toBeDefined();
  });

  it("updates status to 'active' (resume)", async () => {
    const { updateScheduleStatus } = await import("@/lib/actions/schedules");
    const fd = makeFormData({ scheduleId: "sched-uuid", status: "active" });
    const result = await updateScheduleStatus({} as any, fd);
    expect(mocks.supabase.from).toHaveBeenCalledWith("recurring_schedules");
    expect(result).toBeDefined();
  });

  it("does NOT touch credit_wallets or call complete_lesson RPC (CRED-03)", async () => {
    const { updateScheduleStatus } = await import("@/lib/actions/schedules");
    const fd = makeFormData({ scheduleId: "sched-uuid", status: "paused" });
    await updateScheduleStatus({} as any, fd);
    expect(mocks.supabase.rpc).not.toHaveBeenCalledWith("complete_lesson", expect.anything());
    const fromCalls: string[] = mocks.supabase.from.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(fromCalls).not.toContain("credit_wallets");
  });
});
