import Link from "next/link";
import { notFound } from "next/navigation";
import { TeacherQuickStatsBar } from "@/components/teacher/teacher-quick-stats-bar";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
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
import { getPlatformSettings } from "@/lib/queries/admin";

type Props = { params: Promise<{ locale: string }> };

type DashboardT = ReturnType<typeof getDictionary>["teacher"]["dashboard"];

type LevelNext = { sessions: number; rating: number; rate: number };
type LevelConfig = { rate: number; next: LevelNext | null };

function buildLevelConfig(s: Record<string, string>): Record<string, LevelConfig> {
  const jRate  = parseFloat(s.tier_junior_rate_chf  ?? "30");
  const mRate  = parseFloat(s.tier_mid_rate_chf     ?? "45");
  const tRate  = parseFloat(s.tier_top_rate_chf     ?? "60");
  return {
    junior:            { rate: jRate, next: { sessions: parseInt(s.tier_junior_sessions_to_promote ?? "15"), rating: parseFloat(s.tier_junior_rating_to_promote ?? "4.0"), rate: mRate } },
    academigo_teacher: { rate: mRate, next: { sessions: parseInt(s.tier_mid_sessions_to_promote   ?? "30"), rating: parseFloat(s.tier_mid_rating_to_promote   ?? "4.5"), rate: tRate } },
    verified:          { rate: tRate, next: null },
  };
}

function TeacherLevelCard({
  level,
  completedLessons,
  averageRating,
  reviewCount,
  t,
  levelConfig,
}: {
  level: string;
  completedLessons: number;
  averageRating: number;
  reviewCount: number;
  t: DashboardT;
  levelConfig: Record<string, LevelConfig>;
}) {
  const levelLabel: Record<string, string> = {
    junior: t.levelJunior,
    academigo_teacher: t.levelAcademigoTeacher,
    verified: t.levelVerified,
  };
  const config = levelConfig[level] ?? { rate: 30, next: null };
  const next = config.next;
  const label = levelLabel[level] ?? level;

  return (
    <div className="rounded-[14px] border border-academy-line bg-white p-6">
      <p className="text-meta mb-2">{t.levelTitle}</p>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-flex items-center rounded-full bg-[color:var(--brand)]/10 px-3 py-1 text-[13px] font-semibold text-[color:var(--brand-deep)]">
          {label}
        </span>
        <span className="font-display text-[15px] font-semibold text-academy-navy">
          {t.levelRate.replace("{rate}", String(config.rate))}
        </span>
      </div>

      {next ? (
        <div className="mt-5 space-y-4">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-academy-slate">
            {t.nextLevelTitle}
          </p>

          {/* Sessions progress */}
          <div>
            <div className="mb-1 flex justify-between text-[12px] text-academy-slate">
              <span>Completed sessions</span>
              <span className="font-medium text-academy-navy">
                {Math.min(completedLessons, next.sessions)}/{next.sessions}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-academy-mist-dark">
              <div
                className="h-full rounded-full bg-[color:var(--brand-deep)] transition-all duration-500"
                style={{ width: `${Math.min((completedLessons / next.sessions) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Rating requirement */}
          <div>
            <div className="mb-1 flex justify-between text-[12px] text-academy-slate">
              <span>Average rating</span>
              <span className={`font-medium ${reviewCount > 0 && averageRating >= next.rating ? "text-[color:var(--academy-success)]" : "text-academy-navy"}`}>
                {reviewCount > 0 ? `${averageRating} ★` : "—"} / {next.rating}★ required
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-academy-mist-dark">
              <div
                className="h-full rounded-full bg-[color:var(--brand-deep)] transition-all duration-500"
                style={{ width: reviewCount > 0 ? `${Math.min((averageRating / next.rating) * 100, 100)}%` : "0%" }}
              />
            </div>
          </div>

          <p className="text-[12px] text-academy-slate">
            {t.nextLevelRequirements
              .replace("{sessions}", String(next.sessions))
              .replace("{rating}", String(next.rating))}
          </p>
          <p className="text-[12px] font-medium text-[color:var(--brand-deep)]">
            {t.nextLevelRate.replace("{rate}", String(next.rate))}
          </p>
          <a
            href="faq"
            className="mt-1 inline-flex text-[12px] font-medium text-[color:var(--brand-deep)] hover:underline"
          >
            {t.learnMoreLevels} →
          </a>
        </div>
      ) : (
        <p className="mt-3 text-[13px] text-academy-slate">{t.alreadyTopLevel}</p>
      )}
    </div>
  );
}

export default async function TeacherDashboardPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.teacher.dashboard;
  const tc = dict.common;
  const tb = dict.bookings;
  const profile = await requireRoleFromParams("teacher", raw);
  const [data, platformSettings] = await Promise.all([
    getTeacherDashboardData(profile.id),
    getPlatformSettings(),
  ]);
  const levelConfig = buildLevelConfig(platformSettings);
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

      {data.profileCompletion < 100 && (
        <Link
          href={localizedPath(raw, "/teacher/profile")}
          className="mb-6 block rounded-[14px] border border-academy-line bg-white px-5 py-5 transition-colors hover:border-[color:var(--brand)]/40"
        >
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
          {data.missingFields.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="text-[12px] text-academy-slate">{t.missingFieldsLabel}</span>
              {data.missingFields.map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center rounded-full border border-[color:var(--academy-warning)]/30 bg-[color:var(--academy-warning-soft)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--academy-warning)]"
                >
                  {t.profileFields[field]}
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 text-[12px] font-medium text-[color:var(--brand-deep)]">
            {t.completeProfile}
          </p>
        </Link>
      )}

      <TeacherQuickStatsBar
        completedLessons={data.completedLessons}
        averageRating={data.averageRating}
        reviewCount={data.reviewCount}
        completedLabel={t.completed}
        ratingLabel={t.yourRating}
        noRatingYet={t.noRatingYet}
        reviewsCountLabel={formatMessage(t.reviewsCount, { count: String(data.reviewCount) })}
        bookingsHref={localizedPath(raw, "/teacher/bookings")}
        reviewsHref={`${localizedPath(raw, "/teacher/earnings")}#reviews`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          label={t.earningsThisMonth}
          value={`CHF ${data.monthlyEarnings.toFixed(2)}`}
          icon="coins"
          tone="calm"
          href={`${localizedPath(raw, "/teacher/earnings")}#payout`}
          hrefLabel={t.requestPayout}
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
              const dateStr = start.toLocaleDateString(dateFmt, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
              const timeStr = `${start.toLocaleTimeString(dateFmt, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} – ${end.toLocaleTimeString(dateFmt, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}`;
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

      {/* Teacher level + earnings */}
      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        {/* Level card */}
        <TeacherLevelCard
          level={data.teacherLevel}
          completedLessons={data.completedLessons}
          averageRating={data.averageRating}
          reviewCount={data.reviewCount}
          t={t}
          levelConfig={levelConfig}
        />

        {/* Earnings card */}
        <div className="rounded-[14px] border border-academy-line bg-white p-6">
          <p className="text-meta mb-1">{t.earningsTitle}</p>
          <p className="font-display text-[28px] font-semibold leading-none tracking-tight text-academy-navy text-numeric">
            CHF {data.totalEarned.toFixed(2)}
          </p>
          <p className="mt-2 text-[13px] text-academy-slate">{t.earningsNote}</p>
          <Link
            href={localizedPath(raw, "/teacher/earnings")}
            className="mt-4 inline-flex items-center text-[13px] font-medium text-[color:var(--brand-deep)] hover:text-academy-navy"
          >
            {t.viewEarnings}
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
