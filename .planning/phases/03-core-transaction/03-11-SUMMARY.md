---
phase: 03-core-transaction
plan: "11"
subsystem: ui
tags: [supabase, react, server-actions, earnings, payouts, navigation, i18n]

# Dependency graph
requires:
  - phase: 03-core-transaction
    provides: 03-06 earnings queries (getTeacherEarnings, getTeacherPendingBalance) and requestPayout action
  - phase: 02-admin-portal
    provides: Phase 2 admin payout queue (getAdminPayouts reads from payout_requests)
provides:
  - Teacher earnings page at /teacher/earnings (Server Component + RequestPayoutForm Client Component)
  - getTeacherNav updated with earnings nav item (coins icon)
  - getPayoutRequests in lib/queries/admin.ts (EARN-04/05 column alignment confirmed)
affects: [teacher-dashboard, teacher-nav, admin-payouts]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Teacher earnings page uses parallel Promise.all for getTeacherEarnings + getTeacherPendingBalance
    - Payout request state handled server-side (pendingPayout query) — no optimistic UI needed
    - RequestPayoutForm is a minimal Client Component wrapping useActionState with requestPayout
    - getPayoutRequests in admin.ts is separate from getAdminPayouts — both query payout_requests but different column sets

key-files:
  created:
    - app/[locale]/teacher/earnings/page.tsx
    - components/teacher/request-payout-form.tsx
  modified:
    - config/navigation.ts
    - lib/queries/admin.ts

key-decisions:
  - "StatCard requires icon prop (not optional) — used 'coins' icon for pending balance card"
  - "Table component uses render function per column, not label key — plan pseudocode adjusted to match actual component API"
  - "getPayoutRequests added as separate export from getAdminPayouts — same table, different column selection (teacher_id included)"
  - "EmptyState icon uses 'coins' (matching earnings theme) — EmptyState requires icon prop of type IconName"

patterns-established:
  - "Pattern: Teacher page with payout guard checks pendingPayout server-side before rendering RequestPayoutForm"
  - "Pattern: RequestPayoutForm renders success state inline after useActionState resolves successfully"

requirements-completed: [EARN-02, EARN-03, EARN-04, EARN-05]

# Metrics
duration: ~8min
completed: 2026-06-01
---

# Phase 03 Plan 11: Teacher Earnings Page Summary

**Teacher earnings page with pending balance StatCard, payout request form (useActionState), history table, and getPayoutRequests confirmed to read payout_requests rows inserted by requestPayout**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-01T14:17:40Z
- **Completed:** 2026-06-01T14:25:00Z
- **Tasks:** 1
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- Teacher earnings page (Server Component) at `/teacher/earnings` — shows pending balance as StatCard, earnings history as Table with date/student/amount columns, EmptyState when no earnings
- RequestPayoutForm Client Component — uses useActionState with requestPayout action, inline success state, payout amount displayed from pendingBalance prop
- Three payout states: already-pending (disabled button + date), zero balance (disabled button), balance available (RequestPayoutForm)
- config/navigation.ts getTeacherNav now includes earnings entry (label: dict.nav.teacher.earnings, icon: coins)
- lib/queries/admin.ts getPayoutRequests added with EARN-04/05 comment — selects teacher_id, amount_chf, status, created_at from payout_requests with teachers/profiles join

## Task Commits

1. **Task 1: Teacher earnings page + nav update + EARN-04/05 smoke check** - `a86abea` (feat)

## Files Created/Modified

- `app/[locale]/teacher/earnings/page.tsx` — Server Component: auth guard, getTeacherRecord, parallel earnings/balance fetch, payout state logic, DashboardLayout with StatCard + RequestPayoutForm + Table
- `components/teacher/request-payout-form.tsx` — Client Component with useActionState wrapping requestPayout, inline success/error states
- `config/navigation.ts` — getTeacherNav extended with earnings nav item (coins icon)
- `lib/queries/admin.ts` — getPayoutRequests added (EARN-04/05 confirmed comment + function querying payout_requests with teacher_id, amount_chf, status columns)

## Decisions Made

- StatCard requires `icon` prop (not optional) — used "coins" which is already in IconName and registry
- Table component uses `render` function per column (not `label` as plan pseudocode suggested) — adjusted to match actual component API
- getPayoutRequests added as separate named export alongside getAdminPayouts — same underlying payout_requests table but different column set (includes teacher_id for EARN-04/05 alignment verification)
- EmptyState requires `icon: IconName` — used "coins" to match earnings theme; no "noEarningsHint" key in i18n, reused noEarnings for description

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] EmptyState missing noEarningsHint i18n key**
- **Found during:** Task 1 (creating earnings page)
- **Issue:** Plan specified `dict.earnings.noEarningsHint` but that key doesn't exist in en.ts/de.ts earnings namespace
- **Fix:** Used `t.noEarnings` for both title and description (existing key, semantically correct)
- **Files modified:** app/[locale]/teacher/earnings/page.tsx
- **Committed in:** a86abea

**2. [Rule 2 - Missing Critical] RequestPayoutForm extracted as separate Client Component**
- **Found during:** Task 1 — Server Component page cannot use useActionState directly
- **Issue:** Plan's action block implied the form inline in the page — Server Components can't use React hooks
- **Fix:** Created components/teacher/request-payout-form.tsx as a "use client" component
- **Files modified:** components/teacher/request-payout-form.tsx (created), app/[locale]/teacher/earnings/page.tsx (imports it)
- **Committed in:** a86abea

---

**Total deviations:** 2 auto-fixed (1 missing i18n key, 1 Client Component extraction)
**Impact on plan:** Both fixes are correctness requirements. No scope creep.

## Issues Encountered

- Pre-existing TypeScript errors in test files (__tests__/lib/queries/admin.test.ts etc.) — these are not regressions from this plan, confirmed by checking no errors in modified files
- teacher/bookings/page.tsx has pre-existing TS error ("check-circle" icon name) — out of scope, not caused by this plan

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- EARN-02 through EARN-05 satisfied — teacher can view earnings, request payouts, and admin can read payout requests
- Teacher nav now includes earnings link — visible in sidebar immediately
- Plans 03-07 through 03-13 can use getPayoutRequests from lib/queries/admin.ts

---
*Phase: 03-core-transaction*
*Completed: 2026-06-01*
