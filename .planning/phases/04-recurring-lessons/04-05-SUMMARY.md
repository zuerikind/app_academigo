---
phase: 04-recurring-lessons
plan: "05"
subsystem: api
tags: [lessons, reschedule, server-actions, supabase-rpc]

requires:
  - phase: 04-recurring-lessons
    provides: complete_lesson / approve_reschedule / reject_reschedule RPCs (04-01 migration)

provides:
  - completeLesson server action (teacher-only; calls complete_lesson RPC)
  - cancelLesson server action (any auth role; direct UPDATE; zero credit change CRED-03)
  - requestReschedule server action (student-only; Pitfall 3 guard for re-request)
  - approveReschedule server action (teacher-only; calls approve_reschedule RPC; no credit touch RESC-03)
  - rejectReschedule server action (teacher-only; calls reject_reschedule RPC)

affects:
  - 04-recurring-lessons (teacher dashboard, student dashboard — both consume these actions)

tech-stack:
  added: []
  patterns:
    - "requireRole() for role-scoped actions; requireProfile() for any-authenticated-role actions"
    - "Direct Supabase UPDATE for status-only changes; RPC for atomic credit-safe ops"

key-files:
  created:
    - lib/actions/lessons.ts
    - lib/actions/reschedule.ts
  modified: []

key-decisions:
  - "cancelLesson uses requireProfile() not requireRole() — both students and teachers can cancel; no role restriction needed"
  - "requestReschedule checks .in('status', ['confirmed','reschedule_requested']) before updating — Pitfall 3 guard for re-request"
  - "cancelLesson uses direct UPDATE (no RPC) because no credit change is needed on cancel (CRED-03)"

patterns-established:
  - "Lesson lifecycle actions mirror booking actions pattern from lib/actions/bookings.ts"
  - "Reschedule flow: request (student) -> approve/reject (teacher) via RPCs, zero credit touch throughout"

requirements-completed: [CRED-03, LES-03, RESC-01, RESC-02, RESC-03]

duration: 8min
completed: 2026-06-25
---

# Phase 04 Plan 05: Lesson Lifecycle Actions Summary

**completeLesson/cancelLesson and full reschedule workflow (request/approve/reject) as Server Actions with RPC-backed credit safety**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-25T10:50:00Z
- **Completed:** 2026-06-25T10:58:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `lib/actions/lessons.ts`: completeLesson (teacher-only RPC) and cancelLesson (any auth; direct UPDATE; CRED-03 zero credit change)
- `lib/actions/reschedule.ts`: requestReschedule with Pitfall 3 re-request guard, approveReschedule and rejectReschedule via RPCs with no credit_wallets touch (RESC-03)
- `reschedule.test.ts` GREEN (5/5 tests pass)

## Task Commits

1. **Task 1: completeLesson and cancelLesson** - `86f383c` (feat)
2. **Task 2: requestReschedule, approveReschedule, rejectReschedule** - `98c8e39` (feat)

## Files Created/Modified
- `lib/actions/lessons.ts` - completeLesson (RPC) + cancelLesson (direct UPDATE, no credits)
- `lib/actions/reschedule.ts` - requestReschedule (Pitfall 3 guard) + approveReschedule (RPC) + rejectReschedule (RPC)

## Decisions Made
- `cancelLesson` uses `requireProfile()` instead of `requireRole()` — both students and teachers can cancel lessons; restricting to one role would block the other. No credit-safety concern since the action only updates status.
- `requestReschedule` filters `.in("status", ["confirmed", "reschedule_requested"])` — RESC-01 Pitfall 3: student must be able to update a pending reschedule proposal without getting blocked.
- Direct Supabase UPDATE for cancelLesson and requestReschedule (no RPC needed — neither touches credits).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 lesson lifecycle Server Actions ready for consumption by teacher/student dashboards (Plan 04-06, 04-07)
- RPCs complete_lesson, approve_reschedule, reject_reschedule are now wired; UI can bind forms to these actions

---
*Phase: 04-recurring-lessons*
*Completed: 2026-06-25*

## Self-Check: PASSED
- FOUND: lib/actions/lessons.ts
- FOUND: lib/actions/reschedule.ts
- FOUND commit: 86f383c (completeLesson and cancelLesson)
- FOUND commit: 98c8e39 (requestReschedule, approveReschedule, rejectReschedule)
- reschedule.test.ts: 5/5 GREEN
- credit_wallets: absent from both files
- complete_lesson RPC: present in lessons.ts
