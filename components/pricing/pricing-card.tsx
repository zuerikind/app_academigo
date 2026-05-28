"use client";

import { Check } from "lucide-react";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMessage } from "@/lib/i18n/format";
import { getPackageName } from "@/lib/i18n/package-labels";
import { localizedPath } from "@/lib/i18n/path";
import { formatChf } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function PricingCard({
  packageId,
  priceChf,
  credits,
  highlight,
  ctaHref,
  ctaLabel,
}: {
  packageId: string;
  priceChf: number;
  credits?: number;
  highlight?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const { locale, dict } = useI18n();
  const t = dict.pricing;
  const name = getPackageName(dict, packageId);
  const href = ctaHref ?? localizedPath(locale, "/signup?role=student");
  const label = ctaLabel ?? dict.common.getStarted;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-[14px] border p-7 transition-shadow duration-200",
        highlight
          ? "border-[color:var(--brand)] bg-white shadow-card"
          : "border-academy-line bg-white hover:shadow-soft",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[17px] font-semibold tracking-[-0.018em] text-academy-navy">
          {name}
        </h3>
        {highlight && <Badge variant="brand">{t.mostPopular}</Badge>}
      </div>

      <p className="mt-6 flex items-baseline gap-1.5">
        <span className="font-display text-[40px] font-semibold leading-none tracking-[-0.028em] text-academy-navy text-numeric">
          {formatChf(priceChf)}
        </span>
      </p>
      {credits !== undefined && credits > 0 && (
        <p className="mt-2 text-[13px] text-academy-slate">
          {formatMessage(t.lessonCredits, { count: credits })}
        </p>
      )}

      <ul className="mt-8 flex flex-1 flex-col gap-3 border-t border-academy-line pt-7 text-[13.5px] text-academy-slate">
        <Feature label={t.features.duration} />
        <Feature label={t.features.verified} />
        <Feature label={t.features.scheduling} />
      </ul>

      <Button
        href={href}
        variant={highlight ? "primary" : "secondary"}
        size="md"
        shape="pill"
        fullWidth
        className="mt-7"
      >
        {label}
      </Button>
    </div>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-tint)] text-[color:var(--brand-deep)]">
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
      {label}
    </li>
  );
}
