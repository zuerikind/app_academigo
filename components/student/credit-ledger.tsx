import { Coins, ShoppingBag } from "lucide-react";
import { cn, formatChf } from "@/lib/utils";
import type { LedgerEntry } from "@/lib/queries/student";

type Strings = {
  ledgerTitle: string;
  ledgerEmpty: string;
  ledgerSessionWith: string;
  ledgerBalance: string;
};

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === "de" ? "de-CH" : "en-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function CreditLedger({
  entries,
  strings,
  locale,
}: {
  entries: LedgerEntry[];
  strings: Strings;
  locale: string;
}) {
  return (
    <div className="rounded-2xl border border-academy-line bg-white p-5 sm:p-6">
      <h2 className="text-[13px] font-semibold text-academy-navy">{strings.ledgerTitle}</h2>

      {entries.length === 0 ? (
        <p className="mt-4 text-[13px] text-academy-slate-muted">{strings.ledgerEmpty}</p>
      ) : (
        <div className="mt-4">
          {/* Header */}
          <div className="mb-2 grid grid-cols-[1fr_auto_auto] gap-x-4 px-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-academy-slate-muted">Event</span>
            <span className="text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-academy-slate-muted">Change</span>
            <span className="w-14 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-academy-slate-muted">{strings.ledgerBalance}</span>
          </div>

          <ul className="divide-y divide-academy-line/50">
            {entries.map((entry) => {
              const isPurchase = entry.type === "purchase";
              const label = isPurchase
                ? entry.label
                : strings.ledgerSessionWith.replace("{name}", entry.label);

              return (
                <li key={entry.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                        isPurchase
                          ? "bg-[color:var(--brand-tint)] text-[color:var(--brand-deep)]"
                          : "bg-academy-paper-soft text-academy-slate",
                      )}
                    >
                      {isPurchase
                        ? <ShoppingBag className="h-3 w-3" strokeWidth={2} />
                        : <Coins className="h-3 w-3" strokeWidth={2} />
                      }
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-academy-navy">{label}</p>
                      <p className="text-[11px] text-academy-slate-muted">{formatDate(entry.date, locale)}</p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "text-right text-[13px] font-semibold text-numeric",
                      isPurchase ? "text-[color:var(--brand-deep)]" : "text-academy-slate",
                    )}
                  >
                    {isPurchase ? `+${entry.delta}` : `−${Math.abs(entry.delta)}`}
                  </span>

                  <span className="w-14 text-right text-[13px] font-semibold text-academy-navy text-numeric">
                    {entry.balanceAfter}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
