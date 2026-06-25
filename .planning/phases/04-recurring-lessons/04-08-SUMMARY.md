---
phase: 04-recurring-lessons
plan: "08"
subsystem: ui
tags: [student-dashboard, lessons, wallet, reschedule, server-component]

requires:
  - phase: 04-recurring-lessons
    provides: "getWalletBalance, getCreditTransactions (04-03/wallet.ts)"
  - phase: 04-recurring-lessons
    provides: "getStudentSchedules, getStudentUpcomingLessons (04-03/lessons.ts)"
  - phase: 04-recurring-lessons
    provides: "updateScheduleStatus (04-04)"
  - phase: 04-recurring-lessons
    provides: "requestReschedule (04-05)"
  - phase: 04-recurring-lessons
    provides: "i18n keys wallet/lessons/reschedule, nav lessons link (04-07)"

provides:
  - "app/[locale]/student/lessons/page.tsx — full student lesson dashboard (SDASH-01..04)"

affects:
  - "Student navigation — /student/lessons route live"

tech-stack:
  added: []
  patterns:
    - "void wrapper pattern for _prev actions in plain Server Component forms: async (fd) => { await action({}, fd); }"
    - "students table lookup via profile_id before querying student-scoped tables"

key-files:
  created:
    - "app/[locale]/student/lessons/page.tsx"
  modified: []

key-decisions:
  - "Void wrapper pattern for Server Component forms: wrap _prev actions as async (fd) => { await action({}, fd); } — teacher/lessons page uses direct reference without tsc error but student page triggers it, likely due to type inference order; void wrapper is the safe fix"
  - "Student record lookup (students.id from profile_id) required before calling getWalletBalance/getStudentSchedules/getStudentUpcomingLessons — all use students(id) FK not profiles(id)"
  - "Reschedule UX: <details><summary> disclosure toggle for reschedule form — Server Component safe, no client state needed"

patterns-established:
  - "Pattern: Student dashboard pages look up students record before parallel data fetches (same as bookings/page.tsx)"

requirements-completed: [SDASH-01, SDASH-02, SDASH-03, SDASH-04]

duration: 8min
completed: 2026-06-25
---

# Phase 4 Plan 08: Student Lessons Dashboard Summary

**Student lessons dashboard page with credit wallet balance, transaction history, recurring schedule controls, and upcoming lessons with reschedule form — all 4 SDASH requirements fulfilled**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-25T11:00:00Z
- **Completed:** 2026-06-25T11:08:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `app/[locale]/student/lessons/page.tsx` as Server Component following teacher/lessons page pattern
- SDASH-01: Credit wallet balance displayed via StatCard (getWalletBalance)
- SDASH-02: Credit transaction history with i18n type labels (purchase/completion_deduction/cancellation_refund/admin_grant), newest-first, empty state
- SDASH-03: Recurring schedules with Pause/Resume/Cancel form buttons, status badges, teacher name
- SDASH-04: Upcoming lessons with `<details>` reschedule form (two datetime-local inputs + hidden lessonId), pending badge for reschedule_requested status
- TypeScript passes (0 new errors)

## Task Commits

1. **Task 1: Student lessons dashboard page** - `2a3ef47` (feat)

## Files Created/Modified

- `app/[locale]/student/lessons/page.tsx` — 288 lines, all 4 SDASH sections

## Decisions Made

- Void wrapper pattern: `async (fd: FormData) => { await action({}, fd); }` — the `_prev` signature is incompatible with the HTML form `action` type. Teacher/lessons page uses direct reference without error (likely type inference difference), but student/lessons triggered it. Void wrapper is the correct fix.
- Students table lookup required: `credit_wallets`, `recurring_schedules`, and `lessons` all FK to `students(id)`, not `profiles(id)`. Page follows the same pattern as `bookings/page.tsx`.
- Reschedule form uses `<details><summary>` HTML disclosure — pure Server Component, no client JS needed for the toggle.

## Deviations from Plan

**[Rule 1 - Bug] Void wrapper for _prev action signatures**
- **Found during:** Task 1 verification (tsc)
- **Issue:** `updateScheduleStatus` and `requestReschedule` have `(_prev, formData)` signature incompatible with HTML `action` prop type `(formData: FormData) => void | Promise<void>`
- **Fix:** Created void wrapper functions `async (fd: FormData) => { await action({}, fd); }` instead of passing action directly
- **Files modified:** `app/[locale]/student/lessons/page.tsx`
- **Commit:** `2a3ef47`

## Issues Encountered

None beyond the action type fix above.

## User Setup Required

None.

## Next Phase Readiness

- `/student/lessons` route is live — students can view wallet, schedules, and lessons
- All SDASH requirements (SDASH-01..04) are complete
- Phase 4 plan 08 complete — remaining plans: 04-06 (schedule creation UI), 04-09 (cron / final)

---
*Phase: 04-recurring-lessons*
*Completed: 2026-06-25*
