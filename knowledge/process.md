# Academigo — Processes / Flows

> Source of truth: `lib/actions/**`, `app/api/webhooks/stripe/route.ts`, `lib/services/fulfillment.ts`,
> `supabase/migrations/**` (booking RPCs). All steps below are traced from code.

## Student sign-up
1. Sign up (email, password, name, role = student) → a confirmation email is sent (Resend).
2. Verify email → complete onboarding: **school level, preferred subject, learning goal, preferred language, modality**.
3. Land on the student dashboard.

## Teacher sign-up
See `teachers.md` → "Application & onboarding." Summary: sign up as teacher → verify email → build profile (bio, subjects, languages, CV, motivation letter, payout details) → **admin review** → approved → set availability.

## Booking flow
1. Student browses teachers → opens a teacher → picks a date in the availability calendar → picks a 50-min slot.
2. Optionally selects subject(s) and adds a topic note → submits a **booking request** (status `pending`).
3. Booking requires **≥ 1 available credit** (reserved on request; an overlapping slot is blocked at the DB level).
4. The **teacher confirms** (status `confirmed`) and a meeting link is attached (default or per-booking); the student is emailed.

## Payment & package activation
1. Student clicks Buy on a package → **Stripe Checkout** session is created (server-side, price from the DB).
2. On payment, Stripe fires `checkout.session.completed` → the webhook **records the payment and grants credits** (idempotent via a unique `stripe_session_id`).
3. Fallback: if the user returns before the webhook lands, the success page **reconciles** the session and grants credits then (no double grant).
4. Credits are added to one pooled balance and **never expire**.

## Lesson completion
1. **After the lesson's scheduled end time**, the teacher marks it **complete**, choosing a session rating and writing a required private note.
2. The reserved **credit is consumed**, and a **teacher earning** is created at the teacher's level rate.
3. The student can then leave a review.

## Review system
- Only the participating student can review, only **once per booking**, only for a **completed** lesson (enforced by RLS).
- Rating **1–5** + optional comment; the reviewer's name is snapshotted so it displays correctly.

## Payout system
1. Teacher saves payout details (IBAN / address / TWINT).
2. Teacher **requests a payout** — all currently "available" earnings are summed into one request (only one pending at a time).
3. Admin marks it **processed**; earnings flip to "paid" and the teacher is emailed.

## Refund / cancellation handling
- **Confirmed** lesson: cancellable up to **24 hours before start** by student or teacher → the **credit is returned**.
- **Within 24 hours:** not possible via the platform → **contact WhatsApp** for exceptional cases.
- **Pending** (unconfirmed) booking: the student can cancel any time; the reserved credit is released.
- **Money refunds:** no automated flow → **escalate to WhatsApp.**

## Support process
- **Email:** omid@academigo.xyz.
- **WhatsApp:** +41 78 693 68 98 (quick questions, escalations, exceptions).
- The website chat assistant answers general questions and hands off to WhatsApp for anything account-, billing-, or scheduling-specific.
