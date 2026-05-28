# External Integrations

**Analysis Date:** 2026-05-28

## APIs & External Services

**Backend-as-a-Service:**
- Supabase - Primary backend (database, auth, storage, row-level security)
  - SDK/Client (browser): `@supabase/ssr` → `createBrowserClient` in `lib/supabase/client.ts`
  - SDK/Client (server): `@supabase/ssr` → `createServerClient` in `lib/supabase/server.ts`
  - SDK/Client (middleware): `@supabase/ssr` → `createServerClient` in `lib/supabase/middleware.ts`
  - Auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Payment Processing (planned, not yet integrated):**
- Stripe - Credit package purchases and teacher payouts
  - Status: Schema-only (`stripe_price_id TEXT` column on `credit_packages` table, `stripe_session_id TEXT` on `payments` table). Stripe SDK is NOT installed. Placeholder note shown in UI (`app/[locale]/student/packages/page.tsx`).
  - Target: Phase 3

**Communications:**
- WhatsApp (wa.me link) - Consultation/contact channel configured in `config/site.ts`
  - URL: `https://wa.me/41786936898`
  - No SDK — plain href links only

**Fonts:**
- Google Fonts (via `next/font/google`) - Inter and Manrope loaded at build time in `app/layout.tsx`
  - Subsets: latin
  - Weights: Inter (400, 500, 600, 700), Manrope (500, 600, 700)

## Data Storage

**Databases:**
- Supabase (PostgreSQL 15+) — sole database
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Client: `@supabase/supabase-js` / `@supabase/ssr` (no separate ORM; raw Supabase query builder)
  - Schema location: `supabase/migrations/`
  - Key tables: `profiles`, `students`, `teachers`, `subjects`, `teacher_subjects`, `availability_slots`, `bookings`, `student_credits`, `credit_packages`, `payments`, `teacher_earnings`, `payout_requests`, `reviews`
  - RLS: enabled on all tables (`supabase/migrations/20260528000002_rls_policies.sql`)
  - DB functions: `auth_profile_id()`, `auth_is_admin()`, `auth_teacher_id()`, `auth_student_id()`, `student_available_credits(p_student_id)`

**File Storage:**
- Supabase Storage — `avatars` bucket (public read, authenticated write to own folder)
  - Config: `supabase/migrations/20260528000003_storage.sql`
  - Remote image hostname allowed in Next.js: `**.supabase.co/storage/v1/object/public/**` (`next.config.ts`)

**Caching:**
- Next.js built-in cache (`revalidatePath` called after mutations in server actions)
- No external cache (Redis, Upstash, etc.) detected

## Authentication & Identity

**Auth Provider:**
- Supabase Auth — email/password only (no OAuth providers detected in source)
  - Sign-up: `supabase.auth.signUp()` with `data: { role, full_name }` (`lib/actions/auth.ts`)
  - Sign-in: `supabase.auth.signInWithPassword()` (`lib/actions/auth.ts`)
  - Sign-out: `supabase.auth.signOut()` (`lib/actions/auth.ts`)
  - OAuth callback route: `app/auth/callback/route.ts` — handles `?code=` exchange via `exchangeCodeForSession()` (supports future OAuth or magic link flows)
  - Session: cookie-based, managed by `@supabase/ssr` in middleware (`lib/supabase/middleware.ts`)
  - Session refresh: `updateSession()` runs on every request via `proxy.ts` middleware

**Role model:**
- Roles: `student` | `teacher` | `admin` (stored in `profiles.role`)
- DB trigger `on_auth_user_created` auto-creates profile row on signup (`supabase/migrations/20260528000001_initial_schema.sql`)
- Middleware enforces role-based route access: `/student/*`, `/teacher/*`, `/admin/*` (`lib/supabase/middleware.ts`)
- Onboarding gate: incomplete onboarding redirects to `/[role]/onboarding` until `profiles.onboarding_completed = true`

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Datadog, or similar SDK installed)

**Logs:**
- Next.js default server logs only; no structured logging library detected

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred: `.vercel` in `.gitignore`; `eslint-config-next` web vitals preset; domain `academigo.xyz` in `config/site.ts`)

**CI Pipeline:**
- Not detected (no `.github/workflows/`, `.gitlab-ci.yml`, or similar files present)

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (used in `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (same files as above)

**Future env vars (Stripe, Phase 3):**
- `STRIPE_SECRET_KEY` — not yet present in code
- `STRIPE_WEBHOOK_SECRET` — not yet present in code
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — not yet present in code

**Secrets location:**
- `.env*` files (gitignored); exact file name not confirmed as no `.env.example` was found

## Webhooks & Callbacks

**Incoming:**
- `GET /auth/callback` (`app/auth/callback/route.ts`) — Supabase Auth OAuth/magic-link code exchange

**Outgoing:**
- None detected (Stripe webhooks not yet implemented)

## Internationalization

**i18n (internal, not an external service):**
- Custom implementation — no `next-intl`, `i18next`, or similar library
- Supported locales: `de` (default, Swiss German), `en` (`lib/i18n/config.ts`)
- Dictionary files: `messages/de.ts`, `messages/en.ts`
- Locale routing: URL-prefix strategy (`/de/...`, `/en/...`) enforced in `proxy.ts` middleware
- Locale persistence: `academigo_locale` cookie (1-year expiry)

---

*Integration audit: 2026-05-28*
