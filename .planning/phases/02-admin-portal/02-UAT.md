---
status: testing
phase: 02-admin-portal
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md, 02-06-SUMMARY.md, 02-07-SUMMARY.md]
started: 2026-05-31T00:00:00Z
updated: 2026-05-31T00:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 4
name: Teacher Approve button
expected: |
  On /de/admin/teachers, find a pending teacher row (yellow "Ausstehend" badge). Click "Freigeben". Page refreshes and that row's status badge changes to green. The Approve button disappears for that row.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Delete .next/ to clear Turbopack cache. Run `npm run dev` from scratch. Server boots without errors, homepage loads at localhost:3000, no startup crashes.
result: pass

### 2. Admin sign-in → Dashboard redirect
expected: Sign in with an admin account at /de/login. You are redirected to /de/admin/dashboard — not a 404 or back to login. Dashboard loads successfully.
result: pass

### 3. Dashboard stat cards + Needs Attention
expected: The dashboard at /de/admin/dashboard shows 4 stat cards (teachers count, students count, bookings count, revenue stub). Below the cards there is a "Needs Attention" section listing pending teachers, pending promotions, and pending payouts — each with a count badge and a link.
result: pass

### 4. Teacher Approve button
expected: On /de/admin/teachers, find a pending teacher row (yellow "Ausstehend" badge). Click "Freigeben". Page refreshes and that row's status badge changes to green. The Approve button disappears for that row.
result: [pending]

### 5. Students list — credit balance
expected: On /de/admin/students, each student row shows name, email, and a credit balance displayed as "available / total" (e.g., "3 / 5"). Both numbers are visible per row.
result: [pending]

### 6. Bookings tab filter
expected: On /de/admin/bookings, click the "Ausstehend" (pending) tab. The URL changes to include ?status=pending and only pending bookings are shown. Click "Alle" — URL loses the query param and all bookings appear again.
result: [pending]

### 7. Payouts — Mark Processed button
expected: On /de/admin/payouts, if a pending payout row exists, click "Als verarbeitet markieren". Page refreshes and that row's status updates to "Verarbeitet". The button disappears for that row.
result: [pending]

### 8. Promotions expandable review row
expected: On /de/admin/promotions, if a pending promotion request exists, click "Prüfen". The row expands in-place showing a note textarea plus "Freigeben" and "Ablehnen" buttons. Clicking one submits the action, updates the row status, and closes the expansion.
result: [pending]

## Summary

total: 8
passed: 3
issues: 0
pending: 5
skipped: 0

## Gaps

[none yet]
