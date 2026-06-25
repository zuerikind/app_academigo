---
phase: "04"
plan: "06"
subsystem: cron
tags: [cron, lessons, vercel, schedule, service-client]
dependency_graph:
  requires: ["04-03"]
  provides: ["generate-lessons cron route", "vercel cron registration"]
  affects: ["lessons table", "vercel.json"]
tech_stack:
  added: []
  patterns: ["service client for cron RLS bypass", "computeOccurrences integration", "idempotent INSERT via unique partial index"]
key_files:
  created:
    - app/api/cron/generate-lessons/route.ts
  modified:
    - vercel.json
decisions:
  - "Route uses createServiceClient (not createClient) — no user session in cron context"
  - "INSERT idempotency via unique partial index on (schedule_id, start_time) — conflict = silent skip"
  - "6-week window = 42 days from now"
  - "Double-guard removed — .eq('status','active') in DB query is sufficient; in-loop guard was redundant"
metrics:
  duration: "5min"
  completed: "2026-06-25"
  tasks: 2
  files: 2
---

# Phase 04 Plan 06: Generate-Lessons Cron Route Summary

**One-liner:** Daily Vercel Cron route that auto-generates confirmed lessons for all active recurring schedules using a 6-week look-ahead window with idempotent INSERT.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | generate-lessons cron route | ffc08bb | app/api/cron/generate-lessons/route.ts |
| 2 | Add generate-lessons to vercel.json | fb5e958 | vercel.json |

## Verification

- `generate-lessons.test.ts` — 4/4 tests GREEN
- `vercel.json` — 2 cron entries: `/api/cron/reminders` (0 8 * * *) and `/api/cron/generate-lessons` (0 0 * * *)
- Route uses `createServiceClient` confirmed via grep
- No tsc errors in route file (pre-existing test file tsc errors are out of scope, identical to other test files)

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

**Note:** Plan suggested a double-guard (`if (schedule.status !== "active") continue`) inside the loop after already querying `.eq("status", "active")`. Omitted as redundant (ponytail: YAGNI — the DB filter is the guard).

## Self-Check: PASSED

- `app/api/cron/generate-lessons/route.ts` — FOUND
- `vercel.json` updated with 2 cron entries — FOUND
- Commits ffc08bb and fb5e958 — FOUND
