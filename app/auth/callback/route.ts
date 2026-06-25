import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, isLocale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import { createClient } from "@/lib/supabase/server";

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
      if (role === "teacher") {
        await supabase.auth.signOut();
        const teacherNext = next && next.startsWith("/") ? next : localizedPath(locale, "/teacher/onboarding");
        return NextResponse.redirect(
          `${origin}${localizedPath(locale, "/login")}?redirect=${encodeURIComponent(teacherNext)}`,
        );
      }
      const path =
        next && next.startsWith("/") ? next : localizedPath(locale, "/student/dashboard");
      return NextResponse.redirect(`${origin}${path}`);
    }
  }

  return NextResponse.redirect(
    `${origin}${localizedPath(locale, "/login")}?error=auth`,
  );
}
