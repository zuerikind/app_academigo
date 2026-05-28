/** Default teacher payout rates (CHF per completed lesson). Admin can override per teacher in DB. */
export const defaultPayoutRates = {
  standard: 40,
  verified: 50,
} as const;

export type TeacherLevel = keyof typeof defaultPayoutRates;
