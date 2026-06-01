"use client";

import { useActionState } from "react";
import { requestPayout } from "@/lib/actions/earnings";
import type { EarningsActionState } from "@/lib/actions/earnings";

const initialState: EarningsActionState = {};

export function RequestPayoutForm({
  pendingBalance,
  requestPayoutLabel,
  confirmText,
}: {
  pendingBalance: number;
  requestPayoutLabel: string;
  confirmText: string;
}) {
  const [state, action, isPending] = useActionState(requestPayout, initialState);

  if (state.success) {
    return (
      <div className="rounded-[14px] border border-academy-line bg-white p-5">
        <p className="text-sm font-medium text-academy-navy">
          Payout request submitted — pending review.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-academy-line bg-white p-5">
      <p className="text-sm text-academy-slate">
        Request payout of{" "}
        <span className="font-semibold text-academy-navy">{confirmText}</span>
      </p>

      {state.error && (
        <p className="mt-2 text-[13px] text-red-600">{state.error}</p>
      )}

      <form action={action} className="mt-4">
        <input type="hidden" name="amount_chf" value={pendingBalance.toFixed(2)} />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-lg bg-[color:var(--brand)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Requesting…" : requestPayoutLabel}
        </button>
      </form>
    </div>
  );
}
