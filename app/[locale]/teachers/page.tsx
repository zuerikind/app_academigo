import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { TeacherCard } from "@/components/teachers/teacher-card";
import { TeacherOpeningsSection } from "@/components/teachers/teacher-openings-section";
import { JsonLd } from "@/components/seo/json-ld";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";
import { getApprovedTeachers } from "@/lib/queries/teachers";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbListJsonLd } from "@/lib/seo/schemas";
import { absoluteUrl } from "@/lib/seo/site-url";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const dict = getDictionary(raw);
  const seo = dict.seo.teachers;
  return buildPageMetadata({
    locale: raw,
    path: "/teachers",
    title: seo.title,
    description: seo.description,
  });
}

export default async function TeachersPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.teachers;
  const teachers = await getApprovedTeachers();

  return (
    <PublicLayout locale={raw}>
      <JsonLd data={breadcrumbListJsonLd([
        { name: raw === "de" ? "Startseite" : "Home", url: absoluteUrl(localizedPath(raw, "/")) },
        { name: dict.nav.teachers, url: absoluteUrl(localizedPath(raw, "/teachers")) },
      ])} />
      <Section pad="tight" width="wide" className="pt-12">
        <PageHeader
          eyebrow={dict.nav.teachers}
          title={t.title}
          description={t.subtitle}
          size="lg"
        />

        <TeacherOpeningsSection dict={dict} locale={raw} />

        <div className="mt-14 lg:mt-16">
          {teachers.length === 0 ? (
            <EmptyState
              icon="users"
              title={t.emptyTitle}
              description={t.emptyDesc}
              actionLabel={t.becomeTeacher}
              actionHref={localizedPath(raw, "/signup?role=teacher")}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {teachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  profileHref={localizedPath(raw, `/teachers/${teacher.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </Section>
    </PublicLayout>
  );
}
