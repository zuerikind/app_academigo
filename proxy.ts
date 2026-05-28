import { NextResponse, type NextRequest } from "next/server";
import {
  LOCALE_COOKIE,
  defaultLocale,
  isLocale,
  type Locale,
} from "@/lib/i18n/config";
import { localeFromPathname, resolveLocale } from "@/lib/i18n/path";
import { setLocaleCookie, updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const segment = pathname.split("/")[1];

  if (!isLocale(segment)) {
    const locale = resolveLocale(pathname, cookieLocale);
    const url = request.nextUrl.clone();
    url.pathname =
      pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    const redirect = NextResponse.redirect(url);
    setLocaleCookie(redirect, locale);
    return redirect;
  }

  const locale = segment as Locale;
  const sessionResponse = await updateSession(request, locale);
  setLocaleCookie(sessionResponse, locale);
  return sessionResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
