import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import { getSiteUrl } from "@/lib/seo/site-url";
import { getApprovedTeachers } from "@/lib/queries/teachers";

const STATIC_PATHS = ["/", "/teachers", "/pricing", "/subjects", "/about"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${base}${localizedPath(locale, path)}`,
        lastModified: now,
        changeFrequency: path === "/" ? "weekly" : "monthly",
        priority: path === "/" ? 1 : 0.8,
      });
    }
  }

  const teachers = await getApprovedTeachers();
  for (const locale of locales) {
    for (const teacher of teachers) {
      entries.push({
        url: `${base}${localizedPath(locale, `/teachers/${teacher.id}`)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
