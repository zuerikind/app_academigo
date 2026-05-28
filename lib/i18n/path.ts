import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

/** Path without locale prefix, always starts with `/`. */
export function stripLocale(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname || "/";
}

export function localizedPath(locale: Locale, path: string): string {
  const clean = stripLocale(path.startsWith("/") ? path : `/${path}`);
  if (clean === "/") return `/${locale}`;
  return `/${locale}${clean}`;
}

export function localeFromPathname(pathname: string): Locale | null {
  const first = pathname.split("/").filter(Boolean)[0];
  return first && isLocale(first) ? first : null;
}

export function resolveLocale(
  pathname: string,
  cookieLocale?: string | null,
): Locale {
  const fromPath = localeFromPathname(pathname);
  if (fromPath) return fromPath;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;
  return defaultLocale;
}
