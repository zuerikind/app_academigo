---
phase: 02-admin-portal
plan: "06"
subsystem: admin-promotions
tags: [promotions, client-component, useActionState, expandable-row, i18n]
dependency_graph:
  requires:
    - 02-02 (lib/actions/admin.ts: approvePromotion, rejectPromotion, AdminActionState)
    - 02-02 (lib/queries/admin.ts: base file with createClient pattern)
    - 02-02 (messages/de.ts, messages/en.ts: admin.promotions namespace)
    - 02-03 (app/[locale]/admin/layout.tsx: DashboardLayout with getAdminNav)
  provides:
    - app/[locale]/admin/promotions/page.tsx (Server Component promotions list)
    - app/[locale]/admin/promotions/_promotion-row.tsx (Client Component expandable row)
    - lib/queries/admin.ts#getAdminPromotions (promotion requests query with teacher join)
  affects:
    - ADMIN-04 (satisfied)
tech_stack:
  added: []
  patterns:
    - Server Component page + Client Component island (_promotion-row.tsx) in separate files
    - useActionState from "react" (React 19 — NOT react-dom)
    - Supabase join normalization: cast array-inferred teachers/profiles to objects in Server Component
    - Badge variant "verified" for approved status (no "success" variant exists)
key_files:
  created:
    - app/[locale]/admin/promotions/page.tsx
    - app/[locale]/admin/promotions/_promotion-row.tsx
  modified:
    - lib/queries/admin.ts (added getAdminPromotions)
decisions:
  - Supabase join types for nested teachers/profiles normalized in Server Component page (not with as any cast)
  - Badge approved state uses "verified" variant (confirmed badge.tsx has no "success" variant)
  - PromotionRequestNormalized type defined in page.tsx to decouple from Supabase inferred types
  - teacher_level cast to explicit union literal string (not via indexed access on nullable teachers type)
metrics:
  duration: ~8min
  completed_date: "2026-05-30"
  tasks_completed: 1
  files_created: 2
  files_modified: 1
---

# Phase 02 Plan 06: Promotions Management Page Summary

**One-liner:** Promotions page with Server Component table and PromotionRow Client Component island — useActionState from react drives approve/reject in-place expandable rows.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | getAdminPromotions query + _promotion-row.tsx + promotions/page.tsx | 6d15354 | lib/queries/admin.ts, _promotion-row.tsx, page.tsx |

## Verification Results

- `_promotion-row.tsx` has `"use client"` directive at top: PASS
- `useActionState` imported from `"react"` not `"react-dom"`: PASS
- Both approvePromotion and rejectPromotion forms have `requestId` hidden inputs: PASS
- `getAdminPromotions` exported from `lib/queries/admin.ts`: PASS
- Badge variant "verified" used for approved (no "success" variant in badge.tsx): PASS
- TypeScript type safety: normalized Supabase join types without `as any` in render path

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Badge variant "success" does not exist**
- **Found during:** Task 1 (reading badge.tsx)
- **Issue:** Plan specified `variant="success"` for approved status badge, but badge.tsx has no "success" variant — available variants are: default, verified, muted, warning, outline, dark, brand, accent
- **Fix:** Used `variant="verified"` which is the semantic equivalent (green success color)
- **Files modified:** `app/[locale]/admin/promotions/_promotion-row.tsx`
- **Commit:** 6d15354

**2. [Rule 1 - Bug] PromotionRequestNormalized["teachers"]["teacher_level"] invalid indexed access**
- **Found during:** Task 1 (type analysis of page.tsx)
- **Issue:** `PromotionRequestNormalized["teachers"]["teacher_level"]` would fail TypeScript compile since `teachers` is `{...} | null` — cannot index null
- **Fix:** Used explicit union literal type `"junior" | "academigo_teacher" | "verified"` for the cast
- **Files modified:** `app/[locale]/admin/promotions/page.tsx`
- **Commit:** 6d15354

## Self-Check: PASSED

Files verified:
- app/[locale]/admin/promotions/page.tsx: EXISTS
- app/[locale]/admin/promotions/_promotion-row.tsx: EXISTS
- lib/queries/admin.ts exports getAdminPromotions: VERIFIED (line 136)
- Commit 6d15354: EXISTS
