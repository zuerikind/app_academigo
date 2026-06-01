---
phase: 03-core-transaction
plan: "05"
subsystem: infra
tags: [resend, react-email, email, transactional-email]

requires:
  - phase: 03-core-transaction
    provides: RED test stubs for lib/services/email.ts (from 03-01)

provides:
  - lib/services/email.ts with sendBookingConfirmation, sendMeetLinkAdded, sendTeacherReminder
  - emails/booking-confirmation.tsx React Email template (student booking confirmed)
  - emails/meet-link-added.tsx React Email template (student meet link notification)
  - emails/teacher-reminder.tsx React Email template (teacher upcoming lesson reminder)
  - Non-blocking email contract: all functions catch errors and never throw

affects:
  - 03-06 (bookings actions call sendBookingConfirmation)
  - 03-07 (teacher bookings page calls sendMeetLinkAdded via updateBookingMeetLink action)
  - 03-10 (cron reminder job calls sendTeacherReminder)

tech-stack:
  added:
    - resend@^6.12.4 (Resend SDK for transactional email sending)
    - "@react-email/components@^1.0.12" (React Email components for templates)
    - react-email@^6.5.0 (dev — local template preview)
  patterns:
    - Email service module pattern: module-level Resend instance, try/catch in each function, never throw
    - React Email template as function call: react: BookingConfirmationEmail(params) not JSX
    - Non-blocking email contract: log error and return void on failure

key-files:
  created:
    - lib/services/email.ts
    - emails/booking-confirmation.tsx
    - emails/meet-link-added.tsx
    - emails/teacher-reminder.tsx
  modified:
    - package.json (added resend, @react-email/components, react-email)

key-decisions:
  - "Email function signatures use `to` (not `studentEmail`/`teacherEmail`) and `meetingLink` (not `meetLink`) and `startTime` as string — matched test stubs from 03-01"
  - "hoursUntil is optional in sendTeacherReminder (test stubs from 03-01 do not pass it)"
  - "Non-blocking contract enforced with try/catch in each function — email errors never surface to callers per RESEARCH.md Pitfall 8"
  - "tsc --noEmit test file mocks variable collisions are pre-existing project-wide pattern (TS2451), not from this plan"

requirements-completed: [BOOK-04, BOOK-05, BOOK-06]

duration: 15min
completed: 2026-06-01
---

# Phase 03 Plan 05: Email Service Summary

**Resend email service with three React Email templates — booking confirmation, meet link added, and teacher reminder — with non-blocking error handling**

## Performance

- **Duration:** 15 min
- **Started:** 2026-06-01T05:00:00Z
- **Completed:** 2026-06-01T05:15:00Z
- **Tasks:** 1
- **Files modified:** 6

## Accomplishments

- Installed resend@^6, @react-email/components@^1, and react-email@^6 (dev)
- Created three React Email templates under emails/ for booking confirmation, meet link notification, and teacher reminder
- Implemented lib/services/email.ts with all three exported async functions matching test signatures
- All 4 email tests GREEN (sendBookingConfirmation, sendMeetLinkAdded, sendTeacherReminder x2)
- Non-blocking contract enforced: all functions wrap resend.emails.send in try/catch, log errors, never throw

## Task Commits

1. **Task 1: Install Resend + React Email + build email service and templates** - `3bc3a83` (feat)

## Files Created/Modified

- `lib/services/email.ts` - Email service module with sendBookingConfirmation, sendMeetLinkAdded, sendTeacherReminder
- `emails/booking-confirmation.tsx` - React Email template for student booking confirmation
- `emails/meet-link-added.tsx` - React Email template for student meet link added notification
- `emails/teacher-reminder.tsx` - React Email template for teacher upcoming lesson reminder (with missing-link warning)
- `package.json` - Added resend, @react-email/components dependencies; react-email devDependency
- `package-lock.json` - Updated lockfile

## Decisions Made

- Email function signatures match the 03-01 RED test stubs exactly: `to` (not `studentEmail`/`teacherEmail`), `meetingLink` (not `meetLink`), `startTime` as string. The PLAN.md specified different signatures but the test stubs are the ground truth.
- `hoursUntil` is optional in `sendTeacherReminder` because the 03-01 test stubs do not include it.
- `sendTeacherReminder` subject when `meetingLink` is null includes "Meet link" and "Action required" — satisfies test regex `/link|meet|action|urgent/i`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Implemented signatures to match existing test stubs instead of PLAN.md specification**
- **Found during:** Task 1 (analyzing test file before implementing)
- **Issue:** PLAN.md specified `studentEmail`/`teacherEmail`, `meetLink`, `startTime: Date`, and required `hoursUntil: 24 | 1` in sendTeacherReminder. The 03-01 test stubs use `to`, `meetingLink`, `startTime: string`, and no `hoursUntil`. Implementing the PLAN.md signatures would make all tests fail.
- **Fix:** Implemented service with test-matching signatures; made `hoursUntil` optional in sendTeacherReminder (type `24 | 1 | undefined`)
- **Files modified:** lib/services/email.ts
- **Verification:** All 4 tests pass GREEN
- **Committed in:** 3bc3a83

---

**Total deviations:** 1 auto-fixed (Rule 1 - existing test stubs are the ground truth)
**Impact on plan:** No scope creep. Service provides same functionality with test-compatible signatures.

## Issues Encountered

- `tsc --noEmit` reports TS2451 `Cannot redeclare block-scoped variable 'mocks'` in test files — this is a pre-existing project-wide pattern (all test files use module-scope `const mocks = {}` without `export {}`, so TypeScript sees them as scripts sharing global scope). Jest isolates files correctly. This pre-dates plan 03-05 and is documented in STATE.md decisions.

## User Setup Required

Before email sending works in production, the user must:
1. Create a Resend account and verify the `academigo.xyz` domain (add DKIM and SPF DNS records in Resend Dashboard → Domains)
2. Create a Resend API key in Resend Dashboard → API Keys
3. Set environment variables:
   - `RESEND_API_KEY=re_xxxx`
   - `RESEND_FROM_EMAIL=Academigo <noreply@academigo.xyz>`

## Next Phase Readiness

- `lib/services/email.ts` is ready to be called from booking actions (03-06) and the cron reminder job (03-10)
- All three functions are exported and tested
- Non-blocking contract is enforced — callers do not need to catch email errors

---
*Phase: 03-core-transaction*
*Completed: 2026-06-01*
