import { Resend } from "resend";
import { BookingConfirmationEmail } from "@/emails/booking-confirmation";
import { MeetLinkAddedEmail } from "@/emails/meet-link-added";
import { TeacherReminderEmail } from "@/emails/teacher-reminder";
import { TeacherBookingRequestEmail } from "@/emails/teacher-booking-request";
import { PayoutProcessedEmail } from "@/emails/payout-processed";
import { TeacherApprovedEmail } from "@/emails/teacher-approved";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
  return _resend;
}
const FROM =
  process.env.RESEND_FROM_EMAIL ?? "Academigo <hello@academigo.xyz>";

export async function sendBookingConfirmation(params: {
  to: string;
  studentName: string;
  teacherName: string;
  startTime: string;
  meetingLink: string | null;
}): Promise<void> {
  try {
    const { error } = await getResend().emails.send({
      from: FROM,
      to: params.to,
      subject: "Your lesson is confirmed — Academigo",
      react: BookingConfirmationEmail({
        studentName: params.studentName,
        teacherName: params.teacherName,
        startTime: params.startTime,
        meetingLink: params.meetingLink,
      }),
    });
    if (error) {
      console.error("[email] sendBookingConfirmation failed:", error);
    }
  } catch (err) {
    console.error("[email] sendBookingConfirmation failed:", err);
  }
}

export async function sendMeetLinkAdded(params: {
  to: string;
  studentName: string;
  teacherName: string;
  startTime: string;
  meetingLink: string;
}): Promise<void> {
  try {
    const { error } = await getResend().emails.send({
      from: FROM,
      to: params.to,
      subject: "Meeting link added for your lesson — Academigo",
      react: MeetLinkAddedEmail({
        studentName: params.studentName,
        teacherName: params.teacherName,
        startTime: params.startTime,
        meetingLink: params.meetingLink,
      }),
    });
    if (error) {
      console.error("[email] sendMeetLinkAdded failed:", error);
    }
  } catch (err) {
    console.error("[email] sendMeetLinkAdded failed:", err);
  }
}

export async function sendTeacherReminder(params: {
  to: string;
  teacherName: string;
  studentName: string;
  startTime: string;
  meetingLink: string | null;
  hoursUntil?: 24 | 1;
}): Promise<void> {
  try {
    const subject = params.meetingLink
      ? `Reminder: lesson coming up — Academigo`
      : `Action required: add Meet link before your lesson — Academigo`;

    const { error } = await getResend().emails.send({
      from: FROM,
      to: params.to,
      subject,
      react: TeacherReminderEmail({
        teacherName: params.teacherName,
        studentName: params.studentName,
        startTime: params.startTime,
        meetingLink: params.meetingLink,
        hoursUntil: params.hoursUntil,
      }),
    });
    if (error) {
      console.error("[email] sendTeacherReminder failed:", error);
    }
  } catch (err) {
    console.error("[email] sendTeacherReminder failed:", err);
  }
}

export async function sendPayoutProcessed(params: {
  to: string;
  teacherName: string;
  amountChf: number;
}): Promise<void> {
  try {
    const { error } = await getResend().emails.send({
      from: FROM,
      to: params.to,
      subject: "Deine Auszahlung ist unterwegs — Academigo",
      react: PayoutProcessedEmail({
        teacherName: params.teacherName,
        amountChf: params.amountChf,
      }),
    });
    if (error) {
      console.error("[email] sendPayoutProcessed failed:", error);
    }
  } catch (err) {
    console.error("[email] sendPayoutProcessed failed:", err);
  }
}

export async function sendTeacherBookingRequest(params: {
  to: string;
  teacherName: string;
  studentName: string;
  startTime: string;
  topicNote: string | null;
  dashboardUrl: string;
}): Promise<void> {
  try {
    const { error } = await getResend().emails.send({
      from: FROM,
      to: params.to,
      subject: `New lesson request from ${params.studentName} — Academigo`,
      react: TeacherBookingRequestEmail({
        teacherName: params.teacherName,
        studentName: params.studentName,
        startTime: params.startTime,
        topicNote: params.topicNote,
        dashboardUrl: params.dashboardUrl,
      }),
    });
    if (error) {
      console.error("[email] sendTeacherBookingRequest failed:", error);
    }
  } catch (err) {
    console.error("[email] sendTeacherBookingRequest failed:", err);
  }
}

export async function sendTeacherApproved(params: {
  to: string;
  teacherName: string;
  dashboardUrl: string;
}): Promise<void> {
  try {
    const { error } = await getResend().emails.send({
      from: FROM,
      to: params.to,
      subject: "Your Academigo teacher profile is live!",
      react: TeacherApprovedEmail({
        teacherName: params.teacherName,
        dashboardUrl: params.dashboardUrl,
      }),
    });
    if (error) {
      console.error("[email] sendTeacherApproved failed:", error);
    }
  } catch (err) {
    console.error("[email] sendTeacherApproved failed:", err);
  }
}
