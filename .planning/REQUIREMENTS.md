# Requirements: Academigo

**Defined:** 2026-05-28
**Core Value:** Students can find a qualified, vetted teacher for any school subject and book a paid session in under two minutes.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User sees a "check your email" confirmation page after signing up
- [x] **AUTH-02**: User can verify their email via the link sent to their inbox
- [x] **AUTH-03**: User can request a password reset from the login page
- [x] **AUTH-04**: User can set a new password via the emailed reset link

### Teacher Tier System

- [ ] **TIER-01**: Teacher level is stored as one of three values: `junior` / `academigo_teacher` / `verified` (DB migration required — current schema only allows `standard`/`verified`)
- [ ] **TIER-02**: Teacher level badge is displayed on teacher cards in the directory listing
- [ ] **TIER-03**: Teacher level badge and CHF session rate are displayed on the teacher profile page
- [ ] **TIER-04**: Level 3 (Verified) teachers are ranked above Level 2 and Level 1 teachers in directory listings
- [ ] **TIER-05**: Teacher can submit a level promotion request from their dashboard
- [ ] **TIER-06**: Admin can view all pending and historical promotion requests
- [ ] **TIER-07**: Admin can approve or reject a promotion request (with optional note)

### Admin Portal

- [x] **ADMIN-01**: Admin user who signs in is redirected to a functioning admin dashboard (not a 404)
- [x] **ADMIN-02**: Admin can view all teacher accounts with their approval status, tier level, and key stats
- [x] **ADMIN-03**: Admin can approve a pending teacher account (sets `is_approved = true`, making them visible to students)
- [x] **ADMIN-04**: Admin can review and action teacher tier promotion requests
- [x] **ADMIN-05**: Admin can view all student accounts with credit balance and booking count
- [x] **ADMIN-06**: Admin can view all bookings across the platform, filterable by status
- [x] **ADMIN-07**: Admin can view all pending payout requests from teachers
- [x] **ADMIN-08**: Admin can mark a payout request as processed

### Availability

- [x] **AVAIL-01**: Teacher can set recurring weekly availability slots (day of week + start/end time)
- [x] **AVAIL-02**: Teacher can remove or update existing availability slots
- [x] **AVAIL-03**: Student sees a teacher's available slots when viewing their profile or booking page

### Booking

- [x] **BOOK-01**: Student can select an available slot and initiate a booking request
- [x] **BOOK-02**: Student's credits are reserved (held, not deducted) atomically when a booking is initiated
- [x] **BOOK-03**: Teacher sees pending booking requests in their dashboard
- [x] **BOOK-04**: Teacher can confirm or decline a booking request
- [x] **BOOK-05**: On confirmation, teacher provides a Zoom/Meet meeting link
- [x] **BOOK-06**: Student can view the confirmed meeting link for their upcoming session
- [x] **BOOK-07**: On session completion, reserved credits are consumed and teacher earnings are recorded (atomic RPC)
- [x] **BOOK-08**: Student or teacher can cancel a booking before it takes place
- [x] **BOOK-09**: On cancellation, reserved credits are returned to the student atomically

### Payments (Stripe)

- [ ] **PAY-01**: Student can view available credit packages with CHF prices
- [x] **PAY-02**: Student can purchase a credit package via Stripe Checkout (redirect flow)
- [x] **PAY-03**: Credits are automatically granted to the student on successful Stripe payment (webhook, idempotent on `stripe_session_id`)
- [ ] **PAY-04**: Student's current credit balance is displayed on their dashboard and packages page
- [ ] **PAY-05**: Session credit cost matches the teacher's tier rate; deducted on completion

### Reviews

- [x] **REV-01**: Student can submit a star rating (1–5) and optional comment after a completed session
- [ ] **REV-02**: Teacher profile displays all reviews with individual ratings and comments
- [ ] **REV-03**: Teacher profile displays average rating and total review count
- [ ] **REV-04**: Teacher cards in the directory display average star rating and review count

### Earnings and Payouts

- [x] **EARN-01**: Teacher earnings (CHF amount) are automatically recorded per completed session
- [ ] **EARN-02**: Teacher can view their earnings history on a dedicated page
- [x] **EARN-03**: Teacher can submit a payout request from their dashboard
- [x] **EARN-04**: Admin can view all pending payout requests with teacher and amount details
- [x] **EARN-05**: Admin can mark a payout request as processed (with optional reference note)

## v2 Requirements

### Security Hardening

- **SEC-01**: `handle_new_user` DB trigger enforces allowed roles (only `student`/`teacher`), rejecting `admin` from signup metadata at the database level
- **SEC-02**: Server-side MIME type validation on avatar file uploads (currently client-side `accept` only)
- **SEC-03**: Multi-select / tag-input for teacher languages field (replaces fragile comma-string parsing)

### Admin Enhancements

- **ADMIN-EX-01**: Admin can set per-level session rates via UI (currently in `config/pricing.ts`)
- **ADMIN-EX-02**: Admin can generate basic earnings/platform-fee reports

### Auth Extensions

- **AUTH-EX-01**: OAuth login (Google) for students

### Notifications

- **NOTIF-01**: Email notification to teacher when a new booking is requested
- **NOTIF-02**: Email notification to student when booking is confirmed or declined

### Payout Automation

- **PAYOUT-01**: Structured IBAN/account fields for teacher payout details (replaces `payout_info_placeholder` freetext)
- **PAYOUT-02**: Automated payout transfer integration (Stripe Connect or manual bank transfer)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Built-in video calling | External Zoom/Meet link avoids video infrastructure complexity for v1 |
| Mobile native app | Web-first; responsive design covers mobile browsers |
| Real-time chat | Coordination covered by booking confirmation + meeting link |
| Subscription / multi-session packages | Per-session credit model sufficient for v1 |
| OAuth login | Email/password sufficient for v1 |
| Automated bank payouts | Admin processes payouts manually for v1 |
| Multi-currency | CHF only for v1 (Swiss market) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| TIER-01 | Phase 1 | Pending |
| ADMIN-01 | Phase 2 | Complete |
| ADMIN-02 | Phase 2 | Complete |
| ADMIN-03 | Phase 2 | Complete |
| ADMIN-04 | Phase 2 | Complete |
| ADMIN-05 | Phase 2 | Complete |
| ADMIN-06 | Phase 2 | Complete |
| ADMIN-07 | Phase 2 | Complete |
| ADMIN-08 | Phase 2 | Complete |
| AVAIL-01 | Phase 3 | Complete |
| AVAIL-02 | Phase 3 | Complete |
| AVAIL-03 | Phase 3 | Complete |
| BOOK-01 | Phase 3 | Complete |
| BOOK-02 | Phase 3 | Complete |
| BOOK-03 | Phase 3 | Complete |
| BOOK-04 | Phase 3 | Complete |
| BOOK-05 | Phase 3 | Complete |
| BOOK-06 | Phase 3 | Complete |
| BOOK-07 | Phase 3 | Complete |
| BOOK-08 | Phase 3 | Complete |
| BOOK-09 | Phase 3 | Complete |
| PAY-01 | Phase 3 | Pending |
| PAY-02 | Phase 3 | Complete |
| PAY-03 | Phase 3 | Complete |
| PAY-04 | Phase 3 | Pending |
| PAY-05 | Phase 3 | Pending |
| REV-01 | Phase 3 | Complete |
| REV-02 | Phase 3 | Pending |
| REV-03 | Phase 3 | Pending |
| REV-04 | Phase 3 | Pending |
| EARN-01 | Phase 3 | Complete |
| EARN-02 | Phase 3 | Pending |
| EARN-03 | Phase 3 | Complete |
| EARN-04 | Phase 3 | Complete |
| EARN-05 | Phase 3 | Complete |
| TIER-02 | Phase 4 | Pending |
| TIER-03 | Phase 4 | Pending |
| TIER-04 | Phase 4 | Pending |
| TIER-05 | Phase 4 | Pending |
| TIER-06 | Phase 4 | Pending |
| TIER-07 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0

**Note:** The original coverage note stated 44 requirements. A recount of all defined requirement IDs yields 45 (AUTH×4, TIER×7, ADMIN×8, AVAIL×3, BOOK×9, PAY×5, REV×4, EARN×5). All 45 are mapped.

---
*Requirements defined: 2026-05-28*
*Last updated: 2026-05-28 — Traceability populated from ROADMAP.md*
