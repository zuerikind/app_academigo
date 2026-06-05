import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/seo/site-url";

const PRIVATE_SEGMENTS = [
  "student",
  "teacher",
  "admin",
  "login",
  "signup",
  "forgot-password",
  "update-password",
  "verify-email",
] as const;

export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/api/",
    "/auth/",
    ...locales.flatMap((locale) =>
      PRIVATE_SEGMENTS.map((segment) => `/${locale}/${segment}`),
    ),
  ];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow,
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
