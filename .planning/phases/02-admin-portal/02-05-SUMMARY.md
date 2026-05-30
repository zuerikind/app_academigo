---
plan: 02-05
phase: 02-admin-portal
status: complete
requirements: ADMIN-06, ADMIN-07, ADMIN-08
---

# Plan 02-05: Bookings + Payouts Pages — Complete

## What Was Built

**`app/[locale]/admin/bookings/page.tsx`** — Server Component with URL-param-driven tab filter. `BookingStatusTabs` renders 5 status tabs (all/pending/confirmed/completed/cancelled) as `<Link>` elements that set `?status=` search params. Table shows student name, teacher name, date, credits, and status badge. Supabase nested join arrays unwrapped with `Array.isArray` guard before accessing `.profiles`.

**`app/[locale]/admin/payouts/page.tsx`** — Server Component listing all payout requests with teacher name, amount (CHF), status badge, date, and a per-row Mark Processed form (hidden `payoutId` input + inline server action wrapping `markPayoutProcessed`). Pending rows show the form; processed rows show nothing.

## Commits

- `f4ca44f`: feat(02-05): add bookings management page with URL-param tab filter
- `5786b48`: feat(02-05): add payouts management page with Mark Processed form action

## Deviations

- **Supabase join array unwrap:** `row.students` and `row.teachers` are inferred as arrays — applied `Array.isArray` guard to unwrap to `[0]` before accessing `.profiles` (same pattern as 02-04).

## Self-Check: PASSED

- TypeScript: `tsc --noEmit` exits 0
- Requirements ADMIN-06, ADMIN-07, ADMIN-08 satisfied

## key-files

### created
- app/[locale]/admin/bookings/page.tsx
- app/[locale]/admin/payouts/page.tsx
