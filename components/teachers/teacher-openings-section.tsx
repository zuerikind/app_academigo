import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/page-header";
import type { Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import type { Dictionary } from "@/messages/types";

type Opening = Dictionary["teachers"]["openings"]["positions"][number];

export function TeacherOpeningsSection({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const o = dict.teachers.openings;

  return (
    <section className="mt-14 rounded-[20px] border border-academy-line bg-academy-mist/40 p-6 sm:p-8 lg:mt-16">
      <SectionHeader
        eyebrow={o.eyebrow}
        title={o.title}
        description={o.description}
        className="mb-8 sm:mb-10"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {o.positions.map((position) => (
          <OpeningCard
            key={position.id}
            position={position}
            applyLabel={o.applyCta}
            href={localizedPath(locale, `/signup?role=teacher&area=${position.id}`)}
          />
        ))}
      </div>
      <p className="mt-6 text-[12.5px] leading-relaxed text-academy-slate">{o.footnote}</p>
    </section>
  );
}

function OpeningCard({
  position,
  applyLabel,
  href,
}: {
  position: Opening;
  applyLabel: string;
  href: string;
}) {
  return (
    <article className="flex h-full flex-col rounded-[16px] border border-academy-line bg-white p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--brand-deep)]">
        {position.badge}
      </p>
      <h3 className="mt-2 font-display text-[17px] font-semibold leading-snug tracking-[-0.02em] text-academy-navy">
        {position.roleTitle}
      </h3>
      <p className="mt-2 text-[13px] font-medium text-academy-slate">{position.subjects}</p>
      <p className="mt-3 flex-1 text-[13.5px] leading-relaxed text-academy-slate">
        {position.description}
      </p>
      <ul className="mt-4 space-y-1.5 text-[12.5px] text-academy-slate">
        {position.requirements.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden className="mt-[0.35em] h-1 w-1 shrink-0 rounded-full bg-[color:var(--brand)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 pt-1">
        <Button href={href} variant="secondary" shape="pill" size="sm" fullWidth>
          {applyLabel}
        </Button>
      </div>
    </article>
  );
}
