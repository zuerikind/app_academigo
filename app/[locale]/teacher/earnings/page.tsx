import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { Table } from "@/components/ui/table";
import { getTeacherNav } from "@/config/navigation";
import { requireRoleFromParams, getTeacherRecord } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import { getTeacherEarnings, getTeacherPendingBalance } from "@/lib/queries/earnings";
import { RequestPayoutForm } from "@/components/teacher/request-payout-form";

type Props = { params: Promise<{ locale: string }> };

export default async function TeacherEarningsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.earnings;

  const profile = await requireRoleFromParams("teacher", raw);
  const teacher = await getTeacherRecord(profile.id);

  if (!teacher) {
    notFound();
  }

  const supabase = await createClient();

  const [earnings, pendingBalance] = await Promise.all([
    getTeacherEarnings(teacher.id),
    getTeacherPendingBalance(teacher.id),
  ]);

  const { data: pendingPayout } = await supabase
    .from("payout_requests")
    .select("id, status, created_at")
    .eq("teacher_id", teacher.id)
    .eq("status", "pending")
    .maybeSingle();

  type EarningRow = {
    id: string;
    date: string;
    student: string;
    amount: string;
  };

  const earningRows: EarningRow[] = earnings.map((e) => ({
    id: e.id,
    date: new Date(e.created_at).toLocaleDateString("de-CH"),
    student: e.booking?.student?.profiles?.full_name ?? "—",
    amount: `CHF ${e.amount_chf.toFixed(2)}`,
  }));

  return (
    <DashboardLayout
      navItems={getTeacherNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.teacher.earnings}
      title={t.title}
      subtitle={t.subtitle}
    >
      <div className="space-y-6">
        {/* Pending balance card */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label={t.pendingBalance}
            value={`CHF ${pendingBalance.toFixed(2)}`}
            icon="coins"
            tone="brand"
          />
        </div>

        {/* Request Payout section */}
        <div>
          {pendingPayout ? (
            <div className="rounded-[14px] border border-academy-line bg-white p-5">
              <p className="text-sm font-medium text-academy-navy">{t.payoutPending}</p>
              <p className="mt-1 text-[13px] text-academy-slate-muted">
                {t.payoutRequested}{" "}
                {new Date(pendingPayout.created_at as string).toLocaleDateString("de-CH")}
              </p>
              <button
                disabled
                className="mt-4 inline-flex cursor-not-allowed items-center rounded-lg bg-academy-mist px-4 py-2 text-sm font-medium text-academy-slate opacity-60"
              >
                {t.payoutPending}
              </button>
            </div>
          ) : pendingBalance === 0 ? (
            <div className="rounded-[14px] border border-academy-line bg-white p-5">
              <button
                disabled
                className="inline-flex cursor-not-allowed items-center rounded-lg bg-academy-mist px-4 py-2 text-sm font-medium text-academy-slate opacity-60"
              >
                {t.requestPayout}
              </button>
            </div>
          ) : (
            <RequestPayoutForm
              pendingBalance={pendingBalance}
              requestPayoutLabel={t.requestPayout}
              confirmText={`CHF ${pendingBalance.toFixed(2)}`}
            />
          )}
        </div>

        {/* Earnings history table */}
        <div>
          <h2 className="mb-4 text-subheading text-academy-navy">{t.earningsHistory}</h2>
          <Table<EarningRow>
            columns={[
              {
                key: "date",
                header: t.colDate,
                render: (row) => row.date,
              },
              {
                key: "student",
                header: t.colStudent,
                render: (row) => row.student,
              },
              {
                key: "amount",
                header: t.colAmount,
                render: (row) => row.amount,
              },
            ]}
            rows={earningRows}
            emptyState={
              <EmptyState
                icon="coins"
                title={t.noEarnings}
                description={t.noEarnings}
              />
            }
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
