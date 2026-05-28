import type { Locale } from "@/lib/i18n/config";
import { de } from "@/messages/de";
import { en } from "@/messages/en";
import type { Dictionary } from "@/messages/types";

const dictionaries: Record<Locale, Dictionary> = { de, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
