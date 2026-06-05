import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";
import { getPlatformRevenue } from "@/lib/queries/admin";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminRevenuePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const dict = getDictionary(raw);
  const t = dict.admin.revenue;

  const { grossRevenue, totalPayouts, platformMargin, monthly } =
    await getPlatformRevenue();

  type MonthRow = (typeof monthly)[number];

  const columns = [
    {
      key: "month",
      header: t.colMonth,
      render: (row: MonthRow) => {
        const [year, month] = row.month.split("-");
        return new Date(Number(year), Number(month) - 1).toLocaleDateString(
          raw === "de" ? "de-CH" : "en-GB",
          { month: "long", year: "numeric" },
        );
      },
    },
    {
      key: "revenue",
      header: t.colRevenue,
      render: (row: MonthRow) => `CHF ${row.revenue.toFixed(2)}`,
    },
    {
      key: "payouts",
      header: t.colPayouts,
      render: (row: MonthRow) => `CHF ${row.payouts.toFixed(2)}`,
    },
    {
      key: "margin",
      header: t.colMargin,
      render: (row: MonthRow) => (
        <span className={row.margin >= 0 ? "text-green-600" : "text-red-600"}>
          CHF {row.margin.toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title={t.title} description={t.subtitle} />
        <Link
          href={localizedPath(raw, "/admin/analytics")}
          className="mt-1 shrink-0 text-[13px] font-medium text-[color:var(--brand-deep)] hover:text-academy-navy"
        >
          {dict.admin.analytics.viewAnalytics}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={t.statGross}
          value={`CHF ${grossRevenue.toFixed(2)}`}
          icon="coins"
          tone="default"
        />
        <StatCard
          label={t.statPayouts}
          value={`CHF ${totalPayouts.toFixed(2)}`}
          icon="coins"
          tone="default"
        />
        <StatCard
          label={t.statMargin}
          value={`CHF ${platformMargin.toFixed(2)}`}
          icon="trendingUp"
          tone="default"
        />
      </div>

      <Card>
        <CardHeader title={t.tableTitle} className="mb-5" />
        <Table
          columns={columns}
          rows={monthly}
          emptyState={
            <EmptyState icon="trendingUp" title={t.empty} description="" />
          }
        />
      </Card>
    </div>
  );
}
