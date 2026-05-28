# Feature Landscape

**Domain:** Swiss tutoring marketplace (one-on-one, school subjects, CHF, DE/EN)
**Researched:** 2026-05-28
**Source confidence:** HIGH for existing codebase state (from PROJECT.md + CONCERNS.md); MEDIUM for competitive landscape (training data, no live web research available)

---

## Table Stakes

Features users expect. Missing = product feels incomplete or trust is lost.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Teacher profile with subject list and price | Students need to evaluate fit before booking | Low | DB + UI exists; badge display missing |
| Teacher availability calendar (set + view) | Can't book without knowing when a teacher is free | Medium | `availability_slots` table exists; zero application code exists |
| End-to-end booking flow (slot → confirm → link) | Core transaction; without this the product is a directory, not a marketplace | High | `bookings` table exists; `BookingService` is a stub only |
| Credit wallet with balance display | Students need to know their purchasing power before initiating a booking | Low-Med | Schema exists; Stripe not installed; packages page is static |
| Credit purchase via Stripe Checkout | Students must be able to add money to their wallet | Medium | No Stripe SDK installed; webhook handler absent |
| Booking cancellation + credit refund | Students will cancel; no refund path destroys trust | Medium | Not implemented; needs state machine + credit release logic |
| Teacher accept / decline booking requests | Teachers control their schedule; passive auto-accept is not acceptable to most tutors | Low-Med | UI absent; DB state field exists |
| Meeting link delivery (Zoom/Meet URL) | Students need to know how to join the session | Low | Teacher posts a URL after accepting; needs a field in booking confirmation UI |
| Post-session review + star rating | Social proof is the primary trust signal on any marketplace | Medium | `reviews` table exists; no queries, actions, or UI |
| Reviews displayed on teacher profile + card | Without displayed ratings, the review submission has no value loop | Low | Blocked by review submission feature |
| Teacher earnings history | Teachers need to see what they've earned per session | Low-Med | `teacher_earnings` table exists; no queries or UI |
| Payout request submission | Teachers need a path to withdraw earnings | Low-Med | `payout_requests` table exists; payout_info is freetext placeholder |
| Teacher tier badge on cards and profile | Trust signal; differentiates Academigo from a plain listing | Low | Badge data exists in schema; display components absent |
| Admin: approve new teacher accounts | Without this, teachers are invisible forever (`is_approved = false`) | Low-Med | No admin pages exist at all; direct DB access required today |
| Admin: payout processing UI | Manual payout workflow needs a UI; email-only is too fragile | Low-Med | No admin pages exist |
| Email verification (post-signup) | Standard security expectation; users distrust platforms that skip it | Low | `emailRedirectTo` not passed; no "check your email" page |
| Password reset flow | Self-service recovery is expected; broken auth kills retention | Low | Not implemented at all |

---

## Differentiators

Features that set Academigo apart from generic directory or generic marketplace. Not universally expected, but valued and worth building intentionally.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 3-tier teacher progression (Junior → Certified → Verified) | Creates trust gradient and teacher motivation to improve; rare on tutoring platforms | Medium | Schema supports it; level rules not enforced; no promotion request UI |
| Teacher applies for level promotion (in-app) | Keeps promotion transparent and gives teachers agency; not just admin-pushed | Low-Med | Needs a form + `level_promotion_requests` state (not in current schema — needs table or booking-state pattern) |
| Admin reviews promotion with evidence (hours, reviews) | Ensures badge credibility; prevents badge devaluation | Medium | Requires admin UI + promotion review workflow |
| Priority listing for Verified teachers | Verified teachers appear first in directory — makes the badge commercially valuable to teachers | Low | Order-by clause in directory query; already planned |
| Per-level pricing enforced by platform (CHF 35-40 / 45 / 50-60) | Price predictability reduces student decision fatigue; platform controls quality floor | Low | `config/pricing.ts` exists; needs to feed booking credit deduction |
| Swiss-first (CHF, DE default, bilingual) | Relevant to local teachers and students; generic platforms are EN-only | Low | Already implemented |
| Admin-controlled platform pricing (not teacher-set) | Prevents price wars and maintains rate integrity per tier | Low | Admin pricing UI needed; DB has rates in config |
| Teacher onboarding approval gate | Ensures only vetted teachers reach students; not all marketplaces gate this | Low-Med | `is_approved` flag exists; admin UI is the missing piece |

---

## Anti-Features

Features to deliberately NOT build in v1. Explicitly excluded to prevent scope creep.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Built-in video calling (WebRTC, Daily, etc.) | Massive infrastructure complexity, maintenance burden, cost; not a differentiator for tutoring | Teacher posts Zoom/Meet link in booking confirmation; decision already made |
| Real-time chat between student and teacher | High complexity (WebSockets or polling), moderation risk, off-platform coordination is fine at this scale | Meeting link + booking confirmation email covers coordination needs |
| OAuth / SSO login (Google, GitHub) | Extra integration surface; Supabase email/password is sufficient for the Swiss academic market | Email/password auth; decision already made |
| Automated bank transfer payouts (SEPA, Stripe Payouts) | Requires KYC/AML compliance, bank account verification infrastructure; premature for v1 | Admin processes payouts manually against IBAN collected in profile |
| Multi-subject session packages or subscriptions | Adds pricing complexity; credits-per-session model is already flexible enough | Per-session credit deduction; decision already made |
| Mobile native app (iOS/Android) | Separate codebase, app store approval cycles; web is sufficient | Responsive web; decision already made |
| Teacher-set pricing (price negotiation) | Destroys price predictability; undermines tier system credibility | Platform-controlled per-tier rates; decision already made |
| Student-initiated direct message before booking | Enables off-platform coordination that bypasses credits; moderation burden | Students book then meet; contact happens in the session |
| AI-powered teacher matching / recommendation engine | Requires behavioral data that doesn't exist yet; premature optimization | Manual search + filter + directory ordering by tier |
| Group sessions / classroom mode | Different UX and pricing model; scope creep | One-on-one only for v1 |
| Dispute resolution / refund arbitration workflow | Complex policy + tooling; manual for v1 at low volume | Admin handles disputes ad hoc; structured workflow is v2 |

---

## Feature Dependencies

```
Email verification flow
  ← required before → any trust in account quality

Admin: approve teacher accounts
  ← required before → Teacher visible in directory
  ← required before → Booking flow (no teachers to book)

Teacher sets availability slots
  ← required before → Booking slot selection UI

Teacher tier badge display
  ← depends on → Tier data in teacher record (exists)
  ← required before → Priority listing in directory

Credit purchase (Stripe Checkout + webhook)
  ← required before → Booking credit deduction
  ← required before → Student credit balance is meaningful

End-to-end booking flow
  ← depends on → Availability slots
  ← depends on → Credits (reserved on booking)
  ← depends on → Teacher accept/decline UI
  ← depends on → Meeting link input by teacher

Post-session review submission
  ← depends on → Booking reaching "completed" status
  ← required before → Review display on teacher profile

Teacher earnings record
  ← depends on → Booking reaching "completed" status
  ← required before → Payout request (teacher needs earnings to withdraw)

Payout request submission
  ← depends on → Teacher earnings
  ← depends on → Payout info structured (not freetext)

Admin: payout processing UI
  ← depends on → Payout request submission

Teacher level promotion request
  ← depends on → Sufficient completed bookings + reviews (evidence)
  ← depends on → Admin level promotion review UI

Admin: level promotion review
  ← depends on → Promotion request submission
  ← required before → Badge upgrade is credible (not just self-promoted)

Priority listing (Verified teachers first)
  ← depends on → Teacher level data (exists in schema)
  ← depends on → Directory order-by implementation
```

---

## MVP Recommendation

Given that auth, onboarding, dashboards (skeletons), and DB schema already exist, the next buildable increment is:

**Immediate unblocks (ship first):**
1. Admin teacher approval UI — currently requires direct DB access; blocks all booking
2. Password reset + email verification — trust floor; users expect these
3. Teacher availability slot management — prerequisite for the booking flow

**Core transaction (ship second, together as a unit):**
4. Stripe credit purchase + webhook + credit grant — students need funds before booking
5. End-to-end booking flow (slot select → credit reserve → teacher accept → meeting link → confirmation) — the product's reason for existing
6. Booking cancellation + credit refund

**Trust layer (ship third):**
7. Post-session review submission + display
8. Teacher tier badge display on cards and profile
9. Teacher earnings history + payout request form
10. Admin payout processing UI

**Progression system (ship fourth):**
11. Teacher level promotion request + admin review workflow
12. Priority listing for Verified teachers
13. Admin platform pricing configuration UI

**Defer to v2:**
- Structured payout account format (IBAN migration from freetext placeholder) — needs careful data migration planning
- Promotion criteria automation (auto-trigger when thresholds met) — requires enough session data to be meaningful
- Dispute / refund arbitration workflow

---

## Phase-Specific Complexity Notes

| Feature Area | Key Complexity Driver | Risk Level |
|---|---|---|
| Booking state machine | Credits must be atomically reserved on booking, released on cancellation/rejection, and consumed on completion — race conditions if not done as a Supabase RPC transaction | HIGH |
| Stripe webhook | Idempotency required; double-processing a payment event grants duplicate credits | HIGH |
| Availability slot overlap | Teacher availability must prevent double-booking; slot status transitions need careful locking | MEDIUM |
| Teacher level promotion | No promotion_requests table in current schema — needs migration before any UI | MEDIUM |
| Payout info migration | `payout_info_placeholder` TEXT column needs migration to structured format (JSONB or dedicated table) before payout feature ships | MEDIUM |
| Review trigger | Review form should only appear once per completed booking, not repeatedly | LOW |
| Admin portal | Straightforward CRUD + status updates; no novel complexity beyond auth guard | LOW |

---

## Sources

- `C:\Academigo\academigo\app_academigo\.planning\PROJECT.md` — authoritative project requirements (HIGH confidence)
- `C:\Academigo\academigo\app_academigo\.planning\codebase\CONCERNS.md` — existing codebase audit (HIGH confidence)
- Training data: tutoring marketplace competitive landscape (Wyzant, Superprof, Preply, Takelessons patterns) — MEDIUM confidence; no live web research was available during this session
