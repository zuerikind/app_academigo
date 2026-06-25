---
phase: 04-recurring-lessons
plan: "03"
subsystem: utilities-and-queries
tags: [schedule, wallet, lessons, typescript, jest, tdd]

# Dependency graph
requires:
  - phase: 04-01
    provides: "credit_wallets, credit_transactions, recurring_schedules, lessons tables + TypeScript types"
  - phase: 04-02
    provides: "RED test stubs for schedule.util and wallet"
provides:
  - "computeOccurrences utility (lib/utils/schedule.ts) — ISO weekday math, UTC-safe"
  - "getWalletBalance, getCreditTransactions (lib/queries/wallet.ts)"
  - "getStudentUpcomingLessons, getTeacherUpcomingLessons, getTeacherActiveStudents (lib/queries/lessons.ts)"
  - "getTeacherSchedules, getStudentSchedules, getRescheduleRequests (lib/queries/lessons.ts)"
affects:
  - 04-04
  - 04-05
  - 04-07
  - 04-08

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "UTC date methods (setUTCHours, getUTCDay, setUTCDate) for timezone-safe weekday arithmetic"
    - "startTs > from && startTs <= to — exclusive lower, inclusive upper for 6-week window"
    - "Array.isArray guard on Supabase FK join results (bookings.ts pattern)"

key-files:
  created:
    - "lib/utils/schedule.ts"
    - "lib/queries/wallet.ts"
    - "lib/queries/lessons.ts"
  modified: []

key-decisions:
  - "Used UTC date methods throughout computeOccurrences — setUTCHours/getUTCDay/setUTCDate — to match test assertions using getUTCDay/getUTCHours"
  - "Upper window boundary is inclusive (startTs <= to) so 6-week window yields exactly 6 Mondays when from is also a Monday at midnight"
  - "lessons.ts includes getRescheduleRequests and getTeacherSchedules/getStudentSchedules per plan spec (needed by 04-07/04-08)"

# Metrics
duration: ~3min
completed: 2026-06-25
---

# Phase 4 Plan 03: Schedule Utility and Query Functions Summary

**computeOccurrences (UTC-safe weekday arithmetic) + wallet/lesson query functions — all 9 tests GREEN**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-06-25
- **Completed:** 2026-06-25
- **Tasks:** 2
- **Files modified:** 3 created

## Accomplishments

- Implemented `computeOccurrences` with UTC-safe date arithmetic and correct ISO weekday conversion `(getUTCDay() + 6) % 7`
- All 6 `schedule.util.test.ts` tests GREEN; fixed an off-by-one in the upper window boundary (startTs <= to, not just startTs > from)
- Implemented `getWalletBalance` (returns 0 if not found) and `getCreditTransactions` (DESC order, no TTL fields) — all 3 wallet tests GREEN
- Implemented 6 lesson query functions in `lib/queries/lessons.ts` using bookings.ts join pattern

## Task Commits

1. **Task 1: computeOccurrences utility** - `0738182` (feat)
2. **Task 2: Wallet queries and lesson queries** - `c2cd0c7` (feat)

## Files Created/Modified

- `lib/utils/schedule.ts` - computeOccurrences with ScheduleInput/LessonOccurrence types
- `lib/queries/wallet.ts` - getWalletBalance, getCreditTransactions, CreditTransaction type
- `lib/queries/lessons.ts` - getStudentUpcomingLessons, getTeacherUpcomingLessons, getTeacherActiveStudents, getTeacherSchedules, getStudentSchedules, getRescheduleRequests

## Decisions Made

- UTC date methods (`setUTCHours`, `getUTCDay`, `setUTCDate`) instead of local-time methods — tests assert on `getUTCHours()` so local-time methods would break in non-UTC environments
- Window boundary condition: `startTs > from && startTs <= to` — the RESEARCH.md code only had `startTs > from` which caused a 7th Monday to appear in the 6-week test
- `lib/queries/lessons.ts` exported in single file (not split into schedules.ts + lessons.ts as RESEARCH suggested) — plan spec says `files_modified: lib/queries/lessons.ts`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed off-by-one in computeOccurrences window boundary**
- **Found during:** Task 1 test run
- **Issue:** `while (cursor <= to)` with only `startTs > from` check allowed a 7th Monday when `to` falls exactly on a Monday — `cursor <= to` includes that Monday, then `startTs` at 14:00 > midnight so condition passed
- **Fix:** Added `&& startTs <= to` to the push condition; 6-week window yields exactly 6 Mondays
- **Files modified:** `lib/utils/schedule.ts`
- **Commit:** `0738182`

## Self-Check

- [x] `lib/utils/schedule.ts` exists and exports `computeOccurrences`
- [x] `lib/queries/wallet.ts` exists and exports `getWalletBalance`, `getCreditTransactions`
- [x] `lib/queries/lessons.ts` exists and exports all 6 query functions
- [x] 9/9 tests GREEN (schedule.util: 6, wallet: 3)
- [x] No TypeScript errors in new source files (pre-existing test file errors in __tests__ not introduced by this plan)

## Self-Check: PASSED
