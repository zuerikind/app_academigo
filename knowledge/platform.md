# Academigo — Platform Features

> Source of truth: `app/[locale]/**`, `lib/actions/**`, `lib/queries/**`, `emails/**`, `supabase/migrations/**`.
> **Only features that exist in code are listed as "Available." The "NOT available" list is deliberately explicit
> so the chatbot never describes a roadmap/imagined feature as real.**

## ✅ Available (implemented and reachable by users)

### Accounts & roles
- Email/password sign-up and sign-in for **student** and **teacher** roles; a separate **admin** portal.
- Role-based routing/guards; email verification; password reset.

### Students
- **Student dashboard** — available credits, upcoming bookings, pending review count.
- **Teacher directory** (public) and **individual teacher profile** pages with subjects, level, and review average.
- **Booking** — monthly availability calendar → slot picker (50-min slots) → request; the teacher confirms.
- **Credits & billing** — buy packages via Stripe Checkout; credit ledger / billing history; a single available-credit balance.
- **Bookings management** — see pending/confirmed/completed/cancelled sessions; cancel per policy; join link when the teacher adds it; **download an .ics calendar file** per booking.
- **Reviews** — after a completed lesson, rate the teacher **1–5 stars with an optional comment** (one review per booking).
- **Teacher session notes** — the private note the teacher writes on completion is visible to the student on that booking.

### Teachers
- **Teacher dashboard** — pending requests, upcoming/completed counts, profile-completion meter, level card, earnings.
- **Weekly availability editor** + date/time **blockers**.
- **Booking actions** — confirm (with meeting link), decline, add/update meeting link, **mark complete** (rating + required private note; only after the lesson end time), edit notes.
- **Earnings & payouts** — earnings history, pending balance, request payout, payout history.

### Admin
- Teacher **approval**, level **promotions**, **payouts** processing, bookings oversight, **sessions** view, **revenue/analytics**, **platform settings** (tier rates & thresholds), **missing-meet-links** report, student/teacher lists.

### Notifications (email, via Resend)
- Booking request (to teacher), booking confirmation (to student), meeting-link-added, **pre-lesson reminder**, teacher approved, payout processed, new-teacher-application (to admin), email confirmation, password reset.

### Chat assistant
- A website **chat widget** (`components/chat/chat-widget.tsx`) backed by `/api/chat`, plus a WhatsApp escalation button. *(This knowledge base is its source of truth.)*

## ⚠️ Exists in code but NOT available to users
- **Recurring lessons / scheduled series & reschedule flow** — tables and actions exist, but the schedule-**creation** UI is not wired up, so students cannot create recurring schedules. Do **not** advertise recurring lessons as a usable feature.

## ❌ NOT available — never describe these as existing
The following were asked about but **do not exist** anywhere in the codebase:
- Homework / assignments
- Quizzes
- Exercise / worksheet generation
- Progress tracking (beyond the teacher's own level progress bar) — **no student progress dashboard, XP, or levels**
- Badges for students, **XP**, **hints**, **snapshots**
- A notifications center / in-app notification feed (notifications are **email only**)
- Gamification of any kind

If a user asks about any of the above, use the "no verified information" response and, if appropriate, note it isn't a current feature.

## Lesson reminders — timing caveat
- An **email reminder is sent before each lesson.** The chatbot prompt says "24 hours and 1 hour before," but the deployed cron runs **once daily**, so in practice only the **~24-hour** reminder is active; the 1-hour reminder is not currently sent. **State "an email reminder ~24 hours before"; treat the 1-hour reminder as unverified.**
