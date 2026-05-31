---
status: complete
phase: 02-admin-portal
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md, 02-06-SUMMARY.md, 02-07-SUMMARY.md]
started: 2026-05-31T00:00:00Z
updated: 2026-05-31T00:00:00Z
---

## Current Test

number: 7
name: [testing complete — all admin routes blocked by 404]
expected: ""
awaiting: diagnosis

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Run `npm run dev` from scratch. Server boots without errors, homepage loads at localhost:3000, no startup crashes.
result: pass

### 2. Admin sign-in redirect to dashboard
expected: Sign in with an admin account at /de/login. You are redirected to /de/admin/dashboard — not a 404 or back to login. Dashboard shows 4 stat cards (teachers, students, bookings, revenue) and a "Needs Attention" section.
result: issue
reported: "GET /de/admin/dashboard 404 — proxy.ts takes 370-400ms suggesting proxy-level 404, not missing file. Happens both before and after the POST /de/login 303 redirect."
severity: blocker

### 3. Teacher Approve button
expected: On /de/admin/teachers, locate a pending teacher row (yellow "Ausstehend" badge) and click "Freigeben". Page refreshes and the row status badge changes to green "Freigegeben". The Approve button disappears for that row.
result: issue
reported: "GET /de/admin/dashboard 404 — same proxy-level 404, all /admin/* routes unreachable"
severity: blocker

### 4. Students list — credit balance and booking count
expected: On /de/admin/students, each student row shows name, email, available/total credit balance, AND a booking count column. Both credit balance and booking count are visible.
result: skipped
reason: Blocked — all /admin/* routes return 404 (same issue as tests 2 and 3)

### 5. Bookings tab filter
expected: On /de/admin/bookings, click the "Ausstehend" tab. URL changes to ?status=pending and only pending bookings appear. Click "Alle" — URL loses the query param and all bookings appear.
result: skipped
reason: Blocked — all /admin/* routes return 404

### 6. Payouts Mark Processed button
expected: On /de/admin/payouts, if a pending payout exists, click "Als verarbeitet markieren". Page refreshes and the row status updates to "Verarbeitet". The button disappears for that row.
result: skipped
reason: Blocked — all /admin/* routes return 404

### 7. Promotions expandable row review flow
expected: On /de/admin/promotions, if a pending promotion request exists, click "Prüfen". The row expands in-place showing a note textarea plus "Freigeben" and "Ablehnen" buttons. Submitting one updates the row status and the expansion closes.
result: skipped
reason: Blocked — all /admin/* routes return 404

## Summary

total: 7
passed: 1
issues: 2
pending: 0
skipped: 4
skipped: 0

## Gaps

- truth: "All /de/admin/* routes are reachable — dashboard, teachers, students, bookings, payouts, promotions all return 200"
  status: failed
  reason: "User reported: GET /de/admin/dashboard 404 (and /de/admin/teachers same result). proxy.ts takes 370-400ms of the ~406ms response time; next.js is only 8ms. Reproduces consistently across multiple login attempts."
  severity: blocker
  test: 2
  root_cause: "All /de/admin/* routes (dashboard, teachers) 404 with identical timing: proxy.ts ~370ms (Supabase getUser), application-code 28ms. Key diagnostic: 'generate-params' timing is ABSENT on the 404 responses but present on working routes (/de, /de/login). This means Next.js is returning 404 before resolving the [locale] route parameter — the router is not finding app/[locale]/admin/*/page.tsx routes. Two leading hypotheses: (1) The admin layout's requireRoleFromParams calls redirect() which in Next.js 16 may not properly bubble from a nested layout, resulting in 404 instead of 307. (2) The Supabase migration (20260530000001_admin_tables.sql) has not been applied to the remote database, causing a runtime error in getAdminStats() that triggers notFound() behavior. Both require investigation."
  artifacts:
    - path: "app/[locale]/admin/layout.tsx"
      issue: "requireRoleFromParams('admin', locale) may cause redirect() that Next.js 16 renders as 404 from a nested layout"
    - path: "lib/auth/session.ts"
      issue: "requireRoleFromParams/requireRole/requireProfile chain calls redirect() — behavior in Next.js 16 nested layout untested"
    - path: "supabase/migrations/20260530000001_admin_tables.sql"
      issue: "Migration may not be applied to remote Supabase — level_promotion_requests and payout_requests tables may not exist"
  missing:
    - "Verify migration was applied: check Supabase dashboard for level_promotion_requests and payout_requests tables"
    - "If not applied: run `npx supabase db push` or apply migration manually via Supabase dashboard"
    - "If applied: add console.log to admin layout to confirm it runs, and check if redirect() from nested layout causes 404 in Next.js 16"
    - "Consider adding error.tsx to app/[locale]/admin/ to catch runtime errors and prevent silent 404"
  debug_session: ""
