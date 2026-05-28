# Domain Pitfalls

**Domain:** Swiss tutoring marketplace (payments, booking state machine, admin portal, teacher tiers)
**Researched:** 2026-05-28
**Confidence:** HIGH — derived from direct codebase analysis plus known Stripe/Supabase/marketplace failure patterns

---

## Critical Pitfalls

Mistakes that cause data corruption, money loss, security holes, or full rewrites.

---

### Pitfall 1: Stripe Webhook Delivered Multiple Times — Credits Granted Twice

**What goes wrong:**
Stripe guarantees at-least-once delivery. If `/api/webhooks/stripe` returns a non-2xx response (even transiently — timeout, cold start, database hiccup), Stripe retries the same `checkout.session.completed` event. Without idempotency guards a student receives double credits for one payment.

**Why it happens:**
The naive implementation is:
```
on webhook → increment student_credits.total_credits += package.credits
```
There is no check for whether this specific Stripe session was already processed.

**Consequences:**
Credits are real money. A student who buys a 5-credit pack and receives 10 can book sessions without paying for them. Reverting requires manual DB edits and refund handling.

**Prevention:**
- Store `stripe_session_id` in `payments` table (already in schema — use it as a unique constraint check).
- Before granting credits: check `SELECT 1 FROM payments WHERE stripe_session_id = $1 AND status = 'completed'`. If row exists, return 200 and stop.
- Use a Supabase RPC that does the idempotency check and credit grant atomically in one transaction.
- Verify the webhook signature using `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`. Reject unsigned events with 400 before any DB work.

**Detection:**
- `student_credits.total_credits` significantly higher than `SUM(payments.credits_granted)` for that student.
- Duplicate rows in `payments` with identical `stripe_session_id`.

**Phase:** Stripe integration phase. Must be addressed before any webhook handler ships.

---

### Pitfall 2: Credit Reservation Race Condition — Booking Overdraft

**What goes wrong:**
Two students (or two browser tabs for the same student) submit booking requests within milliseconds. Both read `available_credits = total - used - reserved = 1`. Both see 1 credit available. Both proceed to insert a booking and increment `reserved_credits`. The student ends up with `reserved_credits = 2` but only `total_credits = 1`, producing a negative available balance.

**Why it happens:**
The current credit calculation is a derived formula: `total_credits - used_credits - reserved_credits` (visible in `lib/queries/student.ts` and the `student_available_credits` SQL function). There is no database-level lock preventing two concurrent reads from seeing the same balance before either write completes.

**Consequences:**
Students book sessions they have not paid for. Reversals require manual credit adjustments and cancellations.

**Prevention:**
- Implement booking creation as a Supabase RPC (PostgreSQL function) that runs the entire operation in a single transaction with a row-level lock:
  ```sql
  BEGIN;
  SELECT * FROM student_credits WHERE student_id = $1 FOR UPDATE;
  -- check available > 0
  UPDATE student_credits SET reserved_credits = reserved_credits + 1 WHERE student_id = $1;
  INSERT INTO bookings (...) VALUES (...);
  COMMIT;
  ```
- The `FOR UPDATE` lock ensures concurrent requests queue rather than race.
- Never implement reserve/release as separate application-layer reads and writes.

**Detection:**
- `student_credits.reserved_credits + used_credits > total_credits` for any row.
- Multiple `pending` bookings for the same student when available credits should be 0.

**Phase:** Booking state machine phase (BookingService implementation). This is the highest-risk technical area in the entire milestone.

---

### Pitfall 3: Booking State Machine Implemented as Ad-Hoc Updates

**What goes wrong:**
Without enforcing valid state transitions at the database level, application bugs (or direct DB access) can produce impossible states: a `completed` booking that reverts to `pending`, a `cancelled` booking that gets `confirmed`, credits released twice.

**Why it happens:**
The `bookings.status` column has a CHECK constraint for valid string values but no enforcement of which transitions are legal. Any UPDATE that sets a valid status string will succeed.

**Consequences:**
- Credit double-release: `reserved_credits` decremented twice when a booking is rejected then cancelled.
- Teacher earnings recorded for a cancelled session.
- Student charged for a session that never happened.

**Prevention:**
- Implement all state transitions as Supabase RPCs that validate the current state before updating:
  ```sql
  -- In accept_booking RPC:
  IF (SELECT status FROM bookings WHERE id = $1) != 'pending' THEN
    RAISE EXCEPTION 'booking is not pending';
  END IF;
  ```
- Document the allowed transition graph explicitly before writing code:
  `pending → confirmed` (teacher accepts)
  `pending → rejected` (teacher rejects) — releases reserved credit
  `confirmed → completed` (session occurs) — moves reserved to used, records earning
  `confirmed → cancelled` (either party) — releases reserved credit
  `pending → cancelled` (student withdraws) — releases reserved credit
- Never allow application code to set `status` directly via a generic UPDATE; always go through the RPC.

**Detection:**
- `reserved_credits` or `used_credits` out of sync with booking statuses for a student.
- `teacher_earnings` rows exist for bookings with status `rejected` or `cancelled`.

**Phase:** Booking state machine phase. Define the transition graph before writing any code.

---

### Pitfall 4: Admin Portal Authorization Bypass via RLS Helper Functions

**What goes wrong:**
The entire RLS model relies on `auth_is_admin()` which queries `profiles WHERE user_id = auth.uid() AND role = 'admin'`. The `handle_new_user` trigger sets `role` from `raw_user_meta_data->>'role'`. The `signUp` action in `lib/actions/auth.ts` does validate that role is only `student` or `teacher`, but this is application-layer validation only. A direct API call to Supabase Auth's signup endpoint with `role=admin` in metadata would bypass the Next.js action and create an admin-role profile, giving that user full access to all RLS-unrestricted admin operations.

**Why it happens:**
The `handle_new_user` trigger (line 225–226 of the schema) accepts `admin` as a valid role: `IF user_role NOT IN ('student', 'teacher', 'admin') THEN user_role := 'student'`. This means the trigger will happily set `role = 'admin'` if the metadata contains it.

**Consequences:**
An attacker who POSTs directly to `https://<project>.supabase.co/auth/v1/signup` with `data.role = "admin"` gets an admin account with full read/write access to all tables.

**Prevention:**
- Change the `handle_new_user` trigger to only accept `student` or `teacher` from metadata, defaulting everything else to `student`:
  ```sql
  user_role := CASE WHEN NEW.raw_user_meta_data->>'role' = 'teacher' THEN 'teacher' ELSE 'student' END;
  ```
- Admin accounts must only be created via direct DB insert by a superuser, never via the public signup flow.
- Add a separate RLS policy check that admin routes in middleware also validate against the database (already done in middleware) — but this only protects Next.js routes, not direct Supabase API calls.

**Detection:**
- Presence of any profile with `role = 'admin'` that was created via the signup flow rather than manual DB insert.
- Audit the `profiles` table periodically: `SELECT * FROM profiles WHERE role = 'admin' ORDER BY created_at`.

**Phase:** Auth security hardening (early, before admin portal is built). This must be fixed before shipping the admin portal.

---

### Pitfall 5: Webhook Handler Runs as Authenticated User — Grants Credits to Wrong Student

**What goes wrong:**
Stripe webhooks arrive with no user session. If the webhook route uses the standard server Supabase client (which calls `createClient()` and is session-aware), it runs under the anonymous role. Without a service-role key, the webhook handler cannot write to `student_credits` because the RLS policy `student_credits_admin_update` only allows admins to update credits, and there is no INSERT policy for webhooks.

The common workaround — using the Supabase service-role key — is correct but dangerous if mishandled: the service-role key bypasses all RLS, so any bug in the webhook handler can write to any row without restriction.

**Why it happens:**
`student_credits` has `student_credits_admin_update` for UPDATE but no policy for INSERT from a service role. The webhook is neither student nor admin in the session sense.

**Consequences:**
- Credits not granted at all (webhook fails silently, student paid but gets nothing).
- Or: service-role key exposed in client bundle if accidentally imported in a non-server file.

**Prevention:**
- Webhook route must use the Supabase **service-role** key via a server-only client, never the anon key.
- Keep the service-role key in `SUPABASE_SERVICE_ROLE_KEY` (never `NEXT_PUBLIC_*`).
- Grant credits via an RPC that takes `stripe_session_id` and `student_id` as parameters and does the idempotency check + credit update atomically. The RPC runs as `SECURITY DEFINER` so it inherits superuser rights without exposing the service key to application logic.
- Never import the service-role client in any file that could end up in the client bundle. Mark it `server-only`.

**Detection:**
- Students report paying but not receiving credits.
- `payments` rows with `status = 'pending'` that are hours old (webhook never completed).

**Phase:** Stripe integration phase.

---

### Pitfall 6: Teacher Tier Level Mismatch Between Schema and Product Requirements

**What goes wrong:**
The `teachers.teacher_level` column has `CHECK (teacher_level IN ('standard', 'verified'))` — a two-value enum. The product requires three tiers: Junior, Academigo Teacher, Verified. The existing schema is incompatible with the three-tier requirement. Similarly, `config/earnings.ts` only defines `standard` and `verified` rates.

**Why it happens:**
The schema was written before the three-tier requirement was finalized. The product spec says Junior (CHF 35–40), Academigo Teacher (CHF 45), Verified (CHF 50–60). The DB only supports two of these.

**Consequences:**
Building the tier promotion UI against the current schema and then migrating mid-flight breaks all existing teacher records and any RLS or application code referencing the old enum values.

**Prevention:**
- Write and run a migration before building any tier-related feature:
  ```sql
  ALTER TABLE teachers DROP CONSTRAINT teachers_teacher_level_check;
  ALTER TABLE teachers ADD CONSTRAINT teachers_teacher_level_check
    CHECK (teacher_level IN ('junior', 'academigo_teacher', 'verified'));
  UPDATE teachers SET teacher_level = 'junior' WHERE teacher_level = 'standard';
  ```
- Update `config/earnings.ts` to reflect three tiers with CHF ranges.
- Update all TypeScript types that reference `'standard' | 'verified'`.
- Do this migration in the first phase that touches teacher tiers, before any UI is built.

**Detection:**
- `teacher_level = 'standard'` rows after the three-tier system is deployed.
- TypeScript type errors on components consuming `teacher_level`.

**Phase:** Teacher tier system phase — migration must be the very first task.

---

## Moderate Pitfalls

---

### Pitfall 7: Availability Slot Double-Booking — No Booking-to-Slot Lock

**What goes wrong:**
When a student books a slot, the availability record's `is_booked` flag must be set atomically with the booking insert. If these are two separate operations, two students can both read `is_booked = false`, both proceed to insert a booking, and both mark the slot as booked — resulting in a double-booked session.

**Prevention:**
- In the booking creation RPC, include the availability slot update in the same transaction:
  ```sql
  UPDATE availability_slots SET is_booked = true WHERE id = $slot_id AND is_booked = false;
  -- check UPDATE affected 1 row; if 0, raise exception (slot taken)
  INSERT INTO bookings ...
  ```
- Use `GET DIAGNOSTICS affected = ROW_COUNT` to detect if the slot was already taken and raise an error the application can surface to the user.

**Detection:**
- Multiple `pending` or `confirmed` bookings referencing the same `availability_slots.id` (if that FK is added).
- Teacher seeing overlapping sessions in their calendar.

**Phase:** Availability and booking phase — must be part of the booking RPC design.

---

### Pitfall 8: Payout Requested Against Earnings Not Yet Available

**What goes wrong:**
A teacher submits a payout request for CHF 200 but their `teacher_earnings` contains CHF 150 in `available` status and CHF 50 in `pending` (session happened but admin hasn't confirmed). The payout is approved for CHF 200 and the balance goes negative.

**Why it happens:**
There is no check that `payout_requests.amount <= SUM(earnings WHERE status = 'available')` enforced at insert time.

**Prevention:**
- The payout request form must show only the `available` balance (not `pending`).
- The payout request insert action must validate server-side: compute available earnings and reject if request exceeds it.
- Admin approval UI must re-validate availability before processing (earnings could have been reversed between request and approval).

**Detection:**
- `payout_requests.amount > SUM(teacher_earnings.amount WHERE status = 'available' AND teacher_id = X)` for any given teacher.

**Phase:** Earnings and payouts phase.

---

### Pitfall 9: Admin Portal Without Its Own Authorization Layer

**What goes wrong:**
The middleware redirects admin users to `/admin/dashboard` and role-checks the prefix. But once admin pages are built, each page/action must independently verify `requireRole('admin')`. If a developer adds a new admin server action and forgets the role check, any authenticated user who calls that action directly (e.g. from browser DevTools) can execute it.

**Prevention:**
- Create a shared `requireAdmin()` utility (wrapping `requireRole('admin')`) and call it at the top of every admin server action and page.
- Do not rely solely on middleware for admin authorization — middleware can be bypassed by direct API calls.
- Add a layout-level auth check in `app/[locale]/admin/layout.tsx` as a second layer.

**Detection:**
- Admin server actions that do not call `requireAdmin()` at their first line.
- Any admin page that only relies on middleware and does not verify the session inside the page component.

**Phase:** Admin portal phase — establish the pattern before building any admin features.

---

### Pitfall 10: Redirect After Login Sends User to Unauthenticated `redirect` Parameter

**What goes wrong:**
`lib/actions/auth.ts` signIn reads `redirect` from FormData and redirects to it without validation beyond `startsWith("/")`. This was flagged in CONCERNS.md as acceptable, but if the booking flow later deep-links to `?redirect=/student/book/teacher/123`, an attacker can craft a link that sends a victim to `/student/malicious-path` after login if a path is ever added that performs destructive actions on load.

**Prevention:**
- Maintain a whitelist of valid redirect prefixes: `['/student/', '/teacher/', '/admin/']`.
- Reject any redirect that does not start with an approved prefix, defaulting to the role dashboard.
- Apply the same restriction in `app/auth/callback/route.ts` for the `next` parameter.

**Phase:** Auth completion phase.

---

### Pitfall 11: Booking Cancellation — Credit Release Without Status Validation

**What goes wrong:**
If a student calls the cancel-booking action on a booking that is already `completed` or `rejected`, the naive implementation could still decrement `reserved_credits`, producing a negative reserved balance.

**Prevention:**
- Cancellation RPC must validate that the booking is in a cancellable state (`pending` or `confirmed`) before releasing credits.
- Only release `reserved_credits` for `pending`/`confirmed` cancellations. For `completed` sessions credits were already moved to `used_credits` — no credit release.
- The state machine transition table (from Pitfall 3) must define cancellation clearly.

**Phase:** Booking state machine phase.

---

### Pitfall 12: Teacher Level Promotion — No Audit Trail

**What goes wrong:**
Admin promotes a teacher from Junior to Academigo Teacher. No record is kept of when the promotion happened, which admin approved it, or what the previous level was. If a dispute arises or a teacher is incorrectly promoted, there is no way to audit or roll back.

**Prevention:**
- Create a `teacher_level_history` table:
  ```sql
  CREATE TABLE teacher_level_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    old_level TEXT NOT NULL,
    new_level TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES profiles(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT
  );
  ```
- The admin approval action must insert into this table in the same transaction as the teachers UPDATE.

**Detection:**
- No history of level changes available when a teacher disputes their tier.

**Phase:** Teacher tier system phase.

---

## Minor Pitfalls

---

### Pitfall 13: Middleware 2-Round-Trip Tax on Every Protected Page Load

**What goes wrong:**
The current middleware calls `supabase.auth.getUser()` (one Supabase round-trip) then separately queries `profiles` for role and onboarding status (second round-trip) on every protected route. At scale or with slow connections, this adds 100–400ms to every page load.

**Prevention:**
- Store `role` and `onboarding_completed` in the Supabase JWT custom claims via the `handle_new_user` trigger (or a `custom_access_token` hook). Middleware reads from the token, no DB query needed.
- Alternatively, use `React.cache()` to deduplicate within a single request if the claim approach is deferred.

**Phase:** Can be deferred post-MVP, but should be addressed before production launch. Flag in middleware refactor task.

---

### Pitfall 14: Languages Field Produces Dirty Array Data

**What goes wrong:**
`lib/actions/onboarding.ts` splits the languages string on commas: `data.languages.split(",").map((l) => l.trim()).filter(Boolean)`. A teacher entering `"Deutsch, Englisch , Französisch"` with inconsistent spacing will get `["Deutsch", "Englisch", "Französisch"]`. A teacher entering `"Deutsch Englisch"` (space instead of comma) will get `["Deutsch Englisch"]` as a single language name. No error is shown.

**Prevention:**
- Replace the free-text input with a multi-select component backed by a predefined list of languages (Deutsch, Englisch, Französisch, Italienisch, Spanisch, etc.).
- If a free-text approach must be kept temporarily, add Zod refinement that validates each element matches a known language slug.

**Phase:** Teacher onboarding polish phase (can be done alongside tier system work since both touch the teacher form).

---

### Pitfall 15: `as unknown as TeacherRow[]` Type Casting Silences Schema Drift

**What goes wrong:**
`lib/queries/teachers.ts` uses `data as unknown as TeacherRow[]` because the Supabase JS client types don't reflect join shapes. When the `teacher_level` column is renamed or added fields are added, TypeScript will not catch the mismatch — the cast suppresses all inference. Runtime bugs will appear as undefined property reads.

**Prevention:**
- Run `npx supabase gen types typescript --project-id <id>` and use the generated types.
- When the three-tier migration adds a new level enum, regenerate types immediately and remove the double cast.
- At minimum, add a runtime Zod parse in the query function so shape mismatches surface as thrown errors during development.

**Phase:** Address during teacher tier phase when the schema changes require type regeneration anyway.

---

### Pitfall 16: `getProfile` and `requireProfile` Both Call `getUser()` Independently

**What goes wrong:**
Any server component or action that calls `requireProfile` triggers `createClient()` + `supabase.auth.getUser()` twice (once inside `requireProfile` and once inside `getProfile` which it calls). If called from a page that also calls other session helpers, the count multiplies.

**Prevention:**
- Wrap `supabase.auth.getUser()` in React's `cache()` so multiple calls within the same request are deduplicated to one network call.
- Example:
  ```ts
  import { cache } from 'react';
  export const getSessionUser = cache(async () => { ... });
  ```

**Phase:** Can be done during any phase touching `lib/auth/session.ts`. Low urgency but high leverage.

---

### Pitfall 17: No Tests — Credit Math Regression Risk

**What goes wrong:**
The credit formula `total_credits - used_credits - reserved_credits` is computed in three places: `lib/queries/student.ts` (application layer), `student_available_credits` (SQL function), and will be used in booking RPCs. If any of these drift (e.g., one uses `>=` and another uses `>`), students see incorrect balances without any automated alert.

**Prevention:**
- Write unit tests for the credit math before implementing the booking state machine.
- Write integration tests for the RPC that covers: insufficient credits, exact balance, concurrent reservation attempt.
- At minimum: test the `getStudentDashboardData` function with mocked Supabase client to verify the arithmetic.

**Phase:** Should begin during booking state machine phase. Defer broader test coverage to a dedicated quality phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Auth security hardening | Admin account created via public signup (Pitfall 4) | Fix `handle_new_user` trigger before admin portal ships |
| Teacher tier schema migration | Two-value enum conflicts with three-tier requirement (Pitfall 6) | Migration must be Phase 1 of tier work, before any UI |
| Stripe webhook handler | Duplicate credit grants on retry (Pitfall 1) | Idempotency check + signature verification before any DB write |
| Stripe webhook handler | Service-role key exposed or missing (Pitfall 5) | Server-only import, `SUPABASE_SERVICE_ROLE_KEY` never `NEXT_PUBLIC_*` |
| BookingService implementation | Credit overdraft race condition (Pitfall 2) | Single-transaction RPC with `FOR UPDATE` lock |
| BookingService implementation | Invalid state transitions (Pitfall 3) | Define transition graph first, enforce in RPC |
| BookingService implementation | Availability double-booking (Pitfall 7) | Atomic slot lock in booking RPC |
| Booking cancellation | Credit release on already-completed booking (Pitfall 11) | State validation before credit release in RPC |
| Admin portal build | Per-action auth bypass (Pitfall 9) | `requireAdmin()` at top of every admin action and page |
| Teacher tier promotion UI | No audit trail (Pitfall 12) | `teacher_level_history` table before promotion feature ships |
| Earnings and payouts | Payout exceeds available balance (Pitfall 8) | Server-side balance check on request insert and on admin approval |
| Teacher onboarding form | Dirty language array data (Pitfall 14) | Multi-select component before languages are used for filtering |

---

*Pitfalls audit: 2026-05-28. Based on direct codebase inspection of schema, RLS policies, server actions, and service stubs.*
