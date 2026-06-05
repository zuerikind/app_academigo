import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getTeacherPerformance } from "@/lib/queries/admin";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { TeacherAnalyticsTable } from "@/components/admin/teacher-analytics-table";
import { AnalyticsPeriodFilter } from "@/components/admin/analytics-period-filter";
import { localizedPath } from "@/lib/i18n/path";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ period?: string }>;
};

function resolvePeriod(period?: string): { from?: string; to?: string } {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  function daysAgo(n: number) {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  switch (period) {
    case "this_month": {
      const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      return { from, to: todayStr };
    }
    case "last_month": {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const from = d.toISOString().slice(0, 10);
      const to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      return { from, to };
    }
    case "last_30":
      return { from: daysAgo(30), to: todayStr };
    case "last_90":
      return { from: daysAgo(90), to: todayStr };
    case "ytd":
      return { from: `${now.getFullYear()}-01-01`, to: todayStr };
    default:
      return {};
  }
}

export default async function AdminAnalyticsPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const { period } = await searchParams;
  const { from, to } = resolvePeriod(period);

  const dict = getDictionary(raw);
  const t = dict.admin.analytics;

  const { teacherRows, summary, avgCreditValue } = await getTeacherPerformance(from, to);

  const basePath = localizedPath(raw, "/admin/analytics");

  const filterLabels: Record<string, string> = {
    periodLabel: t.periodLabel,
    periodAll: t.periodAll,
    periodThisMonth: t.periodThisMonth,
    periodLastMonth: t.periodLastMonth,
    periodLast30: t.periodLast30,
    periodLast90: t.periodLast90,
    periodYtd: t.periodYtd,
  };

  const tableLabels = {
    colName: t.colName,
    colLevel: t.colLevel,
    colSessions: t.colSessions,
    colRating: t.colRating,
    colReviews: t.colReviews,
    colStudentRevenue: t.colStudentRevenue,
    colTeacherPayout: t.colTeacherPayout,
    colMargin: t.colMargin,
    colMarginPct: t.colMarginPct,
    noRating: t.noRating,
    empty: t.empty,
  };

  return (
    <div className="space-y-8">
      {/* Header + filter */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={t.title} description={t.subtitle} />
        <div className="mt-1">
          <AnalyticsPeriodFilter
            current={period ?? "all"}
            basePath={basePath}
            labels={filterLabels}
          />
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label={t.statSessions} value={summary.sessions} icon="calendar" tone="default" />
        <StatCard label={t.statRevenue} value={`CHF ${summary.studentRevenue.toFixed(2)}`} icon="coins" tone="default" />
        <StatCard label={t.statPayout} value={`CHF ${summary.teacherPayout.toFixed(2)}`} icon="coins" tone="default" />
        <StatCard label={t.statMargin} value={`CHF ${summary.platformMargin.toFixed(2)}`} icon="trendingUp" tone="default" />
      </div>

      {/* WAC methodology note */}
      {avgCreditValue > 0 && (
        <p className="text-[12px] text-academy-slate">
          {t.wacNote.replace("{wac}", avgCreditValue.toFixed(2))}
        </p>
      )}

      {/* Per-teacher breakdown */}
      <Card>
        <CardHeader title={t.title} className="mb-5" />
        <TeacherAnalyticsTable rows={teacherRows} labels={tableLabels} />
      </Card>
    </div>
  );
}
