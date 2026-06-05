import { siteConfig } from "@/config/site";

/** Canonical origin for metadata, sitemap, and JSON-LD (no trailing slash). */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return fromEnv || siteConfig.appUrl;
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}
