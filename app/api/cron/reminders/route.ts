import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTeacherReminder } from "@/lib/services/email";
import { zurichOffsetMs } from "@/lib/utils/zurich";

// Service client required — cron has no user session, RLS on bookings would
// silently return zero rows with the anon client.
export async function GET(request: NextRequest): Promise<Response> {
  // Auth guard: Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createServiceClient();

  // start_time is Zurich wall-clock stored as UTC, so shift the real-time
  // windows by the current Zurich offset before comparing.
  const now = new Date();
  const offset24h = zurichOffsetMs(new Date(now.getTime() + 24 * 60 * 60 * 1000));
  const offset1h = zurichOffsetMs(new Date(now.getTime() + 60 * 60 * 1000));
  const window24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000 + offset24h);
  const window24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000 + offset24h);
  const window1hStart = new Date(now.getTime() + 55 * 60 * 1000 + offset1h);
  const window1hEnd = new Date(now.getTime() + 65 * 60 * 1000 + offset1h);

  // --- 24h reminders ---
  const { data: bookings24h } = await supabase
    .from("bookings")
    .select(
      `id, start_time, meeting_link,
       teachers ( id, default_meet_link, profiles ( email, full_name ) ),
       students ( profiles ( full_name ) )`,
    )
    .eq("status", "confirmed")
    .is("reminder_24h_sent_at", null)
    .gte("start_time", window24hStart.toISOString())
    .lte("start_time", window24hEnd.toISOString());

  let sent24h = 0;
  for (const booking of bookings24h ?? []) {
    // Cast join result to any — Supabase infers arrays for joins, actual value is an object
    const teacher = booking.teachers as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const teacherEmail = teacher?.profiles?.email as string | undefined;
    const teacherName = (teacher?.profiles?.full_name as string | undefined) ?? "Teacher";
    const studentName =
      ((booking.students as any)?.profiles?.full_name as string | undefined) ?? "Student"; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (!teacherEmail) continue;

    await sendTeacherReminder({
      to: teacherEmail,
      teacherName,
      studentName,
      startTime: new Date(booking.start_time).toISOString(),
      meetingLink: booking.meeting_link ?? null,
      hoursUntil: 24,
    });

    // Mark immediately after send — idempotency guard: if loop fails midway,
    // only unprocessed bookings get retried next hour
    await supabase
      .from("bookings")
      .update({ reminder_24h_sent_at: now.toISOString() })
      .eq("id", booking.id);

    sent24h++;
  }

  // --- 1h reminders ---
  const { data: bookings1h } = await supabase
    .from("bookings")
    .select(
      `id, start_time, meeting_link,
       teachers ( id, default_meet_link, profiles ( email, full_name ) ),
       students ( profiles ( full_name ) )`,
    )
    .eq("status", "confirmed")
    .is("reminder_1h_sent_at", null)
    .gte("start_time", window1hStart.toISOString())
    .lte("start_time", window1hEnd.toISOString());

  let sent1h = 0;
  for (const booking of bookings1h ?? []) {
    // Cast join result to any — Supabase infers arrays for joins, actual value is an object
    const teacher = booking.teachers as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const teacherEmail = teacher?.profiles?.email as string | undefined;
    const teacherName = (teacher?.profiles?.full_name as string | undefined) ?? "Teacher";
    const studentName =
      ((booking.students as any)?.profiles?.full_name as string | undefined) ?? "Student"; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (!teacherEmail) continue;

    await sendTeacherReminder({
      to: teacherEmail,
      teacherName,
      studentName,
      startTime: new Date(booking.start_time).toISOString(),
      meetingLink: booking.meeting_link ?? null,
      hoursUntil: 1,
    });

    // Mark immediately after send — idempotency guard
    await supabase
      .from("bookings")
      .update({ reminder_1h_sent_at: now.toISOString() })
      .eq("id", booking.id);

    sent1h++;
  }

  return Response.json({ ok: true, sent24h, sent1h });
}
