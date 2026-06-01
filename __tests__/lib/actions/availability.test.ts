/**
 * Unit tests for lib/actions/availability.ts
 * RED phase: lib/actions/availability.ts does not exist yet.
 * Tests will fail with "Cannot find module" until Plan 03-03 creates the file.
 * Covers: AVAIL-01, AVAIL-02
 */

const mocks = {
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
  revalidatePath: jest.fn(),
  requireRole: jest.fn(),
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

describe("setAvailabilityRange", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: "teacher-uuid" });
    mocks.supabase.from.mockReturnValue(makeChainable({ data: {}, error: null }));
  });

  it("setAvailabilityRange inserts range and revalidates", async () => {
    const { setAvailabilityRange } = await import("@/lib/actions/availability");
    const fd = makeFormData({ dayOfWeek: "1", startTime: "09:00", endTime: "11:00" });
    const result = await setAvailabilityRange({} as any, fd);
    expect(result).toBeDefined();
    expect(mocks.revalidatePath).toHaveBeenCalled();
  });

  it("setAvailabilityRange returns error when unauthenticated", async () => {
    const { setAvailabilityRange } = await import("@/lib/actions/availability");
    mocks.requireRole.mockRejectedValue(new Error("Not authenticated"));
    const fd = makeFormData({ dayOfWeek: "1", startTime: "09:00", endTime: "11:00" });
    const result = await setAvailabilityRange({} as any, fd);
    expect(result).toHaveProperty("error");
  });
});

describe("removeAvailabilityRange", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: "teacher-uuid" });
    mocks.supabase.from.mockReturnValue(makeChainable({ data: null, error: null }));
  });

  it("removeAvailabilityRange deletes range and revalidates", async () => {
    const { removeAvailabilityRange } = await import("@/lib/actions/availability");
    const fd = makeFormData({ rangeId: "range-uuid" });
    const result = await removeAvailabilityRange({} as any, fd);
    expect(result).toBeDefined();
    expect(mocks.revalidatePath).toHaveBeenCalled();
  });
});

describe("setAvailabilityBlocker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: "teacher-uuid" });
    mocks.supabase.from.mockReturnValue(makeChainable({ data: {}, error: null }));
  });

  it("setAvailabilityBlocker inserts blocker and revalidates", async () => {
    const { setAvailabilityBlocker } = await import("@/lib/actions/availability");
    const fd = makeFormData({ date: "2026-07-15" });
    const result = await setAvailabilityBlocker({} as any, fd);
    expect(result).toBeDefined();
    expect(mocks.revalidatePath).toHaveBeenCalled();
  });
});
