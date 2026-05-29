/**
 * Unit tests for app/auth/callback/route.ts
 * These tests verify the callback route handles ?code and ?next params correctly.
 */

// Use a mocks object so declarations are available when jest.mock factories run
const mocks = {
  exchangeCodeForSession: jest.fn(),
};

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { exchangeCodeForSession: (...args: unknown[]) => mocks.exchangeCodeForSession(...args) },
  }),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue(undefined),
  }),
}));

import { GET } from "@/app/auth/callback/route";

describe("auth callback GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
  });

  it("calls exchangeCodeForSession when ?code param is present", async () => {
    const req = new Request(
      "http://localhost:3000/auth/callback?code=abc123&next=/de/student/onboarding"
    );
    await GET(req);
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("abc123");
  });

  it("redirects to the ?next param destination on success", async () => {
    const next = "/de/student/onboarding";
    const req = new Request(
      `http://localhost:3000/auth/callback?code=abc123&next=${encodeURIComponent(next)}`
    );
    const response = await GET(req);
    expect(response.headers.get("location")).toContain("/de/student/onboarding");
  });

  it("redirects to /login?error=auth when no ?code param is present", async () => {
    const req = new Request("http://localhost:3000/auth/callback");
    const response = await GET(req);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain("/login");
    expect(location).toContain("error=auth");
  });
});
