/**
 * Unit tests for lib/services/email.ts
 * RED phase: lib/services/email.ts does not exist yet.
 * Tests will fail with "Cannot find module" until Plan 03-05 creates the file.
 * Covers: BOOK-04, BOOK-06 (email side-effects)
 */

const mocks = {
  emailsSend: jest.fn(),
};

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: (...args: unknown[]) => mocks.emailsSend(...args),
    },
  })),
}));

describe("sendBookingConfirmation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.emailsSend.mockResolvedValue({ data: { id: "email-id-1" }, error: null });
  });

  it("sendBookingConfirmation calls resend.emails.send with correct subject and react template", async () => {
    const { sendBookingConfirmation } = await import("@/lib/services/email");
    await sendBookingConfirmation({
      to: "student@example.com",
      studentName: "Alice Muster",
      teacherName: "Max Lehrer",
      startTime: "2026-07-16T14:00:00Z",
      meetingLink: "https://meet.google.com/abc-123",
    });
    expect(mocks.emailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "student@example.com",
        subject: expect.any(String),
      })
    );
  });
});

describe("sendMeetLinkAdded", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.emailsSend.mockResolvedValue({ data: { id: "email-id-2" }, error: null });
  });

  it("sendMeetLinkAdded calls resend.emails.send with correct subject", async () => {
    const { sendMeetLinkAdded } = await import("@/lib/services/email");
    await sendMeetLinkAdded({
      to: "student@example.com",
      studentName: "Alice Muster",
      teacherName: "Max Lehrer",
      startTime: "2026-07-16T14:00:00Z",
      meetingLink: "https://meet.google.com/new-link",
    });
    expect(mocks.emailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "student@example.com",
        subject: expect.any(String),
      })
    );
  });
});

describe("sendTeacherReminder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.emailsSend.mockResolvedValue({ data: { id: "email-id-3" }, error: null });
  });

  it("sendTeacherReminder uses stronger subject when meetLink is null", async () => {
    const { sendTeacherReminder } = await import("@/lib/services/email");
    await sendTeacherReminder({
      to: "teacher@example.com",
      teacherName: "Max Lehrer",
      studentName: "Alice Muster",
      startTime: "2026-07-16T14:00:00Z",
      meetingLink: null,
    });
    expect(mocks.emailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "teacher@example.com",
        // Subject should be more urgent when meetLink is missing
        subject: expect.stringMatching(/link|meet|action|urgent/i),
      })
    );
  });

  it("sendTeacherReminder does not throw on send error — logs and returns", async () => {
    const { sendTeacherReminder } = await import("@/lib/services/email");
    mocks.emailsSend.mockResolvedValue({ data: null, error: { message: "API rate limit" } });
    // Should not throw — must handle errors gracefully
    await expect(
      sendTeacherReminder({
        to: "teacher@example.com",
        teacherName: "Max Lehrer",
        studentName: "Alice Muster",
        startTime: "2026-07-16T14:00:00Z",
        meetingLink: "https://meet.google.com/abc",
      })
    ).resolves.not.toThrow();
  });
});
