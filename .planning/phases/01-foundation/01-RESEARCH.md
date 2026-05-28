# Phase 1: Foundation - Research

**Researched:** 2026-05-28
**Domain:** Supabase schema migrations, PostgreSQL RPC functions, Supabase Auth email flows, Next.js 16 App Router Server Actions
**Confidence:** HIGH — all findings derived from direct codebase inspection (schema, actions, trigger code) or local Next.js 16 docs in node_modules

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User sees a "check your email" confirmation page after signing up | `signUp()` in `lib/actions/auth.ts` currently redirects directly to onboarding after signup with no email verification step; needs `emailRedirectTo` added and a new `/verify-email` page |
| AUTH-02 | User can verify their email via the link sent to their inbox | `app/auth/callback/route.ts` already performs `exchangeCodeForSession(code)` — this handler is the correct landing point for the verification link; needs URL routing awareness |
| AUTH-03 | User can request a password reset from the login page | No forgot-password page, no `resetPasswordForEmail` call exists anywhere in the codebase |
| AUTH-04 | User can set a new password via the emailed reset link | No update-password page or `updateUser({ password })` call exists; `app/auth/callback/route.ts` handles the inbound code but currently only routes to dashboard |
| TIER-01 | Teacher level stored as `junior` / `academigo_teacher` / `verified`; `standard` value migrated | Schema has `CHECK (teacher_level IN ('standard', 'verified'))` — 2-value constraint; migration required before any tier UI is built |
</phase_requirements>

---

## Summary

Phase 1 is entirely backend and auth plumbing — no new user-facing features beyond the auth flows. The work divides into three distinct tracks that are nearly independent: (1) the SQL migration track (schema corrections + atomic RPC functions), (2) the auth completion track (email verification + password reset), and (3) the security patch (handle_new_user trigger).

The schema track is the highest-leverage work. `teachers.teacher_level` currently has a 2-value CHECK constraint (`standard`, `verified`) that is incompatible with the 3-tier product requirement. All existing teacher rows have `teacher_level = 'standard'`. The migration must drop the old constraint, add a new one with the correct three values (`junior`, `academigo_teacher`, `verified`), migrate existing rows from `standard` → `junior`, and update `types/database.ts` to match. Three atomic Supabase RPC functions are also required now: `create_booking`, `complete_booking`, and `cancel_booking`. Defining them in Phase 1 is the right choice — they will be called by Phase 3 application code, and having them stable in the DB reduces risk during the booking implementation sprint.

The auth completion track involves two flows — email verification and password reset — using Supabase Auth's built-in mechanisms. Both flows route through the existing `app/auth/callback/route.ts` Route Handler which already calls `exchangeCodeForSession`. The handler needs to be extended to distinguish verification callbacks from password-reset callbacks and route accordingly. The security patch (handle_new_user trigger) is a single-line SQL change that takes 5 minutes but has outsized risk reduction value.

**Primary recommendation:** Write and apply migrations first (schema + RPCs + trigger patch), regenerate `types/database.ts`, then implement the two auth flows. Each track can be planned as a separate task wave with no cross-dependencies.

---

## Standard Stack

### Core (existing — do not change)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.2.6 | Page routing, Server Actions, Route Handlers | Project framework; breaking changes from prior versions — read `node_modules/next/dist/docs/` |
| React | 19.2.4 | UI | Project UI library; `useActionState` is the stable form API |
| `@supabase/supabase-js` | ^2.106.2 | DB queries, auth calls | Project data layer |
| `@supabase/ssr` | ^0.10.3 | SSR-safe Supabase client creation | Used in `lib/supabase/server.ts` and `lib/supabase/middleware.ts` |
| Tailwind CSS | ^4 | Styling | v4 — `@import "tailwindcss"` syntax, not v3 `@tailwind` directives |
| Zod | ^4.4.3 | Schema validation in Server Actions | v4 — breaking API changes from v3; project already uses it |

### Supporting (existing)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sonner` | ^2.0.7 | Toast notifications | Use for success/error feedback on new auth flows |
| `lucide-react` | ^1.17.0 | Icons | Import via `@/lib/icons` barrel, not directly |
| `clsx` + `tailwind-merge` | ^2.1.1 / ^3.6.0 | Class merging | Use `cn()` from `@/lib/utils` |

### New Dependencies Required

**None.** Phase 1 requires no new npm packages. All work is SQL migrations, TypeScript type updates, and Server Actions using the existing Supabase client.

---

## Architecture Patterns

### Recommended Project Structure for Phase 1 Additions

```
app/
└── [locale]/
    ├── verify-email/
    │   └── page.tsx           # AUTH-01: "check your email" static page
    ├── forgot-password/
    │   └── page.tsx           # AUTH-03: request reset link form
    └── update-password/
        └── page.tsx           # AUTH-04: set new password form (requires valid session from callback)

lib/
└── actions/
    └── auth.ts                # Add: requestPasswordReset(), updatePassword() — same file as existing signUp/signIn

app/
└── auth/
    └── callback/
        └── route.ts           # Extend: distinguish verification vs password-reset callbacks via ?type= param

supabase/
└── migrations/
    ├── 20260528000004_teacher_level_migration.sql   # TIER-01: constraint + data migration
    ├── 20260528000005_booking_rpcs.sql              # create_booking, complete_booking, cancel_booking
    └── 20260528000006_security_patch.sql            # handle_new_user trigger fix (AUTH-04/SEC-01)

types/
└── database.ts                # Updated after migrations to reflect new teacher_level values + new RPC sigs
```

### Pattern 1: Supabase Auth Email Verification Flow

**What:** After `signUp()`, redirect to a static "check your email" page rather than directly to onboarding. The verification link Supabase emails routes to `app/auth/callback/route.ts?type=signup`.

**When to use:** For AUTH-01 and AUTH-02.

**How it works:**

Step 1 — modify `signUp()` in `lib/actions/auth.ts`:
```typescript
// Source: @supabase/supabase-js auth.signUp() options
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { role, full_name: fullName },
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=signup&next=${encodeURIComponent(localizedPath(locale, role === "teacher" ? "/teacher/onboarding" : "/student/onboarding"))}`,
  },
});
// On success, redirect to verify-email page instead of onboarding:
redirect(localizedPath(locale, "/verify-email"));
```

Step 2 — new static page `app/[locale]/verify-email/page.tsx`:
- Server Component; reads from dictionary; displays "check your email" message
- No auth required (user is unconfirmed at this point)

Step 3 — extend `app/auth/callback/route.ts` to handle `?type=signup`:
```typescript
// Source: app/auth/callback/route.ts (existing)
// Already calls exchangeCodeForSession(code) correctly.
// After session exchange, read ?next param and redirect there.
// The signUp emailRedirectTo already encodes the onboarding path in ?next.
```

**Key constraint:** `NEXT_PUBLIC_SITE_URL` must be set in `.env.local`. For local dev: `http://localhost:3000`. For production: `https://academigo.xyz`.

### Pattern 2: Password Reset Flow

**What:** Two-step flow. Step A: user requests reset link (form → `resetPasswordForEmail`). Step B: user clicks emailed link → lands at callback → redirected to update-password page where they set a new password.

**When to use:** For AUTH-03 and AUTH-04.

**Step A — forgot-password page and action:**
```typescript
// New server action in lib/actions/auth.ts
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = await getActionLocale(formData);
  const dict = getDictionary(locale);
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: dict.auth.errors.emailPasswordRequired };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=recovery&next=${encodeURIComponent(localizedPath(locale, "/update-password"))}`,
  });
  if (error) return { error: error.message };
  // Return success state — do NOT redirect (email may not exist, security: don't confirm)
  return {};
}
```

**Step B — update-password page and action:**
The callback route handles `?type=recovery`: after `exchangeCodeForSession`, user has a session with `amr` containing `"email"`. Redirect to `/update-password`.

```typescript
// New server action in lib/actions/auth.ts
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = await getActionLocale(formData);
  const dict = getDictionary(locale);
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");
  if (!password || password.length < 8) return { error: dict.auth.errors.passwordTooShort };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect(localizedPath(locale, "/login"));
}
```

**Critical:** The update-password page must be accessible only when a valid session exists (from the recovery link). Add an auth check: if no session, redirect to `/forgot-password`.

### Pattern 3: teacher_level Schema Migration

**What:** ALTER the CHECK constraint on `teachers.teacher_level`, migrate existing rows, update the default.

**When to use:** For TIER-01. Must run before any application code that reads or writes teacher_level.

```sql
-- Source: supabase/migrations/20260528000001_initial_schema.sql (inspected directly)
-- Current: CHECK (teacher_level IN ('standard', 'verified'))
-- Target:  CHECK (teacher_level IN ('junior', 'academigo_teacher', 'verified'))

ALTER TABLE teachers DROP CONSTRAINT teachers_teacher_level_check;
ALTER TABLE teachers ADD CONSTRAINT teachers_teacher_level_check
  CHECK (teacher_level IN ('junior', 'academigo_teacher', 'verified'));
ALTER TABLE teachers ALTER COLUMN teacher_level SET DEFAULT 'junior';
UPDATE teachers SET teacher_level = 'junior' WHERE teacher_level = 'standard';
```

**After migration:** Update `types/database.ts` — the `teacher_level` field type in `TeachersRow` must change from `'standard' | 'verified'` to `'junior' | 'academigo_teacher' | 'verified'`. Also update `config/earnings.ts` which currently only defines rates for `standard` and `verified`.

### Pattern 4: Atomic Booking RPCs

**What:** Three PostgreSQL functions that execute multi-table writes atomically. Callers use `supabase.rpc('function_name', params)`.

**When to use:** Defined in Phase 1; called by Phase 3 `lib/services/bookings.ts`. Having them defined now means Phase 3 can implement the service layer against a stable DB interface.

**`create_booking` — with FOR UPDATE credit lock:**
```sql
-- Source: .planning/research/PITFALLS.md Pitfall 2, .planning/research/ARCHITECTURE.md Pattern 3
CREATE OR REPLACE FUNCTION create_booking(
  p_student_id UUID,
  p_teacher_id UUID,
  p_subject_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_credits_to_reserve INTEGER
) RETURNS UUID AS $$
DECLARE
  v_available INTEGER;
  v_booking_id UUID;
BEGIN
  -- Lock student credits row to prevent race condition
  SELECT (total_credits - used_credits - reserved_credits)
  INTO v_available
  FROM student_credits
  WHERE student_id = p_student_id
  FOR UPDATE;

  IF v_available < p_credits_to_reserve THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  INSERT INTO bookings (student_id, teacher_id, subject_id, start_time, end_time,
                         status, credits_reserved)
  VALUES (p_student_id, p_teacher_id, p_subject_id, p_start_time, p_end_time,
          'pending', p_credits_to_reserve)
  RETURNING id INTO v_booking_id;

  UPDATE student_credits
  SET reserved_credits = reserved_credits + p_credits_to_reserve,
      updated_at = now()
  WHERE student_id = p_student_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**`complete_booking` — consumes reserved credits, records earnings:**
```sql
CREATE OR REPLACE FUNCTION complete_booking(p_booking_id UUID) RETURNS void AS $$
DECLARE
  v_booking bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;

  IF v_booking.status != 'confirmed' THEN
    RAISE EXCEPTION 'invalid_booking_status';
  END IF;

  UPDATE bookings SET status = 'completed', updated_at = now()
  WHERE id = p_booking_id;

  UPDATE student_credits
  SET used_credits = used_credits + v_booking.credits_reserved,
      reserved_credits = reserved_credits - v_booking.credits_reserved,
      updated_at = now()
  WHERE student_id = v_booking.student_id;

  INSERT INTO teacher_earnings (teacher_id, booking_id, amount, status)
  SELECT v_booking.teacher_id, p_booking_id, t.payout_rate, 'available'
  FROM teachers t WHERE t.id = v_booking.teacher_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**`cancel_booking` — releases reserved credits with state validation:**
```sql
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID) RETURNS void AS $$
DECLARE
  v_booking bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;

  IF v_booking.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'booking_not_cancellable';
  END IF;

  UPDATE bookings SET status = 'cancelled', updated_at = now()
  WHERE id = p_booking_id;

  -- Only release reserved credits (not used — those were never consumed for pending/confirmed)
  UPDATE student_credits
  SET reserved_credits = reserved_credits - v_booking.credits_reserved,
      updated_at = now()
  WHERE student_id = v_booking.student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Pattern 5: handle_new_user Security Patch

**What:** Change the DB trigger to strip `role=admin` from signup metadata. Currently the trigger accepts `admin` as a valid role from `raw_user_meta_data`, which means a direct POST to the Supabase Auth API with `data.role="admin"` creates an admin profile.

**Current buggy code (line 225–226 of initial schema):**
```sql
user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
IF user_role NOT IN ('student', 'teacher', 'admin') THEN  -- 'admin' is accepted!
  user_role := 'student';
END IF;
```

**Fixed replacement:**
```sql
-- Source: .planning/codebase/CONCERNS.md Security section, .planning/research/PITFALLS.md Pitfall 4
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Only accept 'teacher' from metadata; everything else (including 'admin') defaults to 'student'
  user_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' = 'teacher' THEN 'teacher'
    ELSE 'student'
  END;
  user_email := NEW.email;
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  INSERT INTO profiles (user_id, role, full_name, email)
  VALUES (NEW.id, user_role, user_name, user_email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

This must be deployed as a new migration (not an edit to the existing migration file) since the initial schema has already been applied.

### Pattern 6: types/database.ts Update (Post-Migration)

After each migration, `types/database.ts` must be manually updated. The Supabase CLI command is:
```bash
npx supabase gen types typescript --project-id <project-id> --schema public > types/database.ts
```
However, since types are hand-maintained (per STRUCTURE.md and the `as unknown as TeacherRow[]` cast pattern in `lib/queries/teachers.ts`), the update may also be done manually by editing the `teacher_level` union type. The planner should treat type regeneration as an explicit task step after each migration.

### Anti-Patterns to Avoid

- **Editing existing migration files:** Supabase migrations are append-only. New changes must be new files with a timestamp after the last applied migration (`20260528000003_storage.sql`). Use timestamps `20260528000004_*` and above.
- **Skipping emailRedirectTo:** Without it, `signUp()` sends an email with no working link (or uses the Supabase dashboard default which may point to the wrong domain). Always pass `emailRedirectTo`.
- **Returning success immediately on password reset request:** The action should return a neutral "check your email if it exists" message regardless of whether the email is in the system — do not confirm or deny account existence.
- **Using `request.json()` in the auth callback route:** The callback uses `GET` with query params, not a JSON body. This is not an issue today but is worth noting for future Route Handler additions.
- **Missing `NEXT_PUBLIC_SITE_URL` env var:** Both `emailRedirectTo` and `resetPasswordForEmail`'s `redirectTo` depend on this. Without it, links in emails will be broken.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email sending for verification/reset | Custom SMTP integration | `supabase.auth.signUp({ options: { emailRedirectTo } })` and `supabase.auth.resetPasswordForEmail()` | Supabase handles email delivery, templates, and token generation |
| Session exchange from email link | Custom token parsing | `supabase.auth.exchangeCodeForSession(code)` in `app/auth/callback/route.ts` (already exists) | Handles PKCE flow, token expiry, and session creation |
| Credit-safe booking write | Multiple sequential Supabase `.update()` calls | Supabase RPC with `FOR UPDATE` lock | Concurrent requests will race without DB-level lock |
| Atomic booking state transition | Application-layer status checks + updates | PostgreSQL function with state validation | Enforces state machine rules at DB level, not just app layer |

**Key insight:** The auth email flows (verification and reset) are almost entirely handled by Supabase Auth — the application only needs to redirect correctly and exchange the code. The complexity is in routing, not in email infrastructure.

---

## Common Pitfalls

### Pitfall 1: emailRedirectTo Points to Wrong Domain in Production

**What goes wrong:** `NEXT_PUBLIC_SITE_URL` is set to `http://localhost:3000` in `.env.local` but forgotten in Vercel environment variables. Verification links in production emails direct users to localhost, where nothing responds.

**How to avoid:** Treat `NEXT_PUBLIC_SITE_URL` as a required env var. Set it in Vercel project settings to `https://academigo.xyz` before deploying.

**Warning signs:** Verification links contain "localhost" in the URL text.

### Pitfall 2: Auth Callback Routes to Wrong Destination After Verification

**What goes wrong:** `app/auth/callback/route.ts` currently redirects to `/student/dashboard` as a fallback after a successful code exchange. If a new teacher clicks their verification link, they will land on the student dashboard.

**How to avoid:** Pass the correct onboarding destination in the `?next=` parameter when constructing `emailRedirectTo`. The callback already reads and uses the `next` param — it just needs to be populated by `signUp()`.

**Warning signs:** Teachers land on student dashboard after email verification.

### Pitfall 3: update-password Page Accessible Without Recovery Session

**What goes wrong:** A user who navigates directly to `/update-password` without having clicked a recovery link will hit a page that calls `supabase.auth.updateUser({ password })` but has no valid session. The call fails with a confusing error or is silently ignored.

**How to avoid:** Add a session check at the top of the update-password Server Component. If `getUser()` returns null, redirect to `/forgot-password`.

**Warning signs:** Direct navigation to `/update-password` shows a password form to unauthenticated users.

### Pitfall 4: admin Bypass via Signup Metadata (MUST FIX before Phase 2)

**What goes wrong:** The current `handle_new_user` trigger accepts `role=admin` from `raw_user_meta_data`. A direct POST to the Supabase Auth API with `data.role="admin"` creates a full admin profile row, bypassing all Next.js application-layer validation. This user then has admin access to all RLS-unrestricted tables.

**How to avoid:** Apply the security patch migration before any Phase 2 work begins. The fix is a single `CREATE OR REPLACE FUNCTION` statement.

**Warning signs:** `SELECT * FROM profiles WHERE role = 'admin'` returns rows that were not created by manual DB insert.

### Pitfall 5: teacher_level Column Migration Breaks Existing TypeScript

**What goes wrong:** After migrating the DB constraint, the old union type `'standard' | 'verified'` in `types/database.ts` still type-checks correctly (TypeScript has stale types). Application code passes `'junior'` to the DB but TypeScript doesn't flag it as valid. This creates a false sense of type safety.

**How to avoid:** Update `types/database.ts` immediately after applying the migration. Run `tsc --noEmit` to catch all downstream type errors. Expect errors in `config/earnings.ts` and anywhere `teacher_level` is compared or displayed.

**Warning signs:** TypeScript allows `teacher_level = 'standard'` as a valid value after the migration.

### Pitfall 6: RPC Function Names Must Match TypeScript Call Sites Exactly

**What goes wrong:** An RPC defined as `create_booking` in SQL but called as `supabase.rpc('createBooking', ...)` in TypeScript will fail silently at runtime (Supabase returns an error from the DB that may be swallowed).

**How to avoid:** Use snake_case function names in SQL and match them exactly in `supabase.rpc()` calls. Document the exact function signature (parameter names and types) in comments at the call site. When types are regenerated from the Supabase CLI, RPC function signatures appear in `Database["public"]["Functions"]`.

---

## Code Examples

### Verified Pattern: signUp with emailRedirectTo

```typescript
// Source: lib/actions/auth.ts (existing pattern) + Supabase Auth signUp options
// (Supabase @supabase/supabase-js ^2.106.2)
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { role, full_name: fullName },
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=signup&next=${encodeURIComponent(
      localizedPath(locale, role === "teacher" ? "/teacher/onboarding" : "/student/onboarding")
    )}`,
  },
});
if (error) return { error: error.message };
redirect(localizedPath(locale, "/verify-email"));
```

### Verified Pattern: requestPasswordReset Server Action

```typescript
// Source: Supabase Auth resetPasswordForEmail; follows AuthState pattern from lib/actions/auth.ts
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = await getActionLocale(formData);
  const dict = getDictionary(locale);
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: dict.auth.errors.emailPasswordRequired };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=recovery&next=${encodeURIComponent(
      localizedPath(locale, "/update-password")
    )}`,
  });
  if (error) return { error: error.message };
  return {}; // Empty state = success; UI renders "check your email" inline
}
```

### Verified Pattern: updatePassword Server Action

```typescript
// Source: Supabase Auth updateUser; follows AuthState pattern
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = await getActionLocale(formData);
  const dict = getDictionary(locale);
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");
  if (!password || password.length < 8) return { error: dict.auth.errors.passwordTooShort };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect(localizedPath(locale, "/login"));
}
```

### Verified Pattern: Calling an RPC from the Service Layer

```typescript
// Source: .planning/research/ARCHITECTURE.md Pattern 3
// lib/services/bookings.ts (Phase 3 will implement; RPCs defined in Phase 1)
export async function createBooking(params: {
  studentId: string;
  teacherId: string;
  subjectId: string;
  startTime: string;
  endTime: string;
  creditsToReserve: number;
}): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_booking", {
    p_student_id: params.studentId,
    p_teacher_id: params.teacherId,
    p_subject_id: params.subjectId,
    p_start_time: params.startTime,
    p_end_time: params.endTime,
    p_credits_to_reserve: params.creditsToReserve,
  });
  if (error) throw new Error(error.message);
  return data as string; // returns booking UUID
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useFormState` (React 18 experimental) | `useActionState` (React 19 stable) | React 19 release | The project already uses `useActionState` correctly — no change needed |
| Supabase v1 `auth.api.*` methods | Supabase v2 `auth.signUp()`, `auth.resetPasswordForEmail()` etc. | Supabase JS v2 | Project uses v2 already — use the direct method calls, not deprecated `.api.*` namespace |
| Manually managing email templates | Supabase Dashboard email templates | Always | Configure email templates in Supabase Dashboard (Auth > Email Templates) for verification and recovery |

**Deprecated/outdated:**
- `supabase.auth.api.resetPasswordForEmail()`: deprecated in v2; use `supabase.auth.resetPasswordForEmail()` directly
- Trigger allowing `admin` from signup metadata: must be replaced by the security patch migration

---

## Open Questions

1. **Supabase project email confirmation setting**
   - What we know: If the Supabase project has "Email confirmation required" disabled, `signUp()` auto-confirms the user and skips the verification email entirely. The "check your email" page would never be shown.
   - What's unclear: Whether the current project has this setting enabled or disabled.
   - Recommendation: Verify in Supabase Dashboard → Authentication → Settings → "Confirm email" toggle. Enable it before implementing AUTH-01/AUTH-02. This is a required dashboard configuration, not a code change.

2. **NEXT_PUBLIC_SITE_URL environment variable**
   - What we know: It is not currently referenced in any source file. The auth callback already uses `origin` from the request URL correctly. The `emailRedirectTo` pattern requires an absolute URL.
   - What's unclear: Whether to use `NEXT_PUBLIC_SITE_URL` (a convention) or derive the origin differently.
   - Recommendation: Add `NEXT_PUBLIC_SITE_URL=http://localhost:3000` to `.env.local` (or `.env.example`) and `NEXT_PUBLIC_SITE_URL=https://academigo.xyz` in Vercel. Use it consistently in both auth actions.

3. **auth/callback route typing for `type` parameter**
   - What we know: Supabase Auth sends `?type=signup` or `?type=recovery` as a query parameter when redirecting back after a link click. The existing callback route does not read or branch on this parameter.
   - What's unclear: Whether the route needs to differentiate `signup` from `recovery` redirects, or whether the `?next=` parameter alone is sufficient.
   - Recommendation: Rely on `?next=` for routing. The session type (signup vs recovery) matters for UI messaging but not for the code exchange itself. After `exchangeCodeForSession`, redirect to `next` regardless of `type`. The update-password page handles the recovery case by checking for a valid session.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — zero test files exist across the entire codebase |
| Config file | None — Wave 0 must create |
| Quick run command | `npx jest --testPathPattern=auth` (after Wave 0 setup) |
| Full suite command | `npx jest` (after Wave 0 setup) |

**Note:** The CONCERNS.md file explicitly confirms "Zero test files exist across the entire codebase." The project has no test runner, no test directory, and no test scripts in `package.json`. Given that `nyquist_validation` is enabled in config, Wave 0 must establish the test infrastructure.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | `signUp()` redirects to `/verify-email` (not `/onboarding`) when Supabase confirms signup | unit | `npx jest tests/actions/auth.test.ts -t "signUp redirects to verify-email"` | ❌ Wave 0 |
| AUTH-02 | `app/auth/callback/route.ts` exchanges code and redirects to `?next=` param destination | unit | `npx jest tests/routes/auth-callback.test.ts -t "handles signup callback"` | ❌ Wave 0 |
| AUTH-03 | `requestPasswordReset()` calls `resetPasswordForEmail` with correct `redirectTo` | unit | `npx jest tests/actions/auth.test.ts -t "requestPasswordReset"` | ❌ Wave 0 |
| AUTH-04 | `updatePassword()` calls `updateUser` and redirects to login on success | unit | `npx jest tests/actions/auth.test.ts -t "updatePassword"` | ❌ Wave 0 |
| TIER-01 | `teachers.teacher_level` rejects `standard`, accepts `junior`/`academigo_teacher`/`verified` | manual-only | N/A — requires live Supabase DB | ❌ manual |
| SEC | `handle_new_user` trigger rejects `role=admin` from signup metadata | manual-only | N/A — requires live Supabase DB | ❌ manual |
| RPC | `create_booking` raises on insufficient credits | manual-only | N/A — requires live Supabase DB | ❌ manual |
| RPC | `complete_booking` raises on non-confirmed booking | manual-only | N/A — requires live Supabase DB | ❌ manual |
| RPC | `cancel_booking` raises on already-completed booking | manual-only | N/A — requires live Supabase DB | ❌ manual |

**Manual-only justification for DB tests:** These require a running Supabase instance (local or hosted). For a solo developer on a tight cycle, running manual SQL test scripts against a dev database is a pragmatic substitute for full integration test infrastructure. The planner should include explicit manual verification steps for each migration/RPC.

### Sampling Rate

- **Per task commit:** `npx jest tests/actions/auth.test.ts` (unit tests for modified action)
- **Per wave merge:** `npx jest` (full suite, once established)
- **Phase gate:** Full suite green + manual DB verification of migrations before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/actions/auth.test.ts` — unit tests for `signUp`, `requestPasswordReset`, `updatePassword` with mocked Supabase client
- [ ] `tests/routes/auth-callback.test.ts` — unit test for callback route logic with mocked `exchangeCodeForSession`
- [ ] `jest.config.ts` — configure Jest with Next.js transformer (`next/jest`)
- [ ] `package.json` test script: `"test": "jest"`
- [ ] Framework install: `npm install --save-dev jest @types/jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom` — no test runner currently installed

---

## Sources

### Primary (HIGH confidence)

- `supabase/migrations/20260528000001_initial_schema.sql` — direct inspection of `handle_new_user` trigger (line 218–240), `teachers.teacher_level` constraint (line 48), existing RPC helper `student_available_credits` (line 261–268)
- `lib/actions/auth.ts` — direct inspection confirms: no `emailRedirectTo`, redirects to onboarding immediately, no password reset functions exist
- `app/auth/callback/route.ts` — direct inspection confirms: `exchangeCodeForSession` already implemented, `?next=` param already honored
- `components/auth/auth-form.tsx` — direct inspection: `LoginForm` has no forgot-password link; `SignUpForm` role selector is a `<select>` (user-controlled)
- `.planning/codebase/CONCERNS.md` — authoritative list of missing features, security issues, zero test coverage
- `.planning/research/PITFALLS.md` — Pitfall 4 (admin bypass), Pitfall 6 (teacher_level schema), Pitfall 2 (credit race condition), Pitfall 3 (booking state machine)
- `.planning/research/ARCHITECTURE.md` — Pattern 3 (Supabase RPC atomic booking), Pattern 2 (webhook raw body)
- `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` — Server Actions pattern confirmation

### Secondary (MEDIUM confidence)

- Supabase Auth `signUp({ options: { emailRedirectTo } })` API — training data; behavior consistent with `@supabase/supabase-js ^2.106.2` which is installed
- Supabase Auth `resetPasswordForEmail(email, { redirectTo })` API — training data; same version caveat
- Supabase Auth `updateUser({ password })` API — training data; same version caveat
- Supabase `?type=signup` / `?type=recovery` callback query parameters — training data; documented Supabase Auth behavior

### Tertiary (LOW confidence)

- None — all critical claims are verified against the local codebase or local Next.js docs

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new dependencies; existing stack read from `package.json` and `node_modules`
- Architecture: HIGH — auth patterns derived from existing `lib/actions/auth.ts` and `app/auth/callback/route.ts` source; RPC pattern from established project research
- Migration SQL: HIGH — schema read directly from `supabase/migrations/20260528000001_initial_schema.sql`; constraint text exact
- Auth API calls: MEDIUM — Supabase JS v2 API signatures from training data; version installed matches expected range
- Pitfalls: HIGH — derived from direct code inspection of the trigger, schema, and auth action

**Research date:** 2026-05-28
**Valid until:** 2026-07-01 (stable APIs; only invalidated by Supabase JS major version bump)
