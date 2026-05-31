# Phase 3: Core Transaction - Context

**Gathered:** 2026-05-31
**Status:** Partial — availability discussed; booking flow, Stripe, reviews still needed

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
- Future: double slots (100 min) — noted, deferred to later in phase or v2

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

### Claude's Discretion
- Exact slot reservation logic at the DB level (time overlap detection)
- Whether blocker exceptions are date-specific or date+time ranges
- UI component choice for the monthly calendar (build custom or adapt existing patterns)

</decisions>

<specifics>
## Specific Ideas

- "Students see slots in 15-minute differences — so if teacher is free 2pm–8pm, student sees 2:00, 2:15, 2:30, etc."
- "As soon as the student asks for a slot, the time slots get reserved until the teacher accepts or declines"
- Monthly calendar is the student-facing view; teacher sets ranges, not individual slots

</specifics>

<deferred>
## Deferred Ideas

- Double slots (100-min sessions) — noted for later in phase or v2
- Real-time slot refresh if another student books while browsing — not required for v1

</deferred>

---

**⚠ INCOMPLETE — Areas still to discuss:**
- Booking flow (where student initiates, what the request/confirm UX looks like)
- Stripe checkout (how Buy button works, post-payment landing)
- Post-session review (when/how student is prompted, required vs optional comment)
- Teacher earnings & payout request UI

*Run `/gsd:discuss-phase 3` in a fresh context to continue and update this file.*

---

*Phase: 03-core-transaction*
*Context gathered: 2026-05-31 (partial)*
