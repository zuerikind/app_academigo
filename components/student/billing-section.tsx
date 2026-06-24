"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Coins, ShoppingBag } from "lucide-react";
import { cn, formatChf } from "@/lib/utils";
import type { PaymentHistoryItem } from "@/lib/queries/student";

type Strings = {
  currentPlan: string;
  active: string;
  oneTimePurchase: string;
  purchasedOn: string;
  billingHistory: string;
  hideBillingHistory: string;
  noPayments: string;
  creditsLabel: string;
};

type Props = {
  activePlan: {
    packageName: string;
    purchasedAt?: string;
  } | null;
  paymentHistory: PaymentHistoryItem[];
  creditsRemaining: number;
  strings: Strings;
  locale: string;
};

export function BillingSection({
  activePlan,
  paymentHistory,
  creditsRemaining,
  strings,
  locale,
}: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const dateFmt = locale === "de" ? "de-CH" : "en-CH";

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateFmt, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

  if (!activePlan && paymentHistory.length === 0) return null;

  return (
    <div className="rounded-2xl border border-academy-line bg-white p-5 sm:p-6">
      {activePlan && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-tint)]">
              <ShoppingBag className="h-4 w-4 text-[color:var(--brand-deep)]" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-academy-slate-muted">
                {strings.currentPlan}
              </p>
              <p className="mt-0.5 font-semibold text-academy-navy">{activePlan.packageName}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
              {strings.active}
            </span>
            {activePlan.purchasedAt && (
              <p className="text-[12px] text-academy-slate">
                {strings.purchasedOn.replace("{date}", formatDate(activePlan.purchasedAt))}
              </p>
            )}
          </div>
        </div>
      )}

      {creditsRemaining > 0 && (
        <div className={cn(activePlan ? "mt-4" : "mt-0")}>
          <div className="flex items-center gap-2.5 rounded-xl border border-academy-line bg-academy-paper-soft px-3.5 py-3">
            <Coins className="h-3.5 w-3.5 shrink-0 text-academy-slate" strokeWidth={2} />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-academy-slate-muted truncate">
                {strings.creditsLabel}
              </p>
              <p className="font-display text-[22px] font-semibold leading-none text-academy-navy text-numeric">
                {creditsRemaining}
              </p>
            </div>
          </div>
        </div>
      )}

      {creditsRemaining === 0 && activePlan && (
        <div className="mt-4 rounded-xl border border-academy-line bg-academy-paper-soft px-3.5 py-3">
          <p className="text-[13px] text-academy-slate-muted">{strings.creditsLabel}: 0</p>
        </div>
      )}

      {paymentHistory.length > 0 && (
        <div className="mt-4 border-t border-academy-line/60 pt-4">
          <button
            type="button"
            onClick={() => setHistoryOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 text-[13px] font-medium text-academy-navy hover:text-[color:var(--brand-deep)]"
          >
            <span>{historyOpen ? strings.hideBillingHistory : strings.billingHistory}</span>
            {historyOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-academy-slate" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-academy-slate" />
            )}
          </button>

          {historyOpen && (
            <ul className="mt-3 divide-y divide-academy-line/50">
              {paymentHistory.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-academy-navy">
                      {p.packageName}
                    </p>
                    <p className="text-[11px] text-academy-slate-muted">{formatDate(p.paidAt)}</p>
                  </div>
                  <span className="shrink-0 text-[13px] font-semibold text-academy-navy text-numeric">
                    {formatChf(p.amountChf)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
