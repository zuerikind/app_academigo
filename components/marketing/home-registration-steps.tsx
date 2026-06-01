import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import type { Dictionary } from "@/messages/types";

export function HomeRegistrationSteps({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const p = dict.home.portal;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
      <StepCard
        eyebrow={p.student.eyebrow}
        title={p.student.title}
        steps={p.student.steps}
        cta={p.student.cta}
        href={localizedPath(locale, "/signup?role=student")}
      />
      <StepCard
        eyebrow={p.teacher.eyebrow}
        title={p.teacher.title}
        steps={p.teacher.steps}
        cta={p.teacher.cta}
        href={localizedPath(locale, "/signup?role=teacher")}
      />
    </div>
  );
}

function StepCard({
  eyebrow,
  title,
  steps,
  cta,
  href,
}: {
  eyebrow: string;
  title: string;
  steps: readonly { title: string; description: string }[];
  cta: string;
  href: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-[18px] border border-academy-line bg-white p-6 sm:p-8">
      <p className="text-meta-brand">{eyebrow}</p>
      <h2 className="text-heading mt-2 text-academy-navy">{title}</h2>
      <ol className="mt-8 space-y-0 divide-y divide-academy-line-soft">
        {steps.map((step, idx) => (
          <li key={step.title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
            <span
              aria-hidden
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-tint)] font-display text-[12px] font-semibold text-[color:var(--brand-deep)] text-numeric"
            >
              {idx + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="font-display text-[15px] font-semibold tracking-[-0.015em] text-academy-navy">
                {step.title}
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-academy-slate">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-8 pt-2">
        <Button href={href} variant="secondary" shape="pill" fullWidth>
          {cta}
        </Button>
      </div>
    </div>
  );
}
