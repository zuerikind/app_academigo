# Roadmap: Academigo

**Project:** Academigo — Swiss academic tutoring marketplace
**Core Value:** Students can find a qualified, vetted teacher for any school subject and book a paid session in under two minutes.
**Created:** 2026-05-28
**Granularity:** Coarse (5 phases derived from dependency-driven build order)

---

## Phases

- [ ] **Phase 1: Foundation** — Schema migrations, atomic booking RPCs, auth security patch, email verification and password reset flows
- [x] **Phase 2: Admin Portal** — Functioning admin dashboard, teacher approval gate, student/booking/payout management views (completed 2026-05-30)
- [ ] **Phase 3: Core Transaction** — Availability management, Stripe credit purchase, end-to-end booking, post-session reviews, teacher earnings and payouts
- [ ] **Phase 4: Recurring Lessons** — Credit wallet, recurring learning schedules, auto-generated lessons, rescheduling workflow, teacher and student lesson dashboards
- [ ] **Phase 5: Teacher Progression** — 3-tier badge display, in-app promotion requests, admin promotion review, directory sort by tier

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
  3. On confirmation, the teacher provides a Google Meet link (auto-populated from their default_meet_link); the student sees "Join Lesson" when the link is set, or "Waiting for teacher" when not yet set.
  4. On session completion, reserved credits are consumed and the teacher's earnings are recorded atomically; on cancellation, reserved credits are returned to the student atomically.
  5. A student can purchase a credit package via Stripe Checkout and credits are granted automatically on successful payment (webhook is idempotent on `stripe_session_id`).
  6. A student can submit a star rating and comment after a completed session; the teacher's profile shows all reviews, average rating, and review count.
  7. A teacher can view their earnings history and submit a payout request; admin can view and mark payout requests as processed.
  8. Teachers receive 24h and 1h reminder emails before lessons (with urgent "add Meet link" prompt when meeting_link is missing).
  9. Admin can see upcoming lessons missing a Meet link in a dedicated monitoring view.
**Plans**: 13 plans

Plans:
- [ ] 03-01-PLAN.md — Phase 3 schema migration: availability tables, default_meet_link, bookings columns, review constraint, credit RPCs + type regen
- [ ] 03-02-PLAN.md — Wave 1 RED test stubs: slots, availability, bookings, payments, webhook, reviews, earnings, email service, cron
- [ ] 03-03-PLAN.md — Availability: generateSlots utility, queries, Server Actions, teacher availability page + default_meet_link in onboarding/settings
- [ ] 03-04-PLAN.md — Stripe: install + createCheckoutSession + webhook handler (idempotent) + student packages page buy buttons
- [ ] 03-05-PLAN.md — Email service: Resend install + React Email templates + sendBookingConfirmation/sendMeetLinkAdded/sendTeacherReminder
- [ ] 03-06-PLAN.md — Booking library: all 6 booking actions + queries + reviews + earnings + ICS route + i18n strings
- [ ] 03-07-PLAN.md — Teacher bookings page: confirm/decline/mark-complete UI with Meet Link Status indicators + inline add/update
- [ ] 03-08-PLAN.md — Student teacher profile: monthly calendar + slot picker + booking request form + review display
- [ ] 03-09-PLAN.md — Student bookings page: Join Lesson/Waiting UX + inline review forms + credit balance display
- [ ] 03-10-PLAN.md — Vercel Cron: hourly reminder Route Handler + vercel.json (idempotent via reminder_Xh_sent_at columns)
- [ ] 03-11-PLAN.md — Teacher earnings page + requestPayout action + teacher nav update
- [ ] 03-12-PLAN.md — Admin Missing Meet Links page + getMissingMeetLinks query + admin nav update
- [ ] 03-13-PLAN.md — Human verification checkpoint for all Phase 3 deliverables

### Phase 4: Recurring Lessons
**Goal**: Students and teachers have a recurring lesson system — students buy credits that never expire, schedules auto-generate lessons 6–8 weeks ahead, and either party can reschedule without losing credits. Both dashboards surface the full lesson picture.
**Depends on**: Phase 3 (credit purchase, completed booking model, teacher availability)
**Requirements**: CRED-01, CRED-02, CRED-03, CRED-04, SCHED-01, SCHED-02, SCHED-03, LES-01, LES-02, LES-03, RESC-01, RESC-02, RESC-03, TDASH-01, TDASH-02, TDASH-03, TDASH-04, SDASH-01, SDASH-02, SDASH-03, SDASH-04
**Success Criteria** (what must be TRUE):
  1. A student's credit wallet shows current balance and a full transaction history (purchases, deductions on completion, refunds on cancellation).
  2. A student can set up a recurring schedule with a teacher (e.g. Monday 16:00–16:50); the system auto-generates confirmed lessons 6–8 weeks ahead with no duplicates.
  3. Pausing a schedule stops new lesson generation immediately; resuming restarts it from the next occurrence.
  4. A student can request a reschedule; the teacher approves or rejects; on approval the original lesson is cancelled and the new one confirmed with no credit loss.
  5. The teacher dashboard shows: active students, remaining student credits, all recurring schedules, upcoming lessons, and any reschedule requests.
  6. The student dashboard shows: credit wallet, credit history, active recurring schedules, and upcoming lessons with reschedule option.
**Plans**: 9 plans

Plans:
- [ ] 04-01-PLAN.md — DB migration: credit_wallets, credit_transactions, recurring_schedules, lessons + 3 RPCs + type regen
- [ ] 04-02-PLAN.md — Wave 0 RED test stubs: schedule utility, schedules, reschedule, wallet, cron
- [ ] 04-03-PLAN.md — computeOccurrences utility, wallet queries, lesson queries
- [ ] 04-04-PLAN.md — createSchedule, updateScheduleStatus actions + schedule queries
- [ ] 04-05-PLAN.md — completeLesson, cancelLesson, requestReschedule, approveReschedule, rejectReschedule actions
- [ ] 04-06-PLAN.md — generate-lessons cron route + vercel.json cron entry
- [ ] 04-07-PLAN.md — Teacher lessons dashboard page (TDASH-01..04) + nav + i18n
- [ ] 04-08-PLAN.md — Student lessons dashboard page (SDASH-01..04)
- [ ] 04-09-PLAN.md — Human verification checkpoint for all Phase 4 deliverables

### Phase 5: Teacher Progression
**Goal**: Teachers have visible tier badges, can apply for level promotion, and verified teachers rank higher in the directory.
**Depends on**: Phase 4 (completed sessions and reviews exist as promotion evidence)
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
| 2. Admin Portal | 7/7 | Complete   | 2026-05-30 |
| 3. Core Transaction | 12/13 | In Progress|  |
| 4. Recurring Lessons | 6/9 | In Progress|  |
| 5. Teacher Progression | 0/? | Not started | - |

---

## Coverage Validation

**Total v1 requirements:** 66
**Mapped:** 66/66

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
| CRED-01 | Phase 4 |
| CRED-02 | Phase 4 |
| CRED-03 | Phase 4 |
| CRED-04 | Phase 4 |
| SCHED-01 | Phase 4 |
| SCHED-02 | Phase 4 |
| SCHED-03 | Phase 4 |
| LES-01 | Phase 4 |
| LES-02 | Phase 4 |
| LES-03 | Phase 4 |
| RESC-01 | Phase 4 |
| RESC-02 | Phase 4 |
| RESC-03 | Phase 4 |
| TDASH-01 | Phase 4 |
| TDASH-02 | Phase 4 |
| TDASH-03 | Phase 4 |
| TDASH-04 | Phase 4 |
| SDASH-01 | Phase 4 |
| SDASH-02 | Phase 4 |
| SDASH-03 | Phase 4 |
| SDASH-04 | Phase 4 |
| TIER-02 | Phase 5 |
| TIER-03 | Phase 5 |
| TIER-04 | Phase 5 |
| TIER-05 | Phase 5 |
| TIER-06 | Phase 5 |
| TIER-07 | Phase 5 |

---

## Phase Ordering Rationale

1. **Schema before everything**: Every phase depends on correct DB types and regenerated TypeScript types. Migrating mid-implementation breaks in-progress UI.
2. **Security before admin**: The `handle_new_user` admin bypass must be closed before any admin portal page ships.
3. **Admin before booking**: Teachers must have `is_approved = true` before students can discover or book them. Without Phase 2, the entire marketplace is empty.
4. **Full transaction loop as one phase**: Stripe, availability, booking, reviews, and earnings are tightly interdependent. Delivering any subset appears broken — students need credits to book, bookings need slots, reviews need completed bookings, earnings need completed bookings.
5. **Recurring system before progression**: The recurring lesson model (Phase 4) extends the core transaction loop with schedules, auto-generation, and rescheduling — it is functional and revenue-generating. Tier badge display (Phase 5) is cosmetic and relies on recurring lesson completion data as promotion evidence.
6. **Progression system last**: Tier badge display (Phase 5) is cosmetic and needs completed sessions and reviews to serve as promotion evidence. It does not block the core marketplace loop.

---

*Roadmap created: 2026-05-28*
*Updated: 2026-05-28 — Phase 1 planned (5 plans across 3 waves)*
*Updated: 2026-05-30 — Phase 2 planned (7 plans across 5 waves)*
*Updated: 2026-05-31 — Phase 3 planned (10 plans across 5 waves)*
*Updated: 2026-06-01 — Phase 3 replanned (13 plans across 5 waves) — added Google Meet link management, Resend email service, Vercel Cron reminders, admin missing-links view*
*Updated: 2026-06-02 — Added Phase 4: Recurring Lessons (21 requirements); Teacher Progression moved to Phase 5*
