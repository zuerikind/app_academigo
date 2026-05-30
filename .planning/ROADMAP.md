# Roadmap: Academigo

**Project:** Academigo — Swiss academic tutoring marketplace
**Core Value:** Students can find a qualified, vetted teacher for any school subject and book a paid session in under two minutes.
**Created:** 2026-05-28
**Granularity:** Coarse (4 phases derived from dependency-driven build order)

---

## Phases

- [ ] **Phase 1: Foundation** — Schema migrations, atomic booking RPCs, auth security patch, email verification and password reset flows
- [ ] **Phase 2: Admin Portal** — Functioning admin dashboard, teacher approval gate, student/booking/payout management views
- [ ] **Phase 3: Core Transaction** — Availability management, Stripe credit purchase, end-to-end booking, post-session reviews, teacher earnings and payouts
- [ ] **Phase 4: Teacher Progression** — 3-tier badge display, in-app promotion requests, admin promotion review, directory sort by tier

---

## Phase Details

### Phase 1: Foundation
**Goal**: The database is structurally correct and secure, atomic booking RPCs exist, and users can verify email and reset passwords.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, TIER-01
**Success Criteria** (what must be TRUE):
  1. A new user who signs up sees a "check your email" page and can click the verification link to activate their account.
  2. A user who forgets their password can request a reset link from the login page, click the emailed link, and set a new password.
  3. The `teacher_level` column accepts `junior`, `academigo_teacher`, and `verified` values; the old `standard` value is migrated.
  4. Atomic RPCs for `create_booking` (with FOR UPDATE credit lock), `complete_booking`, and `cancel_booking` exist in the database and TypeScript types are regenerated.
  5. The `handle_new_user` trigger rejects `role=admin` from signup metadata (security patch applied before admin portal ships).
**Plans**: 5 plans

Plans:
- [ ] 01-01-PLAN.md — DB schema migrations: teacher_level, booking RPCs, security patch, types update
- [ ] 01-02-PLAN.md — Jest test infrastructure + failing RED test stubs for all auth behaviors
- [ ] 01-03-PLAN.md — Email verification flow: verify-email page, signUp action, callback update
- [ ] 01-04-PLAN.md — Password reset flows: forgot-password + update-password pages and actions
- [ ] 01-05-PLAN.md — Human verification checkpoint for all Phase 1 deliverables

### Phase 2: Admin Portal
**Goal**: An admin who signs in reaches a functioning dashboard and can approve teachers, manage students, view bookings, and process payouts.
**Depends on**: Phase 1 (correct schema, secure auth trigger)
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, ADMIN-06, ADMIN-07, ADMIN-08
**Success Criteria** (what must be TRUE):
  1. An admin user who signs in is redirected to `/admin/dashboard` and sees platform overview stats (not a 404).
  2. Admin can view all teacher accounts with approval status and tier level, and click "Approve" to make a teacher visible to students.
  3. Admin can view all student accounts with their credit balance and booking count.
  4. Admin can view all bookings across the platform, filterable by status.
  5. Admin can view pending teacher tier promotion requests and approve or reject them with an optional note.
**Plans**: 7 plans

Plans:
- [ ] 02-01-PLAN.md — DB type extensions (level_promotion_requests, payout_requests) + RED test stubs
- [ ] 02-02-PLAN.md — Shared infra: Table component, lib/queries/admin.ts, lib/actions/admin.ts, getAdminNav(), i18n
- [ ] 02-03-PLAN.md — Admin layout (role guard + DashboardLayout) + dashboard page (stat cards + needs-attention)
- [ ] 02-04-PLAN.md — Teachers page (inline Approve) + Students page
- [ ] 02-05-PLAN.md — Bookings page (tab filter) + Payouts page (Mark Processed)
- [ ] 02-06-PLAN.md — Promotions page (expandable row + Approve/Reject with note)
- [ ] 02-07-PLAN.md — Human verification checkpoint for all Phase 2 deliverables

### Phase 3: Core Transaction
**Goal**: Students can purchase credits, browse teacher availability, complete a full booking cycle, leave a review, and teachers can record earnings and request payouts.
**Depends on**: Phase 2 (at least one approved teacher must exist for student flows to work)
**Requirements**: AVAIL-01, AVAIL-02, AVAIL-03, BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05, BOOK-06, BOOK-07, BOOK-08, BOOK-09, PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, REV-01, REV-02, REV-03, REV-04, EARN-01, EARN-02, EARN-03, EARN-04, EARN-05
**Success Criteria** (what must be TRUE):
  1. A teacher can set and update recurring weekly availability slots; a student visiting that teacher's profile sees the available slots.
  2. A student can select a slot, initiate a booking (credits are reserved atomically), and the teacher sees the request in their dashboard to confirm or decline.
  3. On confirmation, the teacher provides a Zoom/Meet link; the student can view the confirmed meeting link for their upcoming session.
  4. On session completion, reserved credits are consumed and the teacher's earnings are recorded atomically; on cancellation, reserved credits are returned to the student atomically.
  5. A student can purchase a credit package via Stripe Checkout and credits are granted automatically on successful payment (webhook is idempotent on `stripe_session_id`).
  6. A student can submit a star rating and comment after a completed session; the teacher's profile shows all reviews, average rating, and review count.
  7. A teacher can view their earnings history and submit a payout request; admin can view and mark payout requests as processed.
**Plans**: TBD

### Phase 4: Teacher Progression
**Goal**: Teachers have visible tier badges, can apply for level promotion, and verified teachers rank higher in the directory.
**Depends on**: Phase 3 (completed sessions and reviews exist as promotion evidence)
**Requirements**: TIER-02, TIER-03, TIER-04, TIER-05, TIER-06, TIER-07
**Success Criteria** (what must be TRUE):
  1. Teacher cards in the directory and individual teacher profile pages display the correct tier badge (Junior / Academigo Teacher / Verified) and CHF session rate for that tier.
  2. Verified teachers appear above Academigo Teachers who appear above Junior teachers in the directory listing.
  3. A teacher can submit a level promotion request from their dashboard; the admin sees it in the promotion queue.
  4. Admin can approve or reject a promotion request with an optional note; approval updates the teacher's tier immediately.
**Plans**: TBD

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/5 | In Progress|  |
| 2. Admin Portal | 1/7 | In Progress|  |
| 3. Core Transaction | 0/? | Not started | - |
| 4. Teacher Progression | 0/? | Not started | - |

---

## Coverage Validation

**Total v1 requirements:** 45
**Mapped:** 45/45

| Requirement | Phase |
|-------------|-------|
| AUTH-01 | Phase 1 |
| AUTH-02 | Phase 1 |
| AUTH-03 | Phase 1 |
| AUTH-04 | Phase 1 |
| TIER-01 | Phase 1 |
| ADMIN-01 | Phase 2 |
| ADMIN-02 | Phase 2 |
| ADMIN-03 | Phase 2 |
| ADMIN-04 | Phase 2 |
| ADMIN-05 | Phase 2 |
| ADMIN-06 | Phase 2 |
| ADMIN-07 | Phase 2 |
| ADMIN-08 | Phase 2 |
| AVAIL-01 | Phase 3 |
| AVAIL-02 | Phase 3 |
| AVAIL-03 | Phase 3 |
| BOOK-01 | Phase 3 |
| BOOK-02 | Phase 3 |
| BOOK-03 | Phase 3 |
| BOOK-04 | Phase 3 |
| BOOK-05 | Phase 3 |
| BOOK-06 | Phase 3 |
| BOOK-07 | Phase 3 |
| BOOK-08 | Phase 3 |
| BOOK-09 | Phase 3 |
| PAY-01 | Phase 3 |
| PAY-02 | Phase 3 |
| PAY-03 | Phase 3 |
| PAY-04 | Phase 3 |
| PAY-05 | Phase 3 |
| REV-01 | Phase 3 |
| REV-02 | Phase 3 |
| REV-03 | Phase 3 |
| REV-04 | Phase 3 |
| EARN-01 | Phase 3 |
| EARN-02 | Phase 3 |
| EARN-03 | Phase 3 |
| EARN-04 | Phase 3 |
| EARN-05 | Phase 3 |
| TIER-02 | Phase 4 |
| TIER-03 | Phase 4 |
| TIER-04 | Phase 4 |
| TIER-05 | Phase 4 |
| TIER-06 | Phase 4 |
| TIER-07 | Phase 4 |

---

## Phase Ordering Rationale

1. **Schema before everything**: Every phase depends on correct DB types and regenerated TypeScript types. Migrating mid-implementation breaks in-progress UI.
2. **Security before admin**: The `handle_new_user` admin bypass must be closed before any admin portal page ships.
3. **Admin before booking**: Teachers must have `is_approved = true` before students can discover or book them. Without Phase 2, the entire marketplace is empty.
4. **Full transaction loop as one phase**: Stripe, availability, booking, reviews, and earnings are tightly interdependent. Delivering any subset appears broken — students need credits to book, bookings need slots, reviews need completed bookings, earnings need completed bookings.
5. **Progression system last**: Tier badge display (Phase 4) is cosmetic and needs completed sessions and reviews to serve as promotion evidence. It does not block the core marketplace loop.

---

*Roadmap created: 2026-05-28*
*Updated: 2026-05-28 — Phase 1 planned (5 plans across 3 waves)*
*Updated: 2026-05-30 — Phase 2 planned (7 plans across 5 waves)*
