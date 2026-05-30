/**
 * Unit tests for lib/actions/admin.ts
 * RED phase: lib/actions/admin.ts does not exist yet.
 * Tests will fail with "Cannot find module" until Plan 02-02 implements the actions.
 */

const mocks = {
  update: jest.fn(),
  revalidatePath: jest.fn(),
  requireRole: jest.fn(),
};

jest.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => mocks.revalidatePath(...args) }));
jest.mock("@/lib/auth/session", () => ({ requireRole: (...args: unknown[]) => mocks.requireRole(...args) }));
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    from: jest.fn().mockReturnValue({
      update: (...args: unknown[]) => mocks.update(...args),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    }),
  }),
}));

import {
  approveTeacher,
  approvePromotion,
  rejectPromotion,
  markPayoutProcessed,
} from "@/lib/actions/admin";

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(entries).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("approveTeacher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.update.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
    mocks.requireRole.mockResolvedValue(undefined);
  });

  it("returns error if teacherId is missing", async () => {
    const result = await approveTeacher({}, makeFormData({}));
    expect(result.error).toBeTruthy();
  });

  it("calls requireRole('admin') for defense-in-depth", async () => {
    await approveTeacher({}, makeFormData({ teacherId: "uuid-123" }));
    expect(mocks.requireRole).toHaveBeenCalledWith("admin");
  });

  it("calls revalidatePath after successful approval", async () => {
    await approveTeacher({}, makeFormData({ teacherId: "uuid-123" }));
    expect(mocks.revalidatePath).toHaveBeenCalled();
  });

  it("returns {} on success", async () => {
    const result = await approveTeacher({}, makeFormData({ teacherId: "uuid-123" }));
    expect(result).toEqual({});
  });
});

describe("approvePromotion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.update.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
    mocks.requireRole.mockResolvedValue(undefined);
  });

  it("returns error if requestId is missing", async () => {
    const result = await approvePromotion({}, makeFormData({}));
    expect(result.error).toBeTruthy();
  });

  it("returns {} on success", async () => {
    const result = await approvePromotion({}, makeFormData({ requestId: "uuid-456" }));
    expect(result).toEqual({});
  });
});

describe("rejectPromotion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.update.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
    mocks.requireRole.mockResolvedValue(undefined);
  });

  it("returns error if requestId is missing", async () => {
    const result = await rejectPromotion({}, makeFormData({}));
    expect(result.error).toBeTruthy();
  });

  it("returns {} on success", async () => {
    const result = await rejectPromotion({}, makeFormData({ requestId: "uuid-789" }));
    expect(result).toEqual({});
  });
});

describe("markPayoutProcessed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.update.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
    mocks.requireRole.mockResolvedValue(undefined);
  });

  it("returns error if payoutId is missing", async () => {
    const result = await markPayoutProcessed({}, makeFormData({}));
    expect(result.error).toBeTruthy();
  });

  it("returns {} on success", async () => {
    const result = await markPayoutProcessed({}, makeFormData({ payoutId: "uuid-abc" }));
    expect(result).toEqual({});
  });
});
