import Link from "next/link";
import { getAdminStats } from "@/lib/queries/admin";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "de";
  const dict = getDictionary(safeLocale);
  const d = dict.admin.dashboard;
  const stats = await getAdminStats();

  const needsAttention = [
    {
      count: stats.pendingTeachers,
      label: d.pendingTeachers,
      linkLabel: d.viewTeachers,
      href: localizedPath(safeLocale, "/admin/teachers"),
    },
    {
      count: stats.pendingPromotions,
      label: d.pendingPromotions,
      linkLabel: d.viewPromotions,
      href: localizedPath(safeLocale, "/admin/promotions"),
    },
    {
      count: stats.pendingPayouts,
      label: d.pendingPayouts,
      linkLabel: d.viewPayouts,
      href: localizedPath(safeLocale, "/admin/payouts"),
    },
  ];

  return (
    <div className="space-y-10">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label={d.statTeachers}
          value={stats.teacherCount}
          icon="users"
          tone="default"
        />
        <StatCard
          label={d.statStudents}
          value={stats.studentCount}
          icon="user"
          tone="default"
        />
        <StatCard
          label={d.statBookings}
          value={stats.bookingCount}
          icon="calendar"
          tone="default"
        />
        <StatCard
          label={d.statRevenue}
          value={d.revenueStub}
          icon="coins"
          tone="default"
          hint={dict.admin.dashboard.revenueStub}
        />
      </div>

      {/* Needs Attention section */}
      <Card>
        <CardHeader title={d.needsAttention} className="mb-5" />
        <ul className="divide-y divide-academy-line">
          {needsAttention.map((item) => (
            <li
              key={item.href}
              className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <Badge variant={item.count > 0 ? "warning" : "muted"}>
                  {item.count}
                </Badge>
                <span className="text-[14px] text-academy-navy">
                  {item.label}
                </span>
              </div>
              <Link
                href={item.href}
                className="text-[12px] font-medium text-[color:var(--brand-deep)] hover:text-academy-navy"
              >
                {item.linkLabel} →
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
