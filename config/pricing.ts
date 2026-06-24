/** Pricing packages — numbers only; copy lives in messages/de.ts & messages/en.ts */
export const pricingTiers = [
  { id: "starter",    highlight: false, credits: 1,  priceChf: 89  },
  { id: "focus",      highlight: true,  credits: 5,  priceChf: 425, pricePerLesson: 85 },
  { id: "excellence", highlight: false, credits: 10, priceChf: 790, pricePerLesson: 79 },
] as const;

export type PricingTierId = (typeof pricingTiers)[number]["id"];

export const lessonDurationMinutes = 50;

/** Credits deducted per completed session (v1: fixed at 1 per session). */
export const CREDIT_COST_PER_SESSION = 1;

/** Starter price — used to compute savings on Focus and Excellence. */
export const STARTER_PRICE_CHF = 89;
