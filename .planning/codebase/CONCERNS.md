# Codebase Concerns

**Analysis Date:** 2026-05-28

## Tech Debt

**BookingService is a stub with no implementation:**
- Issue: `lib/services/bookings.ts` exports only a TypeScript type definition with JSDoc comments referencing "Phase 2–3". No runtime code exists. The booking flow (request, accept, reject, credit reservation/release) is entirely absent.
- Files: `lib/services/bookings.ts`
- Impact: Students cannot book lessons. The teacher bookings and availability pages both render `<EmptyState>` placeholders. The student bookings page is also an empty state.
- Fix approach: Implement as Supabase RPC calls with transactional credit reservation. Wire up `app/[locale]/teacher/bookings/page.tsx`, `app/[locale]/teacher/availability/page.tsx`, and `app/[locale]/student/bookings/page.tsx`.

**Availability/scheduling system is fully absent:**
- Issue: The `availability_slots` and `teacher_unavailable_dates` tables exist in the schema but there are no queries, server actions, or UI for teachers to set or manage their availability.
- Files: `app/[locale]/teacher/availability/page.tsx`, `supabase/migrations/20260528000001_initial_schema.sql`
- Impact: No slot selection is possible during booking; unblocks all of Phase 2.
- Fix approach: Create `lib/queries/availability.ts` and `lib/actions/availability.ts`; build availability calendar UI in the teacher availability page.

**Stripe payment integration is wired in the database but not in the application:**
- Issue: `credit_packages.stripe_price_id` column exists in schema and `types/database.ts`, `payments` table exists, but no Stripe SDK is installed and no checkout session creation, webhook handler, or credit grant logic exists. `config/pricing.ts` is the single source of truth for UI only.
- Files: `config/pricing.ts`, `app/[locale]/student/packages/page.tsx`, `supabase/migrations/20260528000001_initial_schema.sql`, `types/database.ts`
- Impact: Students cannot purchase credits. The packages page shows static pricing cards with a hardcoded note about Stripe being unavailable.
- Fix approach: Install `stripe` package, create `/api/checkout/route.ts` and `/api/webhooks/stripe/route.ts`, populate `credit_packages` rows with real `stripe_price_id` values, grant credits via `student_credits` update on successful webhook.

**Teacher earnings and payout system exists only in the database:**
- Issue: `teacher_earnings`, `payout_requests` tables exist in schema with full RLS policies, but there are no queries, actions, or UI. The teacher dashboard shows a placeholder card with no data.
- Files: `app/[locale]/teacher/dashboard/page.tsx`, `config/earnings.ts`, `supabase/migrations/20260528000001_initial_schema.sql`
- Impact: Teachers cannot see earnings or request payouts.
- Fix approach: Phase 4 work — implement `lib/queries/earnings.ts`, add a teacher earnings page, build payout request form.

**Admin panel is entirely missing:**
- Issue: Middleware at `lib/supabase/middleware.ts` references `ADMIN_PREFIX = "/admin"` and redirects admin users to `/admin/dashboard`, but no `app/[locale]/admin/` directory, pages, or admin-specific queries exist.
- Files: `lib/supabase/middleware.ts`, `lib/auth/session.ts`
- Impact: Admin users who sign in are redirected to a non-existent route, producing a 404. Teacher approval (`is_approved` flag) cannot be managed by any UI.
- Fix approach: Create `app/[locale]/admin/dashboard/page.tsx` as a minimum; add teacher approval UI at `app/[locale]/admin/teachers/page.tsx`.

**`purchasedPackages` is always an empty array:**
- Issue: `lib/queries/student.ts` returns `purchasedPackages: [] as { name: string; credits: number }[]` hardcoded. The student dashboard stat card for purchased packages always shows `0`.
- Files: `lib/queries/student.ts`, `app/[locale]/student/dashboard/page.tsx`
- Impact: Dashboard metric is inaccurate and misleading once payments are implemented.
- Fix approach: Query `payments` joined to `credit_packages` for the student once Stripe integration is live.

**Languages stored as a comma-delimited string in form input but as `TEXT[]` in the database:**
- Issue: `teacher-onboarding-form.tsx` has a single text input for languages with a placeholder suggesting comma separation. `lib/actions/onboarding.ts` splits this string on commas before inserting into the `languages TEXT[]` column. This is fragile and not validated for format.
- Files: `components/onboarding/teacher-onboarding-form.tsx`, `lib/actions/onboarding.ts`
- Impact: A teacher entering languages with inconsistent spacing or format will produce dirty data in the array. No UI feedback if the field is malformed.
- Fix approach: Replace the free-text input with a multi-select or tag-input component with predefined language options; validate the array before insertion.

**`payout_info_placeholder` is a freetext field with no real payout infrastructure:**
- Issue: The `teachers.payout_info_placeholder` column is explicitly named "placeholder" indicating it is a temporary stand-in for proper payout account data (IBAN, bank details). It is collected during onboarding but not validated or used anywhere.
- Files: `lib/actions/onboarding.ts`, `supabase/migrations/20260528000001_initial_schema.sql`, `types/database.ts`
- Impact: Sensitive-adjacent data (payout info) is stored unstructured. When actual payout logic is built this field needs migration to a proper format or a dedicated table.
- Fix approach: Before Phase 4, define the payout data structure (IBAN, account holder name), migrate the column to a JSONB or a dedicated `teacher_payout_accounts` table with appropriate encryption at rest.

## Security Considerations

**Role set via client-controlled form data during signup:**
- Risk: `lib/actions/auth.ts` reads `role` directly from `FormData` and passes it into `supabase.auth.signUp` user metadata. An attacker can POST `role=admin` to create an admin account.
- Files: `lib/actions/auth.ts`
- Current mitigation: The `signUp` action validates that role is only `"student"` or `"teacher"`, so admin account creation via signup is blocked. However the validation relies on application-layer checks rather than database constraints.
- Recommendations: Consider removing role from the signup form entirely and setting it only from a hidden field pre-filled by the UI (student vs. teacher path), or enforce the restriction in the `handle_new_user` trigger which already defaults unknown roles to `"student"`.

**Auth callback `next` redirect parameter is not validated beyond `startsWith("/")`:**
- Risk: `app/auth/callback/route.ts` accepts a `next` query parameter and redirects to it after OAuth code exchange. The only validation is `next.startsWith("/")`, which allows redirect to any same-origin path.
- Files: `app/auth/callback/route.ts`
- Current mitigation: Same-origin only (relative path check). No cross-origin redirect risk exists.
- Recommendations: Acceptable for same-origin redirects; no change required unless the origin check is removed in future.

**Avatar upload uses file extension from original filename with no server-side MIME validation:**
- Risk: `lib/actions/onboarding.ts` uploads avatar files to `avatars/{user_id}/avatar.{ext}` using the file extension from the original filename. The `accept="image/*"` restriction is client-side only.
- Files: `lib/actions/onboarding.ts`, `components/onboarding/teacher-onboarding-form.tsx`
- Current mitigation: Supabase Storage bucket policies may apply size/type limits (see `supabase/migrations/20260528000003_storage.sql`).
- Recommendations: Add server-side MIME type validation (check `avatarFile.type`) in the server action before uploading.

## Performance Bottlenecks

**Student dashboard makes 3 sequential Supabase queries:**
- Problem: `lib/queries/student.ts` runs `students` lookup, then `student_credits` lookup, then `bookings` lookup in sequence.
- Files: `lib/queries/student.ts`
- Cause: No use of `Promise.all` for independent queries.
- Improvement path: Parallelise the credits and bookings queries with `Promise.all` after the initial student id lookup.

**Teacher dashboard makes 4 sequential Supabase queries:**
- Problem: `lib/queries/teacher-dashboard.ts` runs a `teachers` select then 3 separate `bookings` count queries sequentially.
- Files: `lib/queries/teacher-dashboard.ts`
- Cause: Same sequential await pattern as student dashboard.
- Improvement path: Parallelise the 3 booking count queries with `Promise.all` after the teacher id lookup. Alternatively, consolidate into a single SQL query or Supabase RPC.

**Student dashboard loads all approved teachers then slices to 3:**
- Problem: `app/[locale]/student/dashboard/page.tsx` calls `getApprovedTeachers()` which fetches all approved teachers with full join data, then `.slice(0, 3)` discards the rest.
- Files: `app/[locale]/student/dashboard/page.tsx`, `lib/queries/teachers.ts`
- Cause: No `.limit()` applied in `getApprovedTeachers`.
- Improvement path: Add a `limit` parameter to `getApprovedTeachers` and pass `3` from the dashboard call.

## Fragile Areas

**Middleware performs up to 2 Supabase round-trips per protected request:**
- Files: `lib/supabase/middleware.ts`
- Why fragile: For authenticated users hitting protected routes, the middleware calls `supabase.auth.getUser()` (1 round-trip) and then separately queries `profiles` for role and onboarding status (1 additional round-trip). This runs on every navigation within the dashboard.
- Safe modification: Add the role and `onboarding_completed` flag to the Supabase JWT claims via a `handle_new_user` trigger update so middleware can read from the session token without a DB query.
- Test coverage: No tests exist for middleware routing logic.

**`getProfile` and `requireProfile` both call `supabase.auth.getUser()` independently:**
- Files: `lib/auth/session.ts`
- Why fragile: Any server component or action that calls `requireProfile` triggers two Supabase client creations and two `getUser` calls. If session state changes between calls on the same request the results could diverge.
- Safe modification: Accept an optional pre-resolved user as a parameter, or use React `cache()` to deduplicate within a single request.
- Test coverage: None.

**`as unknown as TeacherRow[]` type casting is used throughout teacher queries:**
- Files: `lib/queries/teachers.ts`
- Why fragile: Supabase's generated TypeScript types don't match nested join shapes, requiring double casting. If the query shape changes TypeScript will not catch the mismatch.
- Safe modification: Generate accurate types with the Supabase CLI (`supabase gen types typescript`) and replace manual casting with the generated types.
- Test coverage: None.

## Missing Critical Features

**No admin interface for teacher approval:**
- Problem: `teachers.is_approved` must be set to `true` for a teacher to appear in listings. There is no UI to do this — it currently requires direct database access.
- Blocks: All teacher discovery and booking flows are blocked until at least one teacher is manually approved.

**No email verification flow:**
- Problem: `supabase.auth.signUp` is called without `emailRedirectTo`. There is no "check your email" page or state handling for unconfirmed accounts.
- Files: `lib/actions/auth.ts`
- Blocks: Users may be redirected to onboarding immediately after signup even if their email is unconfirmed, depending on Supabase project configuration.

**No password reset flow:**
- Problem: No forgot-password page, no `supabase.auth.resetPasswordForEmail` call, and no password update action exist.
- Files: `app/[locale]/login/page.tsx`, `components/auth/auth-form.tsx`
- Blocks: Users who forget passwords have no self-service recovery path.

**No review or rating UI:**
- Problem: `reviews` table exists in schema with full RLS, but there are no queries, actions, or UI for submitting or displaying reviews/ratings.
- Files: `supabase/migrations/20260528000001_initial_schema.sql`
- Blocks: Teacher profiles cannot show social proof; trust signal is missing for student acquisition.

## Test Coverage Gaps

**Zero test files exist across the entire codebase:**
- What's not tested: All server actions (`lib/actions/`), all queries (`lib/queries/`), all auth/session utilities (`lib/auth/session.ts`), middleware routing (`lib/supabase/middleware.ts`), i18n helpers (`lib/i18n/`), and all UI components.
- Files: Entire `lib/` and `components/` directories.
- Risk: Any refactoring of auth flow, credit calculation, or booking state machine can break silently. The credit math in `lib/queries/student.ts` (`total_credits - used_credits - reserved_credits`) is particularly high-risk to regress without tests.
- Priority: High — implement at minimum unit tests for `lib/queries/student.ts`, `lib/actions/auth.ts`, `lib/actions/onboarding.ts`, and `lib/supabase/middleware.ts`.

---

*Concerns audit: 2026-05-28*
