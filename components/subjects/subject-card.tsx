"use client";

import { useI18n } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/ui/badge";
import { translateSubjectName } from "@/lib/i18n/subjects";
import type { Subject } from "@/lib/types";

export function SubjectCard({ subject }: { subject: Subject }) {
  const { dict } = useI18n();
  const t = dict.subjects;
  const name = translateSubjectName(dict, subject.slug, subject.name);
  const comingSoon = subject.is_coming_soon;

  return (
    <article className="flex items-center justify-between gap-4 border-b border-academy-line py-5 last:border-b-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h3 className="font-display text-[16px] font-semibold tracking-[-0.018em] text-academy-navy">
            {name}
          </h3>
          {comingSoon ? (
            <Badge variant="muted" size="sm">
              {t.comingSoon}
            </Badge>
          ) : (
            <Badge variant="verified" size="sm">
              {t.available}
            </Badge>
          )}
        </div>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-academy-slate">
          {comingSoon ? t.comingSoonDesc : t.availableDesc}
        </p>
      </div>
    </article>
  );
}
