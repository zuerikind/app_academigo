import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatCard } from "@/components/ui/stat-card";
import { getStudentNav } from "@/config/navigation";
import { requireRoleFromParams } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getWalletBalance, getCreditTransactions } from "@/lib/queries/wallet";
import { getStudentSchedules, getStudentUpcomingLessons } from "@/lib/queries/lessons";
import { updateScheduleStatus } from "@/lib/actions/schedules";
import { requestReschedule } from "@/lib/actions/reschedule";

type Props = { params: Promise<{ locale: string }> };

const statusBadge: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-gray-100 text-gray-600",
  pending: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  reschedule_requested: "bg-orange-100 text-orange-800",
  completed: "bg-gray-100 text-gray-600",
};

export default async function StudentLessonsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const dict = getDictionary(raw);
  const tl = dict.lessons;
  const tw = dict.wallet;
  const tr = dict.reschedule;
  const dateLocale = raw === "de" ? "de-CH" : "en-CH";

  const profile = await requireRoleFromParams("student", raw);

  // Look up student record (credit_wallets, lessons, and schedules all use students.id)
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  const studentId = student?.id ?? "";

  // Wrap actions as void-returning for plain form elements (Server Component — no useActionState)
  // ponytail: void wrappers needed because _prev signature is incompatible with form action type
  const pauseAction = async (fd: FormData) => { await updateScheduleStatus({}, fd); };
  const resumeAction = async (fd: FormData) => { await updateScheduleStatus({}, fd); };
  const cancelAction = async (fd: FormData) => { await updateScheduleStatus({}, fd); };
  const rescheduleAction = async (fd: FormData) => { await requestReschedule({}, fd); };

  const [walletBalance, transactions, schedules, upcomingLessons] = await Promise.all([
    studentId ? getWalletBalance() : Promise.resolve(0),
    studentId ? getCreditTransactions(studentId) : Promise.resolve([]),
    studentId ? getStudentSchedules(studentId) : Promise.resolve([]),
    studentId ? getStudentUpcomingLessons(studentId) : Promise.resolve([]),
  ]);

  function formatTime(ts: string) {
    return new Date(ts).toLocaleString(dateLocale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    });
  }

  // Map transaction type to i18n label
  const txTypeLabel: Record<string, string> = {
    purchase: tw.purchase,
    completion_deduction: tw.completion_deduction,
    cancellation_refund: tw.cancellation_refund,
    admin_grant: tw.admin_grant,
  };

  return (
    <DashboardLayout
      navItems={getStudentNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.student.lessons}
      title={tl.studentTitle}
    >
      <div className="space-y-8">
        {/* Section 1 — Credit Wallet Balance (SDASH-01) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label={tw.balance}
            value={walletBalance}
            icon="coins"
            tone="brand"
          />
        </div>

        {/* Section 2 — Credit Transaction History (SDASH-02) */}
        <section>
          <h2 className="mb-4 text-subheading text-academy-navy">{tw.history}</h2>
          {transactions.length === 0 ? (
            <div className="rounded-[14px] border border-academy-line bg-white px-6 py-9">
              <p className="text-[14px] text-academy-slate">{tw.noTransactions}</p>
            </div>
          ) : (
            <div className="rounded-[14px] border border-academy-line bg-white overflow-hidden divide-y divide-academy-line">
              {transactions.map((tx) => {
                const date = new Date(tx.created_at).toLocaleDateString(dateLocale, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                });
                const amountStr = tx.amount > 0 ? `+${tx.amount}` : `${tx.amount}`;
                const isPositive = tx.amount > 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-academy-navy">
                        {txTypeLabel[tx.type] ?? tx.type}
                      </p>
                      <p className="text-[11px] text-academy-slate-muted">{date}</p>
                    </div>
                    <span
                      className={`shrink-0 text-[13px] font-semibold text-numeric ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {amountStr}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 3 — Active Recurring Schedules (SDASH-03) */}
        <section>
          <h2 className="mb-4 text-subheading text-academy-navy">{tl.recurringSchedules}</h2>
          {schedules.length === 0 ? (
            <div className="rounded-[14px] border border-academy-line bg-white px-6 py-9">
              <p className="text-[14px] text-academy-slate">{tl.noSchedules}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((s) => (
                <div key={s.id} className="rounded-[14px] border border-academy-line bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-academy-navy">
                        {tl.weekdays[s.weekday]} · {s.start_time}–{s.end_time}
                      </p>
                      {s.teacherName && (
                        <p className="text-[13px] text-academy-slate-muted">{s.teacherName}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ${statusBadge[s.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {s.status === "active"
                        ? dict.schedules.activeStatus
                        : s.status === "paused"
                        ? dict.schedules.pausedStatus
                        : dict.schedules.cancelledStatus}
                    </span>
                  </div>
                  {s.status !== "cancelled" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.status === "active" && (
                        <form action={pauseAction}>
                          <input type="hidden" name="scheduleId" value={s.id} />
                          <input type="hidden" name="status" value="paused" />
                          <button
                            type="submit"
                            className="rounded-lg border border-academy-line bg-white px-3 py-1.5 text-sm font-medium text-academy-slate hover:bg-academy-mist transition-colors"
                          >
                            {tl.pauseSchedule}
                          </button>
                        </form>
                      )}
                      {s.status === "paused" && (
                        <form action={resumeAction}>
                          <input type="hidden" name="scheduleId" value={s.id} />
                          <input type="hidden" name="status" value="active" />
                          <button
                            type="submit"
                            className="rounded-lg border border-academy-line bg-white px-3 py-1.5 text-sm font-medium text-academy-slate hover:bg-academy-mist transition-colors"
                          >
                            {tl.resumeSchedule}
                          </button>
                        </form>
                      )}
                      <form action={cancelAction}>
                        <input type="hidden" name="scheduleId" value={s.id} />
                        <input type="hidden" name="status" value="cancelled" />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                        >
                          {tl.cancelSchedule}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 4 — Upcoming Lessons with Reschedule (SDASH-04) */}
        <section>
          <h2 className="mb-4 text-subheading text-academy-navy">{tl.upcomingLessons}</h2>
          {upcomingLessons.length === 0 ? (
            <div className="rounded-[14px] border border-academy-line bg-white px-6 py-9">
              <p className="text-[14px] text-academy-slate">{tl.noUpcomingLessons}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingLessons.map((l) => (
                <div key={l.id} className="rounded-[14px] border border-academy-line bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-academy-navy">{formatTime(l.start_time)}</p>
                      {l.other_party_name && (
                        <p className="text-[13px] text-academy-slate-muted">{l.other_party_name}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ${statusBadge[l.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {l.status === "reschedule_requested" ? tr.pendingBadge : l.status}
                    </span>
                  </div>
                  {l.status === "confirmed" && (
                    <details className="mt-3">
                      <summary className="cursor-pointer rounded-lg border border-academy-line bg-white px-3 py-1.5 text-sm font-medium text-academy-slate hover:bg-academy-mist transition-colors list-none inline-flex items-center gap-1">
                        {tr.requestTitle}
                      </summary>
                      <form action={rescheduleAction} className="mt-3 space-y-3 rounded-lg border border-academy-line bg-academy-mist/40 p-4">
                        <input type="hidden" name="lessonId" value={l.id} />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block">
                            <span className="mb-1 block text-[12px] font-medium text-academy-slate">
                              {tr.proposedDateLabel} (start)
                            </span>
                            <input
                              type="datetime-local"
                              name="proposedStart"
                              required
                              className="w-full rounded-lg border border-academy-line bg-white px-3 py-1.5 text-[13px] text-academy-navy focus:outline-none focus:ring-2 focus:ring-brand/30"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[12px] font-medium text-academy-slate">
                              {tr.proposedDateLabel} (end)
                            </span>
                            <input
                              type="datetime-local"
                              name="proposedEnd"
                              required
                              className="w-full rounded-lg border border-academy-line bg-white px-3 py-1.5 text-[13px] text-academy-navy focus:outline-none focus:ring-2 focus:ring-brand/30"
                            />
                          </label>
                        </div>
                        <button
                          type="submit"
                          className="rounded-lg bg-academy-navy px-4 py-1.5 text-sm font-medium text-white hover:bg-academy-navy/90 transition-colors"
                        >
                          {tr.submitButton}
                        </button>
                      </form>
                    </details>
                  )}
                  {l.status === "reschedule_requested" && (
                    <p className="mt-2 text-[12px] text-academy-slate-muted">
                      {l.reschedule_proposed_start ? `${tr.proposedDateLabel}: ${formatTime(l.reschedule_proposed_start)}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
