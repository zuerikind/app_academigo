# Phase 02: Admin Portal - Research

**Researched:** 2026-05-30
**Domain:** Next.js 16 App Router admin portal, Supabase server-side mutations, React 19 Server Actions, reusable table component
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Dashboard layout: stat cards at top + "Needs attention" action inbox below
- Stat cards (4): Total Teachers | Total Students | Total Bookings | Total Revenue (CHF credits purchased)
- "Needs attention" section present on dashboard; contents at Claude's discretion (pending teacher approvals, pending promotions, pending payouts — at minimum)
- Each action inbox item links directly to the relevant management section
- Build one reusable `Table` component used across all admin management sections — no sorting, no pagination in v1
- Bookings view uses tabs for status filtering: All | Pending | Confirmed | Completed | Cancelled — tabs driven by URL search params
- Teacher approval (ADMIN-03): inline "Approve" button in the table row — one click, server action, row updates immediately
- Tier promotion review (ADMIN-04 / TIER-07): row expands in-place to reveal request details + optional note textarea + Approve / Reject buttons
- Payout marking (ADMIN-08): single "Mark processed" button — no reference note required for v1
- Full DE/EN translation keys; admin routes under `/[locale]/admin/`; add `admin` namespace to messages/de.ts and messages/en.ts

### Claude's Discretion
- Which specific items appear in the "Needs attention" section (pending teacher approvals, promotions, payouts — and any others that make sense)
- Table column layout for each management section
- Exact stat card icons and color tokens
- Empty state copy for each section

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADMIN-01 | Admin user who signs in is redirected to a functioning admin dashboard (not a 404) | Middleware guard already routes admin to `/admin/dashboard`; requires page to exist at that path |
| ADMIN-02 | Admin can view all teacher accounts with approval status, tier level, and key stats | Query `teachers` joined with `profiles`; display `is_approved`, `teacher_level`, `is_verified` columns |
| ADMIN-03 | Admin can approve a pending teacher account (sets `is_approved = true`) | Server action writes `teachers.is_approved = true`; `revalidatePath` refreshes the table page |
| ADMIN-04 | Admin can review and action teacher tier promotion requests | Requires `level_promotion_requests` table (Phase 1 migration); expandable row pattern in Client Component |
| ADMIN-05 | Admin can view all student accounts with credit balance and booking count | Join `students`, `profiles`, `student_credits`; aggregate `bookings` count |
| ADMIN-06 | Admin can view all bookings across the platform, filterable by status | `searchParams.status` drives Supabase `.eq("status", ...)` filter; tab UI is a Client Component using `Link` to set URL param |
| ADMIN-07 | Admin can view all pending payout requests from teachers | Requires `payout_requests` table; not yet in `types/database.ts` — Phase 1 migration must add it OR it is stubbed for Phase 2 |
| ADMIN-08 | Admin can mark a payout request as processed | Server action writes `payout_requests.status = "processed"`; `revalidatePath` |
</phase_requirements>

---

## Summary

Phase 2 builds the admin portal entirely within the existing Next.js 16 App Router, Supabase, and Tailwind v4 stack. All patterns — Server Component pages, `requireRoleFromParams` guards, `lib/queries/` data fetching, `lib/actions/` mutations, `DashboardLayout`, `StatCard`, `Badge`, `Button`, `Card`, `EmptyState` — are already proven and must be followed exactly. The only net-new patterns in this phase are: a reusable `Table` component (does not exist), URL-search-param-driven tab filtering (Server Component `searchParams` prop pattern, documented in Next.js 16 API), and an in-place expandable row for promotion review (requires a small Client Component island).

The most significant research finding is a **database gap**: `types/database.ts` does not contain `payout_requests` or `level_promotion_requests` tables. ADMIN-07/ADMIN-08 (payouts) and ADMIN-04 (promotions) both depend on these tables landing in Phase 1. The planner must ensure Phase 2 tasks declare this dependency explicitly and include a Wave 0 step that verifies the TypeScript types are regenerated before writing any query code.

**Primary recommendation:** Follow the student/teacher dashboard page as the canonical template — `requireRoleFromParams` at the top of each page, data fetch from `lib/queries/admin.ts`, render with shared UI components. The admin layout should use the same thin layout pattern as `app/[locale]/teacher/layout.tsx` (role guard only), not the teacher dashboard page's inline guard pattern. All mutations go in `lib/actions/admin.ts` and call `revalidatePath` targeting the specific admin page path.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.6 | App Router, Server Components, Server Actions | Project stack |
| React | 19.2.4 | UI rendering | Project stack |
| @supabase/ssr | ^0.10.3 | Server-side Supabase client | Project stack |
| @supabase/supabase-js | ^2.106.2 | Supabase query API | Project stack |
| Tailwind CSS | ^4 | Utility styling | Project stack |
| TypeScript | ^5 | Strict types | Project stack |
| Zod | ^4.4.3 | Server action input validation | Already used in onboarding actions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^1.17.0 | Icons via `AppIcon`/`IconName` | All icon usage — add new `IconName` entries to `lib/icons.ts` if needed |
| zod | ^4.4.3 | Validate server action inputs (note text, etc.) | Any server action that accepts user text |

### No New Dependencies
This phase requires zero new npm packages. All patterns and components are already in the codebase.

**Installation:**
```bash
# No new packages needed
```

---

## Architecture Patterns

### Recommended Project Structure
```
app/[locale]/admin/
├── layout.tsx              # Role guard only (thin layout — mirrors teacher/layout.tsx)
├── dashboard/
│   └── page.tsx            # ADMIN-01: stat cards + needs-attention inbox
├── teachers/
│   └── page.tsx            # ADMIN-02 + ADMIN-03: teacher list with approve action
├── students/
│   └── page.tsx            # ADMIN-05: student list
├── bookings/
│   └── page.tsx            # ADMIN-06: bookings list with tab filter
├── promotions/
│   └── page.tsx            # ADMIN-04: promotion requests with expandable rows
└── payouts/
    └── page.tsx            # ADMIN-07 + ADMIN-08: payout requests

lib/queries/
└── admin.ts                # All admin data queries

lib/actions/
└── admin.ts                # approveTeacher, approvePromotion, rejectPromotion, markPayoutProcessed

components/ui/
└── table.tsx               # New: reusable Table component

config/
└── navigation.ts           # Add getAdminNav()

messages/
├── de.ts                   # Add admin: { ... } namespace
└── en.ts                   # Add admin: { ... } namespace
```

### Pattern 1: Admin Layout (Role Guard)
**What:** Thin layout file that runs `requireRoleFromParams` once; all child pages inherit protection.
**When to use:** All admin pages under `/admin/`.
**Example:**
```typescript
// Source: mirrors app/[locale]/teacher/layout.tsx
import { requireRoleFromParams } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRoleFromParams("admin", locale);
  return children;
}
```
Note: CONTEXT.md says "not layout — layout pattern is inconsistent in student/teacher portals." The teacher layout uses the layout guard, the student portal does not. For admin, the layout guard is cleaner — it avoids repeating `requireRoleFromParams` on every page. Use the layout guard for admin.

### Pattern 2: Server Component Page with Data Fetch
**What:** Page awaits params + searchParams, calls `lib/queries/admin.ts`, renders UI.
**When to use:** All admin pages.
**Example:**
```typescript
// Source: Next.js 16 docs — page.md (searchParams is a Promise in v16)
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminBookingsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { status } = await searchParams;
  const dict = getDictionary(isLocale(locale) ? locale : "de");
  // requireRoleFromParams called in layout — not needed again here
  const bookings = await getAdminBookings(status);
  // render ...
}
```

### Pattern 3: Server Action Mutation
**What:** Server action validates input, writes to Supabase, calls `revalidatePath`, returns state.
**When to use:** All admin mutations (approve teacher, approve/reject promotion, mark payout).
**Example:**
```typescript
// Source: mirrors lib/actions/onboarding.ts pattern
"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type AdminActionState = { error?: string };

export async function approveTeacher(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireRole("admin"); // double-check even though layout guards
  const teacherId = String(formData.get("teacherId") ?? "");
  if (!teacherId) return { error: "Missing teacher ID" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("teachers")
    .update({ is_approved: true })
    .eq("id", teacherId);

  if (error) return { error: error.message };

  revalidatePath("/[locale]/admin/teachers", "page");
  return {};
}
```
**Critical:** `requireRole("admin")` inside the action provides defense-in-depth even though the layout already guards. Server actions are directly callable — never trust layout-only protection for mutations.

### Pattern 4: URL Search Param Tab Filter (Bookings)
**What:** Tab UI is a Client Component that uses `<Link>` to set `?status=` param; Server Component page reads `searchParams` prop and passes filter to query.
**When to use:** ADMIN-06 bookings tab filter.
**Example:**
```typescript
// Tab Client Component
"use client";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";

const TABS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;

export function BookingStatusTabs({ current }: { current: string }) {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 border-b border-academy-line">
      {TABS.map((tab) => (
        <Link
          key={tab}
          href={tab === "all" ? pathname : `${pathname}?status=${tab}`}
          className={/* active/inactive styles based on current === tab */}
        >
          {tab}
        </Link>
      ))}
    </div>
  );
}
```
**Critical Next.js 16 note:** `searchParams` in a page is a `Promise<{...}>` — must be `await`ed. `useSearchParams` is Client Component only and requires a `<Suspense>` boundary in production builds. The simpler pattern: Server Component page reads `searchParams` prop, passes the current tab value as a prop to the Client Component tab UI. No `useSearchParams` needed.

### Pattern 5: In-Place Expandable Row (Promotion Review)
**What:** Client Component wraps a table row; clicking "Review" toggles local state to show expanded details + form.
**When to use:** ADMIN-04 promotion request rows.
**Example:**
```typescript
"use client";
import { useState, useActionState } from "react";
import { approvePromotion, rejectPromotion } from "@/lib/actions/admin";

export function PromotionRow({ request }: { request: PromotionRequest }) {
  const [expanded, setExpanded] = useState(false);
  const [approveState, approveAction] = useActionState(approvePromotion, {});
  const [rejectState, rejectAction] = useActionState(rejectPromotion, {});

  return (
    <>
      <tr>
        {/* ... columns ... */}
        <td>
          <button onClick={() => setExpanded(!expanded)}>Review</button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={/* n */}>
            <form action={approveAction}>
              <input type="hidden" name="requestId" value={request.id} />
              <textarea name="note" placeholder="Optional note..." />
              <button type="submit">Approve</button>
            </form>
            <form action={rejectAction}>
              <input type="hidden" name="requestId" value={request.id} />
              <textarea name="note" placeholder="Optional note..." />
              <button type="submit">Reject</button>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
```
**Note:** `useActionState` is the React 19 API (replaces the experimental `useFormState` from React 18). Package.json confirms React 19.2.4 — use `useActionState` throughout, not `useFormState`.

### Pattern 6: Reusable Table Component
**What:** A typed Table component that accepts columns config + data array.
**When to use:** All admin list views (teachers, students, bookings, promotions, payouts).
**Design:**
```typescript
// components/ui/table.tsx
type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  width?: string;
};

export function Table<T extends { id: string }>({
  columns,
  rows,
  emptyState,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyState?: React.ReactNode;
}) {
  if (rows.length === 0) return emptyState ?? null;
  return (
    <div className="overflow-hidden rounded-[14px] border border-academy-line bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-academy-line bg-academy-mist">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-5 py-3 text-left text-[12px] font-medium text-academy-slate">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-academy-line">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-academy-mist/40 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-5 py-3.5 text-[13.5px] text-academy-navy">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Pattern 7: getAdminNav()
**What:** Navigation config function following the existing `getStudentNav` / `getTeacherNav` pattern.
**When to use:** Admin layout page — pass to `DashboardLayout` as `navItems`.
**Required icons:** All must be in `lib/icons.ts` `IconName` union. Current icons: `award`, `globe`, `users`, `monitor`, `bookOpen`, `mapPin`, `calendar`, `coins`, `package`, `clock`, `checkCircle`, `layoutDashboard`, `user`, `settings`, `book`. For admin nav, these will cover: dashboard (`layoutDashboard`), teachers (`users`), students (`user`), bookings (`calendar`), promotions (`award`), payouts (`coins`). No new `IconName` entries needed.

### Pattern 8: i18n — Adding admin Namespace
**What:** Add `admin: { ... }` key to both `messages/de.ts` and `messages/en.ts`. The `Dictionary` type is auto-derived from `typeof de` via `Stringify<typeof de>`, so adding keys to `de.ts` automatically extends the type.
**When to use:** All admin page strings.
**Required structure:**
```typescript
// messages/de.ts — add:
admin: {
  nav: {
    dashboard: "Dashboard",
    teachers: "Lehrpersonen",
    students: "Lernende",
    bookings: "Buchungen",
    promotions: "Stufenaufstiege",
    payouts: "Auszahlungen",
  },
  dashboard: {
    title: "Admin",
    subtitle: "...",
    statTeachers: "Lehrpersonen gesamt",
    statStudents: "Lernende gesamt",
    statBookings: "Buchungen gesamt",
    statRevenue: "Umsatz CHF",
    needsAttention: "Handlungsbedarf",
    pendingTeachers: "Ausstehende Freigaben",
    pendingPromotions: "Ausstehende Aufstiege",
    pendingPayouts: "Ausstehende Auszahlungen",
  },
  teachers: { title: "...", approveButton: "Freigeben", ... },
  students: { title: "...", ... },
  bookings: { title: "...", tabs: { all: "Alle", pending: "Ausstehend", ... } },
  promotions: { title: "...", review: "Prüfen", approve: "Freigeben", reject: "Ablehnen", notePlaceholder: "...", ... },
  payouts: { title: "...", markProcessed: "Als verarbeitet markieren", ... },
  empty: { teachers: "...", students: "...", bookings: "...", promotions: "...", payouts: "..." },
}
```

### Anti-Patterns to Avoid
- **Putting `requireRoleFromParams` in every page instead of the layout:** The admin layout should handle this once. Repeat `requireRole` only inside server actions for defense-in-depth.
- **Using `useSearchParams` in a Server Component:** `useSearchParams` is Client Component only. Use the `searchParams` page prop in Server Components (Next.js 16 docs confirm this clearly).
- **Using `useFormState` instead of `useActionState`:** React 19 (confirmed 19.2.4) ships `useActionState` from `react` directly. `useFormState` from `react-dom` is deprecated.
- **Calling `revalidatePath("/", "layout")` from mutations:** This invalidates the entire cache. Prefer `revalidatePath("/[locale]/admin/teachers", "page")` to target only the affected admin page.
- **Reading `searchParams` in a Layout:** Next.js 16 layouts do not receive `searchParams`. Always in Page files only (confirmed in Next.js 16 docs).
- **Building client-side filtering:** Bookings filter is tab-based URL navigation, not in-memory JavaScript filtering. The query runs server-side per tab.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Role-based redirect | Custom auth check | `requireRoleFromParams("admin", locale)` + layout guard | Already handles redirect logic including locale |
| Cache invalidation after mutation | Manual state refresh | `revalidatePath(path, "page")` | Built into Next.js Server Actions flow |
| Admin session check in actions | Middleware-only reliance | `requireRole("admin")` inside each action | Server actions are directly callable — middleware doesn't protect them |
| Status badge for bookings | Custom badge | `StatusBadge` component (already i18n-aware) | Already maps `BookingStatus` to `Badge` variants with translations |
| Table markup from scratch | Raw `<table>` per page | New `Table` component (Phase 2 deliverable) | Consistency across all 5 admin list views |
| Search param parsing | Manual URL parsing | `searchParams` page prop (Server Component) or `useSearchParams` hook (Client Component) | Next.js 16 API; avoids stale value pitfalls |

---

## Common Pitfalls

### Pitfall 1: Missing `level_promotion_requests` and `payout_requests` Tables
**What goes wrong:** `lib/queries/admin.ts` queries fail at runtime because the tables don't exist yet in the TypeScript types or the Supabase schema.
**Why it happens:** `types/database.ts` currently has no `level_promotion_requests` or `payout_requests` table definitions. Phase 1 Plan 01-01 is supposed to add the promotion table; payout requests may or may not be included.
**How to avoid:** Wave 0 of Phase 2 must explicitly verify these tables exist in `types/database.ts`. If they don't, add a DB migration step before any query code. Do not write query code against tables that aren't in the TypeScript types.
**Warning signs:** TypeScript errors on `.from("level_promotion_requests")` or `.from("payout_requests")`.

### Pitfall 2: `searchParams` is a Promise in Next.js 16
**What goes wrong:** Accessing `searchParams.status` directly (without `await`) returns a Promise object, not the string value.
**Why it happens:** Next.js 16 changed `searchParams` (and `params`) to be async Promises (confirmed in local docs).
**How to avoid:** Always `const { status } = await searchParams;` at the top of the page function.
**Warning signs:** Tab filter appears to always show "All" regardless of URL param.

### Pitfall 3: `useActionState` vs `useFormState`
**What goes wrong:** Importing `useFormState` from `react-dom` causes a deprecation warning or runtime error in React 19.
**Why it happens:** React 18 used `useFormState` from `react-dom/server`. React 19 promotes it to `useActionState` from `react`.
**How to avoid:** `import { useActionState } from "react"` — confirmed React 19.2.4 in package.json.
**Warning signs:** TypeScript "property does not exist" error on `react-dom` import.

### Pitfall 4: Revenue Stat Requires `credit_packages` Join
**What goes wrong:** Total Revenue CHF is not a single column — it requires summing `price_chf` from `credit_packages` multiplied by purchase count, or summing a `purchases` table.
**Why it happens:** There is no `purchases` or `orders` table in `types/database.ts` yet. Credits are tracked in `student_credits` but not tied to CHF amounts in the current schema.
**How to avoid:** For v1, Revenue can be approximated as "total credits purchased × average package price" OR stubbed as a placeholder (e.g., "—") until Phase 3 adds Stripe purchase records. The planner should decide: stub it with a clear label, or skip the Revenue stat card and replace with "Pending Approvals" count. This is a legitimate open question.
**Warning signs:** Joining tables that don't exist causes Supabase runtime errors.

### Pitfall 5: Inline Approve Button Needs Form + Hidden Input
**What goes wrong:** An inline "Approve" button in a table row that triggers a Server Action requires a `<form>` wrapping with the teacher ID as a hidden input. Forgetting the hidden input means the server action receives no teacher ID.
**Why it happens:** Server Actions receive `FormData` — data must be in the form.
**How to avoid:** Each table row's approve form:
```tsx
<form action={approveTeacherAction}>
  <input type="hidden" name="teacherId" value={teacher.id} />
  <Button type="submit" variant="secondary" size="sm">Approve</Button>
</form>
```

### Pitfall 6: LocaleProvider Not Wrapping Admin Pages
**What goes wrong:** `StatusBadge` and any other Client Components that call `useI18n()` throw "useI18n must be used within LocaleProvider" if the admin layout doesn't provide it.
**Why it happens:** `StatusBadge` uses `useI18n()` from `components/i18n/locale-provider.tsx` — the context must be provided somewhere in the tree above it.
**How to avoid:** Check how student/teacher pages handle this. The admin dashboard page should wrap its content (or the layout should) with `<LocaleProvider locale={locale} dict={dict}>`. Check existing portal layouts for where `LocaleProvider` is placed.

---

## Code Examples

### Fetching Admin Stats (dashboard query)
```typescript
// lib/queries/admin.ts
import { createClient } from "@/lib/supabase/server";

export async function getAdminStats() {
  const supabase = await createClient();

  const [{ count: teacherCount }, { count: studentCount }, { count: bookingCount }] =
    await Promise.all([
      supabase.from("teachers").select("*", { count: "exact", head: true }),
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
    ]);

  const [{ count: pendingTeachers }, { count: pendingPromotions }, { count: pendingPayouts }] =
    await Promise.all([
      supabase.from("teachers").select("*", { count: "exact", head: true }).eq("is_approved", false).eq("is_active", true),
      supabase.from("level_promotion_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("payout_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);

  return {
    teacherCount: teacherCount ?? 0,
    studentCount: studentCount ?? 0,
    bookingCount: bookingCount ?? 0,
    pendingTeachers: pendingTeachers ?? 0,
    pendingPromotions: pendingPromotions ?? 0,
    pendingPayouts: pendingPayouts ?? 0,
  };
}
```

### Fetching All Teachers for Admin
```typescript
// lib/queries/admin.ts
export async function getAdminTeachers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select(`
      id,
      is_approved,
      is_verified,
      teacher_level,
      created_at,
      profiles ( full_name, email )
    `)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}
```

### Bookings Query with Status Filter
```typescript
// lib/queries/admin.ts
export async function getAdminBookings(status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("bookings")
    .select(`
      id,
      status,
      start_time,
      credits_reserved,
      students ( profiles ( full_name ) ),
      teachers ( profiles ( full_name ) )
    `)
    .order("created_at", { ascending: false });

  const validStatuses = ["pending", "confirmed", "completed", "cancelled", "rejected"];
  if (status && validStatuses.includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data;
}
```

### Approve Teacher Action
```typescript
// lib/actions/admin.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type AdminActionState = { error?: string };

export async function approveTeacher(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireRole("admin");
  const teacherId = String(formData.get("teacherId") ?? "");
  if (!teacherId) return { error: "Missing teacher ID" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("teachers")
    .update({ is_approved: true })
    .eq("id", teacherId);

  if (error) return { error: error.message };

  revalidatePath("/[locale]/admin/teachers", "page");
  return {};
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useFormState` from `react-dom` | `useActionState` from `react` | React 19 | Import source changes; API is identical |
| `export const dynamic = 'force-dynamic'` to opt into dynamic rendering | `await connection()` from `next/server` | Next.js 15+ | Use `connection()` if a page must be dynamic but has no `searchParams`; admin pages use `searchParams` so they are already dynamic |
| Synchronous `params` and `searchParams` | `Promise<{ ... }>` — must be awaited | Next.js 15+ (confirmed in local docs) | Every page must `await params` and `await searchParams` before use |
| `revalidatePath("/")` to bust all cache | `revalidatePath("/[locale]/admin/page-name", "page")` | Always been available | More targeted invalidation; admin portal is server-rendered with no stale client cache concern |

**Deprecated/outdated:**
- `useFormState` from `react-dom`: Use `useActionState` from `react` in React 19.
- Synchronous `params` access: Will be deprecated per Next.js 16 docs; always `await` it.

---

## Open Questions

1. **Does `level_promotion_requests` table exist after Phase 1?**
   - What we know: `types/database.ts` does not contain this table today. ROADMAP and REQUIREMENTS reference it for ADMIN-04/TIER-06/TIER-07.
   - What's unclear: Phase 1 Plan 01-01 was supposed to create it; whether it has landed and types have been regenerated is unknown at research time.
   - Recommendation: Wave 0 task must check for the table in `types/database.ts`. If absent, add a migration step before implementing ADMIN-04.

2. **Does `payout_requests` table exist?**
   - What we know: Not in `types/database.ts`. ADMIN-07/ADMIN-08 require it. EARN-03/EARN-04/EARN-05 from Phase 3 also reference it.
   - What's unclear: Phase 1 may have added it; Phase 3 might expect Phase 2 to create it. CONTEXT.md scopes ADMIN-07/ADMIN-08 to Phase 2.
   - Recommendation: Phase 2 Wave 0 must include a migration creating `payout_requests (id, teacher_id, amount_chf, status, created_at)`. If Phase 1 already created it, skip. The schema is simple enough to define now.

3. **Revenue stat source**
   - What we know: No `purchases` table exists. `credit_packages` has `price_chf` but no purchase records. `student_credits` tracks totals not CHF amounts.
   - What's unclear: Whether to stub, estimate, or skip the Revenue stat card.
   - Recommendation: Stub as "— CHF" with a label like "Umsatz (Phase 3)" for v1. Revenue tracking requires Stripe webhook records from Phase 3. The planner should include this stub decision in the dashboard plan.

4. **Does `LocaleProvider` need to be in the admin layout?**
   - What we know: `StatusBadge` uses `useI18n()` which requires `LocaleProvider`. Checking how existing portals handle this was not completed (layout files for student portal were not inspected).
   - What's unclear: Whether there is a root layout or locale layout that already provides it.
   - Recommendation: Inspect `app/[locale]/layout.tsx` before writing the admin layout. If `LocaleProvider` is already in the locale-level layout, no action needed. If not, the admin layout must add it.

---

## Validation Architecture

> `nyquist_validation` is `true` in `.planning/config.json` — this section is required.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + ts-jest |
| Config file | `jest.config.ts` (exists) |
| Setup file | `jest.setup.ts` (referenced; assumed to exist) |
| Test pattern | `**/__tests__/**/*.test.ts` and `**/__tests__/**/*.test.tsx` |
| Quick run command | `npx jest __tests__/lib/actions/admin.test.ts --passWithNoTests` |
| Full suite command | `npx jest --passWithNoTests` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADMIN-01 | Admin dashboard page returns non-404 (routing, middleware guard) | Human checkpoint | Manual browser login as admin | N/A |
| ADMIN-02 | `getAdminTeachers()` returns teachers with `is_approved`, `teacher_level`, profile name | Unit (query mock) | `npx jest __tests__/lib/queries/admin.test.ts -t "getAdminTeachers"` | Wave 0 |
| ADMIN-03 | `approveTeacher()` sets `is_approved=true` and calls `revalidatePath` | Unit (action mock) | `npx jest __tests__/lib/actions/admin.test.ts -t "approveTeacher"` | Wave 0 |
| ADMIN-04 | `approvePromotion()` / `rejectPromotion()` update `level_promotion_requests.status` | Unit (action mock) | `npx jest __tests__/lib/actions/admin.test.ts -t "approvePromotion"` | Wave 0 |
| ADMIN-05 | `getAdminStudents()` returns students with credit balance and booking count | Unit (query mock) | `npx jest __tests__/lib/queries/admin.test.ts -t "getAdminStudents"` | Wave 0 |
| ADMIN-06 | `getAdminBookings("pending")` filters by status; `getAdminBookings()` returns all | Unit (query mock) | `npx jest __tests__/lib/queries/admin.test.ts -t "getAdminBookings"` | Wave 0 |
| ADMIN-07 | `getAdminPayouts()` returns pending payout requests with teacher name and amount | Unit (query mock) | `npx jest __tests__/lib/queries/admin.test.ts -t "getAdminPayouts"` | Wave 0 |
| ADMIN-08 | `markPayoutProcessed()` sets payout status to "processed" | Unit (action mock) | `npx jest __tests__/lib/actions/admin.test.ts -t "markPayoutProcessed"` | Wave 0 |
| UI render (all pages) | Each admin page renders without error; stat cards show numeric values | Human checkpoint | Manual browser tour as admin | N/A |
| Table component | `<Table>` renders rows and empty state correctly | Unit (jsdom) | `npx jest __tests__/components/ui/table.test.tsx` | Wave 0 |

**Note on ADMIN-01:** The middleware redirect is already tested implicitly (middleware exists and is exercised on any `/admin/*` request). What matters for ADMIN-01 is that `/admin/dashboard` returns a page, not a 404. This is a human checkpoint: sign in as admin, confirm redirect works and page renders.

### Mocking Pattern
Follow the existing `__tests__/lib/actions/auth.test.ts` pattern:
```typescript
const mocks = {
  update: jest.fn(),
  revalidatePath: jest.fn(),
  requireRole: jest.fn(),
};

jest.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => mocks.revalidatePath(...args) }));
jest.mock("@/lib/auth/session", () => ({ requireRole: (...args: unknown[]) => mocks.requireRole(...args) }));
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    from: jest.fn().mockReturnValue({
      update: (...args: unknown[]) => mocks.update(...args),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    }),
  }),
}));
```

### Sampling Rate
- **Per task commit:** `npx jest --passWithNoTests` (full suite is fast — only unit tests, no integration)
- **Per wave merge:** `npx jest --passWithNoTests`
- **Phase gate:** Full suite green + human checkpoint of browser login flow before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/lib/actions/admin.test.ts` — covers ADMIN-03, ADMIN-04, ADMIN-08
- [ ] `__tests__/lib/queries/admin.test.ts` — covers ADMIN-02, ADMIN-05, ADMIN-06, ADMIN-07
- [ ] `__tests__/components/ui/table.test.tsx` — covers Table component render

---

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` — `searchParams` is Promise in Next.js 16, must be awaited
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md` — layouts do not receive `searchParams`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md` — Client Component only; Suspense boundary required in production
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md` — targeted path invalidation after Server Actions
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/redirect.md` — redirect outside try/catch
- Project codebase: `lib/supabase/middleware.ts` — admin routing confirmed
- Project codebase: `lib/auth/session.ts` — `requireRole` / `requireRoleFromParams` confirmed
- Project codebase: `types/database.ts` — confirmed table schemas and missing tables
- Project codebase: `package.json` — React 19.2.4, Next.js 16.2.6 confirmed
- Project codebase: `components/ui/` — all UI component APIs confirmed
- Project codebase: `config/navigation.ts` — NavItem type and nav function pattern confirmed
- Project codebase: `messages/de.ts` — Dictionary shape and admin namespace absence confirmed
- Project codebase: `components/i18n/locale-provider.tsx` — `useI18n` hook confirmed

### Secondary (MEDIUM confidence)
- `components/ui/status-badge.tsx` — `useI18n` usage pattern; confirms `LocaleProvider` must be in ancestor tree
- `__tests__/lib/actions/auth.test.ts` — mocks object pattern for Jest test files confirmed

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed from package.json; no new dependencies needed
- Architecture: HIGH — all patterns derived from existing codebase + Next.js 16 local docs
- DB schema gaps: HIGH — `types/database.ts` was read directly; gaps are confirmed facts
- Pitfalls: HIGH — all pitfalls derived from observed code + official Next.js 16 docs
- Revenue stat open question: MEDIUM — schema absence confirmed; correct v1 approach is a product decision

**Research date:** 2026-05-30
**Valid until:** 2026-06-30 (stable stack; Next.js 16 API unlikely to change within 30 days)
