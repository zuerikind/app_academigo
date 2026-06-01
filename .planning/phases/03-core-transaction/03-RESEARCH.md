# Phase 3: Core Transaction - Research

**Researched:** 2026-06-01 (updated — Google Meet link, Resend email notifications, Vercel Cron, Admin missing-links view added)
**Domain:** Stripe Checkout, availability scheduling, booking state machine, post-session reviews, teacher earnings/payouts, transactional email (Resend), Vercel Cron
**Confidence:** HIGH (codebase verified; Stripe API verified against official docs; Resend and Vercel Cron verified against official docs)

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
- When teacher clicks Confirm, the confirm form auto-populates the meeting link from the teacher's `default_meet_link` if set; teacher can override for that specific booking
- If no `default_meet_link` is set: teacher sees a warning and must manually enter a link before confirming
- Teacher can also Decline + optionally offer an alternative slot from their own current availability
- After the session: teacher clicks Mark complete on the booking — this triggers the atomic RPC

**Meeting Link Management (Google Meet — MVP Approach)**
- Every teacher profile has a `default_meet_link` field (TEXT, nullable) — their personal Google Meet room URL
- Teachers set `default_meet_link` during onboarding (new field on the onboarding form) or update it from their profile/settings page at any time
- On booking confirmation: `meeting_link` on the booking is auto-populated from `default_meet_link`; teacher can override for that specific booking
- On the teacher bookings page, each confirmed/upcoming booking shows a Meet Link Status indicator:
  - "Meet Link Added" — green indicator
  - "Meet Link Missing" — warning indicator with option to add link inline
- Teachers can add/update the meeting link for an existing confirmed booking directly from their bookings page

**Student Booking UX — Meet Link**
- On the student bookings page (`/student/bookings`), each confirmed/upcoming session shows either:
  - "Join Lesson" button (active, links to meet URL) — when meeting_link is set
  - "Waiting for teacher" (greyed out / disabled) — when meeting_link is not yet set

**Email Notifications (IN SCOPE)**
- Booking confirmation email to student: sent when teacher confirms; includes the meet link if already set
- Meet link added email to student: sent when teacher adds/updates the meeting link on a confirmed booking
- 24-hour reminder email to teacher: sent 24h before the lesson — if meet link is missing, reminder is stronger
- 1-hour reminder email to teacher: if meet link is still missing 1h before the lesson, send a final reminder
- Email service: Resend (transactional, developer-friendly, integrates with React Email templates)
- Reminder emails are triggered by a Vercel Cron job that runs every hour

**Admin View — Lesson Monitoring**
- Admin can see a "Missing Meet Links" section — upcoming lessons where `meeting_link IS NULL`, sorted by date, with teacher name and student name

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
- Plain-text vs React Email component format for email templates (React Email is the recommended approach)

### Deferred Ideas (OUT OF SCOPE)
- Double slots (100-min sessions)
- Real-time slot refresh if another student books while browsing
- Stripe Billing Portal for subscription cancellation/management — minimal v1 only
- Structured IBAN/bank fields for teacher payout info (PAYOUT-01) — payout_info_placeholder freetext used for now
- Google Calendar API integration to auto-create events with Meet links (Phase 2 upgrade path)
- Automatic Meet link creation via Google Meet API (Phase 3 upgrade path)
- Student booking request confirmation email (NOTIF-01) — confirmation email triggers on teacher confirm, not on request
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
| BOOK-04 | Teacher can confirm or decline a booking request | New Server Actions: confirmBooking (sets status='confirmed', adds meeting_link auto-populated from default_meet_link), declineBooking (calls cancel_booking RPC) |
| BOOK-05 | On confirmation, teacher provides a Zoom/Meet meeting link | `meeting_link` column on `bookings` (migration); auto-populated from `teachers.default_meet_link`; teacher can override |
| BOOK-06 | Student can view the confirmed meeting link for their upcoming session | Query bookings with status='confirmed', expose meeting_link field; "Join Lesson" vs "Waiting for teacher" UX |
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

Phase 3 delivers the full transaction loop. The codebase already has significant scaffolding from Phase 1 (atomic RPCs, schema) and Phase 2 (admin payout processing), so work focuses on: (1) the availability model, (2) the booking UI flow including Google Meet link management, (3) Stripe integration, (4) transactional email via Resend, (5) a Vercel Cron reminder job, (6) reviews, (7) the teacher earnings page, and (8) an admin "Missing Meet Links" view.

The largest schema gap is the availability model. The existing `availability_slots` table stores concrete TIMESTAMPTZ rows — but the design requires teacher-side weekly ranges (day-of-week + time window). A new `teacher_availability_ranges` table and a `teacher_availability_blockers` table are required. Slot generation (15-min increments from range, minus booked/reserved) happens in application code.

The atomic booking RPCs (`create_booking`, `complete_booking`, `cancel_booking`) are already deployed and correct. The `bookings` table needs two new columns (`meeting_link TEXT`, `topic_note TEXT`) and the `teachers` table needs `default_meet_link TEXT` — all added via migration.

Stripe is not yet installed (`stripe@^17` is the target). Resend is not yet installed (`resend@^6` is the current latest). Neither `@react-email/components` nor `react-email` is installed. Vercel Cron requires no new npm package — it is configured via `vercel.json` and secured with a `CRON_SECRET` environment variable.

**Primary recommendation:** Build in dependency order — (1) schema migration (availability tables, `default_meet_link`, `meeting_link`, `topic_note`, review constraint, reminder tracking columns), (2) teacher availability management + default_meet_link onboarding/settings, (3) student booking flow using existing RPCs, (4) Stripe Checkout + webhook, (5) Resend email actions, (6) Vercel Cron reminder job, (7) reviews on completed bookings, (8) teacher earnings page and payout submission, (9) admin Missing Meet Links view.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `stripe` | `^17` (latest v17.x) | Stripe SDK — Checkout sessions, webhook verification | Official Stripe Node SDK; v17 is current; project STATE.md explicitly recommends it |
| `resend` | `^6.12.4` (latest: 6.12.4 verified via npm) | Transactional email sending | Official Resend SDK; selected in CONTEXT.md; developer-friendly, integrates with React Email |
| `@react-email/components` | `^1.0.12` (latest verified via npm) | Pre-built email UI components (text, link, button, etc.) | Official React Email component library; used with Resend `react` param |
| `react-email` | `^6.5.0` (latest verified via npm) | React Email dev server for local email preview | Used only in development for template iteration; not a production runtime dep |
| `@supabase/supabase-js` | `^2.106.2` (already installed) | All DB queries, RPC calls, RLS-protected operations | Already in project; all Phase 1/2 patterns use it |
| `next` | `16.2.6` (already installed) | Route Handlers for webhook + cron endpoints; Server Actions for mutations | Project-locked version |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | `^1.17.0` (already installed) | Star icon for rating widget, VideoIcon/Link2 for meet link indicators | Already used project-wide |
| `sonner` | `^2.0.7` (already installed) | Toast notifications on booking actions | Already used project-wide |
| `zod` | `^4.4.3` (already installed) | Input validation in Server Actions | Already used project-wide |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `resend` SDK | nodemailer + SMTP | Resend is simpler, has React Email support, no SMTP config; nodemailer requires an SMTP server |
| `@react-email/components` | Plain HTML strings | React Email produces maintainable, testable templates; HTML strings are error-prone |
| Vercel Cron | External cron service (EasyCron, GitHub Actions schedule) | Vercel Cron is native to the deployment platform; zero additional services |
| Custom CSS star rating | `react-rating-stars-component` | Custom is zero-dep; `lucide-react` Star icons already available; prefer CSS-only |
| Custom calendar grid | `react-calendar` or `@fullcalendar` | Custom is lighter; monthly grid with highlighted days is ~50 lines of TSX |
| Custom .ics generation | `ics` npm package | The ICS format is simple enough to build inline for single-event exports |

**Installation (new packages only):**
```bash
npm install stripe@^17 resend@^6 @react-email/components@^1
npm install --save-dev react-email@^6
```

---

## Architecture Patterns

### Recommended Project Structure

New files for Phase 3 (additions only):

```
supabase/migrations/
  20260601000001_phase3_availability.sql  # availability_ranges, blockers, default_meet_link, meeting_link, topic_note, review unique constraint, reminder tracking columns
  20260601000002_phase3_stripe_prices.sql # populate stripe_price_id on credit_packages (separate to allow separate execution)

vercel.json                               # NEW — cron job configuration

app/api/
  webhooks/stripe/
    route.ts           # POST webhook handler (outside [locale] prefix — no i18n)
  cron/reminders/
    route.ts           # GET cron handler — hourly reminder dispatcher (outside [locale] prefix)
  bookings/[id]/ics/
    route.ts           # GET ics download handler

app/[locale]/
  teacher/
    availability/
      page.tsx         # REPLACE stub → AvailabilityManager
    bookings/
      page.tsx         # REPLACE stub → BookingQueue (pending/confirmed/completed) with Meet Link Status indicators
    earnings/
      page.tsx         # NEW — EarningsPage
  student/
    teachers/[id]/
      page.tsx         # EXTEND — add BookingCalendar + RequestForm
    bookings/
      page.tsx         # REPLACE stub → BookingList with inline review forms + Join/Waiting UX
    packages/
      page.tsx         # EXTEND — add Stripe Checkout action + success banner
  admin/
    missing-links/
      page.tsx         # NEW — Missing Meet Links admin view

lib/
  actions/
    availability.ts    # setAvailabilityRange, removeAvailabilityRange, setBlocker
    bookings.ts        # requestBooking, confirmBooking, declineBooking, markComplete, cancelBooking, updateBookingMeetLink
    payments.ts        # createCheckoutSession
    reviews.ts         # submitReview
    earnings.ts        # requestPayout
    teacher.ts         # EXTEND updateTeacherProfile + updateTeacherSettings to include default_meet_link
  queries/
    availability.ts    # getTeacherAvailabilityRanges, getAvailableSlots(teacherId, date)
    bookings.ts        # getStudentBookings, getTeacherBookings
    earnings.ts        # getTeacherEarnings, getPayoutRequests
    reviews.ts         # getTeacherReviews, getReviewAggregate
    admin.ts           # EXTEND — getMissingMeetLinks query
  services/
    email.ts           # sendBookingConfirmation, sendMeetLinkAdded, sendTeacherReminder
  utils/
    slots.ts           # generateSlots(ranges, blockers, existingBookings, date) → string[]
    ics.ts             # generateIcs(booking) → string

emails/
  booking-confirmation.tsx   # React Email template — student booking confirmed
  meet-link-added.tsx        # React Email template — student meet link added
  teacher-reminder.tsx       # React Email template — teacher upcoming lesson reminder

config/
  navigation.ts        # EXTEND getTeacherNav to add earnings entry; getAdminNav to add missing-links entry
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

-- default_meet_link on teacher profile
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS default_meet_link TEXT;

-- Add to bookings table:
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_link TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS topic_note TEXT;

-- Reminder tracking columns (prevents duplicate sends)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_1h_sent_at TIMESTAMPTZ;

-- One review per completed booking:
ALTER TABLE reviews ADD CONSTRAINT reviews_booking_id_unique UNIQUE (booking_id);
```

### Pattern 2: Slot Generation Algorithm

**What:** Pure TypeScript function that converts day ranges + blockers + existing bookings into bookable 15-min start times for a given calendar date.

```typescript
// Source: lib/utils/slots.ts — designed from CONTEXT.md decisions
import { lessonDurationMinutes } from "@/config/pricing";

export function generateSlots(params: {
  ranges: Array<{ start_time: string; end_time: string }>;
  blockedDates: Date[];
  bookedSlots: Array<{ start_time: string; end_time: string }>;
  targetDate: Date;
  slotIncrementMinutes?: number;
}): string[] {
  const { ranges, blockedDates, bookedSlots, targetDate, slotIncrementMinutes = 15 } = params;

  const dateStr = targetDate.toISOString().slice(0, 10);
  const isBlocked = blockedDates.some(d => d.toISOString().slice(0, 10) === dateStr);
  if (isBlocked) return [];

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

  return candidates
    .filter(candidate => {
      const slotEnd = candidate.getTime() + lessonDurationMinutes * 60_000;
      return !bookedSlots.some(b => {
        const bs = new Date(b.start_time).getTime();
        const be = new Date(b.end_time).getTime();
        return candidate.getTime() < be && slotEnd > bs;
      });
    })
    .map(d => d.toISOString());
}
```

### Pattern 3: Stripe Checkout Server Action

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
  apiVersion: "2025-10-28",
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

```typescript
// Source: official Stripe docs + Next.js route.md docs
// app/api/webhooks/stripe/route.ts
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
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutComplete(session);
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    await handleInvoicePaid(invoice);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

### Pattern 5: default_meet_link — Schema + Actions

**What:** `teachers.default_meet_link TEXT` is the teacher's reusable Google Meet room URL. It is set during onboarding and editable from profile/settings. On confirm, it auto-populates `bookings.meeting_link`.

**Schema change (via migration):**
```sql
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS default_meet_link TEXT;
```

**Onboarding action extension (completeTeacherOnboarding):**
Add `default_meet_link` field to `teacherSchema` in `lib/actions/onboarding.ts` and include it in the `teacherPayload` upsert. The field is optional — URL format validated by zod `.url().optional()`.

**Settings action extension (updateTeacherSettings):**
Add `default_meet_link` reading from `formData` in `lib/actions/teacher.ts` → `updateTeacherSettings`. Update `teachers` table with the new value.

**Profile action extension (updateTeacherProfile):**
Also expose `default_meet_link` in `updateTeacherProfile` or keep it settings-only per UX choice (Claude's discretion).

**Auto-population on confirm:**
```typescript
// lib/actions/bookings.ts — confirmBooking action
export async function confirmBooking(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const profile = await requireRole("teacher");
  const supabase = await createClient();
  const bookingId = String(formData.get("bookingId") ?? "");
  // override_link may be empty — fallback to default_meet_link
  const overrideMeetLink = (formData.get("meetLink") as string)?.trim() || null;

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, default_meet_link")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!teacher) return { error: "Teacher record not found." };

  const meetLink = overrideMeetLink ?? teacher.default_meet_link ?? null;

  const { error } = await supabase
    .from("bookings")
    .update({ status: "confirmed", meeting_link: meetLink })
    .eq("id", bookingId)
    .eq("teacher_id", teacher.id)
    .eq("status", "pending");

  if (error) return { error: error.message };

  // Send booking confirmation email to student (if meet link available)
  // (handled by sendBookingConfirmation in lib/services/email.ts)

  revalidatePath("/", "layout");
  return {};
}
```

### Pattern 6: Resend Email Service

**What:** `lib/services/email.ts` is a thin wrapper around the Resend SDK. Server Actions and the cron Route Handler call it directly — it is never imported in Client Components.

**Installation:**
```bash
npm install resend@^6 @react-email/components@^1
```

**Environment variable required:**
```
RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=Academigo <noreply@academigo.xyz>
```

**Core service module:**
```typescript
// Source: official Resend docs https://resend.com/docs/send-with-nextjs
// lib/services/email.ts
import { Resend } from "resend";
import { BookingConfirmationEmail } from "@/emails/booking-confirmation";
import { MeetLinkAddedEmail } from "@/emails/meet-link-added";
import { TeacherReminderEmail } from "@/emails/teacher-reminder";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Academigo <noreply@academigo.xyz>";

export async function sendBookingConfirmation(params: {
  studentEmail: string;
  studentName: string;
  teacherName: string;
  startTime: Date;
  meetLink: string | null;
}) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [params.studentEmail],
    subject: "Your lesson is confirmed — Academigo",
    react: BookingConfirmationEmail(params),
  });
  if (error) console.error("[email] sendBookingConfirmation failed:", error);
  return { data, error };
}

export async function sendMeetLinkAdded(params: {
  studentEmail: string;
  studentName: string;
  teacherName: string;
  startTime: Date;
  meetLink: string;
}) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [params.studentEmail],
    subject: "Meeting link added for your lesson — Academigo",
    react: MeetLinkAddedEmail(params),
  });
  if (error) console.error("[email] sendMeetLinkAdded failed:", error);
  return { data, error };
}

export async function sendTeacherReminder(params: {
  teacherEmail: string;
  teacherName: string;
  studentName: string;
  startTime: Date;
  meetLink: string | null;
  hoursUntil: 24 | 1;
}) {
  const subject = params.meetLink
    ? `Reminder: lesson in ${params.hoursUntil}h — Academigo`
    : `Action required: add Meet link for lesson in ${params.hoursUntil}h — Academigo`;

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [params.teacherEmail],
    subject,
    react: TeacherReminderEmail(params),
  });
  if (error) console.error("[email] sendTeacherReminder failed:", error);
  return { data, error };
}
```

**React Email template pattern:**
```typescript
// emails/booking-confirmation.tsx
// Source: @react-email/components docs — pass component as function call (not JSX)
import { Html, Body, Container, Text, Link, Heading } from "@react-email/components";

interface BookingConfirmationEmailProps {
  studentName: string;
  teacherName: string;
  startTime: Date;
  meetLink: string | null;
}

export function BookingConfirmationEmail({
  studentName,
  teacherName,
  startTime,
  meetLink,
}: BookingConfirmationEmailProps) {
  return (
    <Html>
      <Body style={{ fontFamily: "sans-serif" }}>
        <Container>
          <Heading>Your lesson is confirmed!</Heading>
          <Text>Hi {studentName},</Text>
          <Text>
            Your lesson with {teacherName} on{" "}
            {startTime.toLocaleDateString("en-CH", {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Zurich",
            })}{" "}
            is confirmed.
          </Text>
          {meetLink ? (
            <Text>
              <Link href={meetLink}>Join the lesson: {meetLink}</Link>
            </Text>
          ) : (
            <Text>Your teacher will add the meeting link shortly.</Text>
          )}
        </Container>
      </Body>
    </Html>
  );
}
```

**Key notes on Resend usage:**
- Pass template as a function call, NOT JSX: `react: BookingConfirmationEmail(params)` — correct. `react: <BookingConfirmationEmail {...params} />` — also works but the function call form is what official docs show.
- Non-blocking: email sending errors should never throw or block the booking action — log and continue.
- `resend` package must be in `serverExternalPackages` if Next.js tree-shaking causes issues (unlikely but document).

### Pattern 7: Vercel Cron Reminder Job

**What:** An hourly GET Route Handler at `app/api/cron/reminders/route.ts` that:
1. Checks CRON_SECRET authorization header
2. Queries bookings with status='confirmed', start_time in the next 25h (for 24h reminder) or next 65min (for 1h reminder)
3. Filters to those that haven't had the corresponding reminder sent yet
4. For each booking: dispatches reminder email via `sendTeacherReminder`, then marks the reminder column

**Configuration (`vercel.json` at project root):**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

`"0 * * * *"` = top of every hour UTC. This is the correct expression for "every hour".

**Cron security (verified against Vercel official docs):**
- Set `CRON_SECRET` environment variable in Vercel project settings (random string, min 16 chars)
- Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` on every cron invocation
- Endpoint checks header; returns 401 if mismatch

```typescript
// Source: Vercel official cron docs — https://vercel.com/docs/cron-jobs/manage-cron-jobs
// app/api/cron/reminders/route.ts
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTeacherReminder } from "@/lib/services/email";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const supabase = await createClient();

  // 24h reminder window: lessons starting between now+23h and now+25h
  const window24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const window24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  // 1h reminder window: lessons starting between now+55min and now+65min
  const window1hStart = new Date(now.getTime() + 55 * 60 * 1000);
  const window1hEnd = new Date(now.getTime() + 65 * 60 * 1000);

  // Query 24h reminders not yet sent
  const { data: bookings24h } = await supabase
    .from("bookings")
    .select(`
      id, start_time, meeting_link,
      teachers ( id, default_meet_link, profiles ( email, full_name ) ),
      students ( profiles ( full_name ) )
    `)
    .eq("status", "confirmed")
    .is("reminder_24h_sent_at", null)
    .gte("start_time", window24hStart.toISOString())
    .lte("start_time", window24hEnd.toISOString());

  for (const booking of bookings24h ?? []) {
    const teacher = booking.teachers as any;
    const teacherEmail = teacher?.profiles?.email;
    const teacherName = teacher?.profiles?.full_name;
    const studentName = (booking.students as any)?.profiles?.full_name;

    if (!teacherEmail) continue;

    await sendTeacherReminder({
      teacherEmail,
      teacherName,
      studentName,
      startTime: new Date(booking.start_time),
      meetLink: booking.meeting_link,
      hoursUntil: 24,
    });

    await supabase
      .from("bookings")
      .update({ reminder_24h_sent_at: now.toISOString() })
      .eq("id", booking.id);
  }

  // Same pattern for 1h reminders using reminder_1h_sent_at
  // ... (mirror of above with window1hStart/window1hEnd and hoursUntil: 1)

  return Response.json({ processed: { "24h": bookings24h?.length ?? 0 } });
}
```

**Key cron facts (verified against Vercel official docs):**
- Vercel cron only runs on production deployments (not preview)
- Timezone is always UTC — cron expression `0 * * * *` fires at minute 0 of every UTC hour
- No retry on failure — errors are logged in Vercel runtime logs
- Hobby plan: cron can only run once per day max; Pro plan: runs at the specified frequency. The hourly cron requires at least a Pro deployment.
- Duration limits match Vercel Function limits (no special cron limit)
- `CRON_SECRET` is sent as `Authorization: Bearer <value>` — verify exactly that format

### Pattern 8: Inline Review Form (Client Component)

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

### Pattern 9: Admin "Missing Meet Links" View

**What:** A Server Component page at `app/[locale]/admin/missing-links/page.tsx` that queries upcoming confirmed bookings without a meeting link. Follows the existing admin page pattern (Table component, requireRoleFromParams, getDictionary).

**Query:**
```typescript
// lib/queries/admin.ts — extend with getMissingMeetLinks
export async function getMissingMeetLinks() {
  const supabase = await createAdminClient(); // or createClient() with admin RLS bypass
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, start_time,
      teachers ( id, profiles ( full_name ) ),
      students ( profiles ( full_name ) )
    `)
    .eq("status", "confirmed")
    .is("meeting_link", null)
    .gte("start_time", now)
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
```

**Page follows the exact same pattern as `app/[locale]/admin/teachers/page.tsx`:**
- `requireRoleFromParams("admin", raw)` guard
- `Table` component with columns: date/time, teacher name, student name, hours until lesson
- `EmptyState` when no missing links
- Admin nav entry added in `config/navigation.ts`

### Pattern 10: ICS Calendar Export

```typescript
// Source: RFC 5545 / iCalendar spec — minimal single-event implementation
// app/api/bookings/[id]/ics/route.ts
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Academigo//Academigo//EN",
    "BEGIN:VEVENT",
    `UID:${id}@academigo.xyz`,
    `DTSTART:${formatIcsDate(startTime)}`,
    `DTEND:${formatIcsDate(endTime)}`,
    `SUMMARY:Academigo lesson`,
    `DESCRIPTION:${meetingLink ?? ""}`,
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
- **Using `request.json()` in the webhook handler:** `request.text()` is required; calling `.json()` first drains the body stream and `constructEvent` will fail.
- **Granting credits in the Server Action redirect flow:** Stripe redirects can be faked. Credits MUST only be granted from the verified webhook event.
- **Assuming `checkout.session.completed` fires for subscription renewals:** It only fires once. Use `invoice.paid` for all subsequent monthly credit grants.
- **Calling `resend.emails.send()` in a Client Component:** Resend requires `RESEND_API_KEY` which is server-only. Email calls must live in Server Actions or Route Handlers.
- **Skipping `reminder_24h_sent_at` / `reminder_1h_sent_at` tracking:** Without these columns the cron will resend the same reminder every hour. Mark them immediately after a successful send.
- **Not protecting the cron endpoint with CRON_SECRET:** Anyone who discovers the URL can trigger mass email sends. Always check the `Authorization: Bearer <CRON_SECRET>` header.
- **Using JSX angle-bracket syntax for Resend react param with function call confusion:** Pass the template as `react: BookingConfirmationEmail(params)` — call the function, don't render JSX. Both work but the function-call form is what Resend's official docs show and is simpler in non-JSX contexts.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment processing | Custom payment flow | Stripe Checkout (redirect mode) | PCI compliance, 3D Secure, SCA handled automatically |
| Webhook signature verification | Manual HMAC check | `stripe.webhooks.constructEvent()` | Handles timing attacks, encoding edge cases |
| Credit race conditions | App-layer locking | Supabase RPC with `FOR UPDATE` (already built) | Database-level locking is the only correct solution |
| Booking state transitions | Ad-hoc status updates | Existing atomic RPCs (`complete_booking`, `cancel_booking`) | Already enforce state machine rules at DB level |
| Transactional email | Custom SMTP integration | Resend SDK | Managed delivery, React templates, bounce handling |
| Email HTML templates | Inline HTML strings | `@react-email/components` | Maintainable, type-safe, previewed locally |
| Scheduled jobs | External cron service | Vercel Cron + `vercel.json` | Native to deployment, no extra services |
| ICS parsing | Full ical parser | Inline string generation (single-event export only) | No parsing needed; generation is ~15 lines |

**Key insight:** The atomic RPCs are already deployed and correct. Phase 3 is primarily UI + wiring + email plumbing, not new business logic.

---

## Common Pitfalls

### Pitfall 1: Webhook Handler Reads JSON Before Constructing Event
**What goes wrong:** `stripe.webhooks.constructEvent()` throws "No signatures found".
**Why it happens:** Calling `await request.json()` consumes the body stream before signature verification.
**How to avoid:** Always `const body = await request.text()` as the very first operation.
**Warning signs:** Webhook verification errors in Stripe Dashboard despite correct secret.

### Pitfall 2: Granting Credits on Success URL Redirect
**What goes wrong:** Student refreshes `/student/packages?success=true` → credits granted twice.
**Why it happens:** Confusing the success redirect with the webhook as the source of truth.
**How to avoid:** Success URL only shows a banner. Credits are granted exclusively in the webhook handler, which is idempotent via `stripe_session_id`.

### Pitfall 3: Subscription Credit Reset vs. Rollover
**What goes wrong:** Subscription subscriber carries unused credits from last month forward.
**Why it happens:** `invoice.paid` handler adds to `total_credits` instead of resetting.
**How to avoid:** For subscription packages, use `grant_subscription_credits` RPC that sets `total_credits = pkg.credits` (not `+= pkg.credits`) and resets used/reserved to 0.

### Pitfall 4: Availability Slot Overlap Not Checking Reserved Bookings
**What goes wrong:** Two students simultaneously book the same slot.
**Why it happens:** Slot generation only filters `status = 'confirmed'` bookings, missing `status = 'pending'`.
**How to avoid:** Filter booked slots for `status IN ('pending', 'confirmed')` in the availability query. The `create_booking` RPC provides a second line of defense via `FOR UPDATE`.

### Pitfall 5: Stripe Webhook Route Outside `[locale]` Prefix
**What goes wrong:** Webhook registered at `/de/api/webhooks/stripe` → 404.
**Why it happens:** The i18n route structure wraps all user-facing pages; API routes must be outside `app/[locale]/`.
**How to avoid:** Place webhook at `app/api/webhooks/stripe/route.ts` (same pattern as `app/auth/callback/route.ts`).

### Pitfall 6: Monthly Calendar Timezone Offset in Slot Display
**What goes wrong:** Teacher's 14:00–18:00 range displays incorrectly for student in different timezone.
**Why it happens:** JavaScript `Date` objects constructed from TIME strings without explicit timezone.
**How to avoid:** For v1 the platform is Zurich-only — derive concrete TIMESTAMPTZ by combining the selected date with the TIME in Europe/Zurich offset.

### Pitfall 7: `useActionState` Signature for Bound Actions
**What goes wrong:** TypeScript error on `action.bind(null, bookingId)`.
**How to avoid:** Define the action with explicit `(state, formData)` signature; use `.bind(null, extraArg)` before passing to `useActionState`. Precedent: Phase 2 `approveTeacher` pattern.

### Pitfall 8: Resend Email Blocking Booking Actions
**What goes wrong:** `sendBookingConfirmation` throws → booking confirmation fails for the teacher.
**Why it happens:** Email errors bubble up into the Server Action.
**How to avoid:** Wrap all email calls in try/catch; log errors but always return success from the booking action itself. Email delivery is best-effort.

### Pitfall 9: Cron Reminder Sent Multiple Times Per Booking
**What goes wrong:** Teacher gets 10+ reminder emails for the same lesson.
**Why it happens:** The hourly cron runs again before the sent-at column is updated, or the column update fails silently.
**How to avoid:** Use `reminder_24h_sent_at` and `reminder_1h_sent_at` TIMESTAMPTZ columns on `bookings`. Query with `.is("reminder_24h_sent_at", null)`. Update the column immediately after sending, inside the same loop iteration. Make the cron operation idempotent (as recommended by Vercel: "check state before making changes").

### Pitfall 10: Cron CRON_SECRET Not Set in Production
**What goes wrong:** Endpoint returns 401 when Vercel invokes the cron — no reminders are ever sent.
**Why it happens:** Environment variable not set in Vercel project settings.
**How to avoid:** Wave 0 includes a task: "Set CRON_SECRET env var in Vercel project settings." Document that without this env var, the cron will silently fail (401 = no retry per Vercel docs).

### Pitfall 11: default_meet_link Not Propagated When Null
**What goes wrong:** Teacher has `default_meet_link = null` → confirm action sets `meeting_link = null` on booking → student sees "Waiting for teacher" even though teacher intended to add a link later.
**Why it happens:** This is actually the intended behavior per CONTEXT.md: if no default, teacher must manually add.
**How to avoid:** The confirm form must show a warning when `default_meet_link` is null, and require the teacher to enter a link before submitting. Validate server-side: if `meeting_link` is still null after confirm, that is a valid state — the teacher can add it inline from the bookings page later.

### Pitfall 12: Vercel Cron Hobby Plan Limitation
**What goes wrong:** Hourly cron deploys but never fires, or deployment fails with "cron frequency exceeds hobby plan limits".
**Why it happens:** Vercel Hobby plan restricts cron jobs to once per day maximum. `0 * * * *` (every hour) will fail on Hobby.
**How to avoid:** The project must be on Vercel Pro or above for hourly cron. Document this as a deployment prerequisite.

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
// Source: lib/queries/availability.ts
export async function getAvailableSlotsForDay(
  teacherId: string,
  targetDate: Date,
): Promise<string[]> {
  const supabase = await createClient();
  const dow = targetDate.getDay();

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

### updateTeacherSettings Extended Pattern

```typescript
// lib/actions/teacher.ts — extension pattern for default_meet_link
// Add to existing updateTeacherSettings:
const defaultMeetLink = (formData.get("defaultMeetLink") as string)?.trim() || null;

// Validate URL format if provided
if (defaultMeetLink && !defaultMeetLink.startsWith("https://")) {
  return { error: "Meet link must be a valid HTTPS URL." };
}

const { error: teacherError } = await supabase
  .from("teachers")
  .update({
    payout_info_placeholder: payoutInfo,
    default_meet_link: defaultMeetLink, // ADD THIS
  })
  .eq("profile_id", profile.id);
```

---

## Schema Changes Required (Migration Summary)

All changes go in a single new migration file `20260601000001_phase3_availability.sql`:

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

-- 2. Teacher default meet link
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS default_meet_link TEXT;

-- 3. Booking extra columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_link TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS topic_note TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_1h_sent_at TIMESTAMPTZ;

-- 4. Reviews unique constraint
ALTER TABLE reviews ADD CONSTRAINT reviews_booking_id_unique UNIQUE (booking_id);

-- 5. Credit grant RPCs (see Code Examples above)

-- 6. Stripe price ID seeding (separate migration)
-- UPDATE credit_packages SET stripe_price_id = 'price_xxxx' WHERE slug = 'single';
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next.js API routes `pages/api` | Route Handlers `app/api` | Next.js 13+ (App Router) | Already adopted (`app/auth/callback/route.ts`) |
| Stripe `@stripe/stripe-js` for server | `stripe` npm package (server-only) | Always | Never import in Client Components |
| `res.json()` / `req.body` in webhook | `request.text()` + `Response` | Next.js App Router | Body parser disabled by default |
| `headers()` sync call | `await headers()` | Next.js 15+ | Dynamic APIs are async (confirmed in codebase) |
| Nodemailer + SMTP for transactional email | Resend SDK + React Email | ~2023 | Simpler setup; React template authoring; managed delivery |
| External cron service (EasyCron, etc.) | Vercel Cron (`vercel.json`) | Vercel platform ~2023 | Native; zero extra service; configured in code |

**Deprecated/outdated:**
- `pages/api/webhook.ts`: Replaced by `app/api/webhooks/stripe/route.ts`
- `bodyParser: false` config export: Not needed in App Router
- `availability_slots` with concrete timestamps: Superseded by `teacher_availability_ranges` model

---

## Environment Variables Required

| Variable | Used By | Notes |
|----------|---------|-------|
| `STRIPE_SECRET_KEY` | Server Actions, webhook handler | Never expose to client |
| `STRIPE_WEBHOOK_SECRET` | Webhook handler only | Get from Stripe Dashboard → Webhooks |
| `NEXT_PUBLIC_SITE_URL` | Success/cancel URL construction | Already in use for auth |
| `RESEND_API_KEY` | `lib/services/email.ts` (server-only) | Get from Resend Dashboard → API Keys |
| `RESEND_FROM_EMAIL` | `lib/services/email.ts` | e.g. `Academigo <noreply@academigo.xyz>`; domain must be verified in Resend |
| `CRON_SECRET` | `app/api/cron/reminders/route.ts` | Random string, min 16 chars; set in Vercel project settings; Vercel sends it as `Bearer <value>` |

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is NOT needed — the project uses redirect Checkout (no embedded Stripe.js).

---

## Open Questions

1. **`create_booking` RPC topic_note parameter**
   - What we know: RPC currently accepts 6 parameters; topic_note is a new field.
   - What's unclear: Whether to extend the RPC signature (atomic) or use a 2-step update.
   - Recommendation: Extend the RPC to accept `p_topic_note TEXT DEFAULT NULL` in the Phase 3 migration.

2. **Stripe API version pinning**
   - What we know: `"2025-10-28"` is a stable version cited in current Stripe docs. `stripe@17` SDK default.
   - Recommendation: Pin to `"2025-10-28"` in the Stripe constructor. Verify on install.

3. **Stripe price IDs for credit_packages**
   - What we know: `stripe_price_id` column exists; 5 packages are seeded.
   - What's unclear: Actual Stripe Price IDs come from the Stripe Dashboard and must be provided by the project owner.
   - Recommendation: Wave 0 task: "Populate `stripe_price_id` on all 5 credit_packages rows via Stripe Dashboard + migration." Mark PAY-02 blocked until done.

4. **Monthly calendar UI — `date-fns` vs. manual**
   - What we know: No date manipulation library is currently installed.
   - Recommendation: Use native `Date` methods for the calendar grid. Add `date-fns` only if timezone handling for Europe/Zurich proves complex.

5. **Resend domain verification**
   - What we know: Resend requires domain verification before production sending. The domain `academigo.xyz` must have DNS records (DKIM, SPF) added via Resend Dashboard.
   - Recommendation: Wave 0 task: "Verify academigo.xyz domain in Resend dashboard + set RESEND_API_KEY and RESEND_FROM_EMAIL env vars."

6. **Vercel plan for hourly cron**
   - What we know: Vercel Hobby plan restricts cron to once per day. Hourly requires Pro.
   - Recommendation: Confirm deployment plan before implementing cron. If Hobby, the cron will not work. Document as a known deployment prerequisite.

7. **`resend` in serverExternalPackages**
   - What we know: Next.js App Router bundles server components by default. Some Node.js-native packages (those using native modules) need to be listed in `serverExternalPackages` in `next.config.ts` to avoid build errors.
   - What's unclear: Whether `resend` requires this.
   - Recommendation: Add `resend` to `serverExternalPackages` if a build error occurs referencing native modules. This is a LOW confidence item — likely not needed but worth flagging.

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
| BOOK-04 | `confirmBooking` sets status + auto-populates meeting_link from default_meet_link | unit | same | ❌ Wave 0 |
| BOOK-05 | `confirmBooking` allows override meeting link | unit | same | ❌ Wave 0 |
| BOOK-07 | `markComplete` calls `complete_booking` RPC | unit | same | ❌ Wave 0 |
| BOOK-08/09 | `cancelBooking` calls `cancel_booking` RPC | unit | same | ❌ Wave 0 |
| PAY-02 | `createCheckoutSession` redirects to Stripe | unit | `npm test -- --testPathPattern="actions/payments"` | ❌ Wave 0 |
| PAY-03 | Webhook handler: idempotent on stripe_session_id | unit | `npm test -- --testPathPattern="api/webhooks"` | ❌ Wave 0 |
| PAY-03 | Webhook handler: rejects invalid signature | unit | same | ❌ Wave 0 |
| REV-01 | `submitReview` inserts review, enforces one-per-booking | unit | `npm test -- --testPathPattern="actions/reviews"` | ❌ Wave 0 |
| EARN-03 | `requestPayout` inserts payout_requests row | unit | `npm test -- --testPathPattern="actions/earnings"` | ❌ Wave 0 |
| EARN-04/05 | Admin payout view/mark-processed | manual | Browser verification | ✅ (Phase 2) |
| Email sends | `sendBookingConfirmation` calls resend.emails.send with correct params | unit | `npm test -- --testPathPattern="services/email"` | ❌ Wave 0 |
| Cron handler | Cron returns 401 without CRON_SECRET; processes 24h reminders | unit | `npm test -- --testPathPattern="api/cron"` | ❌ Wave 0 |
| default_meet_link | `updateTeacherSettings` saves default_meet_link | unit | `npm test -- --testPathPattern="actions/teacher"` | ❌ Wave 0 (extend existing) |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="__tests__/lib" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `__tests__/lib/utils/slots.test.ts` — covers AVAIL-03 slot generation algorithm
- [ ] `__tests__/lib/actions/availability.test.ts` — covers AVAIL-01/02
- [ ] `__tests__/lib/actions/bookings.test.ts` — covers BOOK-01/02/04/05/07/08/09 including default_meet_link auto-population
- [ ] `__tests__/lib/actions/payments.test.ts` — covers PAY-02
- [ ] `__tests__/api/webhooks/stripe.test.ts` — covers PAY-03 idempotency + signature rejection
- [ ] `__tests__/lib/actions/reviews.test.ts` — covers REV-01
- [ ] `__tests__/lib/actions/earnings.test.ts` — covers EARN-03
- [ ] `__tests__/lib/services/email.test.ts` — covers email service calls (mock Resend SDK)
- [ ] `__tests__/api/cron/reminders.test.ts` — covers cron auth + reminder dispatch logic
- [ ] `__tests__/lib/actions/teacher.test.ts` — extend or create; covers default_meet_link save

All use the established `mocks` object pattern + `makeChainable()` factory from existing Phase 1/2 tests.

---

## Sources

### Primary (HIGH confidence)
- Codebase: `supabase/migrations/20260528000001_initial_schema.sql` — full schema verified (teachers table has no default_meet_link yet; bookings has no meeting_link, topic_note, reminder columns)
- Codebase: `supabase/migrations/20260528000005_booking_rpcs.sql` — atomic RPC implementation verified
- Codebase: `lib/actions/onboarding.ts` — teacherSchema and completeTeacherOnboarding pattern; no default_meet_link yet
- Codebase: `lib/actions/teacher.ts` — updateTeacherSettings and updateTeacherProfile patterns confirmed
- Codebase: `app/[locale]/teacher/settings/page.tsx` — settings page structure; passes teacher record to form
- Codebase: `app/[locale]/admin/teachers/page.tsx` — admin page pattern (Table, EmptyState, requireRoleFromParams)
- Codebase: `package.json` — confirms neither `resend`, `@react-email/components`, nor `stripe` are installed yet
- Next.js built-in docs: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` — Route Handler `request.text()` pattern
- Vercel official docs: `https://vercel.com/docs/cron-jobs/quickstart` — vercel.json crons configuration, GET Route Handler format
- Vercel official docs: `https://vercel.com/docs/cron-jobs/manage-cron-jobs` — CRON_SECRET auth pattern, duration limits, no retry on failure, Hobby plan limitations
- Resend official docs: `https://resend.com/docs/send-with-nextjs` — `resend.emails.send()` API, React Email integration pattern

### Secondary (MEDIUM confidence)
- npm registry: `resend` latest version 6.12.4 (verified via `npm show resend version`)
- npm registry: `@react-email/components` latest version 1.0.12 (verified via `npm show @react-email/components version`)
- npm registry: `react-email` latest version 6.5.0 (verified via `npm show react-email version`)
- Resend API reference: `https://resend.com/docs/api-reference/emails/send-email` — full parameter list verified

### Tertiary (LOW confidence)
- Stripe API version `2025-10-28` cited in research — verify against `stripe@17` SDK default on install
- `resend` needing `serverExternalPackages` — unverified; flag for build-time check

---

## Metadata

**Confidence breakdown:**
- Standard stack (original): HIGH — all dependencies verified in codebase or official Stripe docs
- Standard stack (new — Resend, Vercel Cron): HIGH — verified via official docs and npm registry
- Architecture: HIGH — patterns derived from existing codebase conventions + official Next.js/Vercel/Resend docs
- Pitfalls: HIGH — derived from code inspection, official webhook docs, Vercel cron docs
- Stripe API version: MEDIUM — latest version not independently confirmed from npm; follow STATE.md recommendation of `stripe@^17`
- resend serverExternalPackages: LOW — unverified; note for planner to check at build time

**Research date:** 2026-06-01
**Valid until:** 2026-07-01 (30 days; Stripe API stable; Resend API stable; Vercel Cron stable)
