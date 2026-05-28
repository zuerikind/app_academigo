"use client";

import { useEffect } from "react";
import { htmlLang, type Locale } from "@/lib/i18n/config";

export function SetHtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = htmlLang[locale];
  }, [locale]);
  return null;
}
