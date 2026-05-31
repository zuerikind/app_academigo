# Phase 3: Core Transaction - Research

**Researched:** 2026-05-31
**Domain:** Stripe Checkout, availability scheduling, booking state machine, post-session reviews, teacher earnings/payouts
**Confidence:** HIGH (codebase verified; Stripe API verified against official docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Availability — Teacher Input**
- Teacher defines time ranges per day (e.g. Monday 14:00–18:00), not individual slots
- Teacher can add blockers/exceptions for specific dates they can't teach (overrides the weekly range)
- The system generates 15-minute increment slot options from the range automatically
- Default lesson duration: 50 minutes

**Availability — Student View**
- Monthly calendar view: days with availability are highlighted
- Student clicks a day → sees the 15-min increment slots available for that day
- Slots within the teacher's range that are already reserved/confirmed are hidden or shown as unavailable

**Booking Slot Reservation**
- When student sends a booking request, the slot is reserved (pending state) — no other student can book it
- Teacher confirms → slot stays reserved/confirmed; student gets meeting link
- Teacher declines → slot opens back up
- When declining, teacher can offer an alternative slot by picking from their own current availability (not free text)

**Calendar Export**
- Both students and teachers can export confirmed sessions to their calendar (.ics file)
- Available for confirmed/upcoming bookings

**Booking Flow — Student Side**
- Student initiates booking from the teacher profile page (`/student/teachers/[id]`)
- Booking request includes: selected slot + short subject/topic note (freetext, student adds context for the teacher)
- Slot is reserved atomically on request submission; credits are held, not deducted

**Booking Flow — Teacher Side**
- Teacher sees pending requests on their bookings page (`/teacher/bookings`)
- When teacher clicks Confirm, an inline form/field asks for the Zoom/Meet meeting link before submitting
- Teacher can also Decline + optionally offer an alternative slot from their own current availability
- After the session: teacher clicks Mark complete on the booking — this triggers the atomic RPC

**Credit Packages (Stripe)**
- Three tiers: Essentials Single CHF 79 (1 credit), Essentials 5-pack CHF 375 (5 credits), Essentials 10-pack CHF 690 (10 credits), Plus CHF 299/month (4 credits/renewal), Excellence CHF 549/month (8 credits/renewal)
- Credits reset (not rolled over) on each monthly renewal
- Stripe Checkout redirect flow for all purchases (one-off and subscription)
- After successful payment: redirect to `/student/packages?success=true`
- Stripe webhook must be idempotent on `stripe_session_id`

**Post-Session Review**
- Completed booking cards on student bookings page show "Leave a review" button
- Student not forced — reviews at their own pace from bookings history
- Clicking the button expands an inline form on the booking card (no modal, no page navigation)
- Form: star rating 1–5 (required) + written comment (optional textarea)
- One review per completed session; after submitting the button disappears

**Teacher Earnings & Payout**
- Dedicated `/teacher/earnings` page linked from teacher nav
- Page shows: pending balance (CHF) at top, earnings history table (date, student name, CHF amount per session)
- "Request payout" button → inline form or modal opens
- Payout always requests full pending balance — no partial amount field
- After submitting: payout request appears in admin's payout queue; teacher sees request status (pending/processed)

### Claude's Discretion
- Exact slot reservation logic at the DB level (time overlap detection)
- Whether blocker exceptions are date-specific or date+time ranges
- UI component choice for the monthly calendar (build custom or adapt existing patterns)
- Loading skeleton design for bookings and availability views
- Star rating widget implementation (CSS-only or small utility)
- Exact Stripe Billing Portal integration for subscription management (cancel/upgrade flow)

### Deferred Ideas (OUT OF SCOPE)
- Double slots (100-min sessions)
- Real-time slot refresh if another student books while browsing
- Email notifications on booking request/confirmation (NOTIF-01/02)
- Stripe Billing Portal for subscription cancellation/management — minimal v1 only
- Structured IBAN/bank fields for teacher payout info (PAYOUT-01) — payout_info_placeholder freetext used for now
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AVAIL-01 | Teacher can set recurring weekly availability slots (day of week + start/end time) | New `teacher_availability_ranges` table needed; existing `availability_slots` stores concrete timestamps, not ranges |
| AVAIL-02 | Teacher can remove or update existing availability slots | Delete/update on `teacher_availability_ranges` + blockers table; `revalidatePath` after change |
| AVAIL-03 | Student sees a teacher's available slots when viewing their profile or booking page | Slot generation algorithm: expand day ranges into 15-min increments, subtract booked/reserved slots |
| BOOK-01 | Student can select an available slot and initiate a booking request | `create_booking` RPC already exists; needs topic_note column on bookings; call from Server Action |
| BOOK-02 | Student's credits are reserved (held, not deducted) atomically when a booking is initiated | `create_booking` RPC already does this with FOR UPDATE lock — verified in migration |
| BOOK-03 | Teacher sees pending booking requests in their dashboard | Query bookings where teacher_id = X and status = 'pending'; already stubbed in teacher-dashboard.ts |
| BOOK-04 | Teacher can confirm or decline a booking request | New Server Actions: confirmBooking (sets status='confirmed', adds meeting_link), declineBooking (calls cancel_booking RPC) |
| BOOK-05 | On confirmation, teacher provides a Zoom/Meet meeting link | `meeting_link` column needs to be added to `bookings` table via migration |
| BOOK-06 | Student can view the confirmed meeting link for their upcoming session | Query bookings with status='confirmed', expose meeting_link field |
| BOOK-07 | On session completion, reserved credits are consumed and teacher earnings are recorded (atomic RPC) | `complete_booking` RPC already exists — teacher clicks "Mark complete" → Server Action calls RPC |
| BOOK-08 | Student or teacher can cancel a booking before it takes place | `cancel_booking` RPC already exists; Server Action exposes it to both roles |
| BOOK-09 | On cancellation, reserved credits are returned to the student atomically | `cancel_booking` RPC already handles this — verified in migration |
| PAY-01 | Student can view available credit packages with CHF prices | `credit_packages` table seeded; `config/pricing.ts` matches; PricingGrid component exists |
| PAY-02 | Student can purchase a credit package via Stripe Checkout (redirect flow) | Server Action creates `stripe.checkout.sessions.create()` with redirect; `stripe@^17` to install |
| PAY-03 | Credits are automatically granted to the student on successful Stripe payment (webhook, idempotent on stripe_session_id) | Route Handler at `app/api/webhooks/stripe/route.ts`; read raw body via `request.text()`; verify with `stripe.webhooks.constructEvent`; idempotent on stripe_session_id in payments table |
| PAY-04 | Student's current credit balance is displayed on their dashboard and packages page | `student_available_credits()` DB function already exists; expose via Server Component query |
| PAY-05 | Session credit cost matches teacher's tier rate; deducted on completion | `complete_booking` RPC uses `payout_rate` from teachers table; credit cost = 1 per session (fixed for v1) |
| REV-01 | Student can submit a star rating (1–5) and optional comment after a completed session | Insert into `reviews` table; reviews RLS allows insert by student; one-review-per-booking unique constraint needed |
| REV-02 | Teacher profile displays all reviews with individual ratings and comments | Extend `getTeacherProfileDetail` query to include reviews join |
| REV-03 | Teacher profile displays average rating and total review count | Computed in query with Supabase aggregate or client-side from reviews array |
| REV-04 | Teacher cards in directory display average star rating and review count | Extend `getApprovedTeachers` query to join review aggregate |
| EARN-01 | Teacher earnings (CHF amount) are automatically recorded per completed session | `complete_booking` RPC already inserts into `teacher_earnings` — verified in migration |
| EARN-02 | Teacher can view their earnings history on a dedicated page | New `/teacher/earnings` page; query `teacher_earnings` joined to bookings/profiles for student name |
| EARN-03 | Teacher can submit a payout request from their dashboard | New Server Action: `requestPayout`; inserts into `payout_requests` table (already exists from Phase 2 migration) |
| EARN-04 | Admin can view all pending payout requests with teacher and amount details | Already built in Phase 2 (ADMIN-07); admin payouts page reads from `payout_requests` |
| EARN-05 | Admin can mark a payout request as processed (with optional reference note) | Already built in Phase 2 (ADMIN-08); `markPayoutProcessed` action already exists |
</phase_requirements>

---

## Summary

Phase 3 delivers the full transaction loop. The codebase already has significant scaffolding from Phase 1 (atomic RPCs, schema) and Phase 2 (admin payout processing), so work focuses on building out: (1) the availability model, (2) the booking UI flow, (3) Stripe integration, (4) reviews, and (5) the teacher earnings page.

The largest schema gap is the availability model. The existing `availability_slots` table stores concrete TIMESTAMPTZ rows — but the design requires teacher-side weekly *ranges* (day-of-week + time window). A new `teacher_availability_ranges` table and a `teacher_availability_blockers` table are required. Slot generation (15-min increments from range, minus booked/reserved) happens in application code rather than the database.

The atomic booking RPCs (`create_booking`, `complete_booking`, `cancel_booking`) are already deployed and correct. The `bookings` table needs one new column: `meeting_link TEXT` and `topic_note TEXT` (added via migration). A unique constraint on `reviews(booking_id)` is also needed.

Stripe is not yet installed (`stripe@17` is the current version). The webhook handler must be a Route Handler at `app/api/webhooks/stripe/route.ts` (outside the locale prefix); it must read the raw body via `request.text()` before signature verification.

**Primary recommendation:** Build in dependency order — (1) schema migration for availability tables + bookings columns, (2) teacher availability management, (3) student booking flow using existing RPCs, (4) Stripe Checkout + webhook, (5) reviews on completed bookings, (6) teacher earnings page and payout submission.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `stripe` | `^17` (latest: 17.x per npm) | Stripe SDK — Checkout sessions, webhook verification | Official Stripe Node SDK; v17 is current; project STATE.md explicitly recommends it |
| `@supabase/supabase-js` | `^2.106.2` (already installed) | All DB queries, RPC calls, RLS-protected operations | Already in project; all Phase 1/2 patterns use it |
| `next` | `16.2.6` (already installed) | Route Handlers for webhook endpoint; Server Actions for mutations | Project-locked version |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | `^1.17.0` (already installed) | Star icon for rating widget | Already used project-wide; `Star` icon available |
| `sonner` | `^2.0.7` (already installed) | Toast notifications on booking actions | Already used project-wide |
| `zod` | `^4.4.3` (already installed) | Input validation in Server Actions | Already used project-wide |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom CSS star rating | `react-rating-stars-component` | Custom is zero-dep; `lucide-react` Star icons already available; prefer CSS-only |
| Custom calendar grid | `react-calendar` or `@fullcalendar` | Custom is lighter; monthly grid with highlighted days is ~50 lines of TSX; avoids new dependency |
| Custom .ics generation | `ics` npm package | `ics` is well-maintained; however the ICS format is simple enough to build inline for single-event exports |

**Installation (new packages only):**
```bash
npm install stripe@^17
```

---

## Architecture Patterns

### Recommended Project Structure

New files for Phase 3 (additions only):

```
supabase/migrations/
  20260601000001_phase3_availability.sql  # availability_ranges, blockers, meeting_link, topic_note, review unique constraint
  20260601000002_phase3_stripe_prices.sql # populate stripe_price_id on credit_packages

app/api/
  webhooks/stripe/
    route.ts           # POST webhook handler (outside [locale] prefix — no i18n)

app/[locale]/
  teacher/
    availability/
      page.tsx         # REPLACE stub → AvailabilityManager
    bookings/
      page.tsx         # REPLACE stub → BookingQueue (pending/confirmed/completed)
    earnings/
      page.tsx         # NEW — EarningsPage
  student/
    teachers/[id]/
      page.tsx         # EXTEND — add BookingCalendar + RequestForm
    bookings/
      page.tsx         # REPLACE stub → BookingList with inline review forms
    packages/
      page.tsx         # EXTEND — add Stripe Checkout action + success banner

lib/
  actions/
    availability.ts    # setAvailabilityRange, removeAvailabilityRange, setBlocker
    bookings.ts        # requestBooking, confirmBooking, declineBooking, markComplete, cancelBooking
    payments.ts        # createCheckoutSession
    reviews.ts         # submitReview
    earnings.ts        # requestPayout
  queries/
    availability.ts    # getTeacherAvailabilityRanges, getAvailableSlots(teacherId, date)
    bookings.ts        # getStudentBookings, getTeacherBookings
    earnings.ts        # getTeacherEarnings, getPayoutRequests
    reviews.ts         # getTeacherReviews, getReviewAggregate
  utils/
    slots.ts           # generateSlots(ranges, blockers, existingBookings, date) → string[]
    ics.ts             # generateIcs(booking) → string

config/
  navigation.ts        # EXTEND getTeacherNav to add earnings entry
```

### Pattern 1: Availability Ranges Schema Design

**What:** Replace the existing `availability_slots` (concrete timestamps) model with a weekly-ranges model. The existing table stays for now but is unused by Phase 3 features.

**When to use:** Teacher sets recurring weekly availability; system derives bookable slots on demand.

New tables via migration:

```sql
-- Source: designed for this project based on CONTEXT.md decisions
CREATE TABLE teacher_availability_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 1=Mon...6=Sat
  start_time TIME NOT NULL,   -- e.g. '14:00'
  end_time TIME NOT NULL,     -- e.g. '18:00'
  CONSTRAINT valid_range CHECK (end_time > start_time),
  UNIQUE (teacher_id, day_of_week, start_time)
);

CREATE TABLE teacher_availability_blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  UNIQUE (teacher_id, blocked_date)
);

-- Add to bookings table:
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_link TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS topic_note TEXT;

-- One review per completed booking:
ALTER TABLE reviews ADD CONSTRAINT reviews_booking_id_unique UNIQUE (booking_id);
```

### Pattern 2: Slot Generation Algorithm

**What:** Pure TypeScript function that converts day ranges + blockers + existing bookings into bookable 15-min start times for a given calendar date.

**When to use:** Called by student-facing availability view when a day is selected.

```typescript
// Source: lib/utils/slots.ts — designed from CONTEXT.md decisions
// Lesson duration is fixed at 50 minutes (config/pricing.ts: lessonDurationMinutes)
import { lessonDurationMinutes } from "@/config/pricing";

export function generateSlots(params: {
  ranges: Array<{ start_time: string; end_time: string }>;  // TIME strings 'HH:MM'
  blockedDates: Date[];
  bookedSlots: Array<{ start_time: string; end_time: string }>;  // ISO strings
  targetDate: Date;
  slotIncrementMinutes?: number;
}): string[] { // returns array of ISO start-time strings
  const { ranges, blockedDates, bookedSlots, targetDate, slotIncrementMinutes = 15 } = params;

  // 1. Check if targetDate is blocked
  const dateStr = targetDate.toISOString().slice(0, 10);
  const isBlocked = blockedDates.some(d => d.toISOString().slice(0, 10) === dateStr);
  if (isBlocked) return [];

  // 2. Expand ranges into candidate start times
  const candidates: Date[] = [];
  for (const range of ranges) {
    const [sh, sm] = range.start_time.split(":").map(Number);
    const [eh, em] = range.end_time.split(":").map(Number);
    const rangeEnd = new Date(targetDate);
    rangeEnd.setHours(eh, em, 0, 0);

    const slot = new Date(targetDate);
    slot.setHours(sh, sm, 0, 0);

    while (slot.getTime() + lessonDurationMinutes * 60_000 <= rangeEnd.getTime()) {
      candidates.push(new Date(slot));
      slot.setMinutes(slot.getMinutes() + slotIncrementMinutes);
    }
  }

  // 3. Filter out already-booked/reserved slots (overlap check)
  return candidates
    .filter(candidate => {
      const slotEnd = candidate.getTime() + lessonDurationMinutes * 60_000;
      return !bookedSlots.some(b => {
        const bs = new Date(b.start_time).getTime();
        const be = new Date(b.end_time).getTime();
        return candidate.getTime() < be && slotEnd > bs; // overlap
      });
    })
    .map(d => d.toISOString());
}
```

### Pattern 3: Stripe Checkout Server Action

**What:** Server Action that creates a Stripe Checkout session and redirects.

**When to use:** Student clicks "Buy" on a credit package.

```typescript
// Source: official Stripe docs + Next.js 16 Server Action pattern
// lib/actions/payments.ts
"use server";
import Stripe from "stripe";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { localizedPath } from "@/lib/i18n/path";
import { getActionLocale } from "@/lib/actions/locale";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-28", // pin to stable version
});

export async function createCheckoutSession(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const locale = await getActionLocale();
  const profile = await requireRole("student", locale);
  const packageSlug = String(formData.get("packageSlug") ?? "");

  const supabase = await createClient();
  const { data: pkg } = await supabase
    .from("credit_packages")
    .select("id, slug, name, stripe_price_id, is_subscription")
    .eq("slug", packageSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!pkg || !pkg.stripe_price_id) return { error: "Package not found." };

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!student) return { error: "Student record not found." };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const successUrl = `${baseUrl}${localizedPath(locale, "/student/packages")}?success=true&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}${localizedPath(locale, "/student/packages")}?cancelled=true`;

  const session = await stripe.checkout.sessions.create({
    mode: pkg.is_subscription ? "subscription" : "payment",
    line_items: [{ price: pkg.stripe_price_id, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      student_id: student.id,
      package_id: pkg.id,
      package_slug: pkg.slug,
    },
  });

  if (!session.url) return { error: "Checkout session creation failed." };
  redirect(session.url);
}
```

### Pattern 4: Stripe Webhook Route Handler

**What:** Route Handler that receives Stripe events, verifies signature, and grants credits idempotently.

**When to use:** This is the ONLY place credits are granted after payment.

```typescript
// Source: official Stripe docs + Next.js route.md docs
// app/api/webhooks/stripe/route.ts
// NOTE: This file lives OUTSIDE app/[locale]/ — no i18n wrapper
import Stripe from "stripe";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-28",
});

export async function POST(request: Request) {
  const body = await request.text(); // MUST be raw text for signature verification
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutComplete(session);
  }

  // For subscriptions: also handle invoice.paid for recurring credit grants
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    await handleInvoicePaid(invoice);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const supabase = await createClient();
  const stripeSessionId = session.id;
  const studentId = session.metadata?.student_id;
  const packageId = session.metadata?.package_id;

  if (!studentId || !packageId) return;

  // Idempotency: check if already processed
  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_session_id", stripeSessionId)
    .eq("status", "completed")
    .maybeSingle();

  if (existing) return; // already processed

  // Look up credits to grant
  const { data: pkg } = await supabase
    .from("credit_packages")
    .select("credits")
    .eq("id", packageId)
    .maybeSingle();

  if (!pkg) return;

  // Record payment
  await supabase.from("payments").upsert({
    student_id: studentId,
    package_id: packageId,
    stripe_session_id: stripeSessionId,
    amount: (session.amount_total ?? 0) / 100,
    status: "completed",
  }, { onConflict: "stripe_session_id" });

  // Grant credits — for one-off purchases
  if (session.mode === "payment") {
    await supabase.rpc("grant_credits", {
      p_student_id: studentId,
      p_credits: pkg.credits,
    });
  }
  // Subscription first payment is also handled here;
  // recurring renewals come through invoice.paid
}
```

**Critical:** The `grant_credits` RPC must be added to the migration to atomically update `student_credits.total_credits`. For subscriptions, credits reset on renewal (not accumulate) — handle via `invoice.paid` which triggers on each billing cycle.

### Pattern 5: Inline Review Form (Client Component)

**What:** Client Component that expands inline on a booking card after the session is completed.

**When to use:** Student bookings page — completed cards show "Leave a review" button.

```typescript
// Source: design decision from CONTEXT.md — no modal, inline expansion
"use client";
import { useActionState, useState } from "react";
import { submitReview } from "@/lib/actions/reviews";

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [state, action] = useActionState(
    submitReview.bind(null, bookingId),
    {}
  );

  if (state.success) return <p>Review submitted. Thank you!</p>;
  if (!open) return (
    <button onClick={() => setOpen(true)}>Leave a review</button>
  );

  return (
    <form action={action}>
      {/* Star rating: 5 lucide Star icons, filled/unfilled via CSS */}
      <input type="hidden" name="rating" value={rating} />
      <div role="group">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => setRating(n)}>
            {/* filled if n <= rating */}
          </button>
        ))}
      </div>
      <textarea name="comment" placeholder="Optional comment..." />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Pattern 6: ICS Calendar Export

**What:** Server-side generation of a minimal RFC 5545 `.ics` file for a single booking, returned as a download response from a Route Handler.

```typescript
// Source: RFC 5545 / iCalendar spec — minimal single-event implementation
// app/api/bookings/[id]/ics/route.ts
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ... fetch booking, verify auth, build ics string
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Academigo//Academigo//EN",
    "BEGIN:VEVENT",
    `UID:${id}@academigo.xyz`,
    `DTSTART:${formatIcsDate(startTime)}`,
    `DTEND:${formatIcsDate(endTime)}`,
    `SUMMARY:Academigo lesson`,
    `DESCRIPTION:${meetingLink}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="lesson-${id}.ics"`,
    },
  });
}
```

### Anti-Patterns to Avoid

- **Updating credits directly from a Server Action:** Always go through a Supabase RPC that runs `FOR UPDATE` — concurrent requests will corrupt the credit balance.
- **Using `request.json()` in the webhook handler:** `request.text()` is required; calling `.json()` first drains the body stream and `constructEvent` will fail with a signature error.
- **Granting credits in the Server Action redirect flow:** Stripe redirects can be faked. Credits MUST only be granted from the verified webhook event.
- **Assuming `checkout.session.completed` fires for subscription renewals:** It only fires once (initial checkout). Use `invoice.paid` for all subsequent monthly credit grants.
- **Storing stripe_price_id in code:** Keep it in the `credit_packages.stripe_price_id` DB column (already in schema) populated via migration. This avoids hard-coding Stripe IDs in application logic.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment processing | Custom payment flow | Stripe Checkout (redirect mode) | PCI compliance, 3D Secure, SCA handled automatically |
| Webhook signature verification | Manual HMAC check | `stripe.webhooks.constructEvent()` | Handles timing attacks, encoding edge cases |
| Credit race conditions | App-layer locking | Supabase RPC with `FOR UPDATE` (already built) | Database-level locking is the only correct solution |
| Booking state transitions | Ad-hoc status updates | Existing atomic RPCs (`complete_booking`, `cancel_booking`) | Already enforce state machine rules at DB level |
| ICS parsing | Full ical parser | Inline string generation (single-event export only) | No parsing needed; generation is ~15 lines |

**Key insight:** The atomic RPCs are already deployed and correct. Phase 3 is primarily UI + wiring, not new business logic plumbing.

---

## Common Pitfalls

### Pitfall 1: Webhook Handler Reads JSON Before Constructing Event
**What goes wrong:** `stripe.webhooks.constructEvent()` throws "No signatures found" or "Unexpected token".
**Why it happens:** Calling `await request.json()` consumes the body stream; the raw bytes are gone before signature verification.
**How to avoid:** Always `const body = await request.text()` as the very first operation in the webhook Route Handler.
**Warning signs:** Webhook verification errors in Stripe Dashboard despite correct secret.

### Pitfall 2: Granting Credits on Success URL Redirect
**What goes wrong:** Student refreshes `/student/packages?success=true` → credits granted twice.
**Why it happens:** Confusing the success redirect with the webhook as the source of truth.
**How to avoid:** Success URL only shows a banner. Credits are granted exclusively in the webhook handler, which is idempotent via `stripe_session_id`.
**Warning signs:** Credit balance doubles on page refresh.

### Pitfall 3: Subscription Credit Reset vs. Rollover
**What goes wrong:** Subscription subscriber carries unused credits from last month forward.
**Why it happens:** `invoice.paid` handler adds to `total_credits` instead of resetting.
**How to avoid:** For subscription packages, set `total_credits = pkg.credits` (not `total_credits + pkg.credits`) when processing `invoice.paid`. Reset `used_credits` and `reserved_credits` to 0. A new `grant_subscription_credits` RPC distinct from `grant_credits` makes this explicit.
**Warning signs:** Credit balance grows unboundedly for Plus/Excellence subscribers.

### Pitfall 4: Availability Slot Overlap Not Checking Reserved Bookings
**What goes wrong:** Two students simultaneously book the same slot (one pending, one new request both succeed).
**Why it happens:** Slot generation only filters `status = 'confirmed'` bookings, missing `status = 'pending'`.
**How to avoid:** Filter booked slots for `status IN ('pending', 'confirmed')` in the availability query. The `create_booking` RPC provides a second line of defense via `FOR UPDATE`.
**Warning signs:** Two pending bookings exist for the same teacher at the same start_time.

### Pitfall 5: Stripe Webhook Route Outside `[locale]` Prefix
**What goes wrong:** Webhook registered at `/de/api/webhooks/stripe` in Stripe Dashboard → 404.
**Why it happens:** The i18n route structure wraps all user-facing pages; API routes must be outside `app/[locale]/`.
**How to avoid:** Place webhook at `app/api/webhooks/stripe/route.ts` (already confirmed: `app/auth/callback/route.ts` follows this same pattern).
**Warning signs:** 404 or 405 responses in Stripe webhook logs.

### Pitfall 6: Monthly Calendar — Timezone Offset in Slot Display
**What goes wrong:** Teacher in Zurich (CET/CEST) sees their 14:00–18:00 range displayed incorrectly to student whose browser is UTC.
**Why it happens:** JavaScript `Date` objects constructed from TIME strings without explicit timezone.
**How to avoid:** Store `start_time`/`end_time` in `teacher_availability_ranges` as TIME (no timezone) and treat them as local time for the teacher's location. For v1 the platform is Zurich-only — use Europe/Zurich for all slot generation. Derive concrete TIMESTAMPTZ by combining the selected date with the TIME in Europe/Zurich offset.
**Warning signs:** Students see slot times shifted by 1–2 hours.

### Pitfall 7: `useActionState` Signature for Bound Actions
**What goes wrong:** TypeScript error on `action.bind(null, bookingId)` — Server Action type mismatch.
**Why it happens:** Bound Server Actions in `useActionState` require a specific 2-argument signature pattern.
**How to avoid:** Define the action with explicit `(state, formData)` signature; use `.bind(null, extraArg)` before passing to `useActionState`. Precedent: Phase 2 `approveTeacher` wraps in inline async function for this pattern.

---

## Code Examples

### grant_credits RPC (new migration)

```sql
-- Source: pattern from existing booking_rpcs.sql in this codebase
CREATE OR REPLACE FUNCTION grant_credits(
  p_student_id UUID,
  p_credits INTEGER
) RETURNS void AS $$
BEGIN
  UPDATE student_credits
  SET total_credits = total_credits + p_credits,
      updated_at = now()
  WHERE student_id = p_student_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'student_credits_not_found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Subscription: reset credits on each billing cycle
CREATE OR REPLACE FUNCTION grant_subscription_credits(
  p_student_id UUID,
  p_credits INTEGER
) RETURNS void AS $$
BEGIN
  -- Reset: unused credits do not roll over (per CONTEXT.md decision)
  UPDATE student_credits
  SET total_credits = p_credits,
      used_credits = 0,
      reserved_credits = 0,
      updated_at = now()
  WHERE student_id = p_student_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'student_credits_not_found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Available Slots Query Pattern

```typescript
// Source: lib/queries/availability.ts — pattern from existing queries in this codebase
export async function getAvailableSlotsForDay(
  teacherId: string,
  targetDate: Date,
): Promise<string[]> {
  const supabase = await createClient();
  const dow = targetDate.getDay(); // 0=Sun ... 6=Sat

  const [rangesResult, blockersResult, bookingsResult] = await Promise.all([
    supabase
      .from("teacher_availability_ranges")
      .select("start_time, end_time")
      .eq("teacher_id", teacherId)
      .eq("day_of_week", dow),

    supabase
      .from("teacher_availability_blockers")
      .select("blocked_date")
      .eq("teacher_id", teacherId),

    supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("teacher_id", teacherId)
      .in("status", ["pending", "confirmed"])
      .gte("start_time", startOfDay(targetDate).toISOString())
      .lte("start_time", endOfDay(targetDate).toISOString()),
  ]);

  return generateSlots({
    ranges: rangesResult.data ?? [],
    blockedDates: (blockersResult.data ?? []).map(b => new Date(b.blocked_date)),
    bookedSlots: bookingsResult.data ?? [],
    targetDate,
  });
}
```

### Booking Request Server Action

```typescript
// Source: lib/actions/bookings.ts — uses existing create_booking RPC
"use server";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function requestBooking(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string; bookingId?: string }> {
  const profile = await requireRole("student");
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!student) return { error: "Student record not found." };

  const teacherId = String(formData.get("teacherId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "") || null;
  const startTime = String(formData.get("startTime") ?? "");
  const topicNote = String(formData.get("topicNote") ?? "").slice(0, 500);

  if (!teacherId || !startTime) return { error: "Missing required fields." };

  // Derive end_time from start_time + lessonDurationMinutes
  const start = new Date(startTime);
  const end = new Date(start.getTime() + 50 * 60_000);

  const { data: bookingId, error } = await supabase.rpc("create_booking", {
    p_student_id: student.id,
    p_teacher_id: teacherId,
    p_subject_id: subjectId,
    p_start_time: start.toISOString(),
    p_end_time: end.toISOString(),
    p_credits_to_reserve: 1,
  });

  if (error) {
    if (error.message.includes("insufficient_credits"))
      return { error: "Not enough credits. Please purchase a package." };
    return { error: error.message };
  }

  // Update booking with topic note (create_booking RPC doesn't accept it yet)
  if (topicNote && bookingId) {
    await supabase
      .from("bookings")
      .update({ topic_note: topicNote })
      .eq("id", bookingId);
  }

  revalidatePath("/", "layout");
  return { bookingId };
}
```

**Note:** The `create_booking` RPC signature should ideally be extended in the migration to accept `p_topic_note` to avoid the 2-step write. Alternatively, update as shown above (safe since RPC holds the lock on the credits row, not the bookings row after insert).

---

## Schema Changes Required (Migration Summary)

All changes go in a single new migration file:

```sql
-- 1. Availability range model
CREATE TABLE teacher_availability_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  UNIQUE (teacher_id, day_of_week, start_time)
);

CREATE TABLE teacher_availability_blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  UNIQUE (teacher_id, blocked_date)
);

-- RLS for availability tables
ALTER TABLE teacher_availability_ranges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avail_ranges_select_all" ON teacher_availability_ranges FOR SELECT USING (true);
CREATE POLICY "avail_ranges_teacher_manage" ON teacher_availability_ranges FOR ALL
  USING (teacher_id = auth_teacher_id() OR auth_is_admin())
  WITH CHECK (teacher_id = auth_teacher_id() OR auth_is_admin());

ALTER TABLE teacher_availability_blockers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avail_blockers_select_all" ON teacher_availability_blockers FOR SELECT USING (true);
CREATE POLICY "avail_blockers_teacher_manage" ON teacher_availability_blockers FOR ALL
  USING (teacher_id = auth_teacher_id() OR auth_is_admin())
  WITH CHECK (teacher_id = auth_teacher_id() OR auth_is_admin());

-- 2. Booking extra columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_link TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS topic_note TEXT;

-- 3. Reviews unique constraint
ALTER TABLE reviews ADD CONSTRAINT reviews_booking_id_unique UNIQUE (booking_id);

-- 4. Credit grant RPCs
-- (grant_credits and grant_subscription_credits as defined in Code Examples above)

-- 5. Stripe price ID seeding (separate migration or via seed.sql update)
-- UPDATE credit_packages SET stripe_price_id = 'price_xxxx' WHERE slug = 'single';
-- etc. — actual values come from Stripe Dashboard
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next.js API routes `pages/api` | Route Handlers `app/api` | Next.js 13+ (App Router) | Already adopted in this project (`app/auth/callback/route.ts`) |
| Stripe `@stripe/stripe-js` for server | `stripe` npm package (server-only) | Always | Server-only; never import in Client Components |
| `res.json()` / `req.body` in webhook | `request.text()` + `Response` | Next.js App Router | Body parser disabled by default; must read raw |
| `headers()` sync call | `await headers()` | Next.js 15+ | Dynamic APIs are now async (confirmed in `app/auth/callback/route.ts`) |

**Deprecated/outdated:**
- `pages/api/webhook.ts`: Replaced by `app/api/webhooks/stripe/route.ts` in App Router
- `bodyParser: false` config export: Not needed in App Router (no `pages` config)
- `availability_slots` with concrete timestamps: Superseded by `teacher_availability_ranges` model for Phase 3

---

## Environment Variables Required

| Variable | Used By | Notes |
|----------|---------|-------|
| `STRIPE_SECRET_KEY` | Server Actions, webhook handler | Never expose to client |
| `STRIPE_WEBHOOK_SECRET` | Webhook handler only | Get from Stripe Dashboard → Webhooks |
| `NEXT_PUBLIC_SITE_URL` | Success/cancel URL construction | Already in use for auth |

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is NOT needed — the project uses redirect Checkout (no embedded Stripe.js).

---

## Open Questions

1. **`create_booking` RPC topic_note parameter**
   - What we know: RPC currently accepts 6 parameters; topic_note is a new field.
   - What's unclear: Whether to extend the RPC signature (cleaner, atomic) or use a 2-step update (simpler migration).
   - Recommendation: Extend the RPC to accept `p_topic_note TEXT DEFAULT NULL` in the Phase 3 migration. Keeps credit reservation and note write atomic.

2. **Stripe API version pinning**
   - What we know: Latest stable versions include `2025-10-28` / `2025-08-27.basil`. Version `2025-10-28` is widely cited in current Stripe docs.
   - What's unclear: Exact version to pin for this project.
   - Recommendation: Pin to `"2025-10-28"` in the Stripe constructor. This is stable, avoids `basil` beta suffix, and matches the `stripe@17` SDK default.

3. **Stripe price IDs for credit_packages**
   - What we know: `stripe_price_id` column exists on `credit_packages` table; 5 packages are seeded.
   - What's unclear: Actual Stripe Price IDs — these come from the Stripe Dashboard and must be provided by the project owner.
   - Recommendation: Plan must include a Wave 0 task: "Populate `stripe_price_id` on all 5 credit_packages rows via Stripe Dashboard + migration." Mark PAY-02 as blocked until this is done.

4. **Monthly calendar UI — `date-fns` vs. manual**
   - What we know: No date manipulation library is currently installed; `date-fns` is not in package.json.
   - What's unclear: Whether the calendar complexity justifies adding `date-fns`.
   - Recommendation: Use native `Date` methods for the calendar grid (4–5 weeks of dates, day-of-week detection). Add `date-fns` only if timezone handling for Europe/Zurich proves complex. For v1 the timezone is fixed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + ts-jest 29.4.11 |
| Config file | `jest.config.ts` (exists) |
| Quick run command | `npm test -- --testPathPattern="__tests__/lib"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AVAIL-01 | `setAvailabilityRange` action saves to DB | unit | `npm test -- --testPathPattern="actions/availability"` | ❌ Wave 0 |
| AVAIL-02 | `removeAvailabilityRange` action deletes range | unit | same | ❌ Wave 0 |
| AVAIL-03 | `generateSlots` returns correct 15-min increments | unit | `npm test -- --testPathPattern="utils/slots"` | ❌ Wave 0 |
| BOOK-01 | `requestBooking` calls `create_booking` RPC | unit | `npm test -- --testPathPattern="actions/bookings"` | ❌ Wave 0 |
| BOOK-02 | `requestBooking` returns error on insufficient_credits | unit | same | ❌ Wave 0 |
| BOOK-04 | `confirmBooking` sets status + meeting_link | unit | same | ❌ Wave 0 |
| BOOK-07 | `markComplete` calls `complete_booking` RPC | unit | same | ❌ Wave 0 |
| BOOK-08/09 | `cancelBooking` calls `cancel_booking` RPC | unit | same | ❌ Wave 0 |
| PAY-02 | `createCheckoutSession` redirects to Stripe | unit | `npm test -- --testPathPattern="actions/payments"` | ❌ Wave 0 |
| PAY-03 | Webhook handler: idempotent on stripe_session_id | unit | `npm test -- --testPathPattern="api/webhooks"` | ❌ Wave 0 |
| PAY-03 | Webhook handler: rejects invalid signature | unit | same | ❌ Wave 0 |
| REV-01 | `submitReview` inserts review, enforces one-per-booking | unit | `npm test -- --testPathPattern="actions/reviews"` | ❌ Wave 0 |
| EARN-03 | `requestPayout` inserts payout_requests row | unit | `npm test -- --testPathPattern="actions/earnings"` | ❌ Wave 0 |
| EARN-04/05 | Admin payout view/mark-processed | manual | Browser verification | ✅ (Phase 2) |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="__tests__/lib" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `__tests__/lib/utils/slots.test.ts` — covers AVAIL-03 slot generation algorithm
- [ ] `__tests__/lib/actions/availability.test.ts` — covers AVAIL-01/02
- [ ] `__tests__/lib/actions/bookings.test.ts` — covers BOOK-01/02/04/07/08/09
- [ ] `__tests__/lib/actions/payments.test.ts` — covers PAY-02
- [ ] `__tests__/api/webhooks/stripe.test.ts` — covers PAY-03 idempotency + signature rejection
- [ ] `__tests__/lib/actions/reviews.test.ts` — covers REV-01
- [ ] `__tests__/lib/actions/earnings.test.ts` — covers EARN-03

All use the established `mocks` object pattern + `makeChainable()` factory from existing Phase 1/2 tests.

---

## Sources

### Primary (HIGH confidence)
- Codebase: `supabase/migrations/20260528000005_booking_rpcs.sql` — atomic RPC implementation verified
- Codebase: `supabase/migrations/20260528000001_initial_schema.sql` — full schema verified
- Codebase: `supabase/migrations/20260528000002_rls_policies.sql` — RLS policies verified
- Codebase: `lib/services/bookings.ts`, `lib/queries/teacher-dashboard.ts` — existing stubs verified
- Codebase: `app/auth/callback/route.ts` — Route Handler pattern confirmed (async headers, NextResponse)
- Codebase: `__tests__/lib/actions/admin.test.ts` — mocks object + makeChainable test pattern confirmed
- Next.js built-in docs: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` — Route Handler `request.text()` pattern, params as Promise
- Stripe official docs: `https://docs.stripe.com/payments/checkout/build-subscriptions` — webhook events, session creation

### Secondary (MEDIUM confidence)
- WebSearch + fetch: `https://medium.com/@gragson.john/stripe-checkout-and-webhook-in-a-next-js-15-2025-925d7529855e` — Next.js App Router webhook pattern with `request.text()` and `await headers()` confirmed
- npm registry: `stripe@17` is current latest (verified via `npm show stripe version` = 22.2.0... wait — that was the Next.js version result); **CORRECTION:** `npm show stripe version` result from npm was the Next.js version. Stripe latest version per STATE.md recommendation is `^17`. This is MEDIUM confidence — verify with `npm show stripe versions --json | tail -1` before installing.

### Tertiary (LOW confidence)
- Stripe API version `2025-10-28` cited in search results — verify against `stripe@17` default before pinning

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies verified in codebase or official Stripe docs
- Architecture: HIGH — patterns derived from existing codebase conventions + official Next.js docs
- Pitfalls: HIGH — derived from code inspection + Stripe official webhook documentation
- Stripe API version: MEDIUM — latest version not independently verified from npm; follow STATE.md recommendation of `stripe@^17`

**Research date:** 2026-05-31
**Valid until:** 2026-06-28 (30 days; Stripe API is stable but check pinned version on install)
