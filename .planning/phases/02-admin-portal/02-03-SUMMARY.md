---
phase: 02-admin-portal
plan: "03"
subsystem: admin-ui
tags: [admin, layout, dashboard, stat-cards, role-guard, next-js, i18n]

requires:
  - phase: 02-02
    provides: "getAdminNav, getAdminStats, dict.admin.dashboard.* i18n keys, DashboardLayout, StatCard"
provides:
  - app/[locale]/admin/layout.tsx (role guard + DashboardLayout with admin nav for all /admin/* routes)
  - app/[locale]/admin/dashboard/page.tsx (stat cards + needs-attention inbox)
affects:
  - 02-04, 02-05, 02-06 (admin management pages share the layout created here)

tech-stack:
  added: []
  patterns:
    - Admin layout wraps DashboardLayout so child pages need no nav setup
    - DashboardLayout title/subtitle set in layout.tsx from dict — child pages render content only
    - StatCard with string value renders revenue stub without type coercion
    - Needs-attention list uses Badge(warning) for count > 0, Badge(muted) for zero

key-files:
  created:
    - app/[locale]/admin/layout.tsx
    - app/[locale]/admin/dashboard/page.tsx
  modified: []

key-decisions:
  - "DashboardLayout title and subtitle are provided in layout.tsx (not per-page), so all admin pages inherit the same header — child pages render body content only"
  - "Revenue stat uses StatCard value=revenueStub string ('— (Phase 3)') since StatCard accepts string|number; hint prop also shows the stub text"

requirements-completed:
  - ADMIN-01

duration: ~8min
completed: "2026-05-30"
---

# Phase 02 Plan 03: Admin Layout and Dashboard Summary

**Admin portal entry point: role-guarded layout with DashboardLayout + 4-stat-card dashboard with pending-items inbox — ADMIN-01 satisfied.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-30T17:10:00Z
- **Completed:** 2026-05-30T17:18:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Admin layout with `requireRoleFromParams("admin", locale)` guards all `/[locale]/admin/*` routes
- `DashboardLayout` with `getAdminNav()` sidebar rendered once in layout — child pages are body-only
- Dashboard page renders 4 `StatCard` components (teachers, students, bookings, revenue stub)
- Needs Attention section shows `pendingTeachers`, `pendingPromotions`, `pendingPayouts` with badge + link

## Task Commits

1. **Task 1: Admin layout — role guard + DashboardLayout** - `e1b50e3` (feat)
2. **Task 2: Admin dashboard page — stat cards + needs-attention inbox** - `7e0ecba` (feat)

## Files Created/Modified

- `app/[locale]/admin/layout.tsx` - requireRoleFromParams("admin") guard + DashboardLayout with getAdminNav
- `app/[locale]/admin/dashboard/page.tsx` - 4 StatCards + Needs Attention section with pending counts

## Decisions Made

- `DashboardLayout` requires a `title` prop (not optional). Title and subtitle are supplied in `layout.tsx` from `dict.admin.dashboard.title/subtitle` — child pages do not need to repeat them.
- Revenue `StatCard` uses `value={d.revenueStub}` (a string) since StatCard accepts `string | number`. The `hint` prop also shows the stub text for clarity.

## Deviations from Plan

None — plan executed exactly as written. The only adjustment was passing `title` and `subtitle` to `DashboardLayout` in the layout file (required props confirmed by reading the component), which aligned with the plan's intent.

## Issues Encountered

Pre-existing TypeScript errors in `app/[locale]/admin/teachers/page.tsx` (Property 'full_name' does not exist on type 'never', server action type mismatch) — these are out-of-scope from Plan 02-01 stub work, not introduced by this plan. Logged to deferred-items.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- ADMIN-01 satisfied: admin navigating to `/[locale]/admin/dashboard` sees the dashboard, not a 404
- Layout provides role guard and navigation for all subsequent admin pages (02-04 through 02-06)
- Pre-existing `admin/teachers/page.tsx` TypeScript errors need fixing (type narrowing on query result + server action signature) before 02-04 executes

---
*Phase: 02-admin-portal*
*Completed: 2026-05-30*
