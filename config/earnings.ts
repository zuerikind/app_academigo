/** Default teacher payout rates (CHF per completed lesson). Admin can override per teacher in DB. */
export const defaultPayoutRates = {
  junior: 30,
  academigo_teacher: 40,
  verified: 50,
} as const;

export type TeacherLevel = keyof typeof defaultPayoutRates;
