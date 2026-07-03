/**
 * Unit tests for lib/actions/auth.ts
 * RED phase: requestPasswordReset and updatePassword do not exist yet.
 * Tests for signUp emailRedirectTo will also fail until Plan 03 modifies the action.
 */

const mocks = {
  redirect: jest.fn(),
  signUp: jest.fn(),
  resetPasswordForEmail: jest.fn(),
  updateUser: jest.fn(),
};

jest.mock("next/navigation", () => ({ redirect: (...args: unknown[]) => mocks.redirect(...args) }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      signUp: (...args: unknown[]) => mocks.signUp(...args),
      resetPasswordForEmail: (...args: unknown[]) => mocks.resetPasswordForEmail(...args),
      updateUser: (...args: unknown[]) => mocks.updateUser(...args),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getUser: jest.fn(),
    },
  }),
}));

jest.mock("@/lib/actions/locale", () => ({
  getActionLocale: jest.fn().mockResolvedValue("de"),
}));

jest.mock("@/lib/i18n/get-dictionary", () => ({
  getDictionary: jest.fn().mockReturnValue({
    auth: {
      errors: {
        emailPasswordRequired: "E-Mail und Passwort sind erforderlich.",
        invalidAccountType: "Ungültiger Kontotyp.",
        passwordTooShort: "Passwort muss mindestens 8 Zeichen haben.",
      },
    },
  }),
}));

jest.mock("@/lib/i18n/path", () => ({
  localizedPath: jest.fn((locale: string, path: string) => `/${locale}${path}`),
}));

// Import after mocks
import { signUp, requestPasswordReset, updatePassword } from "@/lib/actions/auth";

process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(entries).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("signUp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.signUp.mockResolvedValue({ error: null });
    mocks.redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
  });

  it("calls signUp with emailRedirectTo containing /auth/callback?type=signup", async () => {
    const fd = makeFormData({
      email: "student@test.com",
      password: "password123",
      fullName: "Test User",
      role: "student",
    });
    await signUp({}, fd).catch(() => {}); // redirect() throws in tests
    expect(mocks.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining("/auth/callback?type=signup"),
        }),
      })
    );
  });

  it("redirects to /verify-email on success (not /onboarding)", async () => {
    const fd = makeFormData({
      email: "student@test.com",
      password: "password123",
      fullName: "Test User",
      role: "student",
    });
    await signUp({}, fd).catch(() => {});
    expect(mocks.redirect).toHaveBeenCalledWith(
      expect.stringContaining("/verify-email")
    );
    expect(mocks.redirect).not.toHaveBeenCalledWith(
      expect.stringContaining("/onboarding")
    );
  });
});

describe("requestPasswordReset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
    mocks.redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
  });

  it("calls resetPasswordForEmail with redirectTo containing /auth/callback?type=recovery", async () => {
    const fd = makeFormData({ email: "user@test.com" });
    await requestPasswordReset({}, fd);
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
      "user@test.com",
      expect.objectContaining({
        redirectTo: expect.stringContaining("/auth/callback?type=recovery"),
      })
    );
  });

  it("returns empty object on success — does not redirect", async () => {
    const fd = makeFormData({ email: "user@test.com" });
    const result = await requestPasswordReset({}, fd);
    expect(result).toEqual({});
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("returns error state if email is empty", async () => {
    const fd = makeFormData({ email: "" });
    const result = await requestPasswordReset({}, fd);
    expect(result.error).toBeTruthy();
  });
});

describe("updatePassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
  });

  it("returns error if password is shorter than 8 characters", async () => {
    const fd = makeFormData({ password: "short" });
    const result = await updatePassword({}, fd);
    expect(result.error).toBeTruthy();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("calls updateUser with the new password", async () => {
    const fd = makeFormData({ password: "newpassword123" });
    await updatePassword({}, fd).catch(() => {});
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "newpassword123" });
  });

  it("redirects to /login on success", async () => {
    const fd = makeFormData({ password: "newpassword123" });
    await updatePassword({}, fd).catch(() => {});
    expect(mocks.redirect).toHaveBeenCalledWith(expect.stringContaining("/login"));
  });
});
