# Academigo Platform

MVP tutoring platform for [Academigo.xyz](https://academigo.xyz) — students, teachers, and admins.

## Stack

- Next.js 16 (App Router)
- TypeScript, Tailwind CSS v4
- Supabase (Auth, Postgres, Storage)
- Framer Motion, Sonner

## Languages

- **German:** `/de/...` (default)
- **English:** `/en/...`
- Use the DE | EN switcher in the header, or visit `/` (redirects to `/de`).

All UI copy lives in [`messages/de.ts`](messages/de.ts) and [`messages/en.ts`](messages/en.ts).

## Phase 1 (current)

- Auth with roles (student / teacher)
- German + English UI
- Onboarding flows
- Subjects seed data
- Teacher listing & profiles
- Student & teacher dashboards
- Pricing display (checkout in Phase 3)

## Setup

1. Create a [Supabase](https://supabase.com) project.

2. Copy env file:

   ```bash
   cp .env.example .env.local
   ```

3. Run migrations in the Supabase **SQL Editor** (one file at a time, in order):

   1. `supabase/migrations/20260528000001_initial_schema.sql`
   2. `supabase/migrations/20260528000002_rls_policies.sql`
   3. `supabase/migrations/20260528000003_storage.sql`
   4. `supabase/seed.sql`

   **Brand-new database?** Skip `000000_reset.sql` — start at step 1.

   If tables already exist from a failed run, run `20260528000000_reset.sql` once, then repeat 1–4.

   **Common errors**

   | Error | Fix |
   |-------|-----|
   | `syntax error at or near "FUNCTION"` | Pull latest migrations (use `EXECUTE PROCEDURE` on triggers). |
   | `relation "profiles" already exists` | Run `20260528000000_reset.sql`, then migrations again. |
   | `column "file_size_limit" does not exist` | Use updated `20260528000003_storage.sql` (minimal bucket insert). |
   | `policy "…" already exists` | Re-run migration 2 (it now drops policies first). |
   | `permission denied for schema auth` | Run SQL as **postgres** role in Dashboard (default in SQL Editor). |
   | `must be owner of relation users` | Create the auth trigger via Dashboard → Database → Triggers, or contact support; see `supabase/MANUAL_AUTH_TRIGGER.sql`. |

4. In Supabase Auth settings, add redirect URL: `http://localhost:3000/auth/callback`

5. Install and run:

   ```bash
   npm install
   npm run dev
   ```

6. **Approve teachers** (until admin UI exists): in Supabase Table Editor, set `teachers.is_approved = true` for test teachers.

7. **Optional admin user**: set `profiles.role = 'admin'` for your user after signup.

## Config

- Lesson prices: [`config/pricing.ts`](config/pricing.ts)
- Teacher payout defaults: [`config/earnings.ts`](config/earnings.ts)

## Roadmap

- **Phase 2:** Availability & booking
- **Phase 3:** Stripe & credits
- **Phase 4:** Earnings & payouts
- **Phase 5:** Admin dashboard
- **Phase 6:** UI polish
