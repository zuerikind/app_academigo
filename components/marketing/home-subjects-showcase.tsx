import { HomeSubjectTags } from "@/components/marketing/home-subject-tags";
import type { SubjectDisplayItem } from "@/lib/i18n/subject-catalog";
import type { Dictionary } from "@/messages/types";

export function HomeSubjectsShowcase({
  dict,
  subjectItems,
}: {
  dict: Dictionary;
  subjectItems: SubjectDisplayItem[];
}) {
  const t = dict.home.subjects;

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <p className="text-meta-brand">{t.eyebrow}</p>
        <h2 className="text-display mt-4 text-academy-navy">{t.title}</h2>
        <p className="mt-5 max-w-sm text-[14.5px] leading-relaxed text-academy-slate">
          {t.description}
        </p>
      </div>
      <div className="lg:col-span-8">
        <HomeSubjectTags
          items={subjectItems}
          availableLabel={t.active}
          comingSoonLabel={t.soon}
        />
      </div>
    </div>
  );
}
