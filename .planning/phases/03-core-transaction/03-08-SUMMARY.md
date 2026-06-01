---
phase: 03-core-transaction
plan: "08"
subsystem: student-booking-ui
tags: [supabase, server-actions, availability, booking, reviews, teacher-profile, student-ui]

# Dependency graph
requires:
  - phase: 03-core-transaction
    provides: 03-03 availability management (getAvailableDaysForMonth, getAvailableSlotsForDay, server action wrappers)
  - phase: 03-core-transaction
    provides: 03-06 booking library (requestBooking, getTeacherReviews, getReviewAggregate)
provides:
  - BookingCalendar client component (monthly grid, prev/next navigation, available days highlighted)
  - SlotPicker client component (HH:MM slot list for selected day, emits ISO datetime pair)
  - BookingRequestForm client component (wired to requestBooking via useActionState, success/error state)
  - BookingSection client wrapper (manages day/slot/form cascade state)
  - app/[locale]/student/teachers/[id]/page.tsx extended with reviews section + BookingSection for authenticated students
  - lib/queries/teachers.ts: getApprovedTeachers extended with avg_rating + review_count aggregate columns
  - lib/types/index.ts: TeacherListItem extended with avg_rating and review_count fields
  - components/teachers/teacher-card.tsx: displays star rating and review count (REV-04)
affects: [student-booking-flow, teacher-directory, teacher-profile]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - BookingSection: client wrapper composing Calendar → SlotPicker → BookingRequestForm cascade
    - getAvailableDaysAction / getAvailableSlotsAction: server action wrappers for client-side month navigation and slot fetching
    - TeacherListItem avg_rating computed post-fetch via reviews SELECT + JavaScript reduce (avoids Supabase aggregate query limitations)
    - Teacher profile page: conditional BookingSection render — shown only to authenticated users (getSessionUser check)

key-files:
  created:
    - components/student/booking-calendar.tsx
    - components/student/slot-picker.tsx
    - components/student/booking-request-form.tsx
    - components/student/booking-section.tsx
  modified:
    - app/[locale]/student/teachers/[id]/page.tsx
    - lib/queries/teachers.ts
    - lib/types/index.ts
    - components/teachers/teacher-card.tsx

key-decisions:
  - "BookingCalendar, SlotPicker, BookingRequestForm, BookingSection were pre-created by the 03-07 session — this plan verified their correctness and completed Task 2 (profile page + rating updates)"
  - "getAvailableDaysForMonth uses 1-indexed months; BookingCalendar stores 0-indexed months and converts to 1-indexed when calling the server action"
  - "Teacher profile page shows BookingSection only to authenticated users (getSessionUser check); unauthenticated visitors see the sign-up CTA"
  - "avg_rating computed in JavaScript post-fetch (not SQL aggregate) for compatibility with Supabase type system and ServiceClient pattern"
  - "TeacherListItem type updated to include avg_rating and review_count — affects all consumers of getApprovedTeachers and getTeacherById"

# Metrics
duration: ~20min
completed: 2026-06-01
---

# Phase 03 Plan 08: Student Booking UI + Teacher Reviews Summary

**Monthly availability calendar + slot picker + booking request form wired to teacher profile, plus REV-02/03/04 reviews on profile and rating on teacher cards**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-06-01T15:30:00Z
- **Completed:** 2026-06-01T15:50:00Z
- **Tasks:** 2
- **Files modified:** 4 created, 4 modified

## Accomplishments

- BookingCalendar client component: 7-column month grid with Mon-first layout, available days highlighted (bg-brand-tint), selected day highlighted (bg-brand), prev/next navigation calls getAvailableDaysAction server action
- SlotPicker client component: fetches HH:MM slots via getAvailableSlotsAction on day selection, renders as button grid, converts to ISO datetime pair (startISO, endISO) for booking form
- BookingRequestForm client component: wired to requestBooking via useActionState, shows human-readable slot date/time, topic note textarea, success/error display
- BookingSection client wrapper: manages selectedDay, selectedSlotStart, selectedSlotEnd state; composes Calendar → SlotPicker → BookingRequestForm in cascade
- Teacher profile page extended: REV-02 individual reviews with star ratings (lucide Star icons), REV-03 average rating + count above review list, BookingSection for authenticated students, sign-up CTA for unauthenticated visitors
- lib/queries/teachers.ts getApprovedTeachers: fetches review aggregates in a supplementary Supabase query, merges avg_rating (1 decimal place) and review_count per teacher
- TeacherListItem type extended with avg_rating and review_count fields
- TeacherCard: shows star rating and review count when avg_rating is set, "New on the platform" for null

## Task Commits

1. **Task 1: BookingCalendar + SlotPicker + BookingRequestForm + BookingSection + availability server action wrappers** — pre-created by 03-07 session; committed as part of commit `57f7b9b` (feat(03-07))
2. **Task 2: Teacher profile page reviews + booking section, teacher directory rating update** - `241f5f6` (feat)

## Files Created/Modified

- `components/student/booking-calendar.tsx` — monthly grid Client Component with available day highlighting and month navigation
- `components/student/slot-picker.tsx` — slot list Client Component; converts HH:MM slots to ISO datetime pairs
- `components/student/booking-request-form.tsx` — booking form Client Component with useActionState(requestBooking)
- `components/student/booking-section.tsx` — cascade wrapper Client Component
- `app/[locale]/student/teachers/[id]/page.tsx` — extended with REV-02/03 reviews section and BookingSection for authenticated students
- `lib/queries/teachers.ts` — getApprovedTeachers extended with review aggregate lookup; avg_rating and review_count added to return values
- `lib/types/index.ts` — TeacherListItem extended with avg_rating: number | null and review_count: number
- `components/teachers/teacher-card.tsx` — displays ★ rating and review count; falls back to "New on the platform" when no reviews

## Decisions Made

- BookingCalendar, SlotPicker, BookingRequestForm, BookingSection were already created by the 03-07 session — verified their correctness and completed only Task 2
- getAvailableDaysForMonth uses 1-indexed months; the calendar component stores 0-indexed months and converts (+1) when calling the server action
- Teacher profile page shows BookingSection only to authenticated users via getSessionUser() check; unauthenticated visitors receive the existing sign-up CTA
- avg_rating computed in JavaScript post-fetch rather than SQL aggregate — compatible with Supabase's TypeScript type system and the createServiceClient pattern
- TeacherListItem type updated globally to include avg_rating and review_count; getTeacherById and getTeacherProfileDetail return null/0 defaults via updated mapTeacher signature

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Task 1 components already existed from 03-07 session**
- **Found during:** Task 1 start
- **Issue:** Prior session (03-07) created all four booking components and server action wrappers as part of the teacher bookings page work
- **Fix:** Verified components are functionally correct (identical content); proceeded directly to Task 2
- **Impact:** No rework needed; all Task 1 artifacts exist and are committed

**2. [Rule 1 - Deviation] getApprovedTeachers in teachers.ts, not admin.ts**
- **Found during:** Task 2 planning
- **Issue:** Plan specified updating lib/queries/admin.ts with avg_rating, but getApprovedTeachers actually lives in lib/queries/teachers.ts
- **Fix:** Updated lib/queries/teachers.ts (correct file) with the review aggregate logic
- **Impact:** Plan verification command `grep -n "avg_rating" lib/queries/admin.ts` would fail; real implementation is correct in teachers.ts

---

**Total deviations:** 2 (both non-blocking — Task 1 pre-completed, wrong filename in plan spec)

## Issues Encountered

- None blocking. Pre-existing TypeScript errors in test files are unrelated to this plan.

## User Setup Required

None — no new dependencies, no new environment variables.

## Next Phase Readiness

- AVAIL-03, BOOK-01, BOOK-02, REV-02, REV-03, REV-04 requirements satisfied
- Student-facing booking flow fully connected: calendar → slot picker → booking form → requestBooking RPC
- Teacher directory shows ratings; teacher profile shows individual reviews with stars

---
*Phase: 03-core-transaction*
*Completed: 2026-06-01*
