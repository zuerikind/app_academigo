"use client";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import type { Locale } from "@/lib/i18n/config";

export function FooterLanguageSwitcher({
  locale,
  ariaLabel,
}: {
  locale: Locale;
  ariaLabel: string;
}) {
  return <LanguageSwitcher locale={locale} ariaLabel={ariaLabel} variant="inverse" />;
}
