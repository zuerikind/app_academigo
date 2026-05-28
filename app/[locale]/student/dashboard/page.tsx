import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { TeacherCard } from "@/components/teachers/teacher-card";
import { getStudentNav } from "@/config/navigation";
import { requireRoleFromParams } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMessage } from "@/lib/i18n/format";
import { localizedPath } from "@/lib/i18n/path";
import { getStudentDashboardData } from "@/lib/queries/student";
import { getApprovedTeachers } from "@/lib/queries/teachers";

type Props = { params: Promise<{ locale: string }> };

export default async function StudentDashboardPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.student.dashboard;
  const profile = await requireRoleFromParams("student", raw);
  const dashboard = await getStudentDashboardData(profile.id);
  const teachers = (await getApprovedTeachers()).slice(0, 3);
  const name = profile.full_name?.split(" ")[0] ?? "Student";
  const dateFmt = raw === "de" ? "de-CH" : "en-CH";

  return (
    <DashboardLayout
      navItems={getStudentNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.student.dashboard}
      title={formatMessage(t.greeting, { name })}
      subtitle={t.subtitle}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.availableCredits}
          value={dashboard.availableCredits}
          icon="coins"
          tone="ink"
          href={localizedPath(raw, "/student/packages")}
          hrefLabel={t.buyPackages}
        />
        <StatCard
          label={t.upcomingLessons}
          value={dashboard.upcomingBookings.length}
          icon="calendar"
        />
        <StatCard
          label={t.purchasedPackages}
          value={dashboard.purchasedPackages.length}
          icon="package"
        />
        <StatCard
          label={t.recommended}
          value={teachers.length}
          icon="users"
          tone="brand"
        />
      </div>

      <section className="mt-14">
        <SectionHeader
          title={t.upcomingTitle}
          action={
            <Link
              href={localizedPath(raw, "/student/bookings")}
              className="text-[13px] font-medium text-[color:var(--brand-deep)] hover:text-academy-navy"
            >
              {dict.common.viewAll} →
            </Link>
          }
        />
        <div className="mt-6 overflow-hidden rounded-[14px] border border-academy-line bg-white">
          {dashboard.upcomingBookings.length === 0 ? (
            <div className="px-6 py-9">
              <p className="text-[14px] leading-relaxed text-academy-slate">
                {t.noUpcoming}
              </p>
              {t.noUpcomingHint && (
                <p className="mt-2 text-[12.5px] text-academy-slate-muted">
                  {t.noUpcomingHint}
                </p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-academy-line">
              {dashboard.upcomingBookings.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <p className="text-[13.5px] font-medium text-academy-navy">
                    {new Date(b.start_time).toLocaleString(dateFmt, {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-16">
        <SectionHeader
          title={t.recommendedTitle}
          action={
            <Link
              href={localizedPath(raw, "/student/teachers")}
              className="text-[13px] font-medium text-[color:var(--brand-deep)] hover:text-academy-navy"
            >
              {dict.common.browseAll} →
            </Link>
          }
        />
        {teachers.length === 0 ? (
          <div className="mt-6 rounded-[14px] border border-dashed border-academy-line bg-white px-6 py-10">
            <p className="text-[14px] text-academy-slate">{t.noTeachers}</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {teachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                profileHref={localizedPath(raw, `/student/teachers/${teacher.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
