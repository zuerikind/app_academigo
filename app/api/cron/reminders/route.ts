import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTeacherReminder } from "@/lib/services/email";
import { nowAsStoredIso } from "@/lib/utils/zurich";

// Service client required — cron has no user session, RLS on bookings would
// silently return zero rows with the anon client.
//
// Runs once per day (Vercel Hobby allows daily cron only). So instead of a
// narrow "24h ahead" window, we remind every confirmed lesson starting within
// the next ~48h that hasn't been reminded yet — reminder_24h_sent_at makes it
// idempotent, so each lesson is reminded exactly once, ~1 day ahead.
// The 1h reminder is not possible on a daily cron and was removed.
export async function GET(request: NextRequest): Promise<Response> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createServiceClient();

  // start_time is Zurich wall-clock stored as UTC; compare against "now" and
  // "now + 48h" expressed in the same stored representation.
  const nowStored = nowAsStoredIso();
  const windowEndStored = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const windowEnd = new Date(
    windowEndStored.getTime() + (new Date(nowStored).getTime() - Date.now()),
  ).toISOString();

  const { data: upcoming } = await supabase
    .from("bookings")
    .select(
      `id, start_time, meeting_link,
       teachers ( id, profiles ( email, full_name ) ),
       students ( profiles ( full_name ) )`,
    )
    .eq("status", "confirmed")
    .is("reminder_24h_sent_at", null)
    .gte("start_time", nowStored)
    .lte("start_time", windowEnd)
    .order("start_time", { ascending: true });

  let sent = 0;
  for (const booking of upcoming ?? []) {
    // Supabase types joins as arrays; the actual value is an object
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

    // Mark immediately after send — if the loop dies midway, only unprocessed
    // bookings get retried on the next run.
    await supabase
      .from("bookings")
      .update({ reminder_24h_sent_at: new Date().toISOString() })
      .eq("id", booking.id);

    sent++;
  }

  return Response.json({ ok: true, sent });
}
