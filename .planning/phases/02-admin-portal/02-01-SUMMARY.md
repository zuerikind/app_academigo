---
phase: 02-admin-portal
plan: "01"
subsystem: database
tags: [typescript, postgres, supabase, jest, tdd]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: types/database.ts base Database type with all Phase 1 tables
provides:
  - level_promotion_requests and payout_requests TypeScript table types in types/database.ts
  - SQL migration creating both admin tables with FK constraints, CHECK constraints, and indexes
  - RED test stubs for admin actions (approveTeacher, approvePromotion, rejectPromotion, markPayoutProcessed)
  - RED test stubs for admin queries (getAdminTeachers, getAdminStudents, getAdminBookings, getAdminPayouts, getAdminStats)
  - RED test stub for Table UI component (render, headers, rows, emptyState)
affects: [02-02, 02-03, 02-04, 02-05, 02-06, 02-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "mocks object pattern in test files (not top-level const) to avoid Jest hoisting temporal dead zone issues"
    - "RED stub pattern: test files import from not-yet-created modules — fail with Cannot find module"

key-files:
  created:
    - supabase/migrations/20260530000001_admin_tables.sql
    - __tests__/lib/actions/admin.test.ts
    - __tests__/lib/queries/admin.test.ts
    - __tests__/components/ui/table.test.tsx
  modified:
    - types/database.ts

key-decisions:
  - "level_promotion_requests and payout_requests use TEXT CHECK constraints (not enums) to match existing schema pattern"
  - "RED test stubs fail with Cannot find module — correct state; --passWithNoTests exit behavior matches jest suite-failure semantics"

patterns-established:
  - "Admin table types follow Row/Insert/Update triple with Partial<Insert> Update pattern"
  - "Test stub files use mocks object pattern (not top-level const) consistent with auth.test.ts"

requirements-completed: [ADMIN-03, ADMIN-04, ADMIN-07, ADMIN-08, ADMIN-02, ADMIN-05, ADMIN-06]

# Metrics
duration: 8min
completed: 2026-05-30
---

# Phase 02 Plan 01: Admin DB Types, SQL Migration, and RED Test Stubs Summary

**TypeScript types for level_promotion_requests and payout_requests appended to Database type, SQL migration with FK/CHECK constraints and indexes, plus three failing test stubs establishing the TDD harness for the entire admin portal phase**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-30T16:52:27Z
- **Completed:** 2026-05-30T17:00:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Extended `types/database.ts` with `level_promotion_requests` and `payout_requests` table Row/Insert/Update types — TypeScript compiles clean
- Created `supabase/migrations/20260530000001_admin_tables.sql` with both CREATE TABLE statements, proper FK to teachers(id), CHECK constraints for status/level enums, and performance indexes
- Scaffolded three RED test stubs covering 16 test cases total — all fail with "Cannot find module" which is the correct Phase 0 TDD state

## Task Commits

Each task was committed atomically:

1. **Task 1: Add missing table types to database.ts + write SQL migration** - `50123f3` (feat)
2. **Task 2: Scaffold RED test stubs for admin actions, queries, and Table component** - `c078125` (test)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `types/database.ts` - Added level_promotion_requests and payout_requests table definitions with Row/Insert/Update types
- `supabase/migrations/20260530000001_admin_tables.sql` - SQL DDL for both admin tables; FK constraints to teachers, CHECK constraints, created_at/status indexes
- `__tests__/lib/actions/admin.test.ts` - RED stubs: approveTeacher (4 tests), approvePromotion (2), rejectPromotion (2), markPayoutProcessed (2)
- `__tests__/lib/queries/admin.test.ts` - RED stubs: getAdminTeachers, getAdminStudents, getAdminBookings, getAdminPayouts, getAdminStats
- `__tests__/components/ui/table.test.tsx` - RED stubs: Table renders headers, row data, emptyState, null on empty without emptyState

## Decisions Made
- Used TEXT CHECK constraints for status/level columns (not Postgres enums) — consistent with existing schema pattern in earlier migrations
- Test stubs use `mocks` object pattern (not top-level `const mocks`) to avoid Jest hoisting temporal dead zone issues — established by Plan 01-02

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Types ready: Plans 02-02 through 02-07 can safely import `Database["public"]["Tables"]["level_promotion_requests"]` and `payout_requests`
- Test harness ready: All three test stubs await GREEN implementations in Plans 02-02 (actions), 02-03 (queries), 02-04 (Table component)
- SQL migration must be applied to Supabase before any admin queries run against the live DB

---
*Phase: 02-admin-portal*
*Completed: 2026-05-30*
