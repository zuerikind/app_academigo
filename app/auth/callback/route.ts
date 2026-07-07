import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, isLocale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(next: string | null): string | null {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return null;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale =
    cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const role = sessionData.user?.user_metadata?.role;
      const fallback =
        role === "teacher"
          ? localizedPath(locale, "/teacher/onboarding")
          : localizedPath(locale, "/student/dashboard");
      const path = safeNextPath(next) ?? fallback;
      return NextResponse.redirect(`${origin}${path}`);
    }
  }

  return NextResponse.redirect(
    `${origin}${localizedPath(locale, "/login")}?error=auth`,
  );
}
