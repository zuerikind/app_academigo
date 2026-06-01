---
phase: 03-core-transaction
plan: "04"
subsystem: payments
tags: [stripe, stripe-checkout, webhook, idempotency, credits, server-actions, route-handler]

# Dependency graph
requires:
  - phase: 03-01
    provides: credit_packages table schema, student_credits table, grant_credits RPC, grant_subscription_credits RPC, payments table with stripe_session_id UNIQUE constraint
provides:
  - createCheckoutSession Server Action (lib/actions/payments.ts) — Stripe Checkout redirect flow
  - POST /api/webhooks/stripe Route Handler — idempotent credit grant via Stripe events
  - Student packages page with credit balance, buy buttons, success/cancelled banners
affects:
  - 03-06 (booking flow needs student to have credits)
  - 03-11 (payout flow)

# Tech tracking
tech-stack:
  added:
    - stripe@17.7.0 — Stripe Node SDK for Checkout sessions and webhook signature verification
  patterns:
    - Stripe Checkout redirect flow — Server Action creates session, calls redirect(session.url)
    - Webhook raw body reading — const body = await request.text() as first line before constructEvent
    - Idempotency via payments table UNIQUE(stripe_session_id) — check before grant, insert after
    - checkout.session.completed for one-off → grant_credits RPC
    - invoice.paid for subscription renewals → grant_subscription_credits RPC (resets, not accumulates)

key-files:
  created: []
  modified:
    - lib/actions/payments.ts — createCheckoutSession Server Action (already existed from prior session)
    - app/api/webhooks/stripe/route.ts — POST webhook handler (already existed from prior session)
    - app/[locale]/student/packages/page.tsx — credit balance + buy buttons + banners (already existed)
    - config/pricing.ts — lessonDurationMinutes + CREDIT_COST_PER_SESSION constants (already existed)
    - next.config.ts — serverExternalPackages: ["stripe"] (already existed)
    - __tests__/lib/actions/payments.test.ts — added locale mock to fix cookies() in test env

key-decisions:
  - "Plan 03-04: All core implementation (payments.ts, webhook route.ts, packages page) was already committed in the prior session — this execution verified and fixed the test suite"
  - "Plan 03-04: payments.test.ts needed mocks for @/lib/actions/locale and @/lib/i18n/server to prevent cookies() outside request scope error in Jest environment"
  - "Plan 03-04: Stripe constructor uses sk_placeholder fallback for missing env var so module loads in test env without throwing"
  - "Plan 03-04: invoice.paid handler stores invoice.id as stripe_session_id in payments table for idempotency — consistent column reuse rather than separate field"

patterns-established:
  - "Pattern: Mock Next.js request-scope APIs (cookies, headers) in test files when testing Server Actions that call locale utilities"
  - "Pattern: Stripe webhook handler always starts with request.text() — never request.json()"

requirements-completed: [PAY-01, PAY-02, PAY-03, PAY-04, PAY-05]

# Metrics
duration: 8min
completed: 2026-06-01
---

# Phase 03 Plan 04: Stripe Checkout + Webhook Summary

**Stripe Checkout Server Action + idempotent webhook handler granting credits via grant_credits / grant_subscription_credits RPCs, wired to the student packages page with credit balance display**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-01T13:50:00Z
- **Completed:** 2026-06-01T13:58:00Z
- **Tasks:** 2 (verified + fixed)
- **Files modified:** 1 (test fix)

## Accomplishments

- Verified all plan deliverables were already implemented in a prior session: `lib/actions/payments.ts`, `app/api/webhooks/stripe/route.ts`, `app/[locale]/student/packages/page.tsx`, `config/pricing.ts`, `next.config.ts`
- Fixed `__tests__/lib/actions/payments.test.ts` — added mocks for locale utilities to prevent `cookies()` outside request scope error in Jest
- All 7 PAY tests GREEN: 2 payments action tests + 5 webhook tests
- TypeScript clean (0 errors in source files)
- stripe@17.7.0 installed and resolves correctly

## Task Commits

1. **Task 1: Install Stripe SDK + createCheckoutSession + webhook handler** - `b187eb0` (fix — test locale mock)

_Note: Core implementation files were already committed in prior session. Task 1 commit covers the test fix needed to make tests GREEN._

## Files Created/Modified

- `lib/actions/payments.ts` — createCheckoutSession Server Action with requireRole("student"), package lookup, Stripe session creation, redirect
- `app/api/webhooks/stripe/route.ts` — POST handler: raw body read, constructEvent, idempotency check, grant_credits / grant_subscription_credits RPC dispatch
- `app/[locale]/student/packages/page.tsx` — credit balance StatCard, success/cancelled banners, BuyPricingGrid wired to createCheckoutSession
- `config/pricing.ts` — lessonDurationMinutes = 50, CREDIT_COST_PER_SESSION = 1 constants
- `next.config.ts` — serverExternalPackages: ["stripe"]
- `__tests__/lib/actions/payments.test.ts` — added locale mocks (this session's change)

## Decisions Made

- payments.test.ts requires mocking `@/lib/actions/locale` and `@/lib/i18n/server` to prevent `cookies()` being called outside a Next.js request scope in the Jest test environment. The implementation correctly uses these utilities; tests must mock them.
- Stripe constructor uses `process.env.STRIPE_SECRET_KEY ?? "sk_placeholder"` — allows the module to load in test environment without throwing on missing env var.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed missing locale mock in payments test causing cookies() error**
- **Found during:** Task 1 verification (running tests)
- **Issue:** `createCheckoutSession` calls `getActionLocale` which calls `getLocaleFromCookie` which calls `cookies()` — Next.js throws "cookies was called outside a request scope" in Jest env
- **Fix:** Added `jest.mock("@/lib/actions/locale", ...)` and `jest.mock("@/lib/i18n/server", ...)` to the test file
- **Files modified:** `__tests__/lib/actions/payments.test.ts`
- **Verification:** Both payments tests GREEN after fix
- **Committed in:** b187eb0 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - test bug)
**Impact on plan:** Fix necessary for test correctness. No scope creep. Implementation unchanged.

## Issues Encountered

- All plan deliverables (payments.ts, webhook route, packages page) were already committed in a prior session. Execution focused on verification and fixing the test suite to be GREEN.

## User Setup Required

**External services require manual configuration before PAY-02/PAY-03 work end-to-end:**

1. **Stripe API Keys** — Set `STRIPE_SECRET_KEY` in environment (.env.local for dev, Vercel for prod)
   - Source: Stripe Dashboard > Developers > API keys > Secret key

2. **Stripe Webhook Secret** — Set `STRIPE_WEBHOOK_SECRET` in environment
   - Source: Stripe Dashboard > Developers > Webhooks > create endpoint for `/api/webhooks/stripe` > signing secret

3. **Stripe Price IDs** — Create 5 products in Stripe Dashboard matching:
   - Essentials Single: CHF 79 (1 credit)
   - Essentials 5-pack: CHF 375 (5 credits)
   - Essentials 10-pack: CHF 690 (10 credits)
   - Plus: CHF 299/month (4 credits/renewal, subscription)
   - Excellence: CHF 549/month (8 credits/renewal, subscription)
   - Then update `credit_packages` table rows with the `price_xxxx` IDs

## Next Phase Readiness

- PAY-01 through PAY-05 implemented — student credit purchase flow complete
- Webhook idempotency via payments.stripe_session_id UNIQUE constraint
- Student packages page shows credit balance and buy buttons
- Next: 03-06 booking flow (students need credits before they can book sessions)

---
*Phase: 03-core-transaction*
*Completed: 2026-06-01*
