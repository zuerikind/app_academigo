/**
 * Unit tests for lib/queries/admin.ts
 * RED phase: lib/queries/admin.ts does not exist yet.
 */

const mocks = {
  select: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  head: jest.fn(),
};

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    from: jest.fn().mockReturnValue({
      select: (...args: unknown[]) => { mocks.select(...args); return { eq: mocks.eq, order: mocks.order, data: [], error: null }; },
      eq: mocks.eq,
      order: mocks.order,
    }),
  }),
}));

import {
  getAdminTeachers,
  getAdminStudents,
  getAdminBookings,
  getAdminPayouts,
  getAdminStats,
} from "@/lib/queries/admin";

describe("getAdminTeachers", () => {
  it("returns an array", async () => {
    const result = await getAdminTeachers();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("getAdminStudents", () => {
  it("returns an array", async () => {
    const result = await getAdminStudents();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("getAdminBookings", () => {
  it("returns an array with no status filter", async () => {
    const result = await getAdminBookings();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns an array with a status filter", async () => {
    const result = await getAdminBookings("pending");
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("getAdminPayouts", () => {
  it("returns an array", async () => {
    const result = await getAdminPayouts();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("getAdminStats", () => {
  it("returns an object with teacherCount, studentCount, bookingCount, pendingTeachers, pendingPromotions, pendingPayouts", async () => {
    const result = await getAdminStats();
    expect(result).toHaveProperty("teacherCount");
    expect(result).toHaveProperty("studentCount");
    expect(result).toHaveProperty("bookingCount");
    expect(result).toHaveProperty("pendingTeachers");
    expect(result).toHaveProperty("pendingPromotions");
    expect(result).toHaveProperty("pendingPayouts");
  });
});
