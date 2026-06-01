import { notFound } from "next/navigation";
import { HomeHero } from "@/components/marketing/home-hero";
import { HomeKeyFacts } from "@/components/marketing/home-key-facts";
import { HomeRegistrationSteps } from "@/components/marketing/home-registration-steps";
import { HomeSubjectsShowcase } from "@/components/marketing/home-subjects-showcase";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/page-header";
import { siteConfig } from "@/config/site";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMessage } from "@/lib/i18n/format";
import { localizedPath } from "@/lib/i18n/path";
import {
  buildSubjectCatalog,
  formatSubjectList,
} from "@/lib/i18n/subject-catalog";
import { getSubjects, getSubjectSlugsWithApprovedTeachers } from "@/lib/queries/subjects";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = getDictionary(raw);
  const p = dict.home.portal;
  const c = dict.common;
  const [subjects, teacherSlugs] = await Promise.all([
    getSubjects(),
    getSubjectSlugsWithApprovedTeachers(),
  ]);
  const subjectItems = buildSubjectCatalog(dict, subjects, teacherSlugs);
  const subjectLabels = subjectItems.map((s) => s.label);
  const footerTagline = formatMessage(p.footerTagline, {
    subjects: formatSubjectList(subjectLabels, locale),
    count: String(subjectItems.length),
  });

  return (
    <PublicLayout locale={raw} footerTagline={footerTagline}>
      <HomeHero subjectItems={subjectItems} />

      <Section width="wide" pad="default">
        <HomeSubjectsShowcase dict={dict} subjectItems={subjectItems} />
      </Section>

      <Section width="wide" pad="default">
        <HomeKeyFacts dict={dict} subjectItems={subjectItems} />
      </Section>

      <Section surface="muted" width="wide">
        <SectionHeader
          eyebrow={p.stepsSection.eyebrow}
          title={p.stepsSection.title}
          description={formatMessage(p.stepsSection.description, {
            count: String(subjectItems.length),
          })}
          className="mb-10 max-w-none sm:mb-12"
        />
        <HomeRegistrationSteps dict={dict} locale={locale} />
      </Section>

      <section className="relative isolate overflow-hidden bg-[color:var(--brand-deep)] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_15%_20%,rgba(255,255,255,0.06),transparent_60%)]"
        />
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-10">
          <div className="grid gap-8 py-14 sm:gap-10 sm:py-20 lg:grid-cols-12 lg:items-center lg:gap-16">
            <div className="lg:col-span-7">
              <h2 className="text-display text-white">{p.cta.title}</h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">
                {formatMessage(p.cta.subtitle, {
                  subjects: formatSubjectList(subjectLabels, locale),
                  count: String(subjectItems.length),
                })}
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:col-span-5">
              <Button
                href={localizedPath(raw, "/login")}
                variant="secondary"
                size="lg"
                shape="pill"
                fullWidth
                className="!border-white !bg-white !text-academy-navy hover:!bg-academy-mist sm:w-auto lg:w-full"
              >
                {c.logIn}
              </Button>
              <Button
                href={localizedPath(raw, "/signup?role=student")}
                variant="outline"
                size="lg"
                shape="pill"
                fullWidth
                className="border-white/25 bg-transparent text-white hover:border-white/55 hover:bg-white/5 hover:text-white sm:w-auto lg:w-full"
              >
                {c.getStarted}
              </Button>
              <Button
                href={siteConfig.domain}
                variant="link"
                size="sm"
                external
                fullWidth
                className="!text-white/70 hover:!text-white sm:w-auto lg:w-full"
              >
                {p.learnMore}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
