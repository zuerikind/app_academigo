import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table } from "@/components/ui/table";
import { PayoutDetailDialog } from "@/components/admin/payout-detail-dialog";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAdminPayoutsWithEarnings } from "@/lib/queries/admin";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminPayoutsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const dict = getDictionary(raw);
  const t = dict.admin.payouts;

  const payouts = await getAdminPayoutsWithEarnings();

  type PayoutRow = (typeof payouts)[number];

  const dialogLabels = {
    viewDetails: t.viewDetails,
    dialogTitle: t.dialogTitle,
    dialogTeacher: t.dialogTeacher,
    dialogEmail: t.dialogEmail,
    dialogAmount: t.dialogAmount,
    dialogRequested: t.dialogRequested,
    dialogSessions: t.dialogSessions,
    dialogColDate: t.dialogColDate,
    dialogColStudent: t.dialogColStudent,
    dialogColSubject: t.dialogColSubject,
    dialogColAmount: t.dialogColAmount,
    dialogNoSessions: t.dialogNoSessions,
    confirmPayout: t.confirmPayout,
    confirmPayoutLoading: t.confirmPayoutLoading,
    statusProcessed: t.statusProcessed,
    close: t.close,
  };

  const columns = [
    {
      key: "teacher",
      header: t.colTeacher,
      render: (row: PayoutRow) => {
        const tc = Array.isArray(row.teachers) ? row.teachers[0] : row.teachers;
        if (!tc) return "—";
        const profiles = Array.isArray(tc.profiles) ? tc.profiles[0] : tc.profiles;
        return (profiles as { full_name: string | null; email: string | null } | null)?.full_name ?? "—";
      },
    },
    {
      key: "amount",
      header: t.colAmount,
      render: (row: PayoutRow) =>
        `CHF ${Number(row.amount_chf).toFixed(2)}`,
    },
    {
      key: "status",
      header: t.colStatus,
      render: (row: PayoutRow) => (
        <Badge variant={row.status === "processed" ? "verified" : "warning"}>
          {row.status === "processed" ? t.statusProcessed : t.statusPending}
        </Badge>
      ),
    },
    {
      key: "date",
      header: t.colDate,
      render: (row: PayoutRow) =>
        new Date(row.created_at).toLocaleDateString("de-CH"),
    },
    {
      key: "actions",
      header: t.colActions,
      render: (row: PayoutRow) => (
        <PayoutDetailDialog payout={row as any} labels={dialogLabels} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t.title} />
      <Table
        columns={columns}
        rows={payouts}
        emptyState={
          <EmptyState icon="coins" title={t.empty} description="" />
        }
      />
    </div>
  );
}
