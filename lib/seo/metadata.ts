import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";
import type { Dictionary } from "@/messages/types";

type PageMetaInput = {
  locale: Locale;
  /** Path without locale prefix, e.g. `/pricing` or `/`. */
  path: string;
  title: string;
  description: string;
  ogImage?: string | null;
  noIndex?: boolean;
};

function hreflangKey(locale: Locale): string {
  return locale === "de" ? "de" : locale;
}

export function buildAlternates(
  locale: Locale,
  path: string,
): NonNullable<Metadata["alternates"]> {
  const clean = path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  const languages: Record<string, string> = {};

  for (const l of locales) {
    languages[hreflangKey(l)] = absoluteUrl(localizedPath(l, clean));
  }
  languages["x-default"] = absoluteUrl(localizedPath(defaultLocale, clean));

  return {
    canonical: absoluteUrl(localizedPath(locale, clean)),
    languages,
  };
}

export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  ogImage,
  noIndex = false,
}: PageMetaInput): Metadata {
  const image = ogImage ?? absoluteUrl(siteConfig.ogImage);
  const alternates = buildAlternates(locale, path);
  const canonical = alternates.canonical as string;

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.brand,
      locale: locale === "de" ? "de_CH" : "en_US",
      alternateLocale: locale === "de" ? ["en_US"] : ["de_CH"],
      type: "website",
      images: [{ url: image, width: 512, height: 512, alt: siteConfig.brand }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [image],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export function buildLocaleMetadata(locale: Locale, dict: Dictionary): Metadata {
  const pageMeta = buildPageMetadata({
    locale,
    path: "/",
    title: dict.meta.title,
    description: dict.meta.description,
  });
  return {
    ...pageMeta,
    title: {
      default: dict.meta.title,
      template: dict.meta.titleTemplate,
    },
  };
}

export const noIndexMetadata: Metadata = {
  robots: { index: false, follow: false },
};
