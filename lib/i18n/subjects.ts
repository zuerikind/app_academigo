import type { Dictionary } from "@/messages/types";

export function translateSubjectName(
  dict: Dictionary,
  slug: string,
  fallback: string,
): string {
  const names = dict.subjectNames as Record<string, string>;
  return names[slug] ?? fallback;
}
