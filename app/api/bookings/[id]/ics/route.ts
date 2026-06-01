import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function formatIcsDate(isoString: string): string {
  // Convert ISO 8601 to ICS format: YYYYMMDDTHHMMSSZ
  return isoString.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Auth check
  await headers(); // ensure request context
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Fetch booking
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, start_time, end_time, meeting_link, student_id, teacher_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !booking) {
    return new Response("Booking not found", { status: 404 });
  }

  // Verify the caller is the student or teacher of this booking
  // We need profile → student/teacher lookup
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return new Response("Unauthorized", { status: 401 });
  }

  let isOwner = false;

  if (profile.role === "student") {
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (student && student.id === booking.student_id) isOwner = true;
  } else if (profile.role === "teacher") {
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (teacher && teacher.id === booking.teacher_id) isOwner = true;
  } else if (profile.role === "admin") {
    isOwner = true;
  }

  if (!isOwner) {
    return new Response("Forbidden", { status: 403 });
  }

  // Generate ICS content per RFC 5545
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Academigo//Academigo//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${id}@academigo.xyz`,
    `DTSTART:${formatIcsDate(booking.start_time)}`,
    `DTEND:${formatIcsDate(booking.end_time)}`,
    "SUMMARY:Academigo lesson",
    `DESCRIPTION:${booking.meeting_link ?? "Meeting link will be provided by your teacher."}`,
    booking.meeting_link ? `URL:${booking.meeting_link}` : "",
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="lesson-${id}.ics"`,
    },
  });
}
