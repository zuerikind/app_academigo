/** Pricing tiers — numbers only; copy lives in messages/de.ts & messages/en.ts */
export const pricingTiers = [
  {
    id: "essentials",
    highlight: false,
    options: [
      { id: "single", priceChf: 79 },
      { id: "pack5", priceChf: 375 },
      { id: "pack10", priceChf: 690 },
    ],
  },
  {
    id: "plus",
    highlight: true,
    priceChf: 299,
    interval: "month" as const,
  },
  {
    id: "excellence",
    highlight: false,
    priceChf: 549,
    interval: "month" as const,
  },
] as const;

export type PricingTierId = (typeof pricingTiers)[number]["id"];

export const lessonDurationMinutes = 50;

/** Credits deducted per completed session (v1: fixed at 1 per session). */
export const CREDIT_COST_PER_SESSION = 1;

/** @deprecated Use pricingTiers — kept for credit package slugs in DB */
export const essentialsPackageSlugs = ["single", "pack5", "pack10"] as const;
