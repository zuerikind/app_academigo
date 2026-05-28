/** Lesson packages — single source of truth for UI (Stripe wired in Phase 3). */
export const lessonPackages = [
  {
    id: "single",
    name: "Single Lesson",
    credits: 1,
    priceChf: 70,
    highlight: false,
  },
  {
    id: "pack5",
    name: "5 Lesson Package",
    credits: 5,
    priceChf: 325,
    highlight: true,
  },
  {
    id: "pack10",
    name: "10 Lesson Package",
    credits: 10,
    priceChf: 620,
    highlight: false,
  },
] as const;

export const platformSubscription = {
  id: "platform",
  name: "Platform Access",
  priceChf: 50,
  interval: "month" as const,
};

export const lessonDurationMinutes = 50;
