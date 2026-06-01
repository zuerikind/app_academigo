import { SUBJECT_SLUGS, type SubjectSlug } from "@/config/subjects";
import { translateSubjectName } from "@/lib/i18n/subjects";
import type { Subject } from "@/lib/types";
import type { Dictionary } from "@/messages/types";

export type SubjectDisplayItem = {
  slug: SubjectSlug;
  label: string;
  hasTeachers: boolean;
};

export function buildSubjectCatalog(
  dict: Dictionary,
  dbSubjects: Subject[] = [],
  teacherSlugs: Set<string> = new Set(),
): SubjectDisplayItem[] {
  const bySlug = new Map(dbSubjects.map((s) => [s.slug, s]));

  return SUBJECT_SLUGS.map((slug) => ({
    slug,
    label: translateSubjectName(dict, slug, bySlug.get(slug)?.name ?? slug),
    hasTeachers: teacherSlugs.has(slug),
  }));
}

export function formatSubjectList(
  labels: string[],
  locale: "de" | "en",
): string {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0]!;
  const conj = locale === "de" ? " und " : " and ";
  if (labels.length === 2) return labels.join(conj);
  return `${labels.slice(0, -1).join(", ")}${conj}${labels.at(-1)}`;
}
