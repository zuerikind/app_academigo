# Phase 3: Core Transaction - Context

**Gathered:** 2026-05-31 (updated 2026-06-01 — Google Meet link + email notifications added)
**Status:** Ready for planning

<domain>
## Phase Boundary

Students purchase credits via Stripe, browse teacher availability, complete a full booking cycle (request → confirm → session → complete), leave reviews, and teachers record earnings and request payouts.

Requirements: AVAIL-01, AVAIL-02, AVAIL-03, BOOK-01 through BOOK-09, PAY-01 through PAY-05, REV-01 through REV-04, EARN-01 through EARN-05

</domain>

<decisions>
## Implementation Decisions

### Availability — Teacher Input
- Teacher defines **time ranges per day** (e.g. Monday 14:00–18:00), not individual slots
- Teacher can add **blockers/exceptions** for specific dates they can't teach (overrides the weekly range)
- The system generates 15-minute increment slot options from the range automatically
- Default lesson duration: **50 minutes**

### Availability — Student View
- **Monthly calendar** view: days with availability are highlighted
- Student clicks a day → sees the 15-min increment slots available for that day
- Slots within the teacher's range that are already reserved/confirmed are hidden or shown as unavailable

### Booking Slot Reservation
- When student sends a booking request, the slot is **reserved** (pending state) — no other student can book it
- Teacher **confirms** → slot stays reserved/confirmed; student gets meeting link
- Teacher **declines** → slot opens back up
- When declining, teacher can **offer an alternative slot** by picking from their own current availability (not free text)

### Calendar Export
- Both students and teachers can export confirmed sessions to their calendar (.ics file)
- Available for confirmed/upcoming bookings

### Booking Flow — Student Side
- Student initiates booking from the **teacher profile page** (`/student/teachers/[id]`)
- Booking request includes: **selected slot + short subject/topic note** (freetext, student adds context for the teacher)
- Slot is reserved atomically on request submission; credits are held, not deducted

### Booking Flow — Teacher Side
- Teacher sees pending requests on their **bookings page** (`/teacher/bookings`)
- When teacher clicks **Confirm**, the confirm form **auto-populates** the meeting link from the teacher's `default_meet_link` if set; teacher can override for that specific booking
- If no `default_meet_link` is set: teacher sees a warning and must manually enter a link before confirming
- Teacher can also **Decline** + optionally offer an alternative slot from their own current availability
- After the session: teacher clicks **Mark complete** on the booking — this triggers the atomic RPC (credit deduction + earning record)

### Meeting Link Management (Google Meet — MVP Approach)
- Every teacher profile has a **`default_meet_link`** field (TEXT, nullable) — their personal Google Meet room URL
- Teachers set `default_meet_link` during onboarding (new field on the onboarding form) or update it from their profile/settings page at any time
- On booking confirmation: `meeting_link` on the booking is **auto-populated** from `default_meet_link`; teacher can **override** for that specific booking
- On the teacher bookings page, each confirmed/upcoming booking shows a **Meet Link Status** indicator:
  - "Meet Link Added" — green indicator
  - "Meet Link Missing" — warning indicator with option to add link inline
- Teachers can add/update the meeting link for an existing confirmed booking directly from their bookings page

### Student Booking UX — Meet Link
- On the **student bookings page** (`/student/bookings`), each confirmed/upcoming session shows either:
  - **"Join Lesson"** button (active, links to meet URL) — when meeting_link is set
  - **"Waiting for teacher"** (greyed out / disabled) — when meeting_link is not yet set

### Email Notifications (now IN SCOPE — removed from deferred)
- **Booking confirmation email** to student: sent when teacher confirms; includes the meet link if already set
- **Meet link added email** to student: sent when teacher adds/updates the meeting link on a confirmed booking the student doesn't yet have a link for
- **24-hour reminder email** to teacher: sent 24h before the lesson — if meet link is missing, the reminder is stronger ("Please add your Google Meet link before the lesson")
- **1-hour reminder email** to teacher: if meet link is still missing 1h before the lesson, send a final reminder
- Email service: **Resend** (transactional, developer-friendly, integrates with React Email templates)
- Reminder emails are triggered by a **Vercel Cron** job that runs every hour and checks upcoming lessons

### Admin View — Lesson Monitoring
- Admin can see a **"Missing Meet Links"** section on the admin dashboard or a dedicated page
- Shows: upcoming lessons where `meeting_link IS NULL`, sorted by date, with teacher name and student name

### Credit Packages (Stripe)
- **Three tiers** are offered:
  - **Essentials — Single**: CHF 79 (1 session credit)
  - **Essentials — 5-pack**: CHF 375 (5 session credits)
  - **Essentials — 10-pack**: CHF 690 (10 session credits)
  - **Plus**: CHF 299/month (Stripe subscription — grants 4 session credits on each successful charge)
  - **Excellence**: CHF 549/month (Stripe subscription — grants 8 session credits on each successful charge)
- Credits are **reset (not rolled over)** on each monthly renewal — unused credits do not carry forward
- Stripe Checkout **redirect flow** for all purchases (one-off and subscription)
- After successful payment: redirect back to `/student/packages?success=true` with updated credit balance and success banner
- Stripe webhook must be **idempotent** on `stripe_session_id` (existing constraint from STATE.md)

### Post-Session Review
- Completed booking cards on the **student bookings page** show a "Leave a review" button
- Student is not forced — they review at their own pace from their bookings history
- Clicking the button **expands an inline form** on the booking card (no modal, no page navigation)
- Form: star rating 1–5 (required) + written comment (optional textarea)
- One review per completed session; after submitting the button disappears

### Teacher Earnings & Payout
- Dedicated `/teacher/earnings` page linked from teacher nav
- Page shows: **pending balance** (CHF) at top, earnings history table (date, student name, CHF amount per session)
- **"Request payout" button** on the earnings page → inline form or modal opens
- Payout always requests **full pending balance** — no partial amount field
- After submitting: payout request appears in admin's payout queue; teacher sees request status (pending/processed)

### Claude's Discretion
- Exact slot reservation logic at the DB level (time overlap detection)
- Whether blocker exceptions are date-specific or date+time ranges
- UI component choice for the monthly calendar (build custom or adapt existing patterns)
- Loading skeleton design for bookings and availability views
- Star rating widget implementation (CSS-only or small utility)
- Exact Stripe Billing Portal integration for subscription management (cancel/upgrade flow)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card`, `CardHeader` — paper/muted/inset/brand tones, flat/soft/raised elevation; usable for booking cards and earnings rows
- `EmptyState` — icon, title, description, hint, optional actionLabel/actionHref; student and teacher bookings pages already use it as stubs
- `Badge`, `StatusBadge` — for booking status (pending/confirmed/completed/cancelled)
- `StatCard` — for pending CHF balance on teacher earnings page
- `Table` — with emptyState support; usable for earnings history
- `EmptyState` is already the placeholder in student/bookings and teacher/bookings — replace with real UI

### Established Patterns
- Server components + Server Actions for mutations
- `requireRoleFromParams` for auth guard on all role-protected pages
- `getDictionary` + `localizedPath` for all i18n strings and paths
- `DashboardLayout` with navItems, eyebrow, title, subtitle — used by all dashboard pages
- `config/pricing.ts` — existing tiers (essentials/plus/excellence) + prices already match; update to reflect session credit semantics

### Integration Points
- `/student/teachers/[id]` — teacher profile page; booking calendar + request form lands here
- `/student/bookings` — stub to become booking list with review inline forms
- `/teacher/bookings` — stub to become teacher's request queue (confirm/decline/mark complete)
- `/student/packages` — already has `PricingGrid` and links to `/pricing`; add Stripe Checkout action
- Add `/teacher/earnings` to teacher nav and routing
- Supabase `availability_slots`, `bookings`, `credits`, `earnings`, `payouts`, `reviews` tables all exist in schema; no queries or actions built yet
- Stripe: `stripe_price_id` column exists; Stripe SDK not yet installed

</code_context>

<specifics>
## Specific Ideas

- "Students see slots in 15-minute differences — so if teacher is free 2pm–8pm, student sees 2:00, 2:15, 2:30, etc."
- "As soon as the student asks for a slot, the time slots get reserved until the teacher accepts or declines"
- Monthly calendar is the student-facing view; teacher sets ranges, not individual slots
- Pricing tiers (Essentials / Plus / Excellence) match the existing `config/pricing.ts` structure with the exact CHF values specified

</specifics>

<deferred>
## Deferred Ideas

- Double slots (100-min sessions) — noted for later in phase or v2
- Real-time slot refresh if another student books while browsing — not required for v1
- Stripe Billing Portal for subscription cancellation/management — noted; Claude handles minimal implementation for v1
- Structured IBAN/bank fields for teacher payout info — v2 (PAYOUT-01); payout_info_placeholder freetext used for now
- **Phase 2 upgrade path**: Google Calendar API integration to auto-create events with Meet links
- **Phase 3 upgrade path**: Automatic Meet link creation via Google Meet API (the `default_meet_link` column intentionally stores a plain URL to be replaced by a generated URL later without schema changes)
- Student booking request confirmation email (NOTIF-01) — kept deferred; confirmation email triggers on *teacher confirm*, not on request

</deferred>

---

*Phase: 03-core-transaction*
*Context gathered: 2026-05-31, updated 2026-06-01 with Google Meet link MVP + Resend email notifications*
