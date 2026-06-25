/**
 * Unit tests for lib/actions/reschedule.ts
 * RED phase: lib/actions/reschedule.ts does not exist yet.
 * Tests will fail with "Cannot find module" until Plan 04-04 creates the file.
 * Covers: RESC-01, RESC-02, RESC-03
 */

const mocks = {
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
  revalidatePath: jest.fn(),
  requireRole: jest.fn(),
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
jest.mock("@/lib/auth/session", () => ({ requireRole: (...args: unknown[]) => mocks.requireRole(...args) }));
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mocks.supabase)),
}));

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(entries).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("requestReschedule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: "student-uuid" });
    mocks.supabase.from.mockReturnValue(makeChainable({ data: null, error: null }));
  });

  it("updates lesson status to 'reschedule_requested' and sets proposed start/end", async () => {
    const { requestReschedule } = await import("@/lib/actions/reschedule");
    const fd = makeFormData({
      lessonId: "lesson-uuid",
      proposedStart: "2026-07-20T14:00:00Z",
      proposedEnd: "2026-07-20T14:50:00Z",
    });
    await requestReschedule({} as any, fd);
    expect(mocks.supabase.from).toHaveBeenCalledWith("lessons");
  });

  it("accepts lesson already in 'reschedule_requested' status (re-request — Pitfall 3)", async () => {
    const { requestReschedule } = await import("@/lib/actions/reschedule");
    // The action should not fail if lesson is already reschedule_requested
    // It should just update the proposed times
    mocks.supabase.from.mockReturnValue(
      makeChainable({ data: { id: "lesson-uuid", status: "reschedule_requested" }, error: null })
    );
    const fd = makeFormData({
      lessonId: "lesson-uuid",
      proposedStart: "2026-07-21T14:00:00Z",
      proposedEnd: "2026-07-21T14:50:00Z",
    });
    const result = await requestReschedule({} as any, fd);
    // Must not return an error for re-requesting
    expect(result).not.toHaveProperty("error");
  });
});

describe("approveReschedule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: "teacher-uuid" });
    mocks.supabase.rpc.mockResolvedValue({ data: "new-lesson-uuid", error: null });
  });

  it("calls supabase.rpc('approve_reschedule') with lesson id", async () => {
    const { approveReschedule } = await import("@/lib/actions/reschedule");
    const fd = makeFormData({ lessonId: "lesson-uuid" });
    await approveReschedule({} as any, fd);
    expect(mocks.supabase.rpc).toHaveBeenCalledWith(
      "approve_reschedule",
      expect.objectContaining({ p_lesson_id: "lesson-uuid" })
    );
  });

  it("does NOT touch credit_wallets (RESC-03 — no credit loss on reschedule)", async () => {
    const { approveReschedule } = await import("@/lib/actions/reschedule");
    const fd = makeFormData({ lessonId: "lesson-uuid" });
    await approveReschedule({} as any, fd);
    const fromCalls: string[] = mocks.supabase.from.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(fromCalls).not.toContain("credit_wallets");
    // Also must not call complete_lesson
    expect(mocks.supabase.rpc).not.toHaveBeenCalledWith("complete_lesson", expect.anything());
  });
});

describe("rejectReschedule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: "teacher-uuid" });
    mocks.supabase.rpc.mockResolvedValue({ data: null, error: null });
  });

  it("calls supabase.rpc('reject_reschedule') with lesson id", async () => {
    const { rejectReschedule } = await import("@/lib/actions/reschedule");
    const fd = makeFormData({ lessonId: "lesson-uuid" });
    await rejectReschedule({} as any, fd);
    expect(mocks.supabase.rpc).toHaveBeenCalledWith(
      "reject_reschedule",
      expect.objectContaining({ p_lesson_id: "lesson-uuid" })
    );
  });
});
