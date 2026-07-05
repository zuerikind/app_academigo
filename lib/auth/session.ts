import { cache } from "react";
import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Teacher } from "@/lib/types";
import type { UserRole } from "@/types/database";

// cache() dedupes within a single server render: the role layout AND the page
// both resolve the profile, so without this each authenticated page does the
// auth.getUser() network call + profiles query twice. Cached here, they run once.
export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data as Profile | null;
});

async function redirectForRole(role: UserRole, locale: Locale) {
  redirect(
    localizedPath(
      locale,
      role === "teacher"
        ? "/teacher/dashboard"
        : role === "admin"
          ? "/admin/dashboard"
          : "/student/dashboard",
    ),
  );
}

export async function requireProfile(locale?: Locale) {
  const profile = await getProfile();
  const loc = locale ?? (await getLocaleFromCookie());
  if (!profile) redirect(localizedPath(loc, "/login"));
  return profile;
}

export async function requireRole(role: UserRole, locale?: Locale) {
  const loc = locale ?? (await getLocaleFromCookie());
  const profile = await requireProfile(loc);
  if (profile.role !== role) {
    await redirectForRole(profile.role, loc);
  }
  return profile;
}

export async function requireRoleFromParams(
  role: UserRole,
  rawLocale: string,
) {
  if (!isLocale(rawLocale)) {
    const loc = await getLocaleFromCookie();
    return requireRole(role, loc);
  }
  return requireRole(role, rawLocale);
}

export async function getTeacherRecord(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teachers")
    .select("*, teacher_private ( payout_info_placeholder, motivation_letter, cv_url, default_meet_link )")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!data) return null;
  // Flatten teacher_private so callers keep reading teacher.payout_info_placeholder etc.
  const { teacher_private: priv, ...teacher } = data as Record<string, unknown>;
  const p = Array.isArray(priv) ? priv[0] : priv;
  return { ...teacher, ...((p as object) ?? {}) } as Teacher;
}
