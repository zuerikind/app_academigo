# Academigo — Policies

> Source of truth: `supabase/migrations/20260703000002_*` (cancel/complete rules), `messages/*.ts`, `config/pricing.ts`.

## Credit validity
- **Credits never expire.**
- Credits from multiple purchases are **pooled** into one balance.
- **1 credit = 1 lesson = 50 minutes.** A credit is consumed only when the session is marked **complete**.

## Cancellation
- **Confirmed lesson:** may be cancelled up to **24 hours before the start time** by either the student or the teacher. The **credit is returned** to the student.
- **Less than 24 hours before start:** cancellation is **not possible through the platform** — the student should contact Academigo on WhatsApp for exceptional cases.
- **Pending (unconfirmed) booking:** the student may cancel at any time; the reserved credit is released.
- Enforced server-side: the 24-hour window is a database rule, not just UI. (`cancel_booking` RPC)

## Lesson completion rule
- A teacher can mark a lesson complete **only after its scheduled end time** (enforced in `complete_booking`). This protects students from early/false completion.

## Refunds (money)
- **No automated money-refund mechanism exists.** Timely cancellation returns a **credit**, not money.
- Any money-refund or billing-dispute request must be handled by a human → **escalate to WhatsApp.**

## Payments
- Handled by **Stripe**. Accepted: Visa, Mastercard, American Express, and **TWINT**.
- No card data is stored by Academigo (Stripe-hosted checkout).

## Data isolation & roles (for completeness; not user-facing copy)
- Row-Level Security scopes data to its owner; students and teachers can only read/write their own records; admins have oversight. Teacher payout details, motivation letters, CVs, and default meeting links are stored in a private, admin-only table.

## Discounts / trials
- **No discount codes and no free trial** are configured. The only price benefit is the per-lesson saving on the Focus (CHF 20) and Excellence (CHF 100) packages.

## Anything not covered here
- If a policy question is not answered by this file, respond with the standard line and escalate:
  > "I don't have verified information about that. Please contact Academigo via WhatsApp."
