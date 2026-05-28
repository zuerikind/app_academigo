import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { TeacherCard } from "@/components/teachers/teacher-card";
import { getStudentNav } from "@/config/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";
import { getApprovedTeachers } from "@/lib/queries/teachers";

type Props = { params: Promise<{ locale: string }> };

export default async function StudentTeachersPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.student.teachers;
  const teachers = await getApprovedTeachers();

  return (
    <DashboardLayout
      navItems={getStudentNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.student.findTeachers}
      title={t.title}
      subtitle={t.subtitle}
    >
      {teachers.length === 0 ? (
        <EmptyState
          icon="users"
          title={t.emptyTitle}
          description={t.emptyDesc}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teachers.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              profileHref={localizedPath(raw, `/student/teachers/${teacher.id}`)}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
