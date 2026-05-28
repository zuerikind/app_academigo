/**
 * Booking & credit operations — implemented in Phase 2–3.
 * Reserve/release/consume credits will live here as Supabase RPC wrappers.
 */

export type BookingService = {
  /** Phase 2: create pending booking and reserve 1 credit */
  requestBooking: (params: {
    studentId: string;
    teacherId: string;
    subjectId: string;
    slotId: string;
  }) => Promise<{ bookingId: string }>;
  /** Phase 2: teacher accepts → confirmed */
  acceptBooking: (bookingId: string) => Promise<void>;
  /** Phase 2: teacher rejects → release credit */
  rejectBooking: (bookingId: string) => Promise<void>;
};
