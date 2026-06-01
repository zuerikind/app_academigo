import { AppIcon } from "@/components/icons/app-icon";
import { HomeSubjectTags } from "@/components/marketing/home-subject-tags";
import { SectionHeader } from "@/components/ui/page-header";
import type { SubjectDisplayItem } from "@/lib/i18n/subject-catalog";
import type { Dictionary } from "@/messages/types";
import type { IconName } from "@/lib/icons";

const factIcons: IconName[] = ["mapPin", "coins", "award"];

export function HomeKeyFacts({
  dict,
  subjectItems,
}: {
  dict: Dictionary;
  subjectItems: SubjectDisplayItem[];
}) {
  const k = dict.home.portal.keyFacts;
  const otherFacts = [k.locations, k.pricing, k.teachers];

  return (
    <div>
      <SectionHeader eyebrow={k.eyebrow} title={k.title} />

      <div className="mt-10 overflow-hidden rounded-[18px] border border-academy-line bg-white p-5 sm:p-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[color:var(--brand-tint)]">
          <AppIcon
            name="bookOpen"
            className="h-4 w-4 text-[color:var(--brand-deep)]"
            strokeWidth={1.6}
          />
        </span>
        <h3 className="mt-5 font-display text-[16px] font-semibold tracking-[-0.018em] text-academy-navy">
          {k.subjects.title}
        </h3>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-academy-slate">
          {k.subjects.desc}
        </p>
        <div className="mt-6">
          <HomeSubjectTags
            items={subjectItems}
            availableLabel={k.subjects.availableNow}
            comingSoonLabel={k.subjects.comingSoon}
          />
        </div>
      </div>

      <div className="mt-px grid gap-px overflow-hidden rounded-[18px] border border-academy-line bg-academy-line sm:grid-cols-2 lg:grid-cols-3">
        {otherFacts.map(({ title, desc }, idx) => (
          <div
            key={title}
            className="flex h-full flex-col bg-white p-5 sm:p-6"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[color:var(--brand-tint)]">
              <AppIcon
                name={factIcons[idx] ?? "bookOpen"}
                className="h-4 w-4 text-[color:var(--brand-deep)]"
                strokeWidth={1.6}
              />
            </span>
            <h3 className="mt-5 font-display text-[16px] font-semibold tracking-[-0.018em] text-academy-navy">
              {title}
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-academy-slate">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
