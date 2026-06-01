---
phase: 3
slug: core-transaction
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-01
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 + ts-jest 29.4.11 |
| **Config file** | `jest.config.ts` (exists) |
| **Quick run command** | `npm test -- --testPathPattern="__tests__/lib" --passWithNoTests` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="__tests__/lib" --passWithNoTests`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| W0-slots | 02 | 0 | AVAIL-03 | unit | `npm test -- --testPathPattern="utils/slots"` | ❌ W0 | ⬜ pending |
| W0-availability | 02 | 0 | AVAIL-01/02 | unit | `npm test -- --testPathPattern="actions/availability"` | ❌ W0 | ⬜ pending |
| W0-bookings | 02 | 0 | BOOK-01..09 | unit | `npm test -- --testPathPattern="actions/bookings"` | ❌ W0 | ⬜ pending |
| W0-payments | 02 | 0 | PAY-02/03 | unit | `npm test -- --testPathPattern="actions/payments"` | ❌ W0 | ⬜ pending |
| W0-webhooks | 02 | 0 | PAY-03 | unit | `npm test -- --testPathPattern="api/webhooks"` | ❌ W0 | ⬜ pending |
| W0-reviews | 02 | 0 | REV-01 | unit | `npm test -- --testPathPattern="actions/reviews"` | ❌ W0 | ⬜ pending |
| W0-earnings | 02 | 0 | EARN-03 | unit | `npm test -- --testPathPattern="actions/earnings"` | ❌ W0 | ⬜ pending |
| W0-emails | 02 | 0 | BOOK-04/05/06 | unit | `npm test -- --testPathPattern="lib/email"` | ❌ W0 | ⬜ pending |
| W0-cron | 02 | 0 | BOOK-06 | unit | `npm test -- --testPathPattern="api/cron"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/lib/utils/slots.test.ts` — stubs for AVAIL-03
- [ ] `__tests__/lib/actions/availability.test.ts` — stubs for AVAIL-01/02
- [ ] `__tests__/lib/actions/bookings.test.ts` — stubs for BOOK-01/02/03/04/07/08/09 (incl. getTeacherBookings query stub)
- [ ] `__tests__/lib/actions/payments.test.ts` — stubs for PAY-02
- [ ] `__tests__/api/webhooks/stripe.test.ts` — stubs for PAY-03 idempotency + signature rejection
- [ ] `__tests__/lib/actions/reviews.test.ts` — stubs for REV-01
- [ ] `__tests__/lib/actions/earnings.test.ts` — stubs for EARN-03/04/05 (incl. getPayoutRequests query smoke)
- [ ] `__tests__/lib/email/templates.test.ts` — stubs for email rendering (booking confirm, meet link added, reminders)
- [ ] `__tests__/api/cron/reminders.test.ts` — stubs for cron idempotency (24h/1h sent_at guards)

All use the established `mocks` object pattern + `makeChainable()` factory from existing Phase 1/2 tests.

---

## Nyquist Compliance Note

`checkpoint:human-verify` tasks (plan 03-13, Task 2) are **explicitly exempt** from the automated `<verify>` requirement. These tasks exist precisely because the behavior they verify (browser rendering, interactive flows, Stripe redirect, email delivery) cannot be machine-verified in under 60 seconds. The `<automated>` element in those tasks is marked `MISSING` with an exemption note per the Nyquist rule — this is correct behavior, not a gap.

All other tasks (type="auto") in Phase 3 have `<automated>` verify commands pointing to:
- `npm test -- --testPathPattern=...` for unit-tested functions (Wave 0 stubs + implementation tasks)
- `npx tsc --noEmit` for UI/wiring tasks that cannot be unit-tested independently

No 3 consecutive auto tasks exist without an automated verify command.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Teacher profile shows reviews, avg rating, review count | REV-02/03 | Requires seeded data + browser render | Visit `/[locale]/teachers/[id]` after submitting a review |
| Teacher directory cards show avg rating + review count | REV-04 | Requires seeded data + browser render | Visit `/student/teachers` after submitting a review |
| Student sees "Join Lesson" button with correct Meet URL | BOOK-06 | Requires confirmed booking with meet link + browser | Confirm booking with default_meet_link set; verify student sees active Join button |
| Student sees "Waiting for teacher" when no meet link | BOOK-06 | Requires confirmed booking without meet link | Confirm booking without default_meet_link; verify student sees greyed state |
| ICS export downloads correct calendar file | BOOK (calendar export) | File download + calendar app | Click export on confirmed booking; open .ics |
| Stripe Checkout redirect works end-to-end | PAY-02 | Requires live Stripe test keys | Buy Essentials Single; verify redirect, payment, credit grant |
| Resend email received in inbox | BOOK-04/06 | Email delivery requires live API key | Confirm booking; verify email arrives at student address |
| Cron reminder dispatched and idempotent | BOOK-06 | Requires cron execution + DB inspection | Trigger `/api/cron/reminders` manually; verify reminder_24h_sent_at updated; re-trigger verifies no duplicate send |
| Admin missing meet links page renders correctly | BOOK-06 / EARN-04 area | Requires DB state + browser | Create upcoming booking without meet_link; verify admin page shows it |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are `checkpoint:human-verify` (exempt from automated coverage)
- [x] Sampling continuity: no 3 consecutive auto tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (revised 2026-06-01)
