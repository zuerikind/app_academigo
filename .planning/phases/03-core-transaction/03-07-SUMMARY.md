---
phase: 03-core-transaction
plan: "07"
subsystem: teacher-booking-ui
tags: [react, client-component, useActionState, bookings, meet-link, teacher]

# Dependency graph
requires:
  - phase: 03-core-transaction
    provides: 03-06 booking library (confirmBooking, declineBooking, markComplete, cancelBooking, updateBookingMeetLink, getTeacherBookings)
  - phase: 03-core-transaction
    provides: 03-03 teacher settings (default_meet_link)
  - phase: 03-core-transaction
    provides: 03-01 schema (bookings table, create_booking / cancel_booking / complete_booking RPCs)
provides:
  - TeacherBookingCard Client Component with all inline forms
  - Teacher bookings page (app/[locale]/teacher/bookings/page.tsx) with Requests/Upcoming/Past sections
  - cancelBookingAsTeacher Server Action (teacher-role-gated cancel)
affects: [teacher-dashboard, student-booking-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TeacherBookingCard uses sub-component pattern (PendingCard, ConfirmedCard, CompletedCard, CancelledCard) for clean status dispatch
    - Each form uses useActionState + useFormStatus via shared SubmitButton component
    - cancelBookingAsTeacher added alongside existing cancelBooking (student-scoped) to handle teacher cancellations with requireRole("teacher")
    - page.tsx casts teacher.default_meet_link with explicit type annotation to satisfy tsc

key-files:
  created:
    - components/teacher/booking-card.tsx
  modified:
    - app/[locale]/teacher/bookings/page.tsx
    - lib/actions/bookings.ts

key-decisions:
  - "cancelBookingAsTeacher added as separate action rather than modifying cancelBooking — preserves student-scoped action contract used in student booking flow (03-08)"
  - "TeacherBookingCard split into four sub-components by status — keeps each section independently readable and avoids large conditional trees"
  - "Confirmed bookings check new Date(booking.start_time) < new Date() inline in the client component for Mark Complete visibility"

# Metrics
duration: ~20min
completed: 2026-06-01
---

# Phase 03 Plan 07: Teacher Bookings Page Summary

**Teacher bookings page and interactive booking card component — full inline action forms for confirm/decline/mark-complete/cancel + Meet Link Status indicator with inline add/update**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-06-01T15:15:00Z
- **Completed:** 2026-06-01T15:35:00Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- `components/teacher/booking-card.tsx`: Client Component rendering pending/confirmed/completed/cancelled booking states with all 5 Server Actions wired via useActionState
- PendingCard: confirm form with meet link input (pre-filled with default_meet_link or empty), no-default-link warning banner with AlertCircle icon, decline form
- ConfirmedCard: Meet Link Status indicator (CheckCircle + green Badge "Meet Link Added" or AlertCircle + orange Badge "Meet Link Missing"), inline add/update form, Mark Complete button (only when past start_time), Cancel button, .ics download link
- CompletedCard: read-only display with "Completed" green Badge
- CancelledCard: read-only display with "Cancelled" muted Badge
- `app/[locale]/teacher/bookings/page.tsx`: Server Component replacing stub — fetches teacher record and all bookings, splits into Requests/Upcoming/Past Sessions sections with EmptyState for each empty section
- `lib/actions/bookings.ts`: Added `cancelBookingAsTeacher` (teacher-role-gated) to complement existing student-scoped `cancelBooking`

## Task Commits

1. **Task 1: TeacherBookingCard + cancelBookingAsTeacher** - `29268f6` (feat)
2. **Task 2: Teacher bookings page replacement** - `57f7b9b` (feat)

## Files Created/Modified

- `components/teacher/booking-card.tsx` — TeacherBookingCard Client Component, 285 lines, all 5 actions wired
- `app/[locale]/teacher/bookings/page.tsx` — Server Component with 3-section booking queue, 122 lines
- `lib/actions/bookings.ts` — cancelBookingAsTeacher added (teacher-role-gated cancel RPC wrapper)

## Decisions Made

- Added `cancelBookingAsTeacher` as separate action: existing `cancelBooking` is student-scoped for 03-08 student bookings page — introducing a shared action or role-switching logic would risk breaking existing tests and student flow
- Sub-component pattern for TeacherBookingCard (PendingCard / ConfirmedCard / CompletedCard / CancelledCard): each sub-component owns its own useActionState hooks — cleaner than conditional rendering inside a monolithic component
- Mark Complete only visible when `startDate < new Date()` (session in the past) — evaluated in the client component as the plan specifies

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] cancelBooking was student-scoped, teacher card cannot use it**
- **Found during:** Task 1 — building TeacherBookingCard
- **Issue:** `cancelBooking` action calls `requireRole("student")` — a teacher calling it would be redirected, not served
- **Fix:** Added `cancelBookingAsTeacher` to `lib/actions/bookings.ts` with `requireRole("teacher")`
- **Files modified:** lib/actions/bookings.ts
- **Commit:** 29268f6

**2. [Rule 3 - Blocking] Icon name "check-circle" not in IconName type**
- **Found during:** Task 2 — tsc check on teacher bookings page
- **Issue:** EmptyState `icon` prop requires `IconName` union; `"check-circle"` is not a member; correct name is `"checkCircle"`
- **Fix:** Changed to `"checkCircle"` before commit
- **Files modified:** app/[locale]/teacher/bookings/page.tsx
- **Commit:** 57f7b9b

---

**Total deviations:** 2 auto-fixed
**Impact on plan:** Both fixes required for correct operation; no plan scope change

## Self-Check

- [x] `components/teacher/booking-card.tsx` exists (285 lines, > 100 min_lines)
- [x] `app/[locale]/teacher/bookings/page.tsx` exists (122 lines, > 80 min_lines)
- [x] `lib/actions/bookings.ts` modified (cancelBookingAsTeacher added)
- [x] `npx tsc --noEmit` — no errors in new files
- [x] `TeacherBookingCard` used in teacher bookings page (3 call sites)
- [x] `updateBookingMeetLink` and `confirmBooking` present in booking-card.tsx
- [x] `meeting_link` used in booking-card.tsx Meet Link Status indicator

## Self-Check: PASSED
