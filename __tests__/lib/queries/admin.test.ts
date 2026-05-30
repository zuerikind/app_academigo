/**
 * Unit tests for lib/queries/admin.ts
 */

const mocks = {
  select: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
};

// Chainable mock result that resolves to { data: null, error: null, count: 0 }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeChainable(): any {
  const obj: any = Promise.resolve({ data: null, error: null, count: 0 });
  obj.select = (...args: unknown[]) => { mocks.select(...args); return makeChainable(); };
  obj.eq = (...args: unknown[]) => { mocks.eq(...args); return makeChainable(); };
  obj.order = (...args: unknown[]) => { mocks.order(...args); return makeChainable(); };
  return obj;
}

// Use lazy references inside the factory to avoid TDZ hoisting issues
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    from: () => makeChainable(),
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
