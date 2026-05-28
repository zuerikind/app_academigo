export const locales = ["de", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "de";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const localeLabels: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
};

export const htmlLang: Record<Locale, string> = {
  de: "de-CH",
  en: "en",
};

export const LOCALE_COOKIE = "academigo_locale";
