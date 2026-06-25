---
phase: 04-recurring-lessons
plan: "01"
subsystem: database
tags: [supabase, postgres, sql, migrations, typescript]

# Dependency graph
requires:
  - phase: 03-core-transaction
    provides: "students, teachers, bookings tables; auth helper RPCs; student_credits table"
provides:
  - "credit_wallets table with available_balance per student"
  - "credit_transactions audit log table"
  - "recurring_schedules table (student-teacher weekday+time slots)"
  - "lessons table with nullable schedule_id FK"
  - "complete_lesson RPC (atomic credit deduction + transaction log)"
  - "approve_reschedule RPC (atomic cancel + new confirmed lesson)"
  - "reject_reschedule RPC (revert to confirmed, clear reschedule fields)"
  - "student_available_credits RPCs updated to read from credit_wallets"
  - "TypeScript types for all 4 new tables and 3 new RPCs"
affects:
  - 04-02
  - 04-03
  - 04-04
  - 04-05

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "UNIQUE partial index WHERE schedule_id IS NOT NULL for idempotent cron lesson generation"
    - "credit_wallets as parallel table to student_credits (Phase 3 flows untouched)"
    - "SECURITY DEFINER + FOR UPDATE row lock pattern for all credit-touching RPCs"

key-files:
  created:
    - "supabase/migrations/20260603000001_phase4_schema.sql"
    - "lib/types/database.types.ts"
  modified: []

key-decisions:
  - "Wallet seed uses total_credits - used_credits (NOT subtracting reserved) per RESEARCH.md Pitfall 4"
  - "credit_wallets is a parallel table; student_credits and all Phase 3 RPCs remain untouched"
  - "student_available_credits RPCs now read from credit_wallets exclusively"
  - "lessons table INSERT not covered by RLS (service role used by cron; SECURITY DEFINER RPCs handle lesson completion)"
  - "Migration applied via --include-all flag because timestamp predates already-applied migrations"

patterns-established:
  - "Pattern: All 4 Phase 4 tables in one migration, created in FK-safe order (credit_wallets, recurring_schedules, lessons, credit_transactions)"
  - "Pattern: DROP POLICY IF EXISTS before CREATE POLICY for idempotent re-runs"

requirements-completed:
  - CRED-01
  - CRED-02
  - CRED-03
  - CRED-04
  - SCHED-01
  - SCHED-02
  - SCHED-03
  - LES-01
  - LES-02
  - LES-03
  - RESC-01
  - RESC-02
  - RESC-03

# Metrics
duration: 15min
completed: 2026-06-25
---

# Phase 4 Plan 01: Phase 4 Schema Migration Summary

**Four Phase 4 tables (credit_wallets, credit_transactions, recurring_schedules, lessons) with atomic RPCs and TypeScript types, seeding credit wallets from existing student_credits**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-25T10:40:07Z
- **Completed:** 2026-06-25T10:55:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created all 4 Phase 4 tables with correct FK order, constraints, RLS, and partial unique index on `(schedule_id, start_time)` for idempotent cron generation
- Created 3 new RPCs (`complete_lesson`, `approve_reschedule`, `reject_reschedule`) and updated both `student_available_credits` overloads to read from `credit_wallets`
- Seeded `credit_wallets` from existing `student_credits` (balance = `total_credits - used_credits`), and inserted opening balance `credit_transactions` rows
- Regenerated `lib/types/database.types.ts` — all 4 tables and 3 RPCs reflected

## Task Commits

Each task was committed atomically:

1. **Task 1: Write Phase 4 Supabase migration** - `7ab7742` (feat)
2. **Task 2: Regenerate TypeScript database types** - `15844df` (feat)

## Files Created/Modified

- `supabase/migrations/20260603000001_phase4_schema.sql` - All Phase 4 tables, RPCs, RLS policies, wallet seed (250 lines)
- `lib/types/database.types.ts` - Complete TypeScript types regenerated from remote Supabase schema

## Decisions Made

- Wallet seed uses `total_credits - used_credits` (not subtracting `reserved_credits`) per RESEARCH.md Pitfall 4 — reserved Phase 3 credits resolve via their existing RPCs; `credit_wallets` does not track reserved
- `student_available_credits` RPCs now read from `credit_wallets` exclusively — both the parameterless and parameterized overloads updated via `CREATE OR REPLACE`
- `lessons` table has no RLS INSERT policy — INSERT path is controlled by `SECURITY DEFINER` RPCs and the cron service role (which bypasses RLS)
- Migration applied with `--include-all` flag because filename timestamp `20260603000001` precedes migrations already applied to the remote DB

## Deviations from Plan

None — plan executed exactly as written. Migration applied and types regenerated cleanly.

## Issues Encountered

- Migration timestamp `20260603000001` is earlier than existing applied migrations. `supabase db push` refused with "insert before last migration" warning. Resolved with `--include-all` flag which Supabase supports for out-of-order local migrations.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All Phase 4 database foundations are in place
- Plans 04-02 onwards can proceed (cron generator, Server Actions, dashboard pages)
- `generate-lessons` test stubs (from 04-02 RED commit) will pass once the route is created in its plan

---
*Phase: 04-recurring-lessons*
*Completed: 2026-06-25*
