# Project Research Summary

**Project:** Academigo—Swiss tutoring marketplace
**Domain:** Two-sided marketplace, credit-based payments, session booking, admin portal
**Researched:** 2026-05-28
**Confidence:** HIGH

## Executive Summary

Academigo is a Swiss tutoring marketplace built on a solid but incomplete foundation. Auth, onboarding, role-based routing, and the full database schema already exist. Phase 2 activates that foundation: the booking state machine (currently a stub), the Stripe credit-purchase flow (no SDK installed), teacher availability management (table exists, zero application code), the admin portal (no pages exist—teachers sit in limbo at is_approved = false), and the trust layer (reviews, tier badges, earnings). The product is a directory today; Phase 2 makes it a marketplace.

The recommended technical approach is minimal-new-dependency: add only the stripe npm SDK, implement a custom weekly availability grid with Tailwind (no calendar library), enforce booking state transitions via Supabase RPC functions (no state machine library), and build the admin portal as standard Next.js App Router pages guarded by requireRoleFromParams. All mutations go through Server Actions; the only Route Handler additions are the Stripe webhook receiver and Checkout session creator. No client-side state management library is needed.

The dominant risk class is financial atomicity: credits are real money, and booking creation, cancellation, and completion flows involve multi-table writes that must be atomic. Every credit-touching operation must be a single Supabase RPC with FOR UPDATE locks. A secondary risk is an existing security hole: the handle_new_user trigger accepts role=admin from signup metadata, allowing anyone to bypass admin authorization by calling the Supabase Auth API directly. This must be patched before the admin portal ships.

## Key Findings

### Recommended Stack

The existing stack (Next.js 16.2.6 App Router, React 19, Supabase with RLS, Tailwind v4, Zod v4, framer-motion, sonner) requires no changes. The only mandatory new dependency is the stripe npm SDK (v17, server-side only). No calendar library, no state machine library, no admin framework, no data-grid library.

**Core technologies:**
- stripe (npm SDK): Checkout session creation, webhook signature verification—no alternative exists
- Supabase RPC (plpgsql): Atomic multi-table booking transitions with FOR UPDATE locking—prevents credit race conditions
- Next.js Route Handlers: Two justified uses—Stripe webhook receiver and Checkout session creator
- Custom Tailwind weekly grid: Slot-picker UI for teacher availability—calendar libraries are the wrong abstraction
- Native Intl APIs: Date/time formatting without adding a dependency

**Schema migrations required before any feature code:**
- teachers.teacher_level constraint: expand from (standard, verified) to (junior, academigo_teacher, verified)
- Add availability_slot_id FK column to bookings
- Add level_promotion_requests table
- Add teacher_level_history table (audit trail)
- Add complete_booking RPC (atomic: status update + credit consume + earnings insert)
- Add cancel_booking RPC (atomic: status update + credit release with state validation)

### Expected Features

**Must have (table stakes)—Phases 1-3:**
- Admin teacher approval UI—blocks all teacher visibility without it
- Password reset + email verification—basic trust floor; neither is implemented
- Teacher availability slot management—prerequisite for booking
- Stripe credit purchase + webhook + credit grant—students need funds before booking
- End-to-end booking flow (slot select, credit reserve, teacher accept, meeting link, confirmation)
- Booking cancellation + credit refund
- Post-session review submission + display on teacher profile
- Teacher tier badge display on cards and profile
- Teacher earnings history + payout request form
- Admin payout processing UI

**Should have (differentiators)—Phase 4:**
- 3-tier teacher progression (Junior, Academigo Teacher, Verified) with in-app promotion request
- Admin review of promotion applications with evidence (hours, reviews)
- Priority listing for Verified teachers in directory (ORDER BY tier level)
- Admin-controlled platform pricing configuration UI

**Defer to v2+:**
- Structured payout account format (IBAN migration from payout_info_placeholder freetext)
- Promotion criteria automation
- Dispute / refund arbitration workflow
- Real-time chat, built-in video, OAuth/SSO, native mobile app, AI matching, group sessions

### Architecture Approach

The existing architecture is strict server-first: Server Components query via lib/queries/*, mutations go through Server Actions in lib/actions/*, and a service layer in lib/services/* handles multi-step operations. This pattern must be extended, not deviated from. A lib/supabase/service.ts module using the Supabase service-role key is needed for the webhook route (operates outside a user session and must bypass RLS to grant credits).

**Major components:**
1. lib/services/stripe.ts—Stripe SDK wrapper; called by Route Handlers only
2. lib/services/bookings.ts—implements the existing stub; wraps Supabase RPC calls for all state transitions
3. lib/services/earnings.ts—records teacher earnings atomically on booking completion
4. app/api/stripe/webhook/route.ts—receives Stripe events, verifies signature, grants credits via service-role client
5. app/api/stripe/checkout/route.ts—creates Checkout sessions; returns redirect URL to client
6. app/[locale]/admin/*—full admin portal guarded by admin/layout.tsx calling requireRoleFromParams

### Critical Pitfalls

1. **Stripe webhook duplicate credit grants**—Stripe retries on any non-2xx response. Prevention: idempotency check via payments.stripe_session_id unique constraint inside an atomic RPC before any credit increment.

2. **Credit reservation race condition (booking overdraft)**—Two concurrent booking requests read the same available_credits and both proceed. Prevention: wrap booking creation in a Supabase RPC using SELECT ... FOR UPDATE on student_credits before checking balance.

3. **Booking state transitions without DB-level enforcement**—Direct UPDATE accepts any valid status string regardless of current state, enabling impossible transitions and double credit releases. Prevention: all transitions as Supabase RPCs that validate current state before executing.

4. **Admin authorization bypass via signup metadata**—The handle_new_user trigger accepts role=admin from raw_user_meta_data. Prevention: fix trigger to only accept teacher or default to student before admin portal ships.

5. **Webhook using wrong Supabase client**—Webhook runs with no user session; anon-key client cannot write credits. Prevention: lib/supabase/service.ts as a server-only module using SUPABASE_SERVICE_ROLE_KEY (never NEXT_PUBLIC_*).

## Implications for Roadmap

Based on feature dependencies, architecture patterns, and pitfall analysis, the research supports a 4-phase structure. Phases must be sequential—each phase unblocks the next.

### Phase 1: Foundation (Schema + Auth Security + DB Functions)

**Rationale:** Every subsequent feature depends on correct DB types and correct security. Schema has known gaps (2-value teacher_level enum, missing booking FKs, missing promotion tables). The admin auth bypass is a critical security issue that must be closed before any admin feature ships.

**Delivers:** Correct database schema, atomic booking RPCs (complete_booking, cancel_booking, create_booking with FOR UPDATE), patched handle_new_user trigger, regenerated TypeScript types, email verification flow, password reset flow.

**Addresses:** Email verification, password reset, all schema prerequisites for later phases.

**Avoids:** Admin authorization bypass (Pitfall 4), teacher level schema conflict (Pitfall 6), booking state drift (Pitfall 3—RPCs defined here), credit race condition (Pitfall 2—FOR UPDATE lock in RPC).

### Phase 2: Admin Portal + Teacher Approval Gate

**Rationale:** No teacher is visible in the directory without is_approved = true, and no admin can set that flag today without direct DB access. This phase makes teachers available to students, unblocking all downstream booking features.

**Delivers:** app/[locale]/admin/layout.tsx (auth guard), admin dashboard, teacher management page (approve/reject), lib/queries/admin.ts, lib/actions/admin.ts with requireRole(admin) guards on every action.

**Addresses:** Admin teacher approval UI, admin portal foundation for payouts and pricing.

**Avoids:** Per-action auth bypass (Pitfall 9), admin route without layout-level guard (Architecture Anti-Pattern 4).

### Phase 3: Core Transaction (Stripe + Availability + Booking + Reviews + Earnings)

**Rationale:** These are tightly interdependent. Students need credits to book; bookings need availability slots; reviews need completed bookings; earnings need completed bookings. Partial delivery appears broken to users. Ship the full transaction loop as one phase.

**Delivers:** Stripe credit purchase flow (Route Handler + webhook with idempotency), teacher weekly availability grid (custom Tailwind, no library), end-to-end booking flow (create, confirm, reject, complete, cancel), post-session reviews (submission + profile display), teacher earnings history, payout request form, admin payout processing UI.

**Uses:** stripe npm SDK, Supabase RPC functions from Phase 1, lib/supabase/service.ts (service-role for webhook), custom Tailwind grid.

**Implements:** lib/services/stripe.ts, lib/services/bookings.ts (stub becomes real), lib/services/earnings.ts, both Stripe Route Handlers, all booking/availability/review/earnings actions and queries.

**Avoids:** All financial atomicity pitfalls (1, 2, 3, 7, 11), service-role key exposure (Pitfall 5).

### Phase 4: Teacher Progression System + Directory Optimization

**Rationale:** The 3-tier system depends on completed sessions and reviews as promotion evidence. level_promotion_requests and teacher_level_history tables are created in Phase 1; this phase builds UI and workflows on top.

**Delivers:** Teacher promotion request form, admin promotion review workflow, tier badge display on teacher cards and profiles, directory sort by tier (Verified first), admin platform pricing configuration UI.

**Addresses:** 3-tier teacher progression, in-app promotion request, admin promotion review, priority listing, admin-controlled pricing.

**Avoids:** No audit trail on promotions (Pitfall 12—teacher_level_history inserts wired into approval action).

### Phase Ordering Rationale

- Schema first: every phase depends on correct DB structure and regenerated types; migrating mid-flight breaks in-progress UI
- Security before admin: handle_new_user exploit must be closed before the admin portal ships
- Admin before booking: teachers must be approved before students can book them
- Stripe + Availability + Booking + Reviews as one phase: tightly interdependent; partial delivery appears broken
- Progression system last: requires completed bookings and reviews as evidence data

### Research Flags

Phases needing careful implementation attention (patterns documented in research files, no external research needed):
- **Phase 3:** Stripe webhook idempotency and Supabase FOR UPDATE RPC implementation. Developers must read ARCHITECTURE.md Pattern 2 and Pattern 3 before implementing.

Phases with fully standard patterns (implement directly from research files):
- **Phase 1:** DB migrations, RPC functions, auth trigger fix
- **Phase 2:** Next.js layout guards, Server Components, admin Server Actions
- **Phase 4:** Teacher tier UI, promotion workflow

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack verified against local node_modules/next/dist/docs/; Stripe version MEDIUM (verify before install) |
| Features | HIGH | Derived from authoritative PROJECT.md + direct codebase audit (CONCERNS.md) |
| Architecture | HIGH | Existing layer structure read from source; Route Handler patterns verified against local Next.js 16 docs |
| Pitfalls | HIGH | Derived from direct schema inspection, RLS policy review, and Server Action audit |

**Overall confidence:** HIGH

### Gaps to Address

- Stripe SDK version: recommend stripe@^17; verify with npm show stripe version before installing. Pin explicit API version string after checking Stripe changelog.
- date-fns necessity: defer decision to implementation; add date-fns v3 + date-fns-tz only if slot time arithmetic requires it (Europe/Zurich timezone).
- payout_info_placeholder migration: current TEXT freetext column for IBAN is a known placeholder; structured migration deferred to v2 but should be designed before high-volume payout operations.
- Booking completion trigger: v1 uses manual admin completion; plan schema to support future automation via cron or Supabase Edge Function.
- Languages field cleanup: teacher onboarding free-text language input produces dirty data; replace with multi-select during Phase 2 or Phase 3.

## Sources

### Primary (HIGH confidence)
- node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
- node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md
- node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md
- supabase/migrations/20260528000001_initial_schema.sql
- .planning/PROJECT.md
- .planning/codebase/CONCERNS.md
- lib/actions/auth.ts, lib/auth/session.ts, lib/queries/teachers.ts, proxy.ts

### Secondary (MEDIUM confidence)
- Stripe webhook idempotency and signature verification patterns (training data)
- stripe npm package v17, @stripe/stripe-js v4 (training data; verify before install)
- Tutoring marketplace competitive landscape (Wyzant, Superprof, Preply patterns)—training data, no live web research

### Tertiary (LOW confidence)
- Stripe API version string "2024-12-18.acacia"—verify against Stripe changelog before pinning

---
*Research completed: 2026-05-28*
*Ready for roadmap: yes*
