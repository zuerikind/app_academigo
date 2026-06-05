import { siteConfig } from "@/config/site";
import type { Locale } from "@/lib/i18n/config";
import { absoluteUrl } from "@/lib/seo/site-url";
import type { Dictionary } from "@/messages/types";

export function organizationJsonLd(locale: Locale, dict: Dictionary) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.brand,
    url: absoluteUrl(`/${locale}`),
    logo: absoluteUrl(siteConfig.ogImage),
    description: dict.meta.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Zürich",
      addressCountry: "CH",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: siteConfig.links.email.replace("mailto:", ""),
      availableLanguage: ["German", "English"],
    },
  };
}

export function websiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.brand,
    url: absoluteUrl(`/${locale}`),
    inLanguage: locale === "de" ? "de-CH" : "en",
  };
}

export function faqPageJsonLd(
  items: readonly { q: string; a: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function personJsonLd(input: {
  name: string;
  url: string;
  description: string;
  image?: string | null;
  subjects: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    url: input.url,
    description: input.description,
    ...(input.image ? { image: input.image } : {}),
    ...(input.subjects.length > 0
      ? { knowsAbout: input.subjects }
      : {}),
    worksFor: {
      "@type": "Organization",
      name: siteConfig.brand,
    },
  };
}
