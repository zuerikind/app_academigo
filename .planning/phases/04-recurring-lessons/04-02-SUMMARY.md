---
phase: 04-recurring-lessons
plan: "02"
subsystem: testing
tags: [jest, tdd, recurring-lessons, credit-wallet, reschedule, cron]

requires:
  - phase: 03-core-transaction
    provides: makeChainable test pattern, dynamic import inside test body, Jest configured

provides:
  - RED test stubs for all Phase 4 logic-testable requirements (CRED-01, CRED-03, CRED-04, SCHED-01, SCHED-02, SCHED-03, LES-01, LES-02, RESC-01, RESC-02, RESC-03)
  - 5 test files covering computeOccurrences utility, schedule actions, reschedule actions, wallet query, cron route

affects:
  - 04-03 (schema migration — these tests will go GREEN once modules exist)
  - 04-04 (server actions implementation)
  - 04-05 (cron route implementation)

tech-stack:
  added: []
  patterns:
    - "makeChainable factory for Supabase fluent API mocking (consistent with Phase 3 pattern)"
    - "Dynamic import inside test body ensures tests remain RED until implementation modules exist"
    - "Cron tests mock @/lib/supabase/service (not @/lib/supabase/server) — cron uses createServiceClient()"

key-files:
  created:
    - __tests__/lib/utils/schedule.util.test.ts
    - __tests__/lib/actions/schedules.test.ts
    - __tests__/lib/actions/reschedule.test.ts
    - __tests__/lib/queries/wallet.test.ts
    - __tests__/api/cron/generate-lessons.test.ts
  modified: []

key-decisions:
  - "Dynamic import inside test body used for action/query modules — Phase 3 pattern ensures RED until modules exist"
  - "Cron test mocks @/lib/supabase/service (createServiceClient) not @/lib/supabase/server — cron must use service role to bypass RLS"
  - "requestReschedule test explicitly covers re-request case (Pitfall 3) — action must accept status='reschedule_requested' as starting state"
  - "CRED-03 verified negatively: neither createSchedule nor updateScheduleStatus should touch credit_wallets table"

patterns-established:
  - "Pattern: all Phase 4 RED stubs follow Phase 3 mocks-object + makeChainable pattern"
  - "Pattern: CRON_SECRET tests use beforeEach/afterEach for env cleanup"

requirements-completed:
  - CRED-01
  - CRED-03
  - CRED-04
  - SCHED-01
  - SCHED-02
  - SCHED-03
  - LES-01
  - LES-02
  - RESC-01
  - RESC-02
  - RESC-03

duration: 8min
completed: 2026-06-25
---

# Phase 4 Plan 02: Phase 4 RED Test Stubs Summary

**5 RED test stub files covering all 11 logic-testable Phase 4 requirements using makeChainable + dynamic import pattern**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-25T00:00:00Z
- **Completed:** 2026-06-25
- **Tasks:** 1
- **Files modified:** 5 created

## Accomplishments
- All 5 test files created and verified RED (26 tests failing with "Cannot find module")
- Zero syntax errors — Jest parses all files cleanly
- Test behavioral assertions lock requirements before implementation begins
- Pitfall 3 (reschedule re-request) explicitly covered in reschedule test

## Task Commits

1. **Task 1: Write Phase 4 RED test stubs** - `3f19b65` (test)

## Files Created/Modified
- `__tests__/lib/utils/schedule.util.test.ts` - computeOccurrences unit tests (LES-01, LES-02)
- `__tests__/lib/actions/schedules.test.ts` - createSchedule, updateScheduleStatus (SCHED-01, SCHED-02, CRED-03)
- `__tests__/lib/actions/reschedule.test.ts` - requestReschedule, approveReschedule, rejectReschedule (RESC-01, RESC-02, RESC-03)
- `__tests__/lib/queries/wallet.test.ts` - getWalletBalance (CRED-01, CRED-04)
- `__tests__/api/cron/generate-lessons.test.ts` - cron auth guard + active-only filter (SCHED-03, LES-02)

## Decisions Made
- Cron tests mock `@/lib/supabase/service` not `@/lib/supabase/server` — cron uses `createServiceClient()` for RLS bypass (per RESEARCH.md Pattern 4, Pitfall 2)
- requestReschedule test explicitly covers re-request scenario (lesson already in `reschedule_requested`) per RESEARCH.md Pitfall 3
- CRED-03 verified negatively in both schedules tests — table name check on `from()` call list

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- RED stubs are active and failing — implementation plans (04-03 schema, 04-04 actions, 04-05 cron) can begin
- All 11 requirements have test coverage locked in advance

---
*Phase: 04-recurring-lessons*
*Completed: 2026-06-25*
