"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { markPayoutProcessed } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatPayoutAddress,
  hasPayoutInfo,
  parsePayoutInfo,
} from "@/lib/payout-info";

type EarningRow = {
  id: string;
  amount: number;
  created_at: string;
  bookings: {
    start_time: string;
    students: { profiles: { full_name: string } | Array<{ full_name: string }> } | null;
    subjects: { name: string } | null;
  } | null;
};

type PayoutRow = {
  id: string;
  amount_chf: number;
  status: string;
  note: string | null;
  created_at: string;
  teachers:
    | { payout_info_placeholder: string | null; profiles: { full_name: string; email: string } | Array<{ full_name: string; email: string }> }
    | Array<{ payout_info_placeholder: string | null; profiles: { full_name: string; email: string } | Array<{ full_name: string; email: string }> }>
    | null;
  teacher_earnings?: EarningRow[] | null;
};

type Labels = {
  viewDetails: string;
  dialogTitle: string;
  dialogTeacher: string;
  dialogEmail: string;
  dialogAmount: string;
  dialogRequested: string;
  dialogSessions: string;
  dialogColDate: string;
  dialogColStudent: string;
  dialogColSubject: string;
  dialogColAmount: string;
  dialogNoSessions: string;
  confirmPayout: string;
  confirmPayoutLoading: string;
  statusProcessed: string;
  close: string;
  dialogBankDetails: string;
  dialogPayoutName: string;
  dialogPayoutIban: string;
  dialogPayoutAddress: string;
  dialogPayoutTwint: string;
  dialogNoBankDetails: string;
};

function getTeacher(payout: PayoutRow) {
  return Array.isArray(payout.teachers) ? payout.teachers[0] : payout.teachers;
}

function getProfile(payout: PayoutRow) {
  const tc = getTeacher(payout);
  const profiles = Array.isArray(tc?.profiles) ? tc?.profiles[0] : tc?.profiles;
  return profiles ?? null;
}

function getStudentName(earning: EarningRow): string {
  const sp = earning.bookings?.students?.profiles;
  if (!sp) return "—";
  return Array.isArray(sp) ? (sp[0]?.full_name ?? "—") : (sp.full_name ?? "—");
}

export function PayoutDetailDialog({
  payout,
  labels,
}: {
  payout: PayoutRow;
  labels: Labels;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(markPayoutProcessed, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  const profile = getProfile(payout);
  const teacher = getTeacher(payout);
  const bankDetails = parsePayoutInfo(teacher?.payout_info_placeholder);
  const bankAddress = formatPayoutAddress(bankDetails);
  const hasBankDetails = hasPayoutInfo(bankDetails);
  const earnings: EarningRow[] = payout.teacher_earnings ?? [];
  const isPendingPayout = payout.status === "pending";

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {labels.viewDetails}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-2xl rounded-[14px] border border-academy-line bg-white shadow-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-academy-line px-6 py-4">
              <h2 className="text-subheading text-academy-navy">{labels.dialogTitle}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-academy-slate hover:text-academy-navy transition-colors text-xl leading-none"
                aria-label={labels.close}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Teacher info + meta */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-meta mb-0.5">{labels.dialogTeacher}</p>
                  <p className="font-medium text-academy-navy">{profile?.full_name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-meta mb-0.5">{labels.dialogEmail}</p>
                  <p className="text-academy-slate">{profile?.email ?? "—"}</p>
                </div>
                <div>
                  <p className="text-meta mb-0.5">{labels.dialogAmount}</p>
                  <p className="font-semibold text-academy-navy">
                    CHF {Number(payout.amount_chf).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-meta mb-0.5">{labels.dialogRequested}</p>
                  <p className="text-academy-slate">
                    {new Date(payout.created_at).toLocaleDateString("de-CH")}
                  </p>
                </div>
              </div>

              {/* Bank details */}
              <div>
                <p className="text-meta mb-2">{labels.dialogBankDetails}</p>
                {!hasBankDetails ? (
                  <p className="text-sm text-academy-slate">{labels.dialogNoBankDetails}</p>
                ) : (
                  <div className="rounded-[10px] border border-academy-line bg-academy-mist/30 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {bankDetails.payoutName && (
                      <div>
                        <p className="text-meta mb-0.5">{labels.dialogPayoutName}</p>
                        <p className="font-medium text-academy-navy">{bankDetails.payoutName}</p>
                      </div>
                    )}
                    {bankDetails.payoutIban && (
                      <div className="sm:col-span-2">
                        <p className="text-meta mb-0.5">{labels.dialogPayoutIban}</p>
                        <p className="font-mono text-[13px] text-academy-navy break-all">
                          {bankDetails.payoutIban}
                        </p>
                      </div>
                    )}
                    {bankAddress && (
                      <div className="sm:col-span-2">
                        <p className="text-meta mb-0.5">{labels.dialogPayoutAddress}</p>
                        <p className="text-academy-navy">{bankAddress}</p>
                      </div>
                    )}
                    {bankDetails.payoutTwint && (
                      <div>
                        <p className="text-meta mb-0.5">{labels.dialogPayoutTwint}</p>
                        <p className="text-academy-navy">{bankDetails.payoutTwint}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sessions table */}
              <div>
                <p className="text-meta mb-2">{labels.dialogSessions}</p>
                {earnings.length === 0 ? (
                  <p className="text-sm text-academy-slate">{labels.dialogNoSessions}</p>
                ) : (
                  <div className="rounded-[10px] border border-academy-line overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-academy-mist text-academy-slate border-b border-academy-line">
                          <th className="px-4 py-2.5 text-left font-medium">{labels.dialogColDate}</th>
                          <th className="px-4 py-2.5 text-left font-medium">{labels.dialogColStudent}</th>
                          <th className="px-4 py-2.5 text-left font-medium">{labels.dialogColSubject}</th>
                          <th className="px-4 py-2.5 text-right font-medium">{labels.dialogColAmount}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earnings.map((e) => (
                          <tr key={e.id} className="border-b border-academy-line last:border-0">
                            <td className="px-4 py-2.5 text-academy-navy">
                              {e.bookings?.start_time
                                ? new Date(e.bookings.start_time).toLocaleDateString("de-CH", {
                                    timeZone: "UTC",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })
                                : "—"}
                            </td>
                            <td className="px-4 py-2.5 text-academy-navy">
                              {getStudentName(e)}
                            </td>
                            <td className="px-4 py-2.5 text-academy-slate">
                              {e.bookings?.subjects?.name ?? "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium text-academy-navy">
                              CHF {Number(e.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {state.error && (
                <p className="text-sm text-red-600">{state.error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-academy-line px-6 py-4">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                {labels.close}
              </Button>
              {isPendingPayout && (
                <form action={formAction}>
                  <input type="hidden" name="payoutId" value={payout.id} />
                  <Button type="submit" variant="primary" size="sm" disabled={isPending}>
                    {isPending ? labels.confirmPayoutLoading : labels.confirmPayout}
                  </Button>
                </form>
              )}
              {!isPendingPayout && (
                <Badge variant="verified">{labels.statusProcessed}</Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
