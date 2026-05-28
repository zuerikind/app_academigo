"use server";

import { isLocale, type Locale } from "@/lib/i18n/config";
import { getLocaleFromCookie } from "@/lib/i18n/server";

export async function getActionLocale(formData: FormData): Promise<Locale> {
  const fromForm = String(formData.get("locale") ?? "");
  if (isLocale(fromForm)) return fromForm;
  return getLocaleFromCookie();
}
