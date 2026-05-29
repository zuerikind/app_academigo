# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-28)

**Core value:** Students can find a qualified, vetted teacher for any school subject and book a paid session in under two minutes.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 2 of 5 in current phase
Status: In progress
Last activity: 2026-05-29 — Plans 01-01 and 01-02 complete

Progress: [██░░░░░░░░] 20%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: ~19min
- Total execution time: ~38min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 2/5 | ~38min | ~19min |
| 2. Admin Portal | 0/? | — | — |
| 3. Core Transaction | 0/? | — | — |
| 4. Teacher Progression | 0/? | — | — |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1: Schema migrations must land before any feature code — `teacher_level` enum, booking FK, promotion tables, atomic RPCs
- Phase 1: `handle_new_user` trigger security patch must ship before admin portal (Phase 2) to close admin signup bypass
- Phase 2: Admin approval gate is a hard blocker — no student booking flow works until at least one teacher is approved
- Phase 3: Stripe webhook must be idempotent on `stripe_session_id`; credit ops must use Supabase RPC with FOR UPDATE locks
- Plan 01-02: Use mocks object pattern (not top-level const mocks) to avoid Jest hoisting temporal dead zone issues in test files
- Plan 01-02: Add TypeScript stubs for requestPasswordReset/updatePassword in auth.ts so tsc passes; behavioral RED failures remain for Plan 03/04

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 3 implementation attention: Stripe webhook idempotency and Supabase FOR UPDATE RPC patterns — read ARCHITECTURE.md Patterns 2 and 3 before implementing
- Stripe SDK version: recommend stripe@^17; verify with `npm show stripe version` before installing
- `payout_info_placeholder` freetext field deferred to v2 — design IBAN structure before high-volume payout operations

## Session Continuity

Last session: 2026-05-29
Stopped at: Completed 01-02-PLAN.md (Jest test infrastructure + RED auth stubs)
Resume file: None
