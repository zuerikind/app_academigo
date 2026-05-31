---
phase: 3
slug: core-transaction
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-31
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
| 3-01-01 | 01 | 0 | AVAIL-03 | unit | `npm test -- --testPathPattern="utils/slots"` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 0 | AVAIL-01/02 | unit | `npm test -- --testPathPattern="actions/availability"` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 0 | BOOK-01/02 | unit | `npm test -- --testPathPattern="actions/bookings"` | ❌ W0 | ⬜ pending |
| 3-01-04 | 01 | 0 | PAY-02/03 | unit | `npm test -- --testPathPattern="actions/payments"` | ❌ W0 | ⬜ pending |
| 3-01-05 | 01 | 0 | PAY-03 | unit | `npm test -- --testPathPattern="api/webhooks"` | ❌ W0 | ⬜ pending |
| 3-01-06 | 01 | 0 | REV-01 | unit | `npm test -- --testPathPattern="actions/reviews"` | ❌ W0 | ⬜ pending |
| 3-01-07 | 01 | 0 | EARN-03 | unit | `npm test -- --testPathPattern="actions/earnings"` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | AVAIL-01/02 | unit | `npm test -- --testPathPattern="actions/availability"` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | AVAIL-03 | unit | `npm test -- --testPathPattern="utils/slots"` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 2 | BOOK-01/02 | unit | `npm test -- --testPathPattern="actions/bookings"` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 2 | BOOK-04/05 | unit | `npm test -- --testPathPattern="actions/bookings"` | ❌ W0 | ⬜ pending |
| 3-03-03 | 03 | 2 | BOOK-07/08/09 | unit | `npm test -- --testPathPattern="actions/bookings"` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 2 | PAY-02 | unit | `npm test -- --testPathPattern="actions/payments"` | ❌ W0 | ⬜ pending |
| 3-04-02 | 04 | 2 | PAY-03 | unit | `npm test -- --testPathPattern="api/webhooks"` | ❌ W0 | ⬜ pending |
| 3-05-01 | 05 | 3 | REV-01 | unit | `npm test -- --testPathPattern="actions/reviews"` | ❌ W0 | ⬜ pending |
| 3-05-02 | 05 | 3 | REV-02/03/04 | manual | Browser: teacher profile shows reviews + rating | — | ⬜ pending |
| 3-06-01 | 06 | 3 | EARN-02/03 | unit | `npm test -- --testPathPattern="actions/earnings"` | ❌ W0 | ⬜ pending |
| 3-06-02 | 06 | 3 | EARN-04/05 | manual | Browser: admin payout page (Phase 2, already built) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/lib/utils/slots.test.ts` — stubs for AVAIL-03 slot generation
- [ ] `__tests__/lib/actions/availability.test.ts` — stubs for AVAIL-01/02
- [ ] `__tests__/lib/actions/bookings.test.ts` — stubs for BOOK-01/02/04/07/08/09
- [ ] `__tests__/lib/actions/payments.test.ts` — stubs for PAY-02
- [ ] `__tests__/api/webhooks/stripe.test.ts` — stubs for PAY-03 idempotency + signature rejection
- [ ] `__tests__/lib/actions/reviews.test.ts` — stubs for REV-01
- [ ] `__tests__/lib/actions/earnings.test.ts` — stubs for EARN-03

All use the established `mocks` object pattern + `makeChainable()` factory from existing Phase 1/2 tests (`__tests__/lib/actions/admin.test.ts`).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Teacher profile shows reviews, avg rating, review count | REV-02/03 | Requires seeded data + browser render | Visit `/[locale]/teachers/[id]` after submitting a review; verify stars, count, comments |
| Student sees confirmed meeting link | BOOK-06 | Requires confirmed booking state + browser | Confirm a booking as teacher; verify student bookings page shows meeting link |
| ICS export downloads correct calendar file | BOOK (calendar export) | File download verification | Click export on confirmed booking; verify `.ics` file opens in calendar app |
| Stripe Checkout redirect works end-to-end | PAY-02 | Requires live Stripe test keys | Click "Buy" on Essentials Single; verify redirect to Stripe, successful payment, credits granted |
| Admin payout mark-as-processed | EARN-04/05 | Already verified in Phase 2 | Admin payouts page — mark one as processed; verify status updates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
