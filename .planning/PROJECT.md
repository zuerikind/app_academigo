# Academigo

## What This Is

Academigo is a Swiss academic tutoring marketplace (CHF, DE/EN) where students find school-subject teachers, browse their profiles and tier level, and book one-on-one sessions paid through the platform. Teachers progress through three merit-based levels (Junior → Academigo Teacher → Verified) as they accumulate hours, reviews, and internal training. An admin portal provides full oversight of students, teachers, level promotions, bookings, payouts, and pricing.

## Core Value

Students can find a qualified, vetted teacher for any school subject and book a paid session in under two minutes.

## Requirements

### Validated

- ✓ Email/password sign-up and sign-in for student and teacher roles — existing
- ✓ Role-based middleware routing and auth guards (student, teacher, admin prefixes) — existing
- ✓ Student and teacher onboarding flows (profile, subjects, availability stub) — existing
- ✓ Public teacher directory and individual teacher profile pages — existing
- ✓ Authenticated student teacher browser — existing
- ✓ Teacher and student dashboards (skeleton, data stubs) — existing
- ✓ i18n: DE (default) and EN, URL-prefix routing, cookie persistence — existing
- ✓ DB schema: all core tables (bookings, credits, earnings, reviews, payouts, availability) — existing
- ✓ Supabase Auth + RLS policies on all tables — existing

### Active

**Auth completion:**
- [ ] Email verification flow (post-signup "check your email" state)
- [ ] Password reset flow (forgot-password page + email link + update password)
- [ ] Fix role-from-form-data security: teacher/student path selection, no admin via signup

**Teacher tier system:**
- [ ] 3-tier teacher level: Level 1 Junior (CHF 35–40), Level 2 Academigo Teacher (CHF 45, "Academigo Certified" badge), Level 3 Verified Teacher (CHF 50–60, "Verified Teacher" badge, priority listing)
- [ ] Teacher applies for level promotion (in-app request)
- [ ] Admin reviews and approves/rejects level promotion
- [ ] Level badge displayed on teacher cards and profile pages
- [ ] Level 3 teachers ranked higher in teacher directory

**Admin portal:**
- [ ] Admin dashboard (overview stats)
- [ ] Teacher management: approve new teacher accounts, view all teachers with level/status
- [ ] Teacher level promotion: review applications, approve or reject
- [ ] Student management: view all students, their credit balances, booking history
- [ ] Booking overview: view all sessions across the platform
- [ ] Payout management: review and process payout requests
- [ ] Platform pricing: set per-level session rates (CHF 35–40 / 45 / 50–60)

**Availability and booking:**
- [ ] Teacher sets weekly availability slots
- [ ] Student sees teacher availability when booking
- [ ] End-to-end booking: student selects slot → reserves credits → teacher confirms → teacher provides Zoom/Meet link → student receives link
- [ ] Teacher can accept or decline booking requests
- [ ] Booking cancellation (student or teacher side) with credit refund logic

**Payments (Stripe):**
- [ ] Credit package purchase via Stripe Checkout
- [ ] Stripe webhook: grant credits on successful payment
- [ ] Session cost deducted from student credits on booking completion
- [ ] Student credit balance displayed on dashboard

**Earnings and payouts:**
- [ ] Teacher earnings recorded per completed session
- [ ] Teacher can view earnings history
- [ ] Teacher can submit payout request
- [ ] Admin processes payout requests

**Reviews:**
- [ ] Student submits star rating + comment after completed session
- [ ] Reviews displayed on teacher profile with average rating
- [ ] Review count shown on teacher cards

### Out of Scope

- Built-in video calling — teachers share external Zoom/Meet link instead
- OAuth login (Google, GitHub) — email/password sufficient for v1
- Mobile native app — web-first; responsive design covers mobile browsers
- Real-time chat — coordination happens via booking confirmation + meeting link
- Multi-subject packages or subscriptions — per-session credit model only
- Automated payout transfers — admin processes payouts manually for v1

## Context

- Swiss market: prices in CHF, German-language default, bilingual DE/EN
- Stack: Next.js 16 App Router, React 19, Supabase (auth + DB + storage), Tailwind v4, TypeScript strict
- Booking model: students buy credit packs via Stripe, credits are consumed per session at the teacher's level rate
- Teacher approval gate: new teachers are invisible to students until admin approves (`teachers.is_approved`)
- Admin route (`/admin/*`) is guarded in middleware but no admin pages exist yet — 404 on admin login
- `lib/services/bookings.ts` is a stub type only — no booking logic implemented
- `availability_slots` table exists but no queries, actions, or UI built yet
- Stripe `stripe_price_id` column exists in schema; Stripe SDK not yet installed
- Payout info stored as freetext placeholder — needs structured format before payout implementation
- Languages field collected as comma-string in onboarding, split on insert — fragile, needs multi-select UI

## Constraints

- **Tech stack**: Next.js App Router, Supabase, Tailwind v4 — no additions without clear necessity
- **Currency**: CHF only for v1
- **Auth**: Supabase email/password — no OAuth in v1
- **Session delivery**: External meeting links (Zoom/Meet) — no video infrastructure
- **Payout processing**: Manual by admin for v1 — no automated bank transfer

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 3-tier teacher level system (not binary premium) | Provides career progression and merit-based trust signals for students | — Pending |
| Credits model (not per-session card charge) | Reduces payment friction; students buy a pack, sessions deduct automatically | — Pending |
| External meeting links (Zoom/Meet) | Eliminates video infrastructure complexity for v1 | — Pending |
| Admin promotes teachers manually | Ensures quality control before automation is trusted | — Pending |
| Teacher applies for level, admin approves | Human oversight on level advancement preserves badge credibility | — Pending |

---
*Last updated: 2026-05-28 after initialization*
