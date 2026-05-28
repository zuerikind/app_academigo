import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  LOCALE_COOKIE,
  defaultLocale,
  isLocale,
  type Locale,
} from "@/lib/i18n/config";
import { localizedPath, stripLocale } from "@/lib/i18n/path";
import type { UserRole } from "@/types/database";

const AUTH_ROUTES = ["/login", "/signup"];
const STUDENT_PREFIX = "/student";
const TEACHER_PREFIX = "/teacher";
const ADMIN_PREFIX = "/admin";

export async function updateSession(
  request: NextRequest,
  locale: Locale = defaultLocale,
) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = stripLocale(request.nextUrl.pathname);
  const lp = (path: string) => localizedPath(locale, path);

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}?`));
  const matchSegment = (prefix: string) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`);
  const isProtected =
    matchSegment(STUDENT_PREFIX) ||
    matchSegment(TEACHER_PREFIX) ||
    matchSegment(ADMIN_PREFIX);

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = lp("/login");
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const role = await getProfileRole(supabase, user.id);
    const url = request.nextUrl.clone();
    url.pathname = lp(dashboardPathForRole(role));
    return NextResponse.redirect(url);
  }

  if (user && isProtected) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("role, onboarding_completed")
      .eq("user_id", user.id)
      .single();

    const profile = profileRow as {
      role: UserRole;
      onboarding_completed: boolean;
    } | null;

    if (!profile) {
      return supabaseResponse;
    }

    const role = profile.role;

    if (matchSegment(STUDENT_PREFIX) && role !== "student") {
      return redirectToRoleDashboard(request, role, locale);
    }
    if (matchSegment(TEACHER_PREFIX) && role !== "teacher") {
      return redirectToRoleDashboard(request, role, locale);
    }
    if (matchSegment(ADMIN_PREFIX) && role !== "admin") {
      return redirectToRoleDashboard(request, role, locale);
    }

    const onboardingPath =
      role === "student"
        ? "/student/onboarding"
        : role === "teacher"
          ? "/teacher/onboarding"
          : null;

    const isOnboarding = pathname === onboardingPath;

    if (
      onboardingPath &&
      !profile.onboarding_completed &&
      !isOnboarding &&
      (matchSegment(STUDENT_PREFIX) || matchSegment(TEACHER_PREFIX))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = lp(onboardingPath);
      return NextResponse.redirect(url);
    }

    if (isOnboarding && profile.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = lp(dashboardPathForRole(role));
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

async function getProfileRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<UserRole> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();
  return (data?.role as UserRole) ?? "student";
}

function dashboardPathForRole(role: UserRole) {
  switch (role) {
    case "teacher":
      return "/teacher/dashboard";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/student/dashboard";
  }
}

function redirectToRoleDashboard(
  request: NextRequest,
  role: UserRole,
  locale: Locale,
) {
  const url = request.nextUrl.clone();
  url.pathname = localizedPath(locale, dashboardPathForRole(role));
  return NextResponse.redirect(url);
}

export function setLocaleCookie(response: NextResponse, locale: Locale) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
