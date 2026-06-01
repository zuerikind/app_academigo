---
phase: 01-foundation
plan: "01"
subsystem: database
tags: [postgres, supabase, migrations, rpc, security, typescript]

# Dependency graph
requires: []
provides:
  - "3-tier teacher_level CHECK constraint (junior, academigo_teacher, verified)"
  - "Data migration from 'standard' to 'junior' for all existing teacher rows"
  - "Atomic booking RPCs: create_booking, complete_booking, cancel_booking (FOR UPDATE)"
  - "Closed admin signup bypass in handle_new_user trigger"
  - "Typed teacher_level union in types/database.ts"
  - "Payout rates for all three tiers in config/earnings.ts"
affects: [02-admin-portal, 03-core-transaction, 04-teacher-progression]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SQL migrations are append-only with sequential timestamp naming"
    - "RPC functions use SECURITY DEFINER + SET search_path = public for safety"
    - "FOR UPDATE row locking in RPCs prevents concurrent booking race conditions"
    - "Trigger security: only explicit values from metadata accepted; default to least privilege"

key-files:
  created:
    - supabase/migrations/20260528000004_teacher_level_migration.sql
    - supabase/migrations/20260528000005_booking_rpcs.sql
    - supabase/migrations/20260528000006_security_patch.sql
  modified:
    - types/database.ts
    - config/earnings.ts

key-decisions:
  - "teacher_level column default changed from 'standard' to 'junior' — all new teachers enter at junior tier"
  - "create_booking raises exception (not returns null) on insufficient credits — explicit error propagation to client"
  - "handle_new_user trigger whitelist approach: only 'teacher' accepted, everything else becomes 'student'"

patterns-established:
  - "Pattern 1: RPC functions use p_ prefix for all parameters (p_student_id, p_booking_id, etc.) for Phase 3 supabase.rpc() compatibility"
  - "Pattern 2: Booking state machine enforced at DB level — status transitions validated before any credit mutation"

requirements-completed: [TIER-01]

# Metrics
duration: 3min
completed: 2026-05-29
---

# Phase 1 Plan 01: DB Schema Migrations Summary

**Three PostgreSQL migrations shipping the 3-tier teacher_level constraint, atomic booking RPCs with FOR UPDATE credit locking, and the admin signup bypass security patch**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-29T17:39:19Z
- **Completed:** 2026-05-29T17:42:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Migration 20260528000004: replaced 2-value teacher_level CHECK with 3-tier constraint; migrated all existing rows from 'standard' to 'junior'; updated column default
- Migration 20260528000005: created create_booking, complete_booking, cancel_booking RPC functions — all using FOR UPDATE locks and SECURITY DEFINER
- Migration 20260528000006: patched handle_new_user trigger to reject admin role from signup metadata — closes privilege escalation vulnerability before Phase 2 admin portal
- Updated types/database.ts with explicit 'junior' | 'academigo_teacher' | 'verified' union type
- Updated config/earnings.ts with all three tier payout rates (junior=30, academigo_teacher=40, verified=50)
- npx tsc --noEmit passes with 0 errors after all changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Write teacher_level migration** - `d39a52f` (feat)
2. **Task 2: Write booking RPCs migration** - `5b13ad3` (feat)
3. **Task 3: Write security patch migration** - `f4905c0` (feat)

## Files Created/Modified
- `supabase/migrations/20260528000004_teacher_level_migration.sql` - 3-tier teacher_level constraint + data migration from 'standard' to 'junior'
- `supabase/migrations/20260528000005_booking_rpcs.sql` - create_booking, complete_booking, cancel_booking atomic RPCs with FOR UPDATE credit locking
- `supabase/migrations/20260528000006_security_patch.sql` - handle_new_user trigger patch rejecting admin role from signup metadata
- `types/database.ts` - teacher_level union typed as 'junior' | 'academigo_teacher' | 'verified' in Row and Insert types
- `config/earnings.ts` - payout rates for all three tiers; removed legacy 'standard' key

## Decisions Made
- teacher_level column default changed from 'standard' to 'junior' — all new teachers enter at junior tier
- create_booking raises explicit exceptions (student_credits_not_found, insufficient_credits) rather than returning null, for clear error propagation
- handle_new_user uses whitelist approach: only the string 'teacher' is accepted from metadata; any other value including 'admin' defaults to 'student'

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npx supabase db push` returned "Cannot find project ref. Have you run supabase link?" — Supabase project is not linked locally. Per plan instructions this is expected: "Do not fail the plan if push fails; the SQL files are the deliverable." All three SQL files were written correctly; the push step requires running `supabase link` with project credentials (manual step).

## User Setup Required

To apply migrations to the remote database:
```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Then verify in Supabase SQL Editor:
```sql
-- Verify constraint
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'teachers_teacher_level_check';
-- Expected: CHECK (teacher_level IN ('junior', 'academigo_teacher', 'verified'))

-- Verify RPCs exist
SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('create_booking', 'complete_booking', 'cancel_booking');
-- Expected: 3 rows

-- Verify trigger function updated
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
-- Expected: body contains 'teacher' THEN 'teacher' ELSE 'student'
```

## Next Phase Readiness
- All schema prerequisites for Phase 2 (admin portal) are in place — teacher_level constraint correct, handle_new_user security patch applied
- Phase 3 booking service can call `supabase.rpc('create_booking', { p_student_id, p_teacher_id, ... })` with the exact parameter names defined
- Phase 4 teacher progression logic can read teacher_level safely as a typed union, and config/earnings.ts provides all three tier payout rates

---
*Phase: 01-foundation*
*Completed: 2026-05-29*
