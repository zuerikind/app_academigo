"use client";

import { ArrowUpRight } from "lucide-react";
import { useI18n } from "@/components/i18n/locale-provider";
import { HomeSubjectTags } from "@/components/marketing/home-subject-tags";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { SubjectDisplayItem } from "@/lib/i18n/subject-catalog";
import { localizedPath } from "@/lib/i18n/path";

export function HomeHero({
  subjectItems,
}: {
  subjectItems: SubjectDisplayItem[];
}) {
  const { locale, dict } = useI18n();
  const p = dict.home.portal;
  const c = dict.common;

  return (
    <section className="relative isolate overflow-hidden bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(80%_60%_at_85%_-10%,rgba(43,85,133,0.06),transparent_60%)]"
      />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl py-12 text-center sm:py-20 lg:py-28">
          <p className="text-meta-brand inline-flex items-center justify-center gap-2.5">
            <span
              aria-hidden
              className="h-px w-6 bg-[color:var(--brand)]/45"
            />
            {p.badge}
          </p>

          <h1 className="text-hero mt-7 text-academy-navy">
            {p.title}{" "}
            <span className="text-[color:var(--brand-deep)]">
              {p.titleHighlight}
            </span>
          </h1>

          <p className="text-lead mx-auto mt-6 max-w-xl">{p.subtitle}</p>

          <div className="mx-auto mt-8 max-w-4xl">
            <HomeSubjectTags
              items={subjectItems}
              availableLabel={dict.home.subjects.active}
              comingSoonLabel={dict.home.subjects.soon}
              compact
            />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            <Button
              href={localizedPath(locale, "/login")}
              variant="primary"
              size="lg"
              shape="pill"
              fullWidth
              className="sm:w-auto"
            >
              {c.logIn}
            </Button>
            <Button
              href={localizedPath(locale, "/signup?role=student")}
              variant="secondary"
              size="lg"
              shape="pill"
              fullWidth
              className="sm:w-auto"
            >
              {p.student.cta}
            </Button>
            <Button
              href={localizedPath(locale, "/signup?role=teacher")}
              variant="outline"
              size="lg"
              shape="pill"
              fullWidth
              className="sm:w-auto"
            >
              {p.teacher.cta}
            </Button>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
            <Button
              href={siteConfig.domain}
              variant="link"
              size="sm"
              external
              className="text-[13px]"
            >
              {p.learnMore}
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.7} />
            </Button>
            <Button
              href={localizedPath(locale, "/teachers")}
              variant="link"
              size="sm"
              className="text-[13px]"
            >
              {p.browseTeachers}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
