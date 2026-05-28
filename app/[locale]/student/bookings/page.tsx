import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { getStudentNav } from "@/config/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";

type Props = { params: Promise<{ locale: string }> };

export default async function StudentBookingsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.student.bookings;

  return (
    <DashboardLayout
      navItems={getStudentNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.student.bookings}
      title={t.title}
      subtitle={t.subtitle}
    >
      <EmptyState
        icon="calendar"
        title={t.emptyTitle}
        description={t.emptyDesc}
        hint={t.emptyHint}
        actionLabel={t.findTeachers}
        actionHref={localizedPath(raw, "/student/teachers")}
      />
    </DashboardLayout>
  );
}
