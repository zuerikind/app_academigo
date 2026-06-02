# Phase 4: Recurring Lessons — Research

**Researched:** 2026-06-02
**Domain:** Supabase schema design, Vercel Cron idempotency, credit wallet migration, recurring schedule generation, Next.js App Router dashboard pages
**Confidence:** HIGH (all findings grounded in the live codebase)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Credits do NOT expire — no TTL, no rolling windows
- Credits deducted ONLY on `completed` lesson status — never on booking, never on cancel/reschedule
- Cancellation and reschedule = zero credit loss for student
- Replace the existing raw `credits` integer on the `students` table with a proper `credit_wallets` table and `credit_transactions` log
- Transaction types: `purchase`, `completion_deduction`, `cancellation_refund`, `admin_grant`
- Recurring schedule schema exactly as specified in CONTEXT.md (weekday int 0=Mon…6=Sun, start_time/end_time TIME, status text CHECK)
- Lesson schema exactly as specified in CONTEXT.md (schedule_id nullable, status CHECK, reschedule fields)
- Lesson generation: active schedules only, 6-week look-ahead, idempotent check on (schedule_id, start_time), Vercel Cron daily 00:00, auto-generated lessons start as `confirmed`
- Rescheduling flow: student requests → `reschedule_requested` status + proposed times set → teacher approves (original cancelled + new confirmed created) OR rejects (reverted to confirmed, fields cleared) → no credit change either path
- Existing `bookings` table from Phase 3 is kept as-is; new `lessons` table is separate
- Phase 4 dashboards show `lessons`; Phase 3 dashboards continue showing `bookings`
- Existing `student_credits` table stays; credit_wallets is a NEW parallel table; `student_available_credits` RPC updated to read from `credit_wallets`
- `student_available_credits` RPC is updated to read from `credit_wallets` instead of `student_credits`

### Claude's Discretion
- RLS policies on new tables (follow existing patterns from Phase 3)
- TypeScript type generation after migrations
- Wave assignment and plan ordering
- UI component reuse (Card, Badge, EmptyState — existing design system)
- i18n key placement (follow existing `messages/en.ts` / `messages/de.ts` pattern)

### Deferred Ideas (OUT OF SCOPE)
- Google Calendar sync
- Automatic Meet link generation
- Subscription billing
- Teacher-initiated reschedule requests
- Notification emails for reschedule requests
- Admin view of recurring schedules
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CRED-01 | Student credit wallet displays current available balance | `credit_wallets` table + `get_wallet_balance` RPC; replaces `student_credits` read |
| CRED-02 | Every credit change recorded as transaction with amount, type, timestamp | `credit_transactions` table; INSERT in all RPCs that touch balance |
| CRED-03 | Credits deducted only when lesson marked completed | `complete_lesson` RPC mirrors `complete_booking`; no deduction in create/cancel/reschedule |
| CRED-04 | Credits do not expire; balance carries forward indefinitely | No TTL column; no scheduled purge; wallet `available_balance` is authoritative |
| SCHED-01 | Student can create recurring schedule with teacher (weekday, start, end) | `createSchedule` Server Action → INSERT into `recurring_schedules`; follow `requestBooking` pattern |
| SCHED-02 | Schedule can be paused, resumed, or cancelled by student or teacher | `updateScheduleStatus` Server Action; RLS allows both student_id and teacher_id participants |
| SCHED-03 | Pausing stops new lesson generation; resuming restarts from next occurrence | Cron generator filters `status = 'active'`; idempotency check prevents backfill on resume |
| LES-01 | System auto-generates confirmed lessons for active schedules 6–8 weeks ahead | `generate-lessons` cron route; 42-day look-ahead; INSERT with status='confirmed' |
| LES-02 | Duplicate lesson generation is prevented (idempotent) | UNIQUE constraint on `(schedule_id, start_time)` + upsert-or-skip pattern in cron |
| LES-03 | Lessons support all 5 statuses | CHECK constraint on `lessons.status` |
| RESC-01 | Student can request reschedule by proposing new date/time | `requestReschedule` Server Action; updates lesson status + proposed times |
| RESC-02 | Teacher receives reschedule request and can approve or reject | Teacher lessons dashboard reschedule queue; `approveReschedule` / `rejectReschedule` actions |
| RESC-03 | On approval: original cancelled, new confirmed, no credits lost | `approve_reschedule` DB RPC (atomic: cancel + insert); no wallet touch |
| TDASH-01 | Teacher sees active students with remaining credit balance | Query joining `recurring_schedules` → `credit_wallets` via `student_id` |
| TDASH-02 | Teacher sees all recurring schedules; can pause/cancel | `getTeacherSchedules` query; `updateScheduleStatus` action |
| TDASH-03 | Teacher sees upcoming lessons sorted by date | `getTeacherUpcomingLessons` query; filter `status IN ('confirmed','reschedule_requested') AND start_time >= now()` |
| TDASH-04 | Teacher sees open reschedule requests; can approve or reject | Filter `lessons.status = 'reschedule_requested'` for teacher_id; inline approve/reject forms |
| SDASH-01 | Student sees credit wallet balance prominently | StatCard with `available_balance` from `credit_wallets` |
| SDASH-02 | Student sees full credit transaction history | `getCreditTransactions` query ordered by `created_at DESC` |
| SDASH-03 | Student sees all recurring schedules; can pause or cancel | `getStudentSchedules` query; `updateScheduleStatus` action |
| SDASH-04 | Student sees upcoming lessons; can request reschedule on confirmed lesson | `getStudentUpcomingLessons` query; inline reschedule CTA on `confirmed` lessons |
</phase_requirements>

---

## Summary

Phase 4 builds a recurring lesson layer on top of the Phase 3 booking foundation. Three new domain tables are required: `credit_wallets` (replaces balance read from `student_credits`), `credit_transactions` (audit log), `recurring_schedules` (student-teacher recurring slots), and `lessons` (generated + one-off lesson instances). The existing `bookings` table and all Phase 3 code are untouched.

The Vercel Cron infrastructure already exists (`/api/cron/reminders`, `0 * * * *` in `vercel.json`). A second cron entry (`/api/cron/generate-lessons`, `0 0 * * *`) follows the exact same CRON_SECRET auth guard pattern. Idempotency is enforced by a UNIQUE constraint on `(schedule_id, start_time)` — the cron either inserts or skips; no side-effects on conflict.

The Phase 3 RPC pattern (SECURITY DEFINER, FOR UPDATE row lock, explicit RAISE EXCEPTION codes) is the standard that all new RPCs follow. Two atomic DB functions are new: `complete_lesson` (deducts from `credit_wallets` + logs transaction) and `approve_reschedule` (cancels original lesson + inserts new confirmed lesson atomically). Both follow the `complete_booking` / `cancel_booking` shape exactly.

**Primary recommendation:** Implement in four waves — (1) schema migration + types, (2) cron lesson generator, (3) Server Actions for schedules/lessons/reschedule, (4) teacher and student dashboard pages.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase JS (`@supabase/ssr`) | already installed | DB queries, RLS, RPC | project standard — all queries use `createClient()` from `lib/supabase/server.ts` |
| Next.js App Router | already installed | Server Components, Server Actions, Route Handlers | project standard — all pages follow `app/[locale]/` convention |
| TypeScript | already installed | Types after migration regen | project standard — `supabase gen types` run after every migration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vercel Cron (via `vercel.json`) | already configured | Daily lesson generation | Add second cron entry to existing `vercel.json` |
| `createServiceClient()` from `lib/supabase/service.ts` | already present | Cron route — no user session available | Use for cron route handler exactly as the `reminders` route used `createClient()` — BUT service client bypasses RLS which is correct for cron writes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| DB UNIQUE constraint for idempotency | Application-level check | DB constraint is atomic — application check races under concurrent cron runs |
| Separate `approve_reschedule` RPC | Two sequential updates in action | RPC is atomic — prevents partial state (cancel succeeds, insert fails) |
| New `credit_wallets` table | Extend `student_credits` | CONTEXT.md locks this decision; separate table preserves Phase 3 `student_credits` untouched |

**Installation:** No new packages required. All dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure

New files for Phase 4 follow the exact same layout as Phase 3:

```
supabase/migrations/
  20260603000001_phase4_schema.sql      — all 4 new tables + RPCs + RLS + indexes + wallet migration

lib/queries/
  lessons.ts                            — getStudentUpcomingLessons, getTeacherUpcomingLessons
  schedules.ts                          — getStudentSchedules, getTeacherSchedules, getTeacherActiveStudents
  wallet.ts                             — getWalletBalance, getCreditTransactions

lib/actions/
  lessons.ts                            — completeLesson, cancelLesson
  schedules.ts                          — createSchedule, updateScheduleStatus
  reschedule.ts                         — requestReschedule, approveReschedule, rejectReschedule

app/api/cron/
  generate-lessons/route.ts             — new cron route, same CRON_SECRET guard pattern

app/[locale]/teacher/
  lessons/page.tsx                      — TDASH-01..04: active students, schedules, upcoming, reschedule queue
  lessons/layout.tsx                    — route guard (requireRoleFromParams already handles this via parent layout)

app/[locale]/student/
  lessons/page.tsx                      — SDASH-01..04: wallet balance, transaction history, schedules, upcoming lessons

config/navigation.ts                    — add lessons nav item to getTeacherNav and getStudentNav

messages/en.ts + de.ts                  — add lessons, schedules, wallet, reschedule i18n sections
```

### Pattern 1: Supabase Migration — Additive Tables + Wallet Seed

**What:** Single migration file creates all 4 tables (credit_wallets, credit_transactions, recurring_schedules, lessons), adds RLS, adds indexes, defines new RPCs, and seeds `credit_wallets` from existing `student_credits`.
**When to use:** All schema changes in Phase 4 land in one file — consistent with Phase 3's `20260601000001_phase3_schema.sql` pattern.

```sql
-- Source: live codebase — 20260601000001_phase3_schema.sql pattern
-- Pattern: IF NOT EXISTS + CREATE OR REPLACE throughout for safe re-runs

-- Wallet seed from existing student_credits
INSERT INTO credit_wallets (student_id, available_balance)
SELECT student_id, (total_credits - used_credits - reserved_credits)
FROM student_credits
ON CONFLICT (student_id) DO NOTHING;
```

### Pattern 2: Atomic RPC — complete_lesson

**What:** Mirrors `complete_booking` exactly. Locks lesson row, validates status, updates to `completed`, deducts from `credit_wallets`, inserts `credit_transactions` row.
**When to use:** Teacher marks a lesson complete.

```sql
-- Source: live codebase — 20260528000005_booking_rpcs.sql (complete_booking pattern)
CREATE OR REPLACE FUNCTION complete_lesson(p_lesson_id UUID) RETURNS void AS $$
DECLARE
  v_lesson lessons%ROWTYPE;
  v_credits_to_deduct INTEGER;
BEGIN
  SELECT * INTO v_lesson FROM lessons WHERE id = p_lesson_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'lesson_not_found'; END IF;
  IF v_lesson.status != 'confirmed' THEN RAISE EXCEPTION 'invalid_lesson_status'; END IF;

  -- Determine cost (use teacher payout_rate lookup or fixed 1 credit per session)
  v_credits_to_deduct := 1;  -- Phase 4: 1 credit per lesson (consistent with Phase 3 book)

  UPDATE lessons SET status = 'completed', updated_at = now() WHERE id = p_lesson_id;

  UPDATE credit_wallets
  SET available_balance = available_balance - v_credits_to_deduct, updated_at = now()
  WHERE student_id = v_lesson.student_id;

  INSERT INTO credit_transactions (student_id, amount, type, lesson_id)
  VALUES (v_lesson.student_id, -v_credits_to_deduct, 'completion_deduction', p_lesson_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Pattern 3: Atomic RPC — approve_reschedule

**What:** Cancels the original lesson and inserts a new confirmed lesson in one transaction. No credit change.
**When to use:** Teacher approves student's reschedule request.

```sql
-- Source: design (mirrors cancel_booking pattern)
CREATE OR REPLACE FUNCTION approve_reschedule(p_lesson_id UUID) RETURNS UUID AS $$
DECLARE
  v_lesson lessons%ROWTYPE;
  v_new_lesson_id UUID;
BEGIN
  SELECT * INTO v_lesson FROM lessons WHERE id = p_lesson_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'lesson_not_found'; END IF;
  IF v_lesson.status != 'reschedule_requested' THEN RAISE EXCEPTION 'invalid_lesson_status'; END IF;
  IF v_lesson.reschedule_proposed_start IS NULL THEN RAISE EXCEPTION 'no_proposed_time'; END IF;

  UPDATE lessons SET status = 'cancelled', updated_at = now() WHERE id = p_lesson_id;

  INSERT INTO lessons (student_id, teacher_id, schedule_id, start_time, end_time, meet_link, status)
  VALUES (
    v_lesson.student_id, v_lesson.teacher_id, v_lesson.schedule_id,
    v_lesson.reschedule_proposed_start, v_lesson.reschedule_proposed_end,
    v_lesson.meet_link, 'confirmed'
  )
  RETURNING id INTO v_new_lesson_id;

  RETURN v_new_lesson_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Pattern 4: Cron Route — generate-lessons

**What:** Identical CRON_SECRET guard as `reminders/route.ts`. Uses `createServiceClient()` (not `createClient()`) since there is no user session in a cron context. Queries active schedules, calculates next 6 weeks of occurrences, inserts with ON CONFLICT DO NOTHING.
**When to use:** Registered in `vercel.json` at `0 0 * * *`.

```typescript
// Source: live codebase — app/api/cron/reminders/route.ts (auth guard pattern)
// Use createServiceClient() — cron has no user session
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest): Promise<Response> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const supabase = createServiceClient();  // service role — bypasses RLS

  // Fetch all active schedules
  const { data: schedules } = await supabase
    .from("recurring_schedules")
    .select("id, student_id, teacher_id, weekday, start_time, end_time")
    .eq("status", "active");

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000); // 6 weeks
  let generated = 0;

  for (const schedule of schedules ?? []) {
    // Walk forward day by day finding matching weekdays
    // Use ON CONFLICT DO NOTHING for idempotency
    const lessons = computeOccurrences(schedule, now, windowEnd);
    for (const lesson of lessons) {
      const { error } = await supabase
        .from("lessons")
        .insert(lesson)
        .select("id")  // triggers ON CONFLICT DO NOTHING via UNIQUE(schedule_id, start_time)
      if (!error) generated++;
    }
  }
  return Response.json({ ok: true, generated });
}
```

### Pattern 5: Server Action — createSchedule

Follows `requestBooking` in `lib/actions/bookings.ts`: `requireRole`, validate, supabase insert, revalidatePath.

```typescript
// Source: live codebase — lib/actions/bookings.ts (requestBooking shape)
"use server";
export async function createSchedule(
  _prev: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const profile = await requireRole("student");
  const supabase = await createClient();
  // validate, insert into recurring_schedules, revalidatePath("/", "layout")
}
```

### Pattern 6: RLS on New Tables

Follow `bookings` RLS pattern — participant access (student OR teacher), admin sees all:

```sql
-- Source: live codebase — 20260528000002_rls_policies.sql (bookings policies)
CREATE POLICY "lessons_select_participants"
  ON lessons FOR SELECT
  USING (
    student_id = auth_student_id()
    OR teacher_id = auth_teacher_id()
    OR auth_is_admin()
  );

CREATE POLICY "recurring_schedules_select_participants"
  ON recurring_schedules FOR SELECT
  USING (
    student_id = auth_student_id()
    OR teacher_id = auth_teacher_id()
    OR auth_is_admin()
  );

-- credit_wallets: student reads own; admin reads all; service role bypasses for cron writes
CREATE POLICY "credit_wallets_select_own"
  ON credit_wallets FOR SELECT
  USING (student_id = auth_student_id() OR auth_is_admin());

-- credit_transactions: student reads own
CREATE POLICY "credit_transactions_select_own"
  ON credit_transactions FOR SELECT
  USING (student_id = auth_student_id() OR auth_is_admin());
```

### Pattern 7: Dashboard Page Structure

All dashboard pages follow this exact shape (source: `app/[locale]/teacher/dashboard/page.tsx`):
1. `async function Page({ params })` — Server Component
2. `await params` (Next.js App Router — params is a Promise)
3. `isLocale(raw)` guard → `notFound()`
4. `getDictionary(raw)` → dict
5. `requireRoleFromParams(role, raw)` → profile
6. Data fetch via lib/queries functions
7. Return `<DashboardLayout navItems={...} locale={raw} dict={dict} title={...}>`

New dashboard pages (`/teacher/lessons`, `/student/lessons`) follow this shape identically. The parent `teacher/layout.tsx` already handles the role guard — no second guard needed in the page.

### Anti-Patterns to Avoid

- **DO NOT** use `createClient()` in the cron route for lesson generation. The reminders cron happened to work with `createClient()` because it only reads/updates existing user data, but lesson generation INSERTs new rows as a service — use `createServiceClient()` to bypass RLS for cron writes.
- **DO NOT** update `student_credits` in Phase 4 RPCs. Phase 4 wallet lives in `credit_wallets` exclusively. The two tables coexist — Phase 3 code still uses `student_credits`; Phase 4 code uses `credit_wallets`.
- **DO NOT** attempt to backfill missed occurrences when a schedule is resumed. The idempotency window check `start_time >= now()` naturally prevents generating past-dated lessons. Resuming just re-enables the schedule; the next cron run picks up from the upcoming occurrence.
- **DO NOT** store weekday as a string. CONTEXT.md locks it as `int (0=Monday … 6=Sunday)`. JavaScript's `Date.getDay()` uses 0=Sunday — use `(jsDay + 6) % 7` to convert to ISO convention.
- **DO NOT** use `useActionState` with a 3-argument form action signature without wrapping. See STATE.md decision: "Wrap approveTeacher (2-arg useActionState signature) in inline async function for plain form action to satisfy TypeScript form action type."

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic credit deduction on lesson completion | Application-level update + insert | `complete_lesson` Supabase RPC (SECURITY DEFINER + FOR UPDATE) | Concurrent completions without a row lock corrupt the balance — same reason Phase 3 uses `complete_booking` RPC |
| Idempotent lesson generation | Application-level existence check before insert | `UNIQUE (schedule_id, start_time)` + `INSERT ... ON CONFLICT DO NOTHING` | Application check races if cron runs twice (e.g. Vercel retry); DB constraint is the only safe guarantee |
| Atomic reschedule approval | Two sequential action calls | `approve_reschedule` RPC | If cancel succeeds but insert fails (network blip), lesson is permanently lost; RPC wraps both in one transaction |
| CRON_SECRET authentication | Custom JWT or API key scheme | Bearer token pattern already in `reminders/route.ts` | Vercel Cron always sends `Authorization: Bearer <CRON_SECRET>` — the pattern is proven |
| Weekday-to-date arithmetic | Ad-hoc date math | `computeOccurrences` utility function (new, ~20 lines) in `lib/utils/schedule.ts` | The ISO vs. JS weekday offset (`(jsDay + 6) % 7`) is a recurring bug source; encapsulate once |

**Key insight:** The Phase 3 RPC pattern (SECURITY DEFINER + FOR UPDATE row lock + RAISE EXCEPTION error codes) is the only correct approach for credit operations in Supabase. Any server action that touches balances must go through an RPC — never raw UPDATE from application code.

---

## Common Pitfalls

### Pitfall 1: JS Date.getDay() vs. ISO weekday mismatch
**What goes wrong:** `weekday=0` (Monday in CONTEXT.md schema) maps to `jsDay=1` in JS. Generating occurrences using `Date.getDay() === schedule.weekday` produces lessons on the wrong day.
**Why it happens:** JS uses 0=Sunday; CONTEXT.md schema uses ISO 0=Monday.
**How to avoid:** Create a single utility: `const isoDay = (date.getDay() + 6) % 7;` — use `isoDay === schedule.weekday`.
**Warning signs:** Generated lessons fall one day earlier than expected, or Sunday-scheduled lessons never appear.

### Pitfall 2: Cron using anon client can't INSERT lessons
**What goes wrong:** `createClient()` returns an anon/session client. Without a valid user session cookie, all INSERT operations on `lessons` fail RLS checks (no `auth_student_id()` to match against).
**Why it happens:** The reminders cron only reads bookings and updates reminder timestamps — those operations work with the session-based client because the data already exists. Fresh INSERTs for a generated lesson have no caller session.
**How to avoid:** Use `createServiceClient()` in the generate-lessons cron route — it uses the service role key which bypasses RLS.
**Warning signs:** Cron returns `ok: true, generated: 0` even when active schedules exist.

### Pitfall 3: Reschedule re-request on a reschedule_requested lesson
**What goes wrong:** Student requests reschedule twice (changes their mind about the proposed time). The second request should overwrite `reschedule_proposed_start/end`, not create a second row.
**Why it happens:** The action checks `status = 'confirmed'` before setting `reschedule_requested`, but the lesson is already `reschedule_requested` from the first attempt.
**How to avoid:** `requestReschedule` action accepts `status IN ('confirmed', 'reschedule_requested')` — if already in reschedule_requested, just update the proposed times (no status change needed).
**Warning signs:** Student gets "lesson not in confirmed status" error when updating their reschedule proposal.

### Pitfall 4: Wallet seed produces negative balance
**What goes wrong:** Migration seeds `credit_wallets.available_balance` as `total_credits - used_credits - reserved_credits`. If `reserved_credits > 0` at migration time, balance reflects the temporarily reduced amount. After Phase 3 bookings complete (or are cancelled), `student_credits` credits return but `credit_wallets` is never updated.
**Why it happens:** Phase 3 `student_credits` tracks reserved separately; `credit_wallets` does not use a reserved model.
**How to avoid:** The CONTEXT.md decision says credits are deducted ONLY on completion. The wallet seed should use `total_credits - used_credits` (ignore reserved) — reserved Phase 3 credits will complete or cancel naturally and their `complete_booking` / `cancel_booking` RPCs update `student_credits`, not `credit_wallets`. The two systems are independent.
**Warning signs:** A student with 5 credits and 1 reserved booking sees only 4 credits in the new wallet immediately after migration.

### Pitfall 5: Cancelled recurring schedule generates one final batch
**What goes wrong:** Schedule is cancelled at 23:58; cron runs at 00:00 the next day. The SELECT loads the schedule before the cancel commits (unlikely but possible under load).
**Why it happens:** Read-write gap.
**How to avoid:** The cron SELECT filters `status = 'active'`. As long as the schedule status is committed before midnight, cron won't pick it up. This is acceptable — no need for distributed locking. Add a final `WHERE status = 'active'` check inside the loop body as a double-guard.

### Pitfall 6: Navigation keys don't exist in Dictionary type
**What goes wrong:** Adding `dict.nav.teacher.lessons` throws TypeScript errors because `messages/types.ts` derives from the `en` object literal shape.
**Why it happens:** `Dictionary` type is auto-derived from `en.ts` via `typeof en`. New keys must be added to `en.ts` AND `de.ts` together before importing them in components.
**How to avoid:** Always add i18n keys to both `messages/en.ts` and `messages/de.ts` in the same plan. The German value can be a placeholder on the first pass; it must exist structurally.

### Pitfall 7: Supabase join type inferred as array in TypeScript
**What goes wrong:** `booking.students` typed as `{ id: string; profiles: {...} }[]` (array) even when you expect a single object.
**Why it happens:** Supabase infers foreign-key join results as arrays. Every join in Phase 4 queries will exhibit this.
**How to avoid:** Follow the existing `bookings.ts` pattern: `Array.isArray(b.teachers.profiles) ? b.teachers.profiles[0]?.full_name : b.teachers.profiles?.full_name`. Use `as any` casts in query mapping functions — same as Phase 3. This is documented as a project decision in STATE.md.

---

## Code Examples

Verified patterns from live codebase:

### Cron auth guard (from `app/api/cron/reminders/route.ts`)
```typescript
export async function GET(request: NextRequest): Promise<Response> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  // ... handler body
}
```

### Add second cron to `vercel.json`
```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "0 * * * *" },
    { "path": "/api/cron/generate-lessons", "schedule": "0 0 * * *" }
  ]
}
```

### RPC call pattern (from `lib/actions/bookings.ts`)
```typescript
const { error } = await supabase.rpc("complete_lesson", {
  p_lesson_id: lessonId,
});
if (error) {
  if (error.message?.includes("lesson_not_found")) return { error: "Lesson not found." };
  if (error.message?.includes("invalid_lesson_status")) return { error: "Lesson cannot be completed." };
  return { error: error.message };
}
```

### ISO weekday utility
```typescript
// lib/utils/schedule.ts
export function computeOccurrences(
  schedule: { id: string; student_id: string; teacher_id: string; weekday: number; start_time: string; end_time: string },
  from: Date,
  to: Date,
): Array<{ schedule_id: string; student_id: string; teacher_id: string; start_time: string; end_time: string; status: string }> {
  const results = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= to) {
    const isoDay = (cursor.getDay() + 6) % 7; // JS 0=Sun → ISO 0=Mon
    if (isoDay === schedule.weekday) {
      const [startH, startM] = schedule.start_time.split(":").map(Number);
      const [endH, endM] = schedule.end_time.split(":").map(Number);
      const startTs = new Date(cursor);
      startTs.setHours(startH, startM, 0, 0);
      const endTs = new Date(cursor);
      endTs.setHours(endH, endM, 0, 0);
      if (startTs > from) { // only future occurrences
        results.push({
          schedule_id: schedule.id,
          student_id: schedule.student_id,
          teacher_id: schedule.teacher_id,
          start_time: startTs.toISOString(),
          end_time: endTs.toISOString(),
          status: "confirmed",
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return results;
}
```

### StatCard usage (from `app/[locale]/teacher/dashboard/page.tsx`)
```typescript
<StatCard
  label={t.walletBalance}
  value={walletBalance}
  icon="coins"
  tone="brand"
/>
```

### Navigation extension pattern (from `config/navigation.ts`)
```typescript
export function getStudentNav(dict: Dictionary, locale: Locale): NavItem[] {
  return [
    // ... existing items ...
    {
      label: dict.nav.student.lessons,          // new key
      href: localizedPath(locale, "/student/lessons"),
      icon: "calendar",
    },
  ];
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `student_credits` integer on `students` table | `credit_wallets` + `credit_transactions` | Phase 4 (this phase) | Full audit trail; balance never inferred from diff math |
| One-off `bookings` only | `bookings` (Phase 3) + `lessons` (Phase 4) | Phase 4 (this phase) | Recurring model is separate — no risk to Phase 3 flows |
| Manual lesson scheduling | Auto-generated via Vercel Cron | Phase 4 (this phase) | Teacher sets schedule once; system creates 6 weeks of lessons |

**Deprecated/outdated for Phase 4 contexts:**
- `student_credits` table: still used by Phase 3 RPCs (`complete_booking`, `cancel_booking`, `grant_credits`); DO NOT remove; `credit_wallets` is additive
- `student_available_credits()` RPC: needs updating to read from `credit_wallets` (CONTEXT.md decision); existing parameterless and parameterized overloads both need CREATE OR REPLACE

---

## Migration Design

### Full migration file: `20260603000001_phase4_schema.sql`

**Section order:**
1. `credit_wallets` table (student_id UNIQUE FK → students, available_balance int DEFAULT 0, updated_at)
2. `credit_transactions` table (id, student_id FK → students, lesson_id FK → lessons NULLABLE, amount int, type text CHECK, description text NULLABLE, created_at)
3. `recurring_schedules` table (exact schema from CONTEXT.md + updated_at trigger)
4. `lessons` table (exact schema from CONTEXT.md + updated_at trigger + UNIQUE(schedule_id, start_time) WHERE schedule_id IS NOT NULL)
5. RLS policies on all 4 tables
6. `complete_lesson` RPC
7. `approve_reschedule` RPC
8. `reject_reschedule` RPC (UPDATE only — no new rows)
9. Updated `student_available_credits(UUID)` and `student_available_credits()` to read from `credit_wallets`
10. Wallet seed: INSERT INTO credit_wallets SELECT from student_credits ON CONFLICT DO NOTHING
11. transaction seed for existing purchased credits (type='purchase', amount = total_credits from student_credits)

**Critical index — idempotency guard:**
```sql
-- Partial unique index: only enforce uniqueness for recurring lessons (not one-offs)
CREATE UNIQUE INDEX IF NOT EXISTS lessons_schedule_start_unique
  ON lessons (schedule_id, start_time)
  WHERE schedule_id IS NOT NULL;
```

**IMPORTANT — circular FK between credit_transactions and lessons:**
`credit_transactions.lesson_id` references `lessons.id`, but `lessons` must exist first. Create `lessons` table before `credit_transactions`, or use a DEFERRABLE FK or add the FK as a separate ALTER TABLE after both tables exist.

**Recommended order:** Create `lessons` first (no FK to credit_transactions), then `credit_transactions` (FK to lessons is valid).

---

## Open Questions

1. **Credit cost per lesson (1 credit fixed or based on teacher tier?)**
   - What we know: Phase 3 `create_booking` hard-codes `p_credits_to_reserve: 1` in the action. The DB allows `credits_reserved` to vary.
   - What's unclear: Should `complete_lesson` deduct 1 credit fixed or look up the teacher's tier rate?
   - Recommendation: Follow Phase 3 precedent — 1 credit per lesson. The teacher tier rate affects CHF payout (`payout_rate`), not credit cost to the student. Keep `v_credits_to_deduct := 1` in the RPC.

2. **Reschedule date picker component**
   - What we know: Phase 3 has `BookingCalendar` + `SlotPicker` for initial booking slot selection. These check teacher availability ranges.
   - What's unclear: For rescheduling, does the student pick from teacher's availability slots or any arbitrary datetime?
   - Recommendation: Simplest safe approach — use a plain `<input type="datetime-local">` for the reschedule proposal (teacher reviews and approves anyway). This avoids the calendar component dependency for a first implementation.

3. **Wallet balance can go negative if `student_credits` had reserved credits at migration time**
   - See Pitfall 4 above. Seed formula should be `total_credits - used_credits` (not subtracting reserved).
   - What's unclear: Whether any students will have active Phase 3 bookings (reserved credits) at the time Phase 4 migrates.
   - Recommendation: Seed with `total_credits - used_credits`; let reserved Phase 3 credits resolve naturally through their existing RPCs.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (already configured in Phase 3) |
| Config file | `jest.config.ts` (exists from Phase 3) |
| Quick run command | `npm test -- --testPathPattern="lessons|schedules|wallet|reschedule" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRED-01 | `getWalletBalance` returns available_balance from credit_wallets | unit | `npm test -- --testPathPattern="wallet"` | ❌ Wave 0 |
| CRED-02 | `complete_lesson` RPC inserts credit_transactions row | integration/smoke | Browser verify + manual SQL | manual-only (DB-level) |
| CRED-03 | Credits not deducted in createSchedule / requestReschedule | unit | `npm test -- --testPathPattern="schedules\|reschedule"` | ❌ Wave 0 |
| CRED-04 | No expiry logic present in wallet query or RPC | unit | `npm test -- --testPathPattern="wallet"` | ❌ Wave 0 |
| SCHED-01 | `createSchedule` action succeeds with valid inputs | unit | `npm test -- --testPathPattern="schedules"` | ❌ Wave 0 |
| SCHED-02 | `updateScheduleStatus` accepts active/paused/cancelled | unit | `npm test -- --testPathPattern="schedules"` | ❌ Wave 0 |
| SCHED-03 | Cron skips paused/cancelled schedules | unit | `npm test -- --testPathPattern="generate-lessons"` | ❌ Wave 0 |
| LES-01 | `computeOccurrences` generates correct dates for 6-week window | unit | `npm test -- --testPathPattern="schedule.util"` | ❌ Wave 0 |
| LES-02 | `computeOccurrences` + UNIQUE constraint prevents duplicates | unit | `npm test -- --testPathPattern="generate-lessons"` | ❌ Wave 0 |
| LES-03 | Lesson status enum covers all 5 values | unit | `npm test -- --testPathPattern="lessons"` | ❌ Wave 0 |
| RESC-01 | `requestReschedule` sets status to reschedule_requested | unit | `npm test -- --testPathPattern="reschedule"` | ❌ Wave 0 |
| RESC-02 | `rejectReschedule` reverts lesson to confirmed | unit | `npm test -- --testPathPattern="reschedule"` | ❌ Wave 0 |
| RESC-03 | `approveReschedule` calls RPC; no wallet update | unit | `npm test -- --testPathPattern="reschedule"` | ❌ Wave 0 |
| TDASH-01..04 | Teacher dashboard page renders without error | smoke | Browser verify | manual-only |
| SDASH-01..04 | Student dashboard page renders without error | smoke | Browser verify | manual-only |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="lessons|schedules|wallet|reschedule" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/lib/utils/schedule.util.test.ts` — covers LES-01, LES-02 (computeOccurrences unit tests)
- [ ] `__tests__/lib/actions/schedules.test.ts` — covers SCHED-01, SCHED-02, CRED-03
- [ ] `__tests__/lib/actions/reschedule.test.ts` — covers RESC-01, RESC-02, RESC-03
- [ ] `__tests__/lib/queries/wallet.test.ts` — covers CRED-01, CRED-04
- [ ] `__tests__/app/api/cron/generate-lessons.test.ts` — covers SCHED-03, LES-02

**Framework install:** Jest is already installed from Phase 3. No new install step needed.

---

## Sources

### Primary (HIGH confidence)
- Live codebase: `supabase/migrations/20260528000005_booking_rpcs.sql` — RPC patterns (complete_booking, cancel_booking FOR UPDATE)
- Live codebase: `supabase/migrations/20260601000001_phase3_schema.sql` — migration structure, IF NOT EXISTS pattern
- Live codebase: `supabase/migrations/20260528000002_rls_policies.sql` — RLS helper functions (auth_student_id, auth_teacher_id, auth_is_admin)
- Live codebase: `app/api/cron/reminders/route.ts` — CRON_SECRET auth guard, cron route structure
- Live codebase: `lib/supabase/service.ts` — createServiceClient() for RLS bypass
- Live codebase: `lib/actions/bookings.ts` — Server Action shape, requireRole, revalidatePath
- Live codebase: `lib/queries/bookings.ts` — query function shape, Supabase join handling (Array.isArray pattern)
- Live codebase: `config/navigation.ts` — nav item extension pattern
- Live codebase: `components/ui/stat-card.tsx` — StatCard props API (label, value, icon, tone, href, hrefLabel, hint)
- Live codebase: `components/layout/dashboard-layout.tsx` — DashboardLayout props API
- Live codebase: `.planning/phases/04-recurring-lessons/04-CONTEXT.md` — locked schema decisions
- Live codebase: `.planning/STATE.md` — historical decisions affecting Phase 4 (Supabase join typing, useActionState signature, makeChainable test pattern)

### Secondary (MEDIUM confidence)
- Supabase docs pattern: UNIQUE partial index `WHERE schedule_id IS NOT NULL` for conditional uniqueness on nullable FK columns

### Tertiary (LOW confidence — flag for validation)
- Vercel Cron retry behavior: if the daily cron fails and retries, the ON CONFLICT DO NOTHING constraint prevents duplicate lessons. Behavior under rapid retry is untested in this project.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, all libraries already in use
- Architecture: HIGH — every pattern traced to live Phase 3 code
- Migration design: HIGH — follows exact Phase 3 migration structure; schema from CONTEXT.md (locked)
- RPC design: HIGH — mirrors complete_booking/cancel_booking shape exactly
- Pitfalls: HIGH — ISO weekday trap and RLS/service client trap verified against live code
- Test infrastructure: HIGH — Jest already present from Phase 3; Wave 0 gaps listed precisely

**Research date:** 2026-06-02
**Valid until:** 2026-07-02 (stable stack — 30-day window appropriate)
