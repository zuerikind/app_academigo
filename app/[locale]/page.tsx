import { notFound } from "next/navigation";
import { HomeFeatures } from "@/components/marketing/home-features";
import { HomeHero } from "@/components/marketing/home-hero";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/page-header";
import { TrustStrip } from "@/components/ui/trust-strip";
import { TeacherCard } from "@/components/teachers/teacher-card";
import { siteConfig } from "@/config/site";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";
import { getApprovedTeachers } from "@/lib/queries/teachers";
import { getSubjects } from "@/lib/queries/subjects";
import { translateSubjectName } from "@/lib/i18n/subjects";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.home;
  const c = dict.common;
  const teachers = (await getApprovedTeachers()).slice(0, 3);
  const subjects = await getSubjects();
  const active = subjects.filter((s) => s.is_active && !s.is_coming_soon);
  const comingSoon = subjects.filter((s) => s.is_coming_soon);

  const trustItems = [
    { icon: "award" as const, label: t.trust.experience },
    { icon: "monitor" as const, label: t.trust.platform },
    { icon: "users" as const, label: t.trust.support },
    { icon: "mapPin" as const, label: t.trust.locations },
    { icon: "bookOpen" as const, label: t.trust.subjects },
  ];

  return (
    <PublicLayout locale={raw}>
      <HomeHero />

      <TrustStrip items={trustItems} />

      {/* Subjects — editorial 4/8 split */}
      <Section width="wide" pad="default">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-meta-brand">{t.subjects.eyebrow}</p>
            <h2 className="text-display mt-4 text-academy-navy">
              {t.subjects.title}
            </h2>
            <p className="mt-5 max-w-sm text-[14.5px] leading-relaxed text-academy-slate">
              {t.featuredTeachersDesc}
            </p>
          </div>
          <div className="lg:col-span-8">
            <div>
              <p className="text-meta mb-4">{t.subjects.active}</p>
              <ul className="flex flex-wrap gap-1.5">
                {active.map((s) => (
                  <li
                    key={s.id}
                    className="inline-flex items-center rounded-full border border-[color:var(--brand-deep)] bg-[color:var(--brand-deep)] px-3 py-1.5 text-[13px] font-medium text-white"
                  >
                    {translateSubjectName(dict, s.slug, s.name)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-10">
              <p className="text-meta mb-4">{t.subjects.soon}</p>
              <ul className="flex flex-wrap gap-1.5">
                {comingSoon.map((s) => (
                  <li
                    key={s.id}
                    className="inline-flex items-center rounded-full border border-dashed border-academy-line bg-white px-3 py-1.5 text-[13px] text-academy-slate"
                  >
                    {translateSubjectName(dict, s.slug, s.name)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Approach + features */}
      <Section surface="muted" width="wide">
        <SectionHeader
          eyebrow={t.approach.eyebrow}
          title={t.approach.title}
          description={t.approach.body}
        />
        <div className="mt-14">
          <HomeFeatures />
        </div>
      </Section>

      {teachers.length > 0 && (
        <Section width="wide">
          <SectionHeader
            eyebrow={c.ctaViewTeachers}
            title={t.featuredTeachers}
            description={t.featuredTeachersDesc}
            action={
              <Button
                href={localizedPath(raw, "/teachers")}
                variant="link"
                size="sm"
                className="text-[13px]"
              >
                {c.viewAll} →
              </Button>
            }
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {teachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                profileHref={localizedPath(raw, `/teachers/${teacher.id}`)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Final CTA — brand-deep dark band */}
      <section className="relative isolate overflow-hidden bg-[color:var(--brand-deep)] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_15%_20%,rgba(255,255,255,0.06),transparent_60%)]"
        />
        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-10 py-20 sm:py-24 lg:grid-cols-12 lg:items-center lg:gap-16">
            <div className="lg:col-span-7">
              <p className="text-meta text-white/55">{t.subjects.eyebrow}</p>
              <h2 className="text-display mt-3 text-white">{t.ctaTitle}</h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">
                {t.ctaSubtitle}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:flex-col">
              <Button
                href={siteConfig.links.consultation}
                variant="secondary"
                size="lg"
                shape="pill"
                external
                className="!border-white !bg-white !text-academy-navy hover:!bg-academy-mist"
              >
                {t.createFreeAccount}
              </Button>
              <Button
                href={localizedPath(raw, "/signup?role=student")}
                variant="outline"
                size="lg"
                shape="pill"
                className="border-white/25 bg-transparent text-white hover:border-white/55 hover:bg-white/5 hover:text-white"
              >
                {t.ctaAccount}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
