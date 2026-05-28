# Technology Stack Research

**Project:** Academigo — Swiss tutoring marketplace
**Milestone:** Phase 2+: Stripe payments, availability scheduling, booking state machine, teacher tier system, admin portal, earnings/payouts, reviews
**Researched:** 2026-05-28
**Overall confidence:** MEDIUM-HIGH (verified against local Next.js 16 docs; external library versions from training data cross-checked against package ecosystem knowledge; web search unavailable)

---

## Existing Stack (Do Not Change)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js (App Router) | 16.2.6 | Route Handlers for API; Server Actions for mutations |
| UI | React | 19.2.4 | Server + Client Components |
| Database + Auth | Supabase | @supabase/supabase-js ^2.106.2 | RLS on all tables |
| SSR client | @supabase/ssr | ^0.10.3 | createServerClient, createBrowserClient |
| Styling | Tailwind CSS | ^4 | v4 — @import "tailwindcss" syntax |
| Validation | Zod | ^4.4.3 | v4 — breaking changes from v3 |
| Animation | framer-motion | ^12.40.0 | shared variants in lib/motion.ts |
| Icons | lucide-react | ^1.17.0 | re-exported from lib/icons.ts |
| Toasts | sonner | ^2.0.7 | Toaster in app/layout.tsx |
| Class utils | clsx + tailwind-merge | ^2.1.1 / ^3.6.0 | standard combo |
| i18n | Custom (de/en) | — | No external library; dictionaries in messages/ |
| Deployment | Vercel | — | inferred from .gitignore + config |

---

## Recommended New Dependencies

### 1. Stripe Server SDK

**Package:** `stripe`
**Version:** `^17` (latest stable as of mid-2025; major version incremented from v15)
**Confidence:** MEDIUM — version from training data; verify with `npm show stripe version` before install

**Why:** Official Node.js SDK for creating Checkout Sessions, constructing webhook events, and (future) payouts. No alternative — Stripe's own SDK is the only supported way to use the Stripe API on the server side.

**Why not alternatives:**
- Raw `fetch` to Stripe API: no webhook signature verification, no TypeScript types, no retry logic — do not use
- `@stripe/stripe-js` alone: browser-only, cannot create sessions or verify webhooks on the server

**Installation:**
```bash
npm install stripe
```

**Environment variables to add:**
```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Usage pattern for this app:**
```typescript
// lib/stripe.ts — singleton (matches existing lib/ service pattern)
import Stripe from "stripe";
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia", // pin to explicit version, never "latest"
});
```

---

### 2. Stripe Browser SDK

**Package:** `@stripe/stripe-js`
**Version:** `^4` (latest stable as of mid-2025)
**Confidence:** MEDIUM — verify with `npm show @stripe/stripe-js version`

**Why:** Required to redirect the browser to a Stripe Checkout Session URL, or to embed Stripe Elements if needed in future. For the credit-pack purchase flow (redirect to Stripe Hosted Checkout), only `loadStripe` is needed client-side — the session URL is created server-side via Route Handler.

**Why not skipping it:** Without `loadStripe`, you cannot initialize Stripe on the client. Even a redirect-only flow should use `stripe.redirectToCheckout` or simply `window.location.href = session.url` — the latter requires no client SDK at all.

**Recommendation:** Start with pure redirect (`window.location.href = session.url`) from a Server Action. Add `@stripe/stripe-js` only if you later need Stripe Elements for custom payment UI. Do NOT add it speculatively.

**Confidence impact:** If redirect-only: no browser SDK needed (HIGH confidence). If Stripe Elements: add `@stripe/stripe-js` + `@stripe/react-stripe-js` (LOW confidence needed for this app — avoid).

---

### 3. Webhook Handler Pattern

**No new package needed.** Use a Next.js Route Handler at `app/api/stripe/webhook/route.ts`.

**Why Route Handler, not Server Action:**
- Stripe webhooks require reading the raw request body to verify the `stripe-signature` header
- Server Actions transform the request body into FormData — you cannot access the raw bytes
- Route Handlers expose the raw `Request` object; `await request.text()` gives the raw body string for `stripe.webhooks.constructEvent()`

**Why not an external webhook library:** Stripe's own `stripe.webhooks.constructEvent()` is the correct verification method. No additional library needed.

**Pattern:**
```typescript
// app/api/stripe/webhook/route.ts
export const dynamic = "force-dynamic"; // never cache webhook handler
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  // handle event.type === "checkout.session.completed"
  return Response.json({ received: true });
}
```

**Confidence:** HIGH — verified against Next.js 16 Route Handlers docs in node_modules.

---

### 4. Availability Scheduling UI

**Recommendation: Build a custom weekly grid using React state + Tailwind — no calendar library.**

**Rationale:** The availability model in this app is a recurring weekly schedule (teacher sets which hours they're available each week), stored as `availability_slots` rows with `start_time`, `end_time`, `is_recurring`, and `recurrence_rule`. This is a slot-picker, not a general-purpose calendar. A heavyweight calendar library is unnecessary and adds bundle weight.

**What to build:** A 7-column grid (Mon–Sun) × time-rows (e.g., 08:00–20:00 in 30-min blocks). Teacher clicks cells to toggle availability. State managed with `useState` (or `useReducer` for the slot grid). Persisted to Supabase via Server Action.

**Why not react-big-calendar:**
- Requires `moment` or `date-fns` adapter — adds weight
- Designed for event display (like Google Calendar), not slot-selection
- Significant styling friction with Tailwind v4

**Why not FullCalendar:**
- GPL license (v5 open source tier is GPL; v6 requires commercial license for some features)
- Overkill for a slot-picker

**Why not react-day-picker:**
- Single/multi-day date picker — wrong abstraction for time-slot weekly grids
- Good for unavailable-date selection (teacher blocks specific dates) — use it there if needed

**Confidence:** HIGH for custom grid recommendation; MEDIUM for react-day-picker as a date-blocker (could verify compatibility with React 19).

**For the student booking view:** Student sees teacher's available slots for the next 2–4 weeks as a list or simple calendar. A custom slot-list component (group slots by date, render as cards) is sufficient. No library needed.

---

### 5. Booking State Machine

**Recommendation: Implement as explicit Supabase RPC functions + TypeScript service layer — no state machine library.**

**Why no XState / Zag / Robot:** The booking state machine for this app has exactly 5 states: `pending → confirmed | rejected`, `confirmed → completed | cancelled`. This is small enough to implement as:
1. A TypeScript union type (`BookingStatus`) already defined in the schema
2. Supabase RPC functions that enforce valid transitions atomically (check current status + update in one transaction)
3. Server Actions that call those RPCs and handle errors

Adding XState v5 (or any state machine library) would add ~30KB+ to the bundle and introduce a new mental model for future maintainers — not justified for a 5-state linear workflow.

**When XState would be justified:** If booking had complex parallel states, delayed transitions, or actor-based coordination. Not applicable here.

**Confidence:** HIGH — recommendation based on the schema (`status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed'))`) and the existing codebase patterns (Server Actions + Supabase RPC).

**Implementation pattern:**
```typescript
// supabase/migrations/XXXXXX_booking_transitions.sql
CREATE OR REPLACE FUNCTION confirm_booking(p_booking_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE bookings
  SET status = 'confirmed'
  WHERE id = p_booking_id
    AND status = 'pending'  -- guard: only pending → confirmed allowed
    AND teacher_id = auth_teacher_id();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_transition';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 6. Teacher Tier System

**No new package.** Schema migration only.

**Current schema gap:** `teachers.teacher_level TEXT NOT NULL DEFAULT 'standard' CHECK (teacher_level IN ('standard', 'verified'))` — only 2 values. PROJECT.md requires 3: Junior, Academigo Teacher (Level 2), Verified (Level 3).

**Required migration:**
```sql
ALTER TABLE teachers
  DROP CONSTRAINT teachers_teacher_level_check;
ALTER TABLE teachers
  ADD CONSTRAINT teachers_teacher_level_check
  CHECK (teacher_level IN ('junior', 'academigo_teacher', 'verified'));
ALTER TABLE teachers
  ALTER COLUMN teacher_level SET DEFAULT 'junior';
```

**Confidence:** HIGH — schema is in local migrations, gap is verifiable.

---

### 7. Admin Portal

**Recommendation: Use existing Supabase server client + `auth_is_admin()` RLS function — no admin framework.**

**Why not a third-party admin panel (AdminJS, Payload CMS, Retool):** The admin portal requirements are simple: approve teachers, manage teacher levels, view bookings, process payouts, set pricing. All data is already in Supabase with RLS. Building these as standard Next.js App Router pages under `/admin/*` (already guarded in middleware) is faster and more maintainable than integrating an external admin framework.

**For admin data tables:** Build simple `<table>` components styled with Tailwind. No data-grid library needed at this scale.

**Confidence:** HIGH.

---

### 8. Date/Time Utilities

**Recommendation: Use native `Intl` APIs + a minimal date library if needed.**

**Assessment:** The app currently has no date utility library. For this milestone the needs are:
- Format `TIMESTAMPTZ` values for display (done with `Intl.DateTimeFormat` — no library needed)
- Add/subtract hours to calculate slot end times (use native `Date` arithmetic or a minimal helper)
- Parse time strings for the availability grid

**Recommendation: `date-fns` v3 if date arithmetic becomes complex; otherwise avoid.**

**Why date-fns over Luxon/day.js:**
- Tree-shakeable (only import what you use)
- No prototype mutation (unlike Moment.js)
- Strong TypeScript types in v3
- Integrates with `date-fns-tz` for timezone handling if Swiss timezone (Europe/Zurich) becomes relevant

**Why not Moment.js:** Deprecated. Do not use.
**Why not Luxon:** Heavier than date-fns for simple operations.
**Why not day.js:** Requires explicit plugin imports; less TypeScript-first than date-fns v3.

**Confidence:** MEDIUM — `date-fns` v3 released 2023; stable. Verify current version with `npm show date-fns version` before install.

**Only add if needed.** Start without it and add when the first date arithmetic gets complex.

---

### 9. Form Handling

**Recommendation: Continue with Zod v4 + native `useActionState` (React 19) — no form library.**

**Why:** The app already uses Zod v4 for validation. React 19's `useActionState` (the stable successor to the experimental `useFormState`) + `useFormStatus` covers progressive enhancement, pending state, and error display without additional libraries.

**Why not react-hook-form:** Adds client-side JS for validation that Zod + Server Actions handle server-side. For a marketplace with simple forms (booking request, review submission, payout request), the complexity is not justified.

**Confidence:** HIGH — `useActionState` is React 19 stable API; confirmed by React 19 release notes.

---

### 10. Admin Data Display

**Recommendation: Plain HTML `<table>` with Tailwind styling — no data grid library.**

**Why not TanStack Table (react-table v8):** For the admin portal scope (list of teachers, list of bookings, payout requests), server-side pagination via Supabase `.range()` + simple `<table>` is sufficient. TanStack Table adds complexity without clear benefit at this scale.

**Add TanStack Table only if:** The admin needs client-side sorting, filtering, or column pinning across thousands of rows — not a v1 requirement.

**Confidence:** HIGH.

---

## Environment Variables Required

Add to `.env.local`:

```
# Stripe (Phase: Payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

The publishable key is only needed if using Stripe.js on the client (for redirect-only flows, it is optional but good practice to include for future use).

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Stripe server | `stripe` npm SDK | Raw fetch to Stripe API | No webhook verification, no types, no retries |
| Webhook handler | Next.js Route Handler | Server Action | Server Actions cannot read raw request body |
| Availability UI | Custom Tailwind grid | react-big-calendar | Designed for event display; GPL/heavy; Tailwind friction |
| Availability UI | Custom Tailwind grid | FullCalendar | GPL v5; commercial v6; extreme overkill |
| Booking state | Supabase RPC guards | XState v5 | 5-state machine doesn't justify 30KB+ library |
| Admin portal | Custom Next.js pages | AdminJS / Retool | Overkill; data already in Supabase with RLS |
| Date utils | Native Intl + date-fns (if needed) | Moment.js | Deprecated |
| Date utils | Native Intl + date-fns (if needed) | Luxon | Heavier than needed |
| Form handling | Zod + useActionState | react-hook-form | Client-side JS for server-side problem |
| Data tables | Plain `<table>` + Tailwind | TanStack Table | Not needed at v1 scale |

---

## Installation Summary

Packages to add (minimum viable):

```bash
npm install stripe
```

Packages to add conditionally (defer until needed):

```bash
# Only if date arithmetic grows complex:
npm install date-fns

# Only if switching to Stripe Elements (custom payment UI):
npm install @stripe/stripe-js @stripe/react-stripe-js
```

**No new dev dependencies required** for this milestone.

---

## Schema Migration Required (Not a Package)

The `teacher_level` constraint must be updated before implementing the 3-tier system. The existing check only allows `('standard', 'verified')` — add `'junior'` and rename values to match the 3-tier model in PROJECT.md. Write as a new migration file in `supabase/migrations/`.

---

## Confidence Assessment

| Area | Confidence | Rationale |
|------|-----------|-----------|
| Stripe integration pattern | HIGH | Well-established; Route Handler webhook pattern verified against Next.js 16 docs in node_modules |
| Webhook via Route Handler | HIGH | Verified: Route Handlers expose raw Request; Server Actions cannot |
| No calendar library | HIGH | Based on actual availability_slots schema — it's a slot picker, not a calendar |
| No XState | HIGH | Booking status is 5-state linear; schema-enforced transitions via Supabase RPC is correct approach |
| stripe npm version | MEDIUM | Version from training data — run `npm show stripe version` to confirm before install |
| @stripe/stripe-js version | MEDIUM | Same caveat as above |
| date-fns recommendation | MEDIUM | v3 is stable and well-known; version number from training data |
| Teacher level schema gap | HIGH | Directly observed in supabase/migrations/20260528000001_initial_schema.sql |

---

## Sources

- Next.js 16 Route Handlers docs: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` (local)
- Existing schema: `supabase/migrations/20260528000001_initial_schema.sql` (local)
- Existing integrations: `.planning/codebase/INTEGRATIONS.md` (local)
- Stripe official docs pattern (webhook verification): training data, MEDIUM confidence
- React 19 `useActionState` API: training data, HIGH confidence (stable React 19 release)
