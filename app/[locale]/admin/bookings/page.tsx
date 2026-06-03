import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table } from "@/components/ui/table";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";
import { getAdminBookings } from "@/lib/queries/admin";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
};

const VALID_TABS = [
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;
type TabValue = (typeof VALID_TABS)[number];

// Purely presentational — no hooks, so no "use client" needed
function BookingStatusTabs({
  current,
  basePath,
  labels,
}: {
  current: TabValue;
  basePath: string;
  labels: Record<TabValue, string>;
}) {
  return (
    <div className="mb-4 flex gap-1 border-b border-academy-line">
      {VALID_TABS.map((tab) => (
        <Link
          key={tab}
          href={tab === "all" ? basePath : `${basePath}?status=${tab}`}
          className={[
            "px-4 py-2 text-sm font-medium transition-colors",
            current === tab
              ? "border-b-2 border-academy-navy text-academy-navy"
              : "text-academy-slate hover:text-academy-navy",
          ].join(" ")}
        >
          {labels[tab]}
        </Link>
      ))}
    </div>
  );
}

const statusVariantMap: Record<
  string,
  "default" | "verified" | "muted" | "warning" | "accent" | "brand"
> = {
  pending: "warning",
  confirmed: "verified",
  rejected: "muted",
  cancelled: "muted",
  completed: "brand",
};

export default async function AdminBookingsPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  // Next.js 16: searchParams is a Promise and MUST be awaited
  const { status } = await searchParams;

  const dict = getDictionary(raw);
  const t = dict.admin.bookings;

  const currentTab: TabValue =
    (VALID_TABS as readonly string[]).includes(status ?? "") && status !== "all"
      ? (status as TabValue)
      : "all";

  const bookings = await getAdminBookings(
    currentTab === "all" ? undefined : currentTab,
  );

  const basePath = localizedPath(raw, "/admin/bookings");

  const tabLabels: Record<TabValue, string> = {
    all: t.tabs.all,
    pending: t.tabs.pending,
    confirmed: t.tabs.confirmed,
    completed: t.tabs.completed,
    cancelled: t.tabs.cancelled,
  };

  type BookingRow = (typeof bookings)[number];

  const columns = [
    {
      key: "student",
      header: t.colStudent,
      render: (row: BookingRow) => {
        const s = Array.isArray(row.students) ? row.students[0] : row.students;
        if (!s) return "—";
        const profiles = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
        return (profiles as { full_name: string | null } | null)?.full_name ?? "—";
      },
    },
    {
      key: "teacher",
      header: t.colTeacher,
      render: (row: BookingRow) => {
        const tc = Array.isArray(row.teachers) ? row.teachers[0] : row.teachers;
        if (!tc) return "—";
        const profiles = Array.isArray(tc.profiles) ? tc.profiles[0] : tc.profiles;
        return (profiles as { full_name: string | null } | null)?.full_name ?? "—";
      },
    },
    {
      key: "date",
      header: t.colDate,
      render: (row: BookingRow) =>
        new Date(row.start_time).toLocaleDateString("de-CH", { timeZone: "UTC" }),
    },
    {
      key: "credits",
      header: t.colCredits,
      render: (row: BookingRow) => String(row.credits_reserved),
    },
    {
      key: "status",
      header: t.colStatus,
      render: (row: BookingRow) => (
        <Badge variant={statusVariantMap[row.status] ?? "muted"}>
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t.title} />
      <BookingStatusTabs
        current={currentTab}
        basePath={basePath}
        labels={tabLabels}
      />
      <Table
        columns={columns}
        rows={bookings}
        emptyState={
          <EmptyState icon="calendar" title={t.empty} description="" />
        }
      />
    </div>
  );
}
