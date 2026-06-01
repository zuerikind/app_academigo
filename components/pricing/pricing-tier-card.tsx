"use client";

import { ArrowRight, Check } from "lucide-react";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import type { PricingTierId } from "@/config/pricing";
import { pricingTiers } from "@/config/pricing";
import { localizedPath } from "@/lib/i18n/path";
import { cn, formatChf } from "@/lib/utils";

/** Shared heights so tier cards align in the 3-column grid. */
const TOP_BAR_H = "h-9";
const HEADER_MIN_H = "lg:min-h-[12rem]";
const PRICE_MIN_H = "lg:min-h-[10.5rem]";

export type PricingCtaTone = "action" | "details";

export function PricingTierCard({
  tierId,
  ctaHref,
  ctaLabel,
  ctaTone = "action",
  className,
}: {
  tierId: PricingTierId;
  ctaHref?: string;
  ctaLabel?: string;
  ctaTone?: PricingCtaTone;
  className?: string;
}) {
  const { locale, dict } = useI18n();
  const t = dict.pricing;
  const tier = pricingTiers.find((item) => item.id === tierId)!;
  const copy = t.tiers[tierId];
  const href = ctaHref ?? localizedPath(locale, "/signup?role=student");
  const label = ctaLabel ?? dict.common.getStarted;
  const isSubscription = "priceChf" in tier;
  const isDetails = ctaTone === "details";

  return (
    <article
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl bg-white",
        tier.highlight
          ? "border-2 border-[color:var(--brand)] shadow-card"
          : "border border-academy-line shadow-soft",
        className,
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
          <p className="mt-2 text-[13px] font-medium leading-snug text-academy-navy">
            {copy.tagline}
          </p>
          {"description" in copy && copy.description ? (
            <p className="mt-2 text-[13px] leading-relaxed text-academy-slate">
              {copy.description}
            </p>
          ) : null}
        </header>

        <div
          className={cn(
            PRICE_MIN_H,
            "mt-4 flex shrink-0 flex-col justify-center rounded-xl border border-academy-line/70 bg-academy-paper-soft px-3.5 py-3.5 sm:mt-5 sm:px-4 sm:py-4",
          )}
        >
          {tierId === "essentials" && "options" in tier && (
            <ul className="divide-y divide-academy-line/60">
              {tier.options.map((option) => (
                <li
                  key={option.id}
                  className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <span className="min-w-0 text-[13px] text-academy-navy">
                    {t.tiers.essentials.options[option.id]}
                  </span>
                  <span className="shrink-0 font-display text-[15px] font-semibold text-academy-navy text-numeric sm:text-right">
                    {formatChf(option.priceChf)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {isSubscription && (
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="font-display text-[30px] font-semibold leading-none tracking-tight text-academy-navy text-numeric sm:text-[36px]">
                {formatChf(tier.priceChf)}
              </span>
              <span className="text-[13px] text-academy-slate">{t.perMonth}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-1 flex-col sm:mt-5">
          <p
            className={cn(
              "mb-3 min-h-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-academy-slate-muted lg:min-h-[1rem]",
              !isSubscription && "hidden lg:invisible lg:block",
            )}
            aria-hidden={!isSubscription}
          >
            {t.included}
          </p>
          <ul className="space-y-2.5 text-[13px] leading-snug text-academy-slate">
            {copy.features.map((feature) => (
              <Feature key={feature} label={feature} />
            ))}
          </ul>
        </div>
      </div>

      <footer
        className={cn(
          "mt-auto shrink-0 border-t border-academy-line/80 px-5 py-4 sm:px-6 sm:py-5",
          isDetails ? "bg-academy-paper-soft" : "bg-white",
        )}
      >
        {isDetails ? (
          <Button
            href={href}
            variant="ghost"
            size="md"
            fullWidth
            className={cn(
              "h-11 rounded-xl border border-academy-line/80 bg-white text-[13px] font-medium text-academy-navy shadow-soft",
              "hover:border-[color:var(--brand)]/30 hover:bg-white hover:text-[color:var(--brand-deep)] hover:shadow-card",
              tier.highlight &&
                "border-[color:var(--brand)]/25 bg-[color:var(--brand-tint)]/40 text-[color:var(--brand-deep)] hover:bg-[color:var(--brand-tint)]",
            )}
          >
            {label}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
        ) : (
          <Button
            href={href}
            variant={tier.highlight ? "primary" : "outline"}
            size="md"
            shape="pill"
            fullWidth
            className={cn(
              !tier.highlight &&
                "border-academy-line/80 text-academy-navy hover:border-[color:var(--brand)]/35 hover:bg-academy-paper-soft",
            )}
          >
            {label}
          </Button>
        )}
      </footer>
    </article>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-tint)] text-[color:var(--brand-deep)]">
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
      <span className="min-w-0 flex-1">{label}</span>
    </li>
  );
}
