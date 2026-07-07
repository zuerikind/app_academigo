import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/messages/types";
import type { Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import { translateSubjectName } from "@/lib/i18n/subjects";
import type { getTeacherDashboardData } from "@/lib/queries/teacher-dashboard";

type DashboardData = Awaited<ReturnType<typeof getTeacherDashboardData>>;

export function TeacherPendingDashboard({
  locale,
  dict,
  data,
}: {
  locale: Locale;
  dict: Dictionary;
  data: DashboardData;
}) {
  const t = dict.teacher.dashboard;
  const p = t.pending;

  const modalityLabel = data.offersOnline && data.offersInPerson
    ? p.modalityBoth
    : data.offersInPerson
      ? p.modalityInPerson
      : p.modalityOnline;

  const steps = [p.stepReceived, p.stepReview, p.stepEmail];

  return (
    <div className="space-y-6">
      <div className="rounded-[14px] border border-academy-line bg-white p-6">
        <h2 className="font-display text-[20px] font-semibold tracking-tight text-academy-navy">
          {p.title}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-academy-slate">
          {t.reviewBanner}
        </p>

        <p className="mt-6 text-[12px] font-semibold uppercase tracking-wide text-academy-slate-muted">
          {p.stepsTitle}
        </p>
        <ol className="mt-4 space-y-4">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand)]/10 text-[12px] font-semibold text-[color:var(--brand-deep)]">
                {i + 1}
              </span>
              <p className="pt-0.5 text-[13.5px] leading-relaxed text-academy-slate">{step}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button href={localizedPath(locale, "/teacher/profile")} variant="secondary" size="sm">
            {p.editProfileCta}
          </Button>
          <Button href={localizedPath(locale, "/teacher/faq")} variant="secondary" size="sm">
            {p.faqCta}
          </Button>
        </div>
      </div>

      {data.applicationSubjects.length > 0 && (
        <div className="rounded-[14px] border border-academy-line bg-white p-6">
          <p className="text-meta mb-4">{p.summaryTitle}</p>
          <dl className="space-y-4">
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-wide text-academy-slate-muted">
                {p.summarySubjects}
              </dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">
                {data.applicationSubjects.map((s) => (
                  <Badge key={s.id} variant="muted">
                    {translateSubjectName(dict, s.slug, s.name)}
                  </Badge>
                ))}
              </dd>
            </div>
            {data.languages.length > 0 && (
              <div>
                <dt className="text-[12px] font-semibold uppercase tracking-wide text-academy-slate-muted">
                  {p.summaryLanguages}
                </dt>
                <dd className="mt-2 text-[14px] text-academy-navy">
                  {data.languages.join(", ")}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-wide text-academy-slate-muted">
                {p.summaryModality}
              </dt>
              <dd className="mt-2 text-[14px] text-academy-navy">{modalityLabel}</dd>
            </div>
          </dl>
        </div>
      )}

      {data.profileCompletion < 100 && (
        <Link
          href={localizedPath(locale, "/teacher/profile")}
          className="block rounded-[14px] border border-academy-line bg-white px-5 py-5 transition-colors hover:border-[color:var(--brand)]/40"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-meta">{t.profileCompletion}</p>
              <p className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-tight text-academy-navy text-numeric">
                {data.profileCompletion}%
              </p>
            </div>
            <Badge variant="warning">{dict.common.pending}</Badge>
          </div>
          <div className="mt-5 h-1 overflow-hidden rounded-full bg-academy-mist-dark">
            <div
              className="h-full rounded-full bg-[color:var(--brand-deep)] transition-all duration-500"
              style={{ width: `${data.profileCompletion}%` }}
            />
          </div>
          {data.missingFields.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="text-[12px] text-academy-slate">{t.missingFieldsLabel}</span>
              {data.missingFields.map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center rounded-full border border-[color:var(--academy-warning)]/30 bg-[color:var(--academy-warning-soft)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--academy-warning)]"
                >
                  {t.profileFields[field]}
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 text-[12px] font-medium text-[color:var(--brand-deep)]">
            {t.completeProfile}
          </p>
        </Link>
      )}
    </div>
  );
}
