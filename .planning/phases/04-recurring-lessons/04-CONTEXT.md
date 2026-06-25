# Phase 4: Recurring Lessons — Context

**Gathered:** 2026-06-25 (updated from 2026-06-02 spec)
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the existing booking system with recurring schedules, auto-generated lessons, a credit transaction log, and a rescheduling workflow for BOTH one-off bookings and recurring lessons. The recurring layer is additive — existing `bookings` table stays as-is.

**In scope:**
- Credit system cleanup: drop `subscription_credits` column, add `credit_transactions` log table
- Recurring schedule entity (student ↔ teacher, weekday + time window, status lifecycle, teacher-approval flow)
- Auto-generated lessons (Vercel Cron, 6 weeks ahead, idempotent) — starts after teacher approves schedule
- Lesson entity with `schedule_id` (nullable — one-off bookings stay in `bookings` table)
- Rescheduling workflow for BOTH `bookings` (one-off) and `lessons` (recurring): request → counter-propose → accept/reject
- Teacher dashboard: unified view of one-off bookings + recurring lessons; pending schedule approvals; reschedule queue
- Student dashboard: unified view; credit wallet balance + transaction history; recurring schedules; upcoming lessons
- Email notification to teacher when student creates a recurring schedule request
- Reschedule requests must propose a time from the teacher's existing weekly availability slots

**Not in scope:**
- Google Calendar sync
- Automatic Meet link generation
- Subscription billing
- Admin view of recurring schedules
- Notification emails for reschedule requests (email only for schedule creation)

</domain>

<decisions>
## Implementation Decisions

### Credit System Cleanup
- Drop `subscription_credits` column from `student_credits` (subscriptions are fully removed as of June 2026)
- Simplify `student_available_credits` RPC to: `extra_credits - used_credits - reserved_credits`
- Add `credit_transactions` table to log every credit-changing event
- Transaction types: `purchase`, `completion_deduction`, `admin_grant`
- Cancellation refunds are NOT logged (credits are never deducted on cancel, so no refund transaction needed)
- No backfill of historical transactions — log starts from Phase 4 go-live

### credit_transactions Schema
```
credit_transactions:
  id uuid PK
  student_id uuid FK → students
  type text CHECK IN ('purchase', 'completion_deduction', 'admin_grant')
  amount int (positive = credit added, negative = credit removed)
  reference_id uuid nullable (booking_id or payment_id for traceability)
  created_at timestamptz
```

### Recurring Schedule Schema
```
recurring_schedules:
  id uuid PK
  student_id uuid FK → students
  teacher_id uuid FK → teachers
  weekday int (0=Monday … 6=Sunday, ISO convention)
  start_time time
  end_time time
  status text CHECK IN ('pending', 'active', 'paused', 'cancelled')
  created_at timestamptz
  updated_at timestamptz
```
Note: `pending` is a new status — schedule starts as `pending` until teacher approves.

### Recurring Schedule Approval Flow
1. Student picks a recurring slot from teacher's profile page (shows teacher's weekly availability)
2. Schedule created with `status = 'pending'`
3. Teacher sees pending request in dashboard ("Pending Schedules" section) + receives email notification
4. Teacher approves → status becomes `active`; cron starts generating lessons
5. Teacher declines → status becomes `cancelled`
6. Lesson auto-generation only runs for `status = 'active'` schedules

### Lesson Schema
```
lessons:
  id uuid PK
  student_id uuid FK → students
  teacher_id uuid FK → teachers
  schedule_id uuid FK → recurring_schedules (NULLABLE — null means manually created one-off lesson)
  start_time timestamptz
  end_time timestamptz
  meet_link text (nullable)
  status text CHECK IN ('pending', 'confirmed', 'completed', 'cancelled', 'reschedule_requested')
  reschedule_proposed_start timestamptz (nullable)
  reschedule_proposed_end timestamptz (nullable)
  reschedule_requested_by text CHECK IN ('student', 'teacher') (nullable)
  reschedule_round int default 0 (incremented each counter-proposal)
  created_at timestamptz
  updated_at timestamptz
```

### Lesson Generation
- Lessons generated for `active` schedules only
- Look-ahead window: 6 weeks
- Idempotent: UNIQUE constraint on `(schedule_id, start_time)` + upsert-or-skip
- Trigger: Vercel Cron — daily at 00:00 (reuse existing cron infrastructure)
- Status of auto-generated lessons: `confirmed`

### Rescheduling Flow (applies to BOTH `bookings` and `lessons` tables)

**For `bookings` table (one-off):** Add columns `reschedule_status`, `reschedule_proposed_start`, `reschedule_proposed_end`, `reschedule_requested_by`, `reschedule_round` to existing `bookings` table via migration.

**Flow (same for both tables):**
1. Student OR teacher requests reschedule → proposes a new time from the teacher's available weekly slots
2. Status becomes `reschedule_requested`, proposed times set, requested_by recorded
3. Other party sees request in their dashboard reschedule queue
4. Options for receiving party:
   - **Accept**: original lesson/booking `cancelled`, new lesson/booking created as `confirmed` at proposed time
   - **Reject**: reverts to `confirmed`, all reschedule fields cleared
   - **Counter-propose**: proposes a different available slot; `reschedule_round` increments, `requested_by` flips
5. No credit change in any reschedule path (credits only deducted on completion)

### Dashboard Layout (unified)

**Teacher dashboard — replaces existing booking sections:**
- Pending Schedule Requests (new — approve/decline recurring schedule requests)
- Pending Reschedule Requests (new — accept/reject/counter-propose for both bookings and lessons)
- Upcoming Sessions (combined: upcoming bookings + upcoming lessons)
- Active Recurring Schedules (new — pause/cancel controls)
- Active Students with credit balances (new)

**Student dashboard — replaces existing booking sections:**
- Credit Wallet (balance + transaction history — replaces old "credits" display)
- Upcoming Sessions (combined: upcoming bookings + upcoming lessons with reschedule CTA)
- Active Recurring Schedules (new — pause/cancel controls)

### Schedule Creation Entry Point
- Student initiates from teacher's profile page (availability slots already shown there)
- Select an available weekly slot → confirm → schedule created as `pending`
- Teacher profile page already exists at `/teacher/[teacherId]` (or equivalent)

### Backward Compatibility
- Existing `bookings` table kept — add reschedule columns via migration, no data loss
- Phase 3 booking actions (complete, cancel, confirm) unchanged
- Phase 3 dashboard sections replaced, but underlying booking data remains queryable

### Claude's Discretion
- RLS policies on new tables (follow Phase 3 patterns)
- TypeScript type generation after migrations
- Wave assignment and plan ordering
- UI component reuse (Card, Badge, EmptyState from existing design system)
- i18n key placement (follow existing messages/en.ts / messages/de.ts pattern)
- Email template for schedule request notification (reuse Resend from Phase 3)
- Exact counter-proposal UI (modal vs inline vs separate page)

</decisions>

<specifics>
## Specific Requirements

**Credit wallet display:** Available balance prominently. Transaction history list: type, amount (±), date. No backfill.

**Schedule creation from teacher profile:** Show teacher's weekly availability slots as selectable recurring options. Student picks one slot, confirms. Slot becomes a pending recurring schedule.

**Teacher schedule approval:** Dashboard section "Pending Schedules" shows student name + proposed weekday + time. Approve or Decline buttons. Email sent on schedule creation (not on approval).

**Reschedule UX:** Proposed times must come from teacher's weekly availability slots (not free datetime input). Back-and-forth counter-proposal allowed (reschedule_round tracks depth).

**Dashboard sections:** Old booking-focused sections on both teacher and student dashboards are replaced by the unified recurring+one-off view described above. Historical bookings remain queryable from `/bookings` history pages if needed.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `student_available_credits` RPC: exists, update formula only (drop subscription_credits term)
- `grant_credits` function: exists in migrations, add credit_transactions INSERT alongside it
- `complete_booking` RPC: add credit_transactions INSERT for `completion_deduction` alongside existing used_credits update
- Teacher profile page: existing page where schedule creation CTA will live
- Resend email integration: exists from Phase 3 for schedule approval emails
- Vercel Cron setup: exists in vercel.json from Phase 3

### Established Patterns
- Reschedule fields pattern: already on `lessons` schema — mirror same columns onto `bookings`
- Server Actions: all booking mutations follow `lib/actions/` pattern
- RLS: follow `auth.uid() = student_id OR auth.uid() = teacher_id` pattern from bookings table
- i18n: `messages/en.ts` + `messages/de.ts` with namespace per page

### Integration Points
- `student_credits` table: cleanup migration (drop column, update RPC)
- `bookings` table: alter to add reschedule columns
- Teacher profile page: add "Set up recurring schedule" section
- Both dashboard pages: replace existing booking sections with unified view
- vercel.json cron: add `/api/cron/generate-lessons` route

</code_context>

<deferred>
## Deferred Ideas

- Google Calendar sync
- Automatic Meet link generation
- Subscription billing
- Teacher-initiated reschedule requests (teacher can now request via counter-propose flow; direct initiation deferred)
- Admin view of recurring schedules
- Notification emails for reschedule decisions (email only sent on schedule creation in this phase)

</deferred>

---

*Phase: 04-recurring-lessons*
*Context updated: 2026-06-25*
