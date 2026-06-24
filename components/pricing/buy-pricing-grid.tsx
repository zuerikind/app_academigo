"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useI18n } from "@/components/i18n/locale-provider";
import { pricingTiers } from "@/config/pricing";
import { cn, formatChf } from "@/lib/utils";

/** Shared heights so tier cards align in the 3-column grid. */
const TOP_BAR_H = "h-9";
const HEADER_MIN_H = "lg:min-h-[11rem]";
const PRICE_MIN_H = "lg:min-h-[9rem]";

type BuyAction = (
  prev: { error?: string },
  formData: FormData,
) => Promise<{ error?: string }>;

function SubmitButton({
  label,
  pendingLabel,
  highlight,
}: {
  label: string;
  pendingLabel: string;
  highlight: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium tracking-tight transition-all",
        "disabled:pointer-events-none disabled:opacity-50 btn-tactile",
        highlight
          ? "bg-[color:var(--brand-deep)] text-white border border-[color:var(--brand-deep)] shadow-[var(--shadow-button)] hover:bg-[color:var(--academy-navy)] hover:border-[color:var(--academy-navy)]"
          : "bg-transparent text-academy-navy border border-academy-line hover:border-[color:var(--brand)]/40 hover:text-[color:var(--brand-deep)]",
      )}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
      )}
      {pending ? pendingLabel : label}
    </button>
  );
}

function BuyForm({
  packageSlug,
  label,
  pendingLabel,
  highlight,
  action,
}: {
  packageSlug: string;
  label: string;
  pendingLabel: string;
  highlight: boolean;
  action: BuyAction;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction}>
      <input type="hidden" name="packageSlug" value={packageSlug} />
      <SubmitButton label={label} pendingLabel={pendingLabel} highlight={highlight} />
      {state.error && (
        <p className="mt-2 text-[12px] text-red-600">{state.error}</p>
      )}
    </form>
  );
}

export function BuyPricingGrid({ action }: { action: BuyAction }) {
  const { dict } = useI18n();
  const t = dict.pricing;

  return (
    <div className="grid gap-4 sm:gap-5 lg:grid-cols-3 lg:items-stretch lg:gap-5">
      {pricingTiers.map((tier) => {
        const copy = t.tiers[tier.id];

        return (
          <article
            key={tier.id}
            className={cn(
              "relative flex h-full flex-col overflow-hidden rounded-2xl bg-white",
              tier.highlight
                ? "border-2 border-[color:var(--brand)] shadow-card"
                : "border border-academy-line shadow-soft",
            )}
          >
            {tier.highlight ? (
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center bg-[color:var(--brand-deep)] px-4",
                  TOP_BAR_H,
                )}
              >
                <span className="text-[11px] font-semibold tracking-wide text-white">
                  {t.mostPopular}
                </span>
              </div>
            ) : (
              <div className={cn("shrink-0", TOP_BAR_H)} aria-hidden />
            )}

            <div className="flex flex-1 flex-col p-5 sm:p-6 lg:p-7">
              <header className={cn("shrink-0", HEADER_MIN_H)}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-academy-slate-muted">
                  {copy.kindLabel}
                </p>
                <h3 className="mt-1.5 font-display text-[18px] font-semibold leading-tight tracking-[-0.02em] text-academy-navy sm:text-[19px]">
                  {copy.name}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-academy-slate">
                  {copy.tagline}
                </p>
              </header>

              <div
                className={cn(
                  PRICE_MIN_H,
                  "mt-4 flex shrink-0 flex-col justify-center rounded-xl border border-academy-line/70 bg-academy-paper-soft px-3.5 py-3.5 sm:mt-5 sm:px-4 sm:py-4",
                )}
              >
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  <span className="font-display text-[30px] font-semibold leading-none tracking-tight text-academy-navy text-numeric sm:text-[36px]">
                    {formatChf(tier.priceChf)}
                  </span>
                  <span className="text-[13px] text-academy-slate">
                    · {tier.credits} {tier.credits === 1 ? "credit" : "credits"}
                  </span>
                </div>
                {"pricePerLesson" in tier && (
                  <p className="mt-1.5 text-[12px] text-academy-slate">
                    {formatChf(tier.pricePerLesson)} {t.perLesson}
                  </p>
                )}
                {"savings" in copy && copy.savings && (
                  <span className="mt-2 inline-flex w-fit items-center rounded-full bg-[color:var(--brand-tint)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--brand-deep)]">
                    {copy.savings}
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-1 flex-col sm:mt-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-academy-slate-muted">
                  {t.included}
                </p>
                <ul className="space-y-2.5 text-[13px] leading-snug text-academy-slate">
                  {copy.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-tint)] text-[color:var(--brand-deep)]">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                      <span className="min-w-0 flex-1">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <footer
              className={cn(
                "mt-auto shrink-0 border-t border-academy-line/80 px-5 py-4 sm:px-6 sm:py-5 bg-white",
              )}
            >
              <BuyForm
                packageSlug={tier.id}
                label={t.buyButton}
                pendingLabel={t.redirecting}
                highlight={tier.highlight}
                action={action}
              />
            </footer>
          </article>
        );
      })}
    </div>
  );
}
