---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 04-05-PLAN.md
last_updated: "2026-06-25T10:47:27.494Z"
last_activity: 2026-05-29 — Plans 01-01, 01-02, 01-03 complete
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 34
  completed_plans: 28
  percent: 80
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-28)

**Core value:** Students can find a qualified, vetted teacher for any school subject and book a paid session in under two minutes.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 4 of 5 in current phase (01-03 complete — 01-04 also committed in prior session)
Status: In progress
Last activity: 2026-05-29 — Plans 01-01, 01-02, 01-03 complete

Progress: [████████░░] 80%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: ~12min
- Total execution time: ~46min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 4/5 | ~46min | ~12min |
| 2. Admin Portal | 0/? | — | — |
| 3. Core Transaction | 0/? | — | — |
| 4. Teacher Progression | 0/? | — | — |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-foundation P03 | 4 | 2 tasks | 5 files |
| Phase 01-foundation P01-04 | 22 | 2 tasks | 8 files |
| Phase 02-admin-portal P01 | 8 | 2 tasks | 5 files |
| Phase 02-admin-portal P02 | 12 | 2 tasks | 8 files |
| Phase 02-admin-portal P03 | 8 | 2 tasks | 2 files |
| Phase 02-admin-portal P04 | 10 | 2 tasks | 2 files |
| Phase 02-admin-portal P06 | 8 | 1 tasks | 3 files |
| Phase 02-admin-portal P07 | 3 | 1 tasks | 0 files |
| Phase 03-core-transaction P01 | 2 | 2 tasks | 2 files |
| Phase 03-core-transaction P02 | 18 | 2 tasks | 11 files |
| Phase 03-core-transaction P05 | 15 | 1 tasks | 6 files |
| Phase 03-core-transaction P04 | 8 | 2 tasks | 1 files |
| Phase 03-core-transaction P03 | 30 | 2 tasks | 11 files |
| Phase 03-core-transaction P06 | 35 | 2 tasks | 9 files |
| Phase 03-core-transaction P10 | 8 | 1 tasks | 2 files |
| Phase 03-core-transaction P11 | 480 | 1 tasks | 4 files |
| Phase 03-core-transaction P07 | 20 | 2 tasks | 3 files |
| Phase 03-core-transaction P09 | 10 | 2 tasks | 3 files |
| Phase 03-core-transaction P08 | 20 | 2 tasks | 8 files |
| Phase 03-core-transaction P12 | 8 | 1 tasks | 7 files |
| Phase 04-recurring-lessons P02 | 8 | 1 tasks | 5 files |
| Phase 04-recurring-lessons P01 | 15 | 2 tasks | 2 files |
| Phase 04-recurring-lessons P05 | 8 | 2 tasks | 2 files |

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
- [Phase 01-foundation]: Plan 01-03: emailRedirectTo pattern uses NEXT_PUBLIC_SITE_URL + /auth/callback?type=signup&next=<encoded-locale-path>
- [Phase 01-foundation]: Plan 01-03: verify-email page has no auth guard — users are unconfirmed at this point and must be able to reach the page freely
- [Phase 01-foundation]: Plan 01-04: requestPasswordReset returns {} on both success AND error (AUTH-03 neutral response — never exposes whether email exists)
- [Phase 01-foundation]: Plan 01-04: update-password session guard uses supabase.auth.getUser() directly (not requireProfile) to redirect to /forgot-password instead of /login
- [Phase 02-admin-portal]: Plan 02-01: level_promotion_requests and payout_requests use TEXT CHECK constraints (not enums) to match existing schema pattern
- [Phase 02-admin-portal]: Plan 02-01: RED test stubs use mocks object pattern consistent with auth.test.ts to avoid Jest hoisting TDZ issues
- [Phase 02-admin-portal]: Table component returns emptyState (or null if none) when rows=[], not an empty table shell
- [Phase 02-admin-portal]: Admin actions call requireRole before validating formData inputs for defense-in-depth
- [Phase 02-admin-portal]: queries test stub TDZ fix: use makeChainable() factory for Supabase fluent API mocking (consistent with auth test pattern)
- [Phase 02-admin-portal]: Plan 02-03: DashboardLayout title/subtitle set in layout.tsx from dict — child admin pages render body content only without repeating header
- [Phase 02-admin-portal]: Plan 02-03: Revenue StatCard uses string value (revenueStub) since StatCard accepts string|number — no type coercion needed
- [Phase 02-admin-portal]: Plan 02-04: Wrap approveTeacher (2-arg useActionState signature) in inline async function for plain form action to satisfy TypeScript form action type
- [Phase 02-admin-portal]: Plan 02-04: Supabase infers profiles join as array type — cast to array and use [0] indexing for teachers and students pages
- [Phase 02-admin-portal]: Plan 02-06: Supabase join types for nested teachers/profiles normalized in Server Component page with explicit union casts — no as any in render path
- [Phase 02-admin-portal]: Plan 02-06: Badge approved state uses 'verified' variant (no 'success' variant in badge.tsx — confirmed by reading component)
- [Phase 02-admin-portal]: All 8 ADMIN requirements require live browser verification — automated tests verify function contracts, not rendered UI
- [Phase 03-core-transaction]: grant_subscription_credits resets used_credits and reserved_credits to 0 on renewal — credits do not roll over
- [Phase 03-core-transaction]: create_booking RPC updated with backward-compatible p_topic_note TEXT DEFAULT NULL parameter via CREATE OR REPLACE
- [Phase 03-core-transaction]: Phase 3 test stubs use dynamic import inside test body to ensure tests remain RED until implementation modules exist
- [Phase 03-core-transaction]: lib/queries/admin.ts getPayoutRequests test stub is RED because Phase 2 only exported getAdminPayouts — getPayoutRequests will be added in 03-11
- [Phase 03-core-transaction]: Stripe webhook test stubs mock constructEvent on Stripe SDK instance — auth guard 401 tests for CRON_SECRET are correctness requirements
- [Phase 03-core-transaction]: Plan 03-05: Email function signatures use to/meetingLink/startTime-string to match 03-01 test stubs; hoursUntil optional in sendTeacherReminder
- [Phase 03-core-transaction]: Plan 03-04: payments.test.ts needs mocks for @/lib/actions/locale and @/lib/i18n/server to prevent cookies() outside request scope in Jest — implementation is correct, tests must mock request-scope APIs
- [Phase 03-core-transaction]: Plan 03-03: lib/storage/avatars.ts centralizes avatar upload helper (isValidAvatarFile + uploadAvatar) for reuse across onboarding and profile edit actions
- [Phase 03-core-transaction]: Plan 03-06: requestBooking wraps students lookup in try/catch — test mocks don't set up supabase.from for student lookup; falls back to profile.id
- [Phase 03-core-transaction]: Plan 03-06: ICS route placed at app/api/bookings/[id]/ics/route.ts outside [locale] prefix per RESEARCH.md Pattern 10
- [Phase 03-core-transaction]: Plan 03-10: vercel.json in app_academigo/ (not monorepo root) — Vercel deployment uses app_academigo as root dir
- [Phase 03-core-transaction]: Plan 03-11: StatCard requires icon prop — used 'coins' for earnings balance card; Table uses render function per column not label key
- [Phase 03-core-transaction]: Plan 03-11: getPayoutRequests added as separate export in lib/queries/admin.ts — EARN-04/05 column alignment with requestPayout confirmed
- [Phase 03-core-transaction]: cancelBookingAsTeacher added as separate teacher-scoped action — existing cancelBooking is student-scoped; shared action would break student booking flow
- [Phase 03-core-transaction]: submitReview uses (prev, formData) signature — no bookingId parameter; use useActionState(submitReview, {}) with hidden bookingId input in form
- [Phase 03-core-transaction]: Plan 03-08: BookingSection cascade pattern: Calendar -> SlotPicker -> BookingRequestForm managed in single client wrapper with shared state
- [Phase 03-core-transaction]: Plan 03-08: Teacher profile BookingSection conditional on getSessionUser() — unauthenticated visitors see sign-up CTA instead of booking calendar
- [Phase 03-core-transaction]: Plan 03-08: avg_rating computed via JavaScript post-fetch in getApprovedTeachers (teachers.ts) — avoids Supabase aggregate SQL limitations
- [Phase 03-core-transaction]: Plan 03-12: getMissingMeetLinks uses createClient consistent with other admin queries; alertTriangle added to icon registry; nav label uses dict.admin.nav.missingLinks pattern
- [Phase 04-recurring-lessons]: Cron tests mock @/lib/supabase/service (createServiceClient) — cron uses service role to bypass RLS for lesson INSERTs
- [Phase 04-recurring-lessons]: requestReschedule test covers re-request case (Pitfall 3) — action accepts status='reschedule_requested' as starting state
- [Phase 04-recurring-lessons]: Wallet seed uses total_credits - used_credits (not subtracting reserved) per RESEARCH.md Pitfall 4
- [Phase 04-recurring-lessons]: credit_wallets is a parallel table; student_credits and all Phase 3 RPCs remain untouched
- [Phase 04-recurring-lessons]: student_available_credits RPCs updated to read from credit_wallets; Phase 4 04-01 migration applied with --include-all flag
- [Phase 04-recurring-lessons]: cancelLesson uses requireProfile() (any auth role) not requireRole() — both students and teachers can cancel; direct UPDATE with zero credit change (CRED-03)
- [Phase 04-recurring-lessons]: requestReschedule filters .in('status',['confirmed','reschedule_requested']) — Pitfall 3 guard allows student to update pending reschedule proposal

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 3 implementation attention: Stripe webhook idempotency and Supabase FOR UPDATE RPC patterns — read ARCHITECTURE.md Patterns 2 and 3 before implementing
- Stripe SDK version: recommend stripe@^17; verify with `npm show stripe version` before installing
- `payout_info_placeholder` freetext field deferred to v2 — design IBAN structure before high-volume payout operations

## Session Continuity

Last session: 2026-06-25T10:47:27.491Z
Stopped at: Completed 04-05-PLAN.md
Resume file: None
