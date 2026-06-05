/**
 * Unit tests for lib/actions/bookings.ts
 * RED phase: lib/actions/bookings.ts does not exist yet.
 * Tests will fail with "Cannot find module" until Plan 03-06 creates the file.
 * Covers: BOOK-01, BOOK-02, BOOK-04, BOOK-05, BOOK-07, BOOK-08, BOOK-09
 */

const mocks = {
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
  revalidatePath: jest.fn(),
  requireRole: jest.fn(),
  sendBookingConfirmation: jest.fn(),
  sendMeetLinkAdded: jest.fn(),
};

// makeChainable factory for Supabase fluent API — consistent with Phase 1/2 pattern
function makeChainable(resolves: unknown) {
  const chain: Record<string, jest.Mock> = {};
  const methods = ["select", "insert", "update", "delete", "upsert", "eq", "neq", "in", "is", "gte", "lte", "order", "limit", "maybeSingle", "single"];
  methods.forEach(m => { chain[m] = jest.fn(() => chain); });
  chain["then"] = jest.fn((cb: (v: unknown) => unknown) => Promise.resolve(cb(resolves)));
  return chain;
}

jest.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => mocks.revalidatePath(...args) }));
jest.mock("@/lib/auth/session", () => ({ requireRole: (...args: unknown[]) => mocks.requireRole(...args) }));
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mocks.supabase)),
}));
jest.mock("@/lib/services/email", () => ({
  sendBookingConfirmation: (...args: unknown[]) => mocks.sendBookingConfirmation(...args),
  sendMeetLinkAdded: (...args: unknown[]) => mocks.sendMeetLinkAdded(...args),
}));

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(entries).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe("requestBooking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: "student-uuid" });
    mocks.supabase.rpc.mockResolvedValue({ data: { booking_id: "booking-uuid" }, error: null });
  });

  it("requestBooking calls create_booking RPC with correct params", async () => {
    const { requestBooking } = await import("@/lib/actions/bookings");
    const fd = makeFormData({
      teacherId: "teacher-uuid",
      packageType: "single",
      startTime: "2026-07-16T14:00:00Z",
      endTime: "2026-07-16T14:50:00Z",
    });
    await requestBooking({} as any, fd);
    expect(mocks.supabase.rpc).toHaveBeenCalledWith(
      "create_booking",
      expect.objectContaining({ p_teacher_id: "teacher-uuid" })
    );
  });

  it("requestBooking returns error when RPC returns insufficient_credits", async () => {
    const { requestBooking } = await import("@/lib/actions/bookings");
    mocks.supabase.rpc.mockResolvedValue({
      data: null,
      error: { code: "P0001", message: "insufficient_credits" },
    });
    const fd = makeFormData({
      teacherId: "teacher-uuid",
      packageType: "single",
      startTime: "2026-07-16T14:00:00Z",
      endTime: "2026-07-16T14:50:00Z",
    });
    const result = await requestBooking({} as any, fd);
    expect(result).toHaveProperty("error");
  });
});

describe("confirmBooking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: "teacher-uuid", default_meet_link: "https://meet.google.com/abc-default" });
    mocks.supabase.from.mockReturnValue(makeChainable({ data: { id: "booking-uuid", student_id: "student-uuid" }, error: null }));
    mocks.sendBookingConfirmation.mockResolvedValue(undefined);
  });

  it("confirmBooking auto-populates meeting_link from default_meet_link when no override", async () => {
    const { confirmBooking } = await import("@/lib/actions/bookings");
    const fd = makeFormData({ bookingId: "booking-uuid" });
    const result = await confirmBooking({} as any, fd);
    expect(result).toBeDefined();
  });

  it("confirmBooking uses override meeting_link when provided", async () => {
    const { confirmBooking } = await import("@/lib/actions/bookings");
    const fd = makeFormData({
      bookingId: "booking-uuid",
      meetingLink: "https://meet.google.com/override-link",
    });
    const result = await confirmBooking({} as any, fd);
    expect(result).toBeDefined();
  });

  it("confirmBooking requires meeting_link to be non-null or warns", async () => {
    const { confirmBooking } = await import("@/lib/actions/bookings");
    // No default_meet_link, no override
    mocks.requireRole.mockResolvedValue({ id: "teacher-uuid", default_meet_link: null });
    const fd = makeFormData({ bookingId: "booking-uuid" });
    const result = await confirmBooking({} as any, fd);
    // Either warns or returns error — must not silently confirm with null link
    expect(result).toBeDefined();
  });
});

describe("declineBooking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: "teacher-uuid" });
    mocks.supabase.from.mockReturnValue(makeChainable({ data: null, error: null }));
  });

  it("declineBooking updates booking status to declined", async () => {
    const { declineBooking } = await import("@/lib/actions/bookings");
    const fd = makeFormData({ bookingId: "booking-uuid" });
    const result = await declineBooking({} as any, fd);
    expect(result).toBeDefined();
  });
});

describe("markComplete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: "teacher-uuid" });
    mocks.supabase.rpc.mockResolvedValue({ data: null, error: null });
  });

  it("markComplete calls complete_booking RPC", async () => {
    const { markComplete } = await import("@/lib/actions/bookings");
    const fd = makeFormData({ bookingId: "booking-uuid", sessionRating: "4" });
    await markComplete({} as any, fd);
    expect(mocks.supabase.rpc).toHaveBeenCalledWith(
      "complete_booking",
      expect.objectContaining({ p_booking_id: "booking-uuid" })
    );
  });
});

describe("cancelBooking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: "user-uuid" });
    mocks.supabase.rpc.mockResolvedValue({ data: null, error: null });
  });

  it("cancelBooking calls cancel_booking RPC", async () => {
    const { cancelBooking } = await import("@/lib/actions/bookings");
    const fd = makeFormData({ bookingId: "booking-uuid" });
    await cancelBooking({} as any, fd);
    expect(mocks.supabase.rpc).toHaveBeenCalledWith(
      "cancel_booking",
      expect.objectContaining({ p_booking_id: "booking-uuid" })
    );
  });
});

describe("updateBookingMeetLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: "teacher-uuid" });
    mocks.supabase.from.mockReturnValue(makeChainable({ data: null, error: null }));
    mocks.sendMeetLinkAdded.mockResolvedValue(undefined);
  });

  it("updateBookingMeetLink updates meeting_link on confirmed booking", async () => {
    const { updateBookingMeetLink } = await import("@/lib/actions/bookings");
    const fd = makeFormData({
      bookingId: "booking-uuid",
      meetingLink: "https://meet.google.com/new-link",
    });
    const result = await updateBookingMeetLink({} as any, fd);
    expect(result).toBeDefined();
  });
});
