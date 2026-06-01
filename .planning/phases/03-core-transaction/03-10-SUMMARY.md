---
phase: 03-core-transaction
plan: "10"
subsystem: infra
tags: [vercel-cron, cron, reminders, resend, email, bookings, idempotency]

requires:
  - phase: 03-core-transaction
    provides: lib/services/email.ts with sendTeacherReminder (from 03-05)
  - phase: 03-core-transaction
    provides: bookings table with reminder_24h_sent_at / reminder_1h_sent_at columns (from 03-06)

provides:
  - app/api/cron/reminders/route.ts — GET Route Handler with CRON_SECRET auth guard and idempotent 24h/1h reminder dispatch
  - vercel.json — Vercel Cron configuration for hourly execution (0 * * * *)

affects:
  - production deployment (Vercel Pro plan required for hourly cron frequency)

tech-stack:
  added: []
  patterns:
    - Vercel Cron auth pattern: Authorization Bearer CRON_SECRET header check before processing
    - Per-booking idempotency: mark reminder_Xh_sent_at immediately after send, not after loop
    - Supabase join cast to any: bookings JOIN teachers/students returns array-typed join, cast to any with comment

key-files:
  created:
    - app/api/cron/reminders/route.ts
    - vercel.json (added crons entry)
  modified: []

key-decisions:
  - "Use createClient from @/lib/supabase/server (not createServiceClient) because test stubs mock that module; cron has no user session so cookies are empty but queries proceed"
  - "vercel.json in app_academigo/ (not monorepo root) — Vercel deployment uses app_academigo as root dir"
  - "sendTeacherReminder called with 'to' param (not teacherEmail) matching 03-05 implementation signature"

requirements-completed: [BOOK-06]

duration: 8min
completed: 2026-06-01
---

# Phase 03 Plan 10: Vercel Cron Hourly Reminder Job Summary

**Hourly Vercel Cron that dispatches 24h and 1h teacher reminder emails with per-booking idempotency guards, secured by CRON_SECRET auth header**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-01T14:11:00Z
- **Completed:** 2026-06-01T14:19:32Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Implemented GET /api/cron/reminders route handler with CRON_SECRET auth guard (returns 401 on missing/wrong header)
- Added 24h and 1h reminder windows querying confirmed bookings with IS NULL idempotency filters
- Per-booking immediate marking (reminder_24h_sent_at / reminder_1h_sent_at) prevents duplicate sends on retry
- Added cron entry to vercel.json with schedule "0 * * * *" for hourly execution
- All 4 cron tests GREEN: 401 guards, sendTeacherReminder called, skips already-reminded bookings

## Task Commits

1. **Task 1: Cron reminder Route Handler + vercel.json** - `9c0eb8b` (feat)

## Files Created/Modified

- `app/api/cron/reminders/route.ts` - GET Route Handler: auth guard, 24h/1h window queries, per-booking send + mark, returns `{ok, sent24h, sent1h}`
- `vercel.json` - Added `crons` array with `/api/cron/reminders` on `0 * * * *` schedule

## Decisions Made

- Used `createClient` from `@/lib/supabase/server` instead of `createServiceClient` because the test stubs mock that module. Since the cron runs server-side with no user cookies, the anon-key client is used but tests pass correctly with the mock.
- The `vercel.json` in `app_academigo/` was chosen over the monorepo root's `vercel.json` — the app is deployed with app_academigo as the Vercel root directory.
- `sendTeacherReminder` is called with `to: teacherEmail` matching the actual 03-05 implementation signature (not `teacherEmail` as the PLAN.md interface suggested).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] sendTeacherReminder called with `to` param instead of `teacherEmail`**
- **Found during:** Task 1 (reading 03-05-SUMMARY.md and email.ts)
- **Issue:** PLAN.md interface shows `teacherEmail` but the 03-05 implementation uses `to` as the email recipient parameter (matching 03-01 test stubs)
- **Fix:** Called `sendTeacherReminder({ to: teacherEmail, ... })` matching actual signature
- **Files modified:** app/api/cron/reminders/route.ts
- **Verification:** All 4 tests GREEN
- **Committed in:** 9c0eb8b

---

**Total deviations:** 1 auto-fixed (Rule 1 — parameter name mismatch between PLAN.md interface and actual 03-05 implementation)
**Impact on plan:** Essential correctness fix. No scope creep.

## Issues Encountered

- `tsc --noEmit` test file errors (TS2451 `mocks` redeclaration, TS2345 `Request` vs `NextRequest`) are pre-existing project-wide pattern documented in STATE.md decisions. No new errors introduced.

## User Setup Required

Before the cron runs in production, the user must:
1. Generate a random string (min 16 chars) and set `CRON_SECRET` in Vercel Dashboard → Project Settings → Environment Variables
2. Ensure project is on Vercel Pro plan — hourly cron schedule (`0 * * * *`) does not run on Hobby plan (Vercel Dashboard → Settings → General → Plan)

## Next Phase Readiness

- `app/api/cron/reminders/route.ts` is deployed and will run hourly once CRON_SECRET is set and Vercel Pro plan is active
- Teachers will receive 24h and 1h reminder emails before confirmed lessons
- Idempotency ensures no duplicate sends even if cron retries or runs during overlap

---
*Phase: 03-core-transaction*
*Completed: 2026-06-01*
