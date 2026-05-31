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
  root_cause: "Turbopack build cache (.next) did not pick up newly created admin route files after phase 2 execution. Deleting .next and restarting npm run dev resolved all 404s immediately. The 'generate-params' timing was absent on 404 requests (vs present on working routes) because Turbopack never compiled the admin route modules."
  artifacts:
    - path: ".next/"
      issue: "Stale Turbopack cache — did not discover admin route files created during phase 2 execution"
  missing:
    - "No code fix needed — resolved by clearing .next cache and restarting dev server"
    - "Document: after adding new route files in this project, clear .next before testing"
  debug_session: ""
