import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { computeOccurrences } from "@/lib/utils/schedule";

// ponytail: service client required — cron has no user session, RLS would block INSERTs
export async function GET(request: NextRequest): Promise<Response> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: schedules, error: scheduleError } = await supabase
    .from("recurring_schedules")
    .select("id, student_id, teacher_id, weekday, start_time, end_time, status")
    .eq("status", "active"); // SCHED-03: only active schedules

  if (scheduleError) {
    return Response.json({ ok: false, error: scheduleError.message }, { status: 500 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000); // 6 weeks
  let generated = 0;

  for (const schedule of schedules ?? []) {
    const occurrences = computeOccurrences(schedule, now, windowEnd);
    for (const occurrence of occurrences) {
      // Unique partial index on (schedule_id, start_time) makes this idempotent
      const { error } = await supabase.from("lessons").insert(occurrence);
      if (!error) generated++;
      // code 23505 = unique violation = duplicate, silently skipped
    }
  }

  return Response.json({ ok: true, generated });
}
