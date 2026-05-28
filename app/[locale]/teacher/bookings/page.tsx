import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { getTeacherNav } from "@/config/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type Props = { params: Promise<{ locale: string }> };

export default async function TeacherBookingsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.teacher.bookings;

  return (
    <DashboardLayout
      navItems={getTeacherNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.teacher.bookings}
      title={t.title}
      subtitle={t.subtitle}
    >
      <EmptyState
        icon="book"
        title={t.emptyTitle}
        description={t.emptyDesc}
        hint={t.emptyHint}
      />
    </DashboardLayout>
  );
}
