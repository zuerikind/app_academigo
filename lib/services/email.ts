import { Resend } from "resend";
import { BookingConfirmationEmail } from "@/emails/booking-confirmation";
import { MeetLinkAddedEmail } from "@/emails/meet-link-added";
import { TeacherReminderEmail } from "@/emails/teacher-reminder";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM =
  process.env.RESEND_FROM_EMAIL ?? "Academigo <noreply@academigo.xyz>";

export async function sendBookingConfirmation(params: {
  to: string;
  studentName: string;
  teacherName: string;
  startTime: string;
  meetingLink: string | null;
}): Promise<void> {
  try {
    const { error } = await resend.emails.send({
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
    const { error } = await resend.emails.send({
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

    const { error } = await resend.emails.send({
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
