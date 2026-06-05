import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { SubjectCard } from "@/components/subjects/subject-card";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getSubjects } from "@/lib/queries/subjects";
import { buildPageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const dict = getDictionary(raw);
  const seo = dict.seo.subjects;
  return buildPageMetadata({
    locale: raw,
    path: "/subjects",
    title: seo.title,
    description: seo.description,
  });
}

export default async function SubjectsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const subjects = await getSubjects();
  const active = subjects.filter((s) => s.is_active && !s.is_coming_soon);
  const comingSoon = subjects.filter((s) => s.is_coming_soon);
  const t = dict.subjects;

  return (
    <PublicLayout locale={raw}>
      <Section pad="tight" width="wide" className="pt-12">
        <PageHeader
          eyebrow={dict.nav.subjects}
          title={t.title}
          description={t.subtitle}
          size="lg"
        />

        <div className="mt-12 grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-meta mb-1">{t.availableNow}</p>
            <div className="hairline-t mt-4 border-t pt-2">
              {active.map((s) => (
                <SubjectCard key={s.id} subject={s} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-meta mb-1">{t.comingSoon}</p>
            <div className="hairline-t mt-4 border-t pt-2">
              {comingSoon.map((s) => (
                <SubjectCard key={s.id} subject={s} />
              ))}
            </div>
          </div>
        </div>
      </Section>
    </PublicLayout>
  );
}
