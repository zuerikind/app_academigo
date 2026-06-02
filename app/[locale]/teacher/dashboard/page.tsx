import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getTeacherNav } from "@/config/navigation";
import { requireRoleFromParams } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMessage } from "@/lib/i18n/format";
import { localizedPath } from "@/lib/i18n/path";
import { translateSubjectName } from "@/lib/i18n/subjects";
import { getTeacherDashboardData } from "@/lib/queries/teacher-dashboard";

type Props = { params: Promise<{ locale: string }> };

export default async function TeacherDashboardPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.teacher.dashboard;
  const tc = dict.common;
  const tb = dict.bookings;
  const profile = await requireRoleFromParams("teacher", raw);
  const data = await getTeacherDashboardData(profile.id);
  const name = profile.full_name?.split(" ")[0] ?? "Teacher";
  const dateFmt = raw === "de" ? "de-CH" : "en-CH";

  return (
    <DashboardLayout
      navItems={getTeacherNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.teacher.dashboard}
      title={formatMessage(t.greeting, { name })}
      subtitle={t.subtitle}
    >
      {!data.isApproved && (
        <div className="mb-6 flex items-start gap-3 rounded-[10px] border border-[color:var(--academy-warning)]/25 bg-[color:var(--academy-warning-soft)] px-4 py-3.5">
          <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--academy-warning)]" />
          <p className="text-[13.5px] leading-relaxed text-[color:var(--academy-warning)]">
            {t.reviewBanner}
          </p>
        </div>
      )}

      <div className="mb-10 rounded-[14px] border border-academy-line bg-white px-5 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-meta">{t.profileCompletion}</p>
            <p className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-tight text-academy-navy text-numeric">
              {data.profileCompletion}%
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {data.isVerified ? (
              <Badge variant="verified">{tc.verified}</Badge>
            ) : (
              <Badge variant="muted">{tc.standard}</Badge>
            )}
            {data.isApproved ? (
              <Badge variant="verified">{tc.approved}</Badge>
            ) : (
              <Badge variant="warning">{tc.pending}</Badge>
            )}
          </div>
        </div>
        <div className="mt-5 h-1 overflow-hidden rounded-full bg-academy-mist-dark">
          <div
            className="h-full rounded-full bg-[color:var(--brand-deep)] transition-all duration-500"
            style={{ width: `${data.profileCompletion}%` }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t.pendingRequests}
          value={data.pendingRequests}
          icon="clock"
          tone="ink"
          href={`${localizedPath(raw, "/teacher/bookings")}#requests`}
          hrefLabel={t.viewRequests}
        />
        <StatCard
          label={t.upcomingLessons}
          value={data.upcomingLessons}
          icon="calendar"
        />
        <StatCard
          label={t.completed}
          value={data.completedLessons}
          icon="checkCircle"
          tone="calm"
        />
      </div>

      {/* Upcoming confirmed lessons */}
      <section className="mt-12">
        <SectionHeader
          title={t.upcomingTitle}
          action={
            <Link
              href={localizedPath(raw, "/teacher/bookings")}
              className="text-[13px] font-medium text-[color:var(--brand-deep)] hover:text-academy-navy"
            >
              {tc.viewAll} →
            </Link>
          }
        />
        <div className="mt-6 space-y-3">
          {data.upcomingBookings.length === 0 ? (
            <div className="rounded-[14px] border border-academy-line bg-white px-6 py-9">
              <p className="text-[14px] text-academy-slate">{t.noUpcoming}</p>
            </div>
          ) : (
            data.upcomingBookings.map((b) => {
              const start = new Date(b.start_time);
              const end = new Date(b.end_time);
              const dateStr = start.toLocaleDateString(dateFmt, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
              const timeStr = `${start.toLocaleTimeString(dateFmt, { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString(dateFmt, { hour: "2-digit", minute: "2-digit" })}`;
              return (
                <div key={b.id} className="rounded-[14px] border border-academy-line bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-academy-navy">{b.studentName}</p>
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
                    <Badge variant="verified">{tb.statusConfirmed}</Badge>
                  </div>
                  <div className="mt-4">
                    {b.meeting_link ? (
                      <a
                        href={b.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[color:var(--brand-deep)] px-4 text-sm font-medium text-white shadow-[var(--shadow-button)] transition-colors hover:bg-[color:var(--academy-navy)]"
                      >
                        {tb.joinLesson}
                      </a>
                    ) : (
                      <Link
                        href={localizedPath(raw, "/teacher/bookings")}
                        className="inline-flex h-9 items-center justify-center rounded-[10px] border border-academy-line bg-white px-4 text-sm font-medium text-academy-navy transition-colors hover:border-[color:var(--brand)]/40"
                      >
                        {tb.addLink}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <div className="mt-12">
        <Card padding="loose">
          <CardHeader
            eyebrow={t.status}
            title={t.earningsTitle}
            description={t.earningsNote}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
