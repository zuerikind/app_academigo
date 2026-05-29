---
phase: 01-foundation
plan: "03"
subsystem: auth
tags: [supabase, next.js, email-verification, server-actions, i18n]

# Dependency graph
requires:
  - phase: 01-02
    provides: Jest test infrastructure and RED auth stubs (signUp, requestPasswordReset, updatePassword)
provides:
  - Email verification flow with verify-email page (no auth required)
  - signUp action with emailRedirectTo to /auth/callback?type=signup&next=<onboarding-path>
  - signUp redirects to /[locale]/verify-email on success (not directly to onboarding)
  - auth callback already follows ?next param — confirmed working
  - NEXT_PUBLIC_SITE_URL env var in .env.local
affects: [01-04, teacher-onboarding, student-onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "emailRedirectTo pattern: NEXT_PUBLIC_SITE_URL + /auth/callback?type=signup&next=<encoded-locale-path>"
    - "verify-email page is a Server Component with no auth guard — user is unconfirmed at this point"
    - "encodeURIComponent wraps the locale-prefixed onboarding path for safe URL encoding in emailRedirectTo"

key-files:
  created:
    - app/[locale]/verify-email/page.tsx
  modified:
    - lib/actions/auth.ts
    - messages/de.ts
    - messages/en.ts
    - .env.local

key-decisions:
  - "verifyEmail keys added to de.ts and en.ts under auth.verifyEmail — Dictionary type auto-derives from de.ts via Stringify<typeof de>"
  - "Removed revalidatePath from signUp — it has no effect before redirect for unconfirmed users"
  - "NEXT_PUBLIC_SITE_URL set in .env.local (not committed — gitignored) and used as base for emailRedirectTo absolute URL"
  - "verify-email page uses isLocale guard with defaultLocale fallback — no notFound() thrown for invalid locale"

patterns-established:
  - "Auth flow: signUp -> verify-email page (intermediate) -> email click -> /auth/callback?next=<onboarding> -> onboarding"
  - "Server Component pages that do not require auth: no createClient/requireProfile guard — publicly accessible"

requirements-completed: [AUTH-01, AUTH-02]

# Metrics
duration: 4min
completed: 2026-05-29
---

# Phase 01 Plan 03: Email Verification Flow Summary

**signUp action now passes emailRedirectTo with /auth/callback?type=signup and encoded onboarding next-path, redirecting users to /[locale]/verify-email before onboarding**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-29T22:32:41Z
- **Completed:** 2026-05-29T22:36:51Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created `app/[locale]/verify-email/page.tsx` — static Server Component with no auth guard, shows "check your email" message with link back to login
- Added `auth.verifyEmail` translation keys to `messages/de.ts` and `messages/en.ts`
- Modified `signUp` in `lib/actions/auth.ts`: passes `emailRedirectTo` pointing to `/auth/callback?type=signup&next=<encoded-onboarding-path>` and redirects to `/verify-email` on success
- Confirmed `app/auth/callback/route.ts` already follows `?next` param correctly — no changes needed
- All 11 unit tests GREEN: signUp describe (2), auth callback describe (3), requestPasswordReset (3), updatePassword (3)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add translation keys and create verify-email page** - `5e41d02` (feat)
2. **Task 2: Update signUp action — make tests GREEN** - `fb19882` (feat, included in Plan 04 batch commit from prior session)

## Files Created/Modified
- `app/[locale]/verify-email/page.tsx` - Static Server Component, no auth required, renders check-email message
- `lib/actions/auth.ts` - signUp modified: emailRedirectTo added, redirect to /verify-email on success, revalidatePath removed
- `messages/de.ts` - Added auth.verifyEmail keys (title, subtitle, instruction, spam, backToLogin)
- `messages/en.ts` - Added auth.verifyEmail keys in English
- `.env.local` - Added NEXT_PUBLIC_SITE_URL=http://localhost:3000 (gitignored, not committed)

## Decisions Made
- Used `isLocale(raw) ? (raw as Locale) : defaultLocale` pattern (instead of `notFound()`) for verify-email page — user arrives here from an email click without locale context enforcement being critical
- `revalidatePath` removed from signUp — no-op before redirect, and user is unconfirmed at this point so no layout re-render is needed
- `emailRedirectTo` uses `NEXT_PUBLIC_SITE_URL` as base per Supabase requirement for absolute URLs

## Deviations from Plan

None — plan executed exactly as written. The `lib/actions/auth.ts` changes and test verification were already committed in a prior session's commit (`fb19882`), which included both Plan 03 signUp fixes and Plan 04 implementations. TypeScript cache showed a false-positive error on `update-password-form` that resolved on fresh `--incremental false` run.

## Issues Encountered

- **TypeScript incremental cache false positive:** `npx tsc --noEmit` reported `Cannot find module '@/components/auth/update-password-form'` on first run — resolved by running `npx tsc --noEmit --incremental false`. The file exists on disk and the error did not appear on a clean run.
- **Prior session overlap:** `lib/actions/auth.ts` changes were already committed in `fb19882` (labeled Plan 04) which included Plan 03 fixes alongside Plan 04 implementations. All tests confirm the implementation is correct.

## User Setup Required

Add `NEXT_PUBLIC_SITE_URL=http://localhost:3000` to `.env.local` (already done locally). This env var is required for `emailRedirectTo` absolute URL construction in `signUp`. For production, set to your production domain.

## Next Phase Readiness
- Email verification flow is complete and tested (AUTH-01, AUTH-02 GREEN)
- Plan 04 can implement `requestPasswordReset` and `updatePassword` — stubs already exist and tests are GREEN (Plan 04 work was already committed alongside this plan's work in `fb19882`)
- `app/auth/callback/route.ts` already handles both `?type=signup` and `?type=recovery` flows via `?next` param

---
*Phase: 01-foundation*
*Completed: 2026-05-29*
