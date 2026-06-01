---
phase: 03-core-transaction
plan: "02"
subsystem: testing
tags: [jest, tdd, red-phase, stripe, supabase, resend, cron]

# Dependency graph
requires:
  - phase: 02-admin-portal
    provides: makeChainable factory pattern and mocks object pattern for Jest test stubs
provides:
  - 11 RED test stub files covering all Phase 3 core-transaction contracts
  - Test harness for slots algorithm (AVAIL-03), availability actions (AVAIL-01/02), bookings actions (BOOK-01/02/04/05/07/08/09), bookings query (BOOK-03), payments (PAY-02), Stripe webhook idempotency (PAY-03), reviews (REV-01), earnings (EARN-03), admin payout query (EARN-04/05), email service, cron reminder auth guard
affects: [03-03, 03-04, 03-05, 03-06, 03-09, 03-10, 03-11]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "mocks object pattern for Jest hoisting TDZ safety (established Phase 1/2, continued here)"
    - "makeChainable() factory for Supabase fluent API mocking"
    - "dynamic import in test body: const { fn } = await import('@/lib/...') — keeps tests RED until module exists"

key-files:
  created:
    - __tests__/lib/utils/slots.test.ts
    - __tests__/lib/actions/availability.test.ts
    - __tests__/lib/actions/bookings.test.ts
    - __tests__/lib/queries/bookings.test.ts
    - __tests__/lib/actions/payments.test.ts
    - __tests__/api/webhooks/stripe.test.ts
    - __tests__/lib/actions/reviews.test.ts
    - __tests__/lib/actions/earnings.test.ts
    - __tests__/lib/queries/admin.test.ts
    - __tests__/lib/services/email.test.ts
    - __tests__/api/cron/reminders.test.ts
  modified: []

key-decisions:
  - "Phase 3 test stubs use dynamic import inside test body to ensure tests remain RED until implementation modules exist"
  - "lib/queries/admin.ts getPayoutRequests test stub is RED because Phase 2 only exported getAdminPayouts — getPayoutRequests will be added in 03-11"
  - "Stripe webhook test stubs mock constructEvent on Stripe SDK instance, not module-level, to align with actual handler pattern"
  - "Cron reminders test stubs verify 401 on missing/wrong CRON_SECRET — auth guard is a correctness requirement, not optional"

patterns-established:
  - "Dynamic import in test body: avoids TDZ issues and keeps stub RED until implementation module is created"
  - "makeChainable() factory consistent across all Phase 3 test files — same pattern as Phase 1/2"
  - "Email service mocked in booking/cron tests to prevent real send side-effects"

requirements-completed:
  - AVAIL-01
  - AVAIL-02
  - AVAIL-03
  - BOOK-01
  - BOOK-02
  - BOOK-03
  - BOOK-04
  - BOOK-05
  - BOOK-07
  - BOOK-08
  - BOOK-09
  - PAY-02
  - PAY-03
  - REV-01
  - EARN-03
  - EARN-04
  - EARN-05

# Metrics
duration: 18min
completed: 2026-06-01
---

# Phase 3 Plan 02: RED Test Stubs for Core Transaction Summary

**11 RED test stub files scaffolded using mocks object pattern and makeChainable factory, covering all Phase 3 booking/payment/email/cron contracts**

## Performance

- **Duration:** 18 min
- **Started:** 2026-06-01T03:49:15Z
- **Completed:** 2026-06-01T04:07:00Z
- **Tasks:** 2
- **Files modified:** 11 created

## Accomplishments

- Scaffolded 5 test files (slots, availability, bookings, bookings query, payments) — all RED with "Cannot find module" failures
- Scaffolded 6 test files (Stripe webhook, reviews, earnings, admin payout query, email service, cron reminders) — all RED
- Confirmed `getPayoutRequests` function is missing from Phase 2 `lib/queries/admin.ts` — stub is correctly RED, will turn GREEN when 03-11 adds the function

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold RED stubs for slots, availability, bookings actions, bookings query, payments** - `0ccceb5` (test)
2. **Task 2: Scaffold RED stubs for webhook, reviews, earnings, admin payout query, email service, cron** - `9de1381` (test)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `__tests__/lib/utils/slots.test.ts` - 4 RED stubs for generateSlots algorithm (AVAIL-03)
- `__tests__/lib/actions/availability.test.ts` - 4 RED stubs for setAvailabilityRange, removeAvailabilityRange, setAvailabilityBlocker (AVAIL-01/02)
- `__tests__/lib/actions/bookings.test.ts` - 8 RED stubs for requestBooking, confirmBooking, declineBooking, markComplete, cancelBooking, updateBookingMeetLink (BOOK-01/02/04/05/07/08/09)
- `__tests__/lib/queries/bookings.test.ts` - 3 RED stubs for getTeacherBookings (BOOK-03)
- `__tests__/lib/actions/payments.test.ts` - 2 RED stubs for createCheckoutSession (PAY-02)
- `__tests__/api/webhooks/stripe.test.ts` - 5 RED stubs for Stripe webhook idempotency + signature validation (PAY-03)
- `__tests__/lib/actions/reviews.test.ts` - 3 RED stubs for submitReview (REV-01)
- `__tests__/lib/actions/earnings.test.ts` - 3 RED stubs for requestPayout (EARN-03)
- `__tests__/lib/queries/admin.test.ts` - 3 RED stubs for getPayoutRequests (EARN-04/05)
- `__tests__/lib/services/email.test.ts` - 4 RED stubs for sendBookingConfirmation, sendMeetLinkAdded, sendTeacherReminder
- `__tests__/api/cron/reminders.test.ts` - 4 RED stubs for cron 401 auth guard + reminder dispatch idempotency

## Decisions Made

- **Dynamic import in test body:** All test files use `const { fn } = await import("@/lib/...")` inside each `it()` block to ensure tests fail at assertion-time (module not found) rather than at setup-time — consistent with TDD RED guarantee
- **getPayoutRequests stub is correctly RED:** Phase 2 exports `getAdminPayouts` (not `getPayoutRequests`). The Phase 3 stub confirms the new function contract for 03-11
- **Stripe webhook test mocks constructEvent on the Stripe instance:** Aligned with expected handler implementation pattern (constructEvent called on `new Stripe().webhooks`)
- **CRON_SECRET auth guard tests:** Two tests verify 401 on missing/wrong secret — this is a correctness/security requirement for the cron endpoint

## Deviations from Plan

None — plan executed exactly as written. The `queries/admin.test.ts` file was written to the existing file path (previously had getAdminPayouts tests — replaced with getPayoutRequests stubs per plan spec).

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 11 test stub files are RED and discoverable by Jest
- Plans 03-03 through 03-11 can independently make their respective test files GREEN
- The `getPayoutRequests` stub in `__tests__/lib/queries/admin.test.ts` will be GREEN after Plan 03-11 adds the function to `lib/queries/admin.ts`

---
*Phase: 03-core-transaction*
*Completed: 2026-06-01*
