"use server";

import { redirect } from "next/navigation";
import { getActionLocale } from "@/lib/actions/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmailConfirmation, sendPasswordReset } from "@/lib/services/email";
import type { UserRole } from "@/types/database";

export type AuthState = { error?: string };

function siteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env && env.startsWith("http")) return env;
  // Vercel auto-injects these — use as fallback so links never point to localhost in prod
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod}`;
  const deploy = process.env.VERCEL_URL;
  if (deploy) return `https://${deploy}`;
  return "http://localhost:3000";
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = await getActionLocale(formData);
  const dict = getDictionary(locale);

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "student") as UserRole;

  if (!email || !password) {
    return { error: dict.auth.errors.emailPasswordRequired };
  }

  if (role !== "student" && role !== "teacher") {
    return { error: dict.auth.errors.invalidAccountType };
  }

  const redirectTo = `${siteUrl()}/auth/callback?type=signup&next=${encodeURIComponent(
    localizedPath(locale, role === "teacher" ? "/teacher/onboarding" : "/student/onboarding"),
  )}`;

  const admin = createServiceClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { data: { role, full_name: fullName }, redirectTo },
  });

  if (error) return { error: error.message };

  await sendEmailConfirmation({
    to: email,
    fullName: fullName || undefined,
    confirmationUrl: data.properties.action_link,
  });

  redirect(localizedPath(locale, "/verify-email"));
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = await getActionLocale(formData);
  const dict = getDictionary(locale);
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  const redirectTo = String(formData.get("redirect") ?? "");
  if (redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(localizedPath(locale, "/login"));

  const { data } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("user_id", user.id)
    .single();

  const profile = data as {
    role: UserRole;
    onboarding_completed: boolean;
  } | null;

  if (!profile) redirect(localizedPath(locale, "/student/dashboard"));

  if (!profile.onboarding_completed && profile.role !== "admin") {
    redirect(
      localizedPath(
        locale,
        profile.role === "teacher"
          ? "/teacher/onboarding"
          : "/student/onboarding",
      ),
    );
  }

  redirect(
    localizedPath(
      locale,
      profile.role === "teacher"
        ? "/teacher/dashboard"
        : profile.role === "admin"
          ? "/admin/dashboard"
          : "/student/dashboard",
    ),
  );
}

export async function signOut(formData: FormData) {
  const locale = await getActionLocale(formData);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(localizedPath(locale, "/login"));
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = await getActionLocale(formData);
  const dict = getDictionary(locale);
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: dict.auth.errors.emailPasswordRequired };

  // AUTH-03 SECURITY REQUIREMENT: always return same empty response — never confirm/deny email exists
  try {
    const redirectTo = `${siteUrl()}/auth/callback?type=recovery&next=${encodeURIComponent(
      localizedPath(locale, "/update-password"),
    )}`;
    const admin = createServiceClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
    if (error) {
      console.error("[auth] resetPassword generateLink failed:", error.message);
    } else {
      const profile = await supabase
        .from("profiles")
        .select("full_name")
        .eq("email", email)
        .maybeSingle();
      await sendPasswordReset({
        to: email,
        fullName: profile.data?.full_name ?? undefined,
        resetUrl: data.properties.action_link,
      });
    }
  } catch (err) {
    console.error("[auth] resetPassword failed:", err);
  }

  return {};
}

export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = await getActionLocale(formData);
  const dict = getDictionary(locale);
  const supabase = await createClient();

  const password = String(formData.get("password") ?? "");
  if (!password || password.length < 8) {
    return { error: dict.auth.errors.passwordTooShort };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect(localizedPath(locale, "/login"));
}
