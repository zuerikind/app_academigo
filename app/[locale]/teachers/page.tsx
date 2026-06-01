import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/layout/public-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { TeacherCard } from "@/components/teachers/teacher-card";
import { TeacherOpeningsSection } from "@/components/teachers/teacher-openings-section";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";
import { getApprovedTeachers } from "@/lib/queries/teachers";

type Props = { params: Promise<{ locale: string }> };

export default async function TeachersPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.teachers;
  const teachers = await getApprovedTeachers();

  return (
    <PublicLayout locale={raw}>
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
