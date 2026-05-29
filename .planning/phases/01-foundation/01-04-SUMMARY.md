---
phase: 01-foundation
plan: "04"
subsystem: auth
tags: [supabase, next.js, server-actions, useActionState, i18n, password-reset]

# Dependency graph
requires:
  - phase: 01-02
    provides: Jest test infrastructure and RED stubs for requestPasswordReset/updatePassword
  - phase: 01-03
    provides: signUp emailRedirectTo + verify-email page (implemented as Rule 3 auto-fix in this plan)
provides:
  - Two-step password reset flow (forgot-password + update-password pages)
  - requestPasswordReset server action (neutral response — AUTH-03 security requirement)
  - updatePassword server action with 8-char minimum and redirect to /login
  - ForgotPasswordForm and UpdatePasswordForm client components
  - "Forgot password?" link in LoginForm
  - passwordTooShort, forgotPassword, updatePassword translation keys (de + en)
  - signUp now passes emailRedirectTo and redirects to /verify-email (Plan 03 fix applied)
affects: [01-05, admin-portal, auth-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component wraps Client Component — server action passed as prop"
    - "useActionState with INITIAL_STATE reference check for success detection (forgot-password form)"
    - "supabase.auth.getUser() direct call in Server Component for session guard (not requireProfile)"
    - "Neutral auth response: requestPasswordReset returns {} on both success and error (AUTH-03)"

key-files:
  created:
    - app/[locale]/forgot-password/page.tsx
    - app/[locale]/update-password/page.tsx
    - components/auth/forgot-password-form.tsx
    - components/auth/update-password-form.tsx
  modified:
    - lib/actions/auth.ts
    - components/auth/auth-form.tsx
    - messages/de.ts
    - messages/en.ts

key-decisions:
  - "requestPasswordReset returns {} on BOTH success and Supabase error — intentional AUTH-03 security requirement to prevent email enumeration"
  - "update-password uses supabase.auth.getUser() directly (not requireProfile) to redirect to /forgot-password instead of /login on no session"
  - "Success detection in ForgotPasswordForm: compare state reference vs INITIAL_STATE constant (avoids submitted flag)"

patterns-established:
  - "Auth pages: Server Component shell → Client Component form (action passed as prop)"
  - "Client components use useI18n() hook for locale + dict — no need to pass as props from Server Component"
  - "Session guards for non-middleware-protected pages: createClient + getUser() directly in Server Component"

requirements-completed: [AUTH-03, AUTH-04]

# Metrics
duration: 22min
completed: 2026-05-30
---

# Phase 01 Plan 04: Password Reset Flow Summary

**Two-step Supabase password reset with neutral forgot-password response, session-guarded update-password page, and "Forgot password?" link on login — all 11 auth unit tests GREEN**

## Performance

- **Duration:** ~22 min
- **Started:** 2026-05-30T08:13:39Z
- **Completed:** 2026-05-30T08:35:00Z
- **Tasks:** 2 (+ 1 auto-fix for Plan 03 blocking issue)
- **Files modified:** 8

## Accomplishments
- requestPasswordReset server action with AUTH-03 neutral response (same {} on success AND error — never exposes whether email exists)
- updatePassword server action with 8-char validation, redirect to /login on success
- forgot-password page with email form; shows inline success message without redirect
- update-password page with supabase.auth.getUser() session guard — redirects to /forgot-password if no recovery session
- "Forgot password?" link added to LoginForm in auth-form.tsx
- Applied Plan 03 signUp fix (emailRedirectTo + redirect to /verify-email) as blocking auto-fix

## Task Commits

Each task was committed atomically:

1. **Task 1: Add server actions and translation keys** - `fb19882` (feat)
2. **Task 2: Create forgot-password and update-password pages, add login link** - `1d80e24` (feat)

**Plan metadata:** (final docs commit — see below)

## Files Created/Modified
- `lib/actions/auth.ts` - requestPasswordReset, updatePassword (full implementation); signUp fixed with emailRedirectTo + /verify-email redirect
- `messages/de.ts` - passwordTooShort, forgotPassword (with forgotPasswordLink), updatePassword translation keys
- `messages/en.ts` - same keys in English
- `app/[locale]/forgot-password/page.tsx` - Server Component shell, passes requestPasswordReset to ForgotPasswordForm
- `app/[locale]/update-password/page.tsx` - Server Component with session guard, passes updatePassword to UpdatePasswordForm
- `components/auth/forgot-password-form.tsx` - Client Component: email form + inline success state
- `components/auth/update-password-form.tsx` - Client Component: password form (minLength=8)
- `components/auth/auth-form.tsx` - Added "Forgot password?" link to LoginForm using useI18n locale

## Decisions Made
- `requestPasswordReset` returns `{}` on both success and Supabase error — this intentionally prevents email enumeration (AUTH-03 security requirement). A comment in the code explains this is NOT a bug.
- `update-password` session check uses `supabase.auth.getUser()` directly, not `requireProfile()` — because `requireProfile` redirects to `/login` but the update-password flow requires redirect to `/forgot-password`.
- Success detection in ForgotPasswordForm: compare `state !== INITIAL_STATE` (a module-level constant reference) rather than tracking a submitted boolean separately.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Applied missing Plan 03 changes to make signUp tests pass**
- **Found during:** Task 1 (initial test run showed 6 failing tests, including 2 signUp tests from Plan 03)
- **Issue:** Plan 03 was never executed. The signUp tests (emailRedirectTo, /verify-email redirect) were RED. Plan 04's success criteria requires ALL tests GREEN including signUp tests. This was a blocking dependency.
- **Fix:** Applied Plan 03 changes inline:
  - Added `emailRedirectTo` with `/auth/callback?type=signup` and encoded onboarding `?next` param to `signUp`
  - Changed `signUp` redirect target from `/onboarding` to `/verify-email`
  - Removed `revalidatePath` from `signUp` (no-op before redirect for unconfirmed users)
  - Added `NEXT_PUBLIC_SITE_URL=http://localhost:3000` to `.env.local`
  - Note: verify-email page and verifyEmail translation keys were already present from a prior session
- **Files modified:** lib/actions/auth.ts, .env.local
- **Verification:** All 8 signUp/requestPasswordReset/updatePassword tests GREEN
- **Committed in:** fb19882 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix was necessary to satisfy Plan 04's success criteria (all tests GREEN). No scope creep — this was skipped Plan 03 work, not new features.

## Issues Encountered
- Plan 03 was skipped (no SUMMARY.md, no commits). Its changes were required before Plan 04 tests could all pass. Applied as Rule 3 auto-fix.

## User Setup Required
None — NEXT_PUBLIC_SITE_URL was added to .env.local automatically. No external service configuration required beyond what already exists.

## Next Phase Readiness
- Password reset flow is fully functional at the server action layer
- All auth unit tests GREEN (signUp, requestPasswordReset, updatePassword, callback)
- Plan 03 SUMMARY.md not created (those changes were absorbed into Plan 04 commits)
- Ready for Plan 05 (remaining foundation work)

---
*Phase: 01-foundation*
*Completed: 2026-05-30*
