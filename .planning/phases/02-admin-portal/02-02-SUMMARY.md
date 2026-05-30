---
phase: 02-admin-portal
plan: "02"
subsystem: admin-infrastructure
tags: [table-component, admin-queries, admin-actions, i18n, navigation]
dependency_graph:
  requires:
    - 02-01 (DB types: level_promotion_requests, payout_requests in types/database.ts)
    - lib/auth/session.ts (requireRole function)
    - lib/supabase/server.ts (createClient)
  provides:
    - components/ui/table.tsx (Table<T> component)
    - lib/queries/admin.ts (getAdminStats, getAdminTeachers, getAdminStudents, getAdminBookings, getAdminPayouts)
    - lib/actions/admin.ts (approveTeacher, approvePromotion, rejectPromotion, markPayoutProcessed, AdminActionState)
    - config/navigation.ts#getAdminNav (6-item admin nav)
    - messages/de.ts#admin (full DE admin namespace)
    - messages/en.ts#admin (full EN admin namespace)
  affects:
    - 02-03, 02-04, 02-05, 02-06 (all admin page plans import from these files)
tech_stack:
  added: []
  patterns:
    - Generic typed Table<T extends { id: string }> component with column render functions
    - Server actions with requireRole("admin") guard and revalidatePath after mutation
    - Chainable Supabase query builder pattern with error-safe [] fallback
    - Jest TDZ-safe mock with makeChainable() pattern for Supabase fluent API
key_files:
  created:
    - components/ui/table.tsx
    - lib/queries/admin.ts
    - lib/actions/admin.ts
  modified:
    - config/navigation.ts (added getAdminNav)
    - messages/de.ts (added admin namespace)
    - messages/en.ts (added admin namespace)
    - __tests__/components/ui/table.test.tsx (added @jest-environment jsdom)
    - __tests__/lib/queries/admin.test.ts (fixed TDZ mock to chainable pattern)
decisions:
  - Table component returns emptyState (or null if none) when rows=[], not an empty table
  - Admin actions call requireRole before validating inputs for defense-in-depth
  - queries/admin.ts uses getAdminStats with Promise.all for parallel count queries
  - jsdom environment required for table.test.tsx — added via @jest-environment docblock
  - queries test fixed with makeChainable() pattern to avoid TDZ hoisting with fluent Supabase mock
metrics:
  duration: ~12min
  completed_date: "2026-05-30"
  tasks_completed: 2
  files_created: 3
  files_modified: 5
---

# Phase 02 Plan 02: Admin Infrastructure Summary

**One-liner:** Generic Table component + all admin query/action functions + getAdminNav + DE/EN admin i18n — Wave 0 RED tests now GREEN.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Table component + admin queries + admin actions (TDD GREEN) | 51b96f5 | components/ui/table.tsx, lib/queries/admin.ts, lib/actions/admin.ts, test fixes |
| 2 | Admin navigation + DE/EN i18n messages | 650384a | config/navigation.ts, messages/de.ts, messages/en.ts |

## Verification Results

- All 3 admin test suites (20 tests): PASS
- Full suite (31 tests): PASS
- `npx tsc --noEmit`: PASS (0 errors)
- All 6 artifact files created/updated with correct exports

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] table.test.tsx missing jsdom environment**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** Jest defaulted to `node` environment; `document is not defined` error when rendering React components
- **Fix:** Added `@jest-environment jsdom` docblock to test file header
- **Files modified:** `__tests__/components/ui/table.test.tsx`
- **Commit:** 51b96f5

**2. [Rule 3 - Blocking] queries/admin.test.ts TDZ hoisting bug in stub**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** Test stub from plan 02-01 used `mocks.eq` directly inside `jest.mock()` factory (not inside an arrow function), causing `ReferenceError: Cannot access 'mocks' before initialization` — same TDZ pattern documented in Plan 01-02 decisions
- **Fix:** Rewrote mock to use `makeChainable()` factory that returns chainable promise-like objects with lazy `mocks.*` references; entire test suite now passes
- **Files modified:** `__tests__/lib/queries/admin.test.ts`
- **Commit:** 51b96f5

## Self-Check: PASSED

Files verified:
- components/ui/table.tsx: EXISTS
- lib/queries/admin.ts: EXISTS
- lib/actions/admin.ts: EXISTS
- config/navigation.ts exports getAdminNav: VERIFIED (line 81)
- messages/de.ts contains admin: VERIFIED (line 385)
- messages/en.ts contains admin: VERIFIED (line 384)
- Commit 51b96f5: EXISTS
- Commit 650384a: EXISTS
