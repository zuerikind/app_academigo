"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActionLocale } from "@/lib/actions/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export type AuthState = { error?: string };

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = await getActionLocale(formData);
  const dict = getDictionary(locale);
  const supabase = await createClient();

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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, full_name: fullName },
    },
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(
    localizedPath(
      locale,
      role === "teacher" ? "/teacher/onboarding" : "/student/onboarding",
    ),
  );
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

  if (!profile.onboarding_completed) {
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

// Stub: implemented in Plan 03
export async function requestPasswordReset(
  _prev: AuthState,
  _formData: FormData,
): Promise<AuthState> {
  return { error: "Not implemented" };
}

// Stub: implemented in Plan 04
export async function updatePassword(
  _prev: AuthState,
  _formData: FormData,
): Promise<AuthState> {
  return { error: "Not implemented" };
}
