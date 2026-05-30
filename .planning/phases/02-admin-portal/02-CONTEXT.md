# Phase 2: Admin Portal - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a functioning admin portal: dashboard overview, teacher approval, student management, booking overview, payout management, and teacher tier promotion review. The admin is the sole internal user. No student/teacher-facing changes in this phase.

Requirements: ADMIN-01 through ADMIN-08, TIER-06, TIER-07

</domain>

<decisions>
## Implementation Decisions

### Dashboard Homepage
- Layout: stat cards at top + "Needs attention" action inbox below
- Stat cards (4): Total Teachers | Total Students | Total Bookings | Total Revenue (CHF credits purchased)
- "Needs attention" section: Claude decides which pending queues to surface (pending teacher approvals, pending promotions, pending payouts — at minimum)
- Each action inbox item links directly to the relevant management section

### Data Display Pattern
- Build a reusable `Table` component used across all admin management sections
- No sorting for v1 — simple server-rendered list
- No pagination for v1 — admin portal is internal, data volumes are low at launch
- Bookings view (ADMIN-06) uses **tabs** for status filtering: All | Pending | Confirmed | Completed | Cancelled — tabs driven by URL search params

### Action UX
- Teacher approval (ADMIN-03): inline "Approve" button in the table row — one click, server action, row updates immediately
- Tier promotion review (ADMIN-04 / TIER-07): row expands in-place to reveal request details + optional note textarea + Approve / Reject buttons
- Payout marking (ADMIN-08): single "Mark processed" button — no reference note required for v1

### Admin i18n
- Full DE/EN translation keys — same pattern as student/teacher portals
- Admin routes under `/[locale]/admin/` like the rest of the app
- Add `admin` namespace to messages/de.ts and messages/en.ts

### Claude's Discretion
- Which specific items appear in the "Needs attention" section (pending teacher approvals, promotions, payouts — and any others that make sense)
- Table column layout for each management section
- Exact stat card icons and color tokens
- Empty state copy for each section

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/layout/dashboard-layout.tsx`: Sidebar + mobile nav + top header. Reuse directly for admin — pass a `getAdminNav()` function
- `components/ui/stat-card.tsx`: Large number display with icon and tone variants. Use directly for dashboard stat cards
- `components/ui/card.tsx`: Container with multiple tone/elevation variants
- `components/ui/button.tsx`: 6 variants (primary/secondary/ghost/etc.), all sizes — use for inline action buttons
- `components/ui/badge.tsx`: 8 variants including `warning` and `muted` — use for approval status / booking status display
- `components/ui/empty-state.tsx`: Icon + title + description + CTA. Use for empty management sections
- `components/ui/page-header.tsx`: PageHeader (h1) and SectionHeader (h2) — use for page titles

### Established Patterns
- Server Component pages → `requireRoleFromParams("admin", locale)` guard in each page (not layout — layout pattern is inconsistent in student/teacher portals)
- Data fetching: Server Component calls `getXxxData()` from `lib/queries/` → query creates server client → executes Supabase query → page renders
- Server actions in `lib/actions/` for mutations (approve, reject, mark processed)
- Navigation config: add `getAdminNav()` to `config/navigation.ts` following existing `getStudentNav()` / `getTeacherNav()` pattern

### Integration Points
- Admin middleware guard already in place: `lib/supabase/middleware.ts` redirects non-admin users away from `/admin/*`; admin users auto-redirected to `/admin/dashboard` on login — no changes needed
- `requireRole("admin")` and `requireRoleFromParams("admin", locale)` in `lib/auth/session.ts` — ready to use
- i18n: add `admin` namespace to `messages/de.ts` and `messages/en.ts`; follow `useI18n()` hook pattern

### What Must Be Built New
- `components/ui/table.tsx` — reusable Table component (no existing one)
- `/app/[locale]/admin/` directory tree: layout, dashboard, teachers, students, bookings, promotions, payouts
- `lib/queries/admin.ts` — all admin data queries
- `lib/actions/admin.ts` — approve teacher, reject/approve promotion, mark payout processed
- `config/navigation.ts` → add `getAdminNav()`

</code_context>

<specifics>
## Specific Ideas

No specific UI references provided — standard admin tool aesthetic is fine.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-admin-portal*
*Context gathered: 2026-05-30*
