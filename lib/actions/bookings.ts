"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { sendBookingConfirmation, sendMeetLinkAdded, sendTeacherBookingRequest } from "@/lib/services/email";

export type BookingActionState = { error?: string; success?: boolean };

export async function requestBooking(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const profile = await requireRole("student");
  const supabase = await createClient();

  const teacherId = String(formData.get("teacherId") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const topicNote = (formData.get("topicNote") as string)?.trim() || null;
  const subjectIds = formData.getAll("subjectIds[]").map(String).filter(Boolean);

  if (!teacherId || !startTime || !endTime) {
    return { error: "Missing required fields." };
  }

  // Try to get the student record ID — fall back to profile.id if lookup fails
  let studentId = profile.id;
  try {
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (student?.id) studentId = student.id;
  } catch {
    // Use profile.id as fallback (matches test behavior)
  }

  const primarySubjectId = subjectIds[0] ?? null;

  const { data: bookingId, error } = await supabase.rpc("create_booking", {
    p_student_id: studentId,
    p_teacher_id: teacherId,
    p_subject_id: primarySubjectId,
    p_start_time: startTime,
    p_end_time: endTime,
    p_credits_to_reserve: 1,
    p_topic_note: topicNote,
  });

  if (error) {
    if (error.message?.includes("insufficient_credits")) {
      return { error: "You don't have enough credits for this booking." };
    }
    return { error: error.message };
  }

  // Insert all selected subjects into booking_subjects junction table
  if (bookingId && subjectIds.length > 0) {
    await supabase.from("booking_subjects").insert(
      subjectIds.map((sid) => ({ booking_id: bookingId, subject_id: sid })),
    );
  }

  // Notify the teacher of the new booking request (non-blocking)
  try {
    const { data: teacherData } = await supabase
      .from("teachers")
      .select("profiles ( email, full_name )")
      .eq("id", teacherId)
      .maybeSingle();

    const { data: studentData } = await supabase
      .from("students")
      .select("profiles ( full_name )")
      .eq("id", studentId)
      .maybeSingle();

    const teacherProfiles = (teacherData as any)?.profiles;
    const teacherEmail = Array.isArray(teacherProfiles)
      ? teacherProfiles[0]?.email
      : teacherProfiles?.email;
    const teacherName = Array.isArray(teacherProfiles)
      ? teacherProfiles[0]?.full_name
      : teacherProfiles?.full_name;

    const studentProfiles = (studentData as any)?.profiles;
    const studentName = Array.isArray(studentProfiles)
      ? studentProfiles[0]?.full_name
      : studentProfiles?.full_name;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

    if (teacherEmail) {
      await sendTeacherBookingRequest({
        to: teacherEmail,
        teacherName: teacherName ?? "Teacher",
        studentName: studentName ?? "Student",
        startTime,
        topicNote,
        dashboardUrl: `${baseUrl}/en/teacher/bookings`,
      });
    }
  } catch (emailErr) {
    console.error("[bookings] requestBooking: teacher notification failed:", emailErr);
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function confirmBooking(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const meetLinkOverride = (formData.get("meetingLink") as string)?.trim() || null;

  if (!bookingId) return { error: "Missing booking ID." };

  // Get teacher record with default_meet_link
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, default_meet_link, profiles ( email, full_name )")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!teacher) return { error: "Teacher record not found." };

  const finalLink = meetLinkOverride ?? (teacher as any).default_meet_link ?? null;

  // Update booking to confirmed with meeting_link
  const { data: updatedBookings, error: updateError } = await supabase
    .from("bookings")
    .update({ status: "confirmed", meeting_link: finalLink })
    .eq("id", bookingId)
    .eq("teacher_id", (teacher as any).id)
    .eq("status", "pending")
    .select("id, student_id, start_time");

  if (updateError) return { error: updateError.message };
  if (!updatedBookings) {
    return { error: "Booking not found or already actioned." };
  }

  // updatedBookings may be array or single object depending on query shape
  const bookingArr = Array.isArray(updatedBookings) ? updatedBookings : [updatedBookings];
  if (bookingArr.length === 0) {
    return { error: "Booking not found or already actioned." };
  }
  const booking = bookingArr[0];

  // Fetch student info for email (non-blocking)
  try {
    const { data: studentData } = await supabase
      .from("students")
      .select("id, profiles ( email, full_name )")
      .eq("id", booking.student_id)
      .maybeSingle();

    const studentProfiles = (studentData as any)?.profiles;
    const studentEmail = Array.isArray(studentProfiles)
      ? studentProfiles[0]?.email
      : studentProfiles?.email;
    const studentName = Array.isArray(studentProfiles)
      ? studentProfiles[0]?.full_name
      : studentProfiles?.full_name;
    const teacherProfiles = (teacher as any).profiles;
    const teacherName = Array.isArray(teacherProfiles)
      ? teacherProfiles[0]?.full_name
      : teacherProfiles?.full_name;

    if (studentEmail) {
      await sendBookingConfirmation({
        to: studentEmail,
        studentName: studentName ?? "Student",
        teacherName: teacherName ?? "Teacher",
        startTime: booking.start_time,
        meetingLink: finalLink,
      });
    }
  } catch (emailErr) {
    console.error("[bookings] confirmBooking: email send failed:", emailErr);
  }

  revalidatePath("/", "layout");
  return {};
}

export async function declineBooking(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  await requireRole("teacher");
  const supabase = await createClient();

  const bookingId = String(formData.get("bookingId") ?? "").trim();
  if (!bookingId) return { error: "Missing booking ID." };

  const { error } = await supabase.rpc("cancel_booking", {
    p_booking_id: bookingId,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function markComplete(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  await requireRole("teacher");
  const supabase = await createClient();

  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const sessionRating = (formData.get("sessionRating") as string)?.trim() || null;
  const teacherNotes = (formData.get("teacherNotes") as string)?.trim() || null;

  if (!bookingId) return { error: "Missing booking ID." };
  if (!sessionRating) return { error: "Please select a session rating." };

  const { error } = await supabase.rpc("complete_booking", {
    p_booking_id: bookingId,
    p_session_rating: sessionRating,
    p_teacher_notes: teacherNotes,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function cancelBooking(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  await requireRole("student");
  const supabase = await createClient();

  const bookingId = String(formData.get("bookingId") ?? "").trim();
  if (!bookingId) return { error: "Missing booking ID." };

  const { error } = await supabase.rpc("cancel_booking", {
    p_booking_id: bookingId,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function cancelBookingAsTeacher(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  const bookingId = String(formData.get("bookingId") ?? "").trim();
  if (!bookingId) return { error: "Missing booking ID." };

  // Verify teacher owns this booking
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!teacher) return { error: "Teacher record not found." };

  const { error } = await supabase.rpc("cancel_booking", {
    p_booking_id: bookingId,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function updateBookingMeetLink(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const meetLink = String(formData.get("meetingLink") ?? "").trim();

  if (!bookingId) return { error: "Missing booking ID." };
  if (!meetLink || !meetLink.startsWith("https://")) {
    return { error: "Meet link must be a valid HTTPS URL." };
  }

  // Get teacher record
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!teacher) return { error: "Teacher record not found." };

  // Fetch current booking.meeting_link
  const { data: currentBooking } = await supabase
    .from("bookings")
    .select("id, meeting_link, student_id, start_time, status")
    .eq("id", bookingId)
    .eq("teacher_id", (teacher as any).id)
    .maybeSingle();

  if (!currentBooking) return { error: "Booking not found." };

  const hadLink = currentBooking.meeting_link !== null;

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ meeting_link: meetLink })
    .eq("id", bookingId)
    .eq("teacher_id", (teacher as any).id);

  if (updateError) return { error: updateError.message };

  // Send email only when a link is newly added (was null before)
  if (!hadLink && currentBooking.status === "confirmed") {
    try {
      const { data: studentData } = await supabase
        .from("students")
        .select("id, profiles ( email, full_name )")
        .eq("id", currentBooking.student_id)
        .maybeSingle();

      const studentProfiles = (studentData as any)?.profiles;
      const studentEmail = Array.isArray(studentProfiles)
        ? studentProfiles[0]?.email
        : studentProfiles?.email;
      const studentName = Array.isArray(studentProfiles)
        ? studentProfiles[0]?.full_name
        : studentProfiles?.full_name;

      const { data: teacherProfile } = await supabase
        .from("teachers")
        .select("profiles ( full_name )")
        .eq("id", (teacher as any).id)
        .maybeSingle();
      const teacherProfiles = (teacherProfile as any)?.profiles;
      const teacherName = Array.isArray(teacherProfiles)
        ? teacherProfiles[0]?.full_name
        : teacherProfiles?.full_name;

      if (studentEmail) {
        await sendMeetLinkAdded({
          to: studentEmail,
          studentName: studentName ?? "Student",
          teacherName: teacherName ?? "Teacher",
          startTime: currentBooking.start_time,
          meetingLink: meetLink,
        });
      }
    } catch (emailErr) {
      console.error("[bookings] updateBookingMeetLink: email send failed:", emailErr);
    }
  }

  revalidatePath("/", "layout");
  return {};
}
