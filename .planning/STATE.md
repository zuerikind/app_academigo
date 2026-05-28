# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-28)

**Core value:** Students can find a qualified, vetted teacher for any school subject and book a paid session in under two minutes.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 0 of ? in current phase
Status: Ready to plan
Last activity: 2026-05-28 — Roadmap created; 45 v1 requirements mapped across 4 phases

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 0/? | — | — |
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

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 3 implementation attention: Stripe webhook idempotency and Supabase FOR UPDATE RPC patterns — read ARCHITECTURE.md Patterns 2 and 3 before implementing
- Stripe SDK version: recommend stripe@^17; verify with `npm show stripe version` before installing
- `payout_info_placeholder` freetext field deferred to v2 — design IBAN structure before high-volume payout operations

## Session Continuity

Last session: 2026-05-28
Stopped at: Roadmap created, STATE.md initialized, REQUIREMENTS.md traceability updated
Resume file: None
