import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { getTeacherNav } from "@/config/navigation";
import { requireRoleFromParams } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMessage } from "@/lib/i18n/format";
import { getTeacherDashboardData } from "@/lib/queries/teacher-dashboard";

type Props = { params: Promise<{ locale: string }> };

export default async function TeacherDashboardPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.teacher.dashboard;
  const tc = dict.common;
  const profile = await requireRoleFromParams("teacher", raw);
  const data = await getTeacherDashboardData(profile.id);
  const name = profile.full_name?.split(" ")[0] ?? "Teacher";

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
