import Link from "next/link";
import { notFound } from "next/navigation";
import { RefreshCw, ShoppingBag } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SectionHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { TeacherCard } from "@/components/teachers/teacher-card";
import { getStudentNav } from "@/config/navigation";
import { requireRoleFromParams } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMessage } from "@/lib/i18n/format";
import { localizedPath } from "@/lib/i18n/path";
import { translateSubjectName } from "@/lib/i18n/subjects";
import { getStudentDashboardData, getStudentBillingInfo } from "@/lib/queries/student";
import { getApprovedTeachers } from "@/lib/queries/teachers";

type Props = { params: Promise<{ locale: string }> };

export default async function StudentDashboardPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.student.dashboard;
  const tb = dict.bookings;
  const profile = await requireRoleFromParams("student", raw);
  const [dashboard, billing, teachers] = await Promise.all([
    getStudentDashboardData(profile.id),
    getStudentBillingInfo(profile.id),
    getApprovedTeachers().then((t) => t.slice(0, 3)),
  ]);
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={t.availableCredits}
          value={dashboard.availableCredits}
          icon="coins"
          tone="ink"
          href={localizedPath(raw, "/student/packages")}
          hrefLabel={t.buyPackages}
          hint={
            dashboard.subscriptionRemaining > 0 && dashboard.extraRemaining > 0
              ? `${dashboard.subscriptionRemaining} ${t.creditHintMonthly} · ${dashboard.extraRemaining} ${t.creditHintExtra}`
              : dashboard.subscriptionRemaining > 0
                ? `${dashboard.subscriptionRemaining} ${t.creditHintMonthly}`
                : dashboard.extraRemaining > 0
                  ? `${dashboard.extraRemaining} ${t.creditHintExtra}`
                  : undefined
          }
        />
        <StatCard
          label={t.plannedLessons}
          value={dashboard.upcomingBookings.length}
          icon="calendar"
        />
        <StatCard
          label={t.recommended}
          value={teachers.length}
          icon="users"
          tone="brand"
        />
      </div>

      {billing.activePlan && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-[14px] border border-[color:var(--brand)]/25 bg-[color:var(--brand-tint)] px-4 py-3">
          <div className="flex items-center gap-2.5">
            {billing.activePlan.isSubscription ? (
              <RefreshCw className="h-3.5 w-3.5 shrink-0 text-[color:var(--brand-deep)]" strokeWidth={2} />
            ) : (
              <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-[color:var(--brand-deep)]" strokeWidth={2} />
            )}
            <div>
              <span className="text-[13px] font-semibold text-[color:var(--brand-deep)]">
                {billing.activePlan.packageName}
              </span>
              {billing.activePlan.isSubscription && billing.activePlan.nextRenewalAt ? (
                <span className="ml-2 text-[12px] text-[color:var(--brand-deep)]/70">
                  ·{" "}
                  {formatMessage(t.renewsOn, {
                    date: new Date(billing.activePlan.nextRenewalAt).toLocaleDateString(
                      dateFmt,
                      { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" },
                    ),
                  })}
                </span>
              ) : billing.activePlan.purchasedAt ? (
                <span className="ml-2 text-[12px] text-[color:var(--brand-deep)]/70">
                  ·{" "}
                  {formatMessage(t.purchasedOn, {
                    date: new Date(billing.activePlan.purchasedAt).toLocaleDateString(
                      dateFmt,
                      { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" },
                    ),
                  })}
                </span>
              ) : null}
            </div>
          </div>
          <Link
            href={localizedPath(raw, "/student/packages")}
            className="shrink-0 text-[12px] font-medium text-[color:var(--brand-deep)] hover:text-academy-navy"
          >
            {billing.activePlan.isSubscription ? t.viewPlan : t.buyPackages} →
          </Link>
        </div>
      )}

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
        <div className="mt-6 space-y-3">
          {dashboard.upcomingBookings.length === 0 ? (
            <div className="rounded-[14px] border border-academy-line bg-white px-6 py-9">
              <p className="text-[14px] leading-relaxed text-academy-slate">{t.noUpcoming}</p>
            </div>
          ) : (
            dashboard.upcomingBookings.map((b) => {
              const start = new Date(b.start_time);
              const end = new Date(b.end_time);
              const dateStr = start.toLocaleDateString(dateFmt, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
              const timeStr = `${start.toLocaleTimeString(dateFmt, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} – ${end.toLocaleTimeString(dateFmt, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}`;
              return (
                <div key={b.id} className="rounded-[14px] border border-academy-line bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-academy-navy">{b.teacherName}</p>
                      <p className="mt-0.5 text-[13px] text-academy-slate">{dateStr} · {timeStr}</p>
                      {b.subjects.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {b.subjects.map((s) => (
                            <span key={s.id} className="inline-flex items-center rounded-full border border-[color:var(--brand)]/30 bg-[color:var(--brand)]/8 px-2 py-0.5 text-[11px] font-medium text-[color:var(--brand-deep)]">
                              {translateSubjectName(dict, s.slug, s.name)}
                            </span>
                          ))}
                        </div>
                      )}
                      {b.topic_note && (
                        <p className="mt-1 text-[12px] text-academy-slate-muted">
                          <span className="font-medium">{tb.topic}</span> {b.topic_note}
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ${b.status === "confirmed" ? "border border-green-200 bg-green-50 text-green-700" : "border border-yellow-200 bg-yellow-50 text-yellow-700"}`}>
                      {b.status === "confirmed" ? tb.statusConfirmed : tb.pendingReview}
                    </span>
                  </div>
                  <div className="mt-4">
                    {b.status === "confirmed" && b.meeting_link ? (
                      <a
                        href={b.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[color:var(--brand-deep)] px-4 text-sm font-medium text-white shadow-[var(--shadow-button)] transition-colors hover:bg-[color:var(--academy-navy)]"
                      >
                        {tb.joinLesson}
                      </a>
                    ) : b.status === "confirmed" ? (
                      <span className="inline-flex h-9 items-center justify-center rounded-[10px] border border-academy-line bg-academy-mist px-4 text-sm font-medium text-academy-slate-muted opacity-60">
                        {tb.waitingForTeacher}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
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
