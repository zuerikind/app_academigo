import type { PricingTierId } from "@/config/pricing";
import { pricingTiers } from "@/config/pricing";
import { cn } from "@/lib/utils";
import type { PricingCtaTone } from "./pricing-tier-card";
import { PricingTierCard } from "./pricing-tier-card";

export function PricingGrid({
  className,
  getCta,
}: {
  className?: string;
  getCta?: (tierId: PricingTierId) => {
    href?: string;
    label?: string;
    tone?: PricingCtaTone;
  };
}) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-5 lg:grid-cols-3 lg:items-stretch lg:gap-5",
        className,
      )}
    >
      {pricingTiers.map((tier) => {
        const cta = getCta?.(tier.id);
        return (
          <PricingTierCard
            key={tier.id}
            tierId={tier.id}
            className="h-full"
            ctaHref={cta?.href}
            ctaLabel={cta?.label}
            ctaTone={cta?.tone}
          />
        );
      })}
    </div>
  );
}
