# Phase 4: Recurring Lessons — Context

**Gathered:** 2026-06-02
**Status:** Ready for planning
**Source:** User spec (PRD Express Path)

<domain>
## Phase Boundary

This phase extends the existing single-booking model with recurring schedules, auto-generated lessons, a proper credit wallet with transaction history, and a rescheduling workflow. It does NOT replace the existing booking system — existing one-off bookings continue to work. The recurring layer is additive.

**In scope:**
- Credit wallet model (replace raw credit balance with wallet + transactions table)
- Recurring schedule entity (student ↔ teacher, weekday + time window, status lifecycle)
- Auto-generated lessons (Vercel Cron or DB function, 6–8 weeks ahead, idempotent)
- Lesson entity with `schedule_id` (nullable — one-off bookings set this to null)
- Rescheduling workflow (request → approve/reject → swap)
- Teacher dashboard: active students, student credits, schedules, upcoming lessons, reschedule queue
- Student dashboard: wallet, credit history, schedules, upcoming lessons with reschedule action

**Not in scope:**
- Google Calendar sync (deferred)
- Automatic Meet link generation (deferred)
- Subscription billing (deferred)
- Teacher payouts for recurring lessons (uses existing Phase 3 payout system)

</domain>

<decisions>
## Implementation Decisions

### Credit Model
- Credits do NOT expire — no TTL, no rolling windows
- Credits deducted ONLY on `completed` lesson status — never on booking, never on cancel/reschedule
- Cancellation and reschedule = zero credit loss for student
- Replace the existing raw `credits` integer on the `students` table with a proper `credit_wallets` table and `credit_transactions` log
- Transaction types: `purchase`, `completion_deduction`, `cancellation_refund`, `admin_grant`

### Recurring Schedule Schema
```
recurring_schedules:
  id uuid PK
  student_id uuid FK → students
  teacher_id uuid FK → teachers
  weekday int (0=Monday … 6=Sunday, ISO convention)
  start_time time
  end_time time
  status text CHECK IN ('active', 'paused', 'cancelled')
  created_at timestamptz
  updated_at timestamptz
```

### Lesson Schema
```
lessons:
  id uuid PK
  student_id uuid FK → students
  teacher_id uuid FK → teachers
  schedule_id uuid FK → recurring_schedules (NULLABLE — null for one-off)
  start_time timestamptz
  end_time timestamptz
  meet_link text (nullable)
  status text CHECK IN ('pending', 'confirmed', 'completed', 'cancelled', 'reschedule_requested')
  reschedule_proposed_start timestamptz (nullable)
  reschedule_proposed_end timestamptz (nullable)
  reschedule_requested_by text CHECK IN ('student', 'teacher') (nullable)
  created_at timestamptz
  updated_at timestamptz
```

### Lesson Generation
- Lessons generated for **active** schedules only
- Look-ahead window: **6 weeks** (simple, predictable)
- Idempotent: check for existing lesson at same (schedule_id, start_time) before inserting
- Trigger: Vercel Cron — daily at 00:00 (reuse existing cron infrastructure from Phase 3)
- Status of auto-generated lessons: `confirmed` (teacher already has an ongoing relationship with the student)

### Rescheduling Flow
1. Student requests reschedule → lesson status becomes `reschedule_requested`, `reschedule_proposed_start`/`end` set
2. Teacher sees it in their queue
3. Teacher approves → original lesson `cancelled`, new lesson created with `confirmed` status at proposed time
4. Teacher rejects → lesson reverts to `confirmed`, reschedule fields cleared
5. No credit change in either path

### Backward Compatibility
- Existing `bookings` table from Phase 3 is kept as-is
- New `lessons` table is separate — one-off bookings (Phase 3) use `bookings`, recurring use `lessons`
- Phase 4 dashboards show `lessons`; Phase 3 dashboards continue showing `bookings`
- Future migration path: unify tables in a v2 milestone (out of scope here)

### Credit Wallet Migration
- Existing `credits` column on `students` is migrated to a `credit_wallets` table
- A Supabase migration creates the wallet row and seeds balance from existing `credits` value
- `student_available_credits` RPC is updated to read from `credit_wallets` instead

### Claude's Discretion
- RLS policies on new tables (follow existing patterns from Phase 3)
- TypeScript type generation after migrations
- Wave assignment and plan ordering
- UI component reuse (Card, Badge, EmptyState — existing design system)
- i18n key placement (follow existing `messages/en.ts` / `messages/de.ts` pattern)

</decisions>

<specifics>
## Specific Requirements from User Spec

**Credit wallet fields:** available_balance (int), all transactions logged with type + amount + timestamp
**Schedule fields:** id, student_id, teacher_id, weekday, start_time, end_time, status (active/paused/cancelled)
**Lesson fields:** id, student_id, teacher_id, schedule_id (nullable), start_time, end_time, meet_link, status
**Lesson statuses:** pending, confirmed, completed, cancelled, reschedule_requested
**Generation window:** 6–8 weeks (implement as 6 weeks for simplicity)
**No duplicate lessons:** check (schedule_id, start_time) before insert
**No credits on cancel/reschedule:** zero deduction in both flows
**Reschedule approval:** original cancelled + new confirmed created (not updated in place)

**Teacher dashboard must show:**
- Active students (with remaining credit balance)
- All recurring schedules
- Upcoming lessons
- Reschedule requests

**Student dashboard must show:**
- Credit wallet balance
- Credit transaction history
- Active recurring schedules
- Upcoming lessons (with reschedule CTA)

</specifics>

<deferred>
## Deferred Ideas

- Google Calendar sync (explicitly deferred by user)
- Automatic Meet link generation (deferred)
- Subscription billing (deferred)
- Teacher-initiated reschedule requests (user spec only covers student-initiated; teacher can just cancel for now)
- Notification emails for reschedule requests (can add in a v2 patch; reuse Resend from Phase 3)
- Admin view of recurring schedules (Phase 5 or later)

</deferred>

---

*Phase: 04-recurring-lessons*
*Context gathered: 2026-06-02 via user spec*
