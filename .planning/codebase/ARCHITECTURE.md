# Architecture

**Analysis Date:** 2026-05-28

## Pattern Overview

**Overall:** Next.js App Router with server-first rendering, role-based routing, and Supabase as the data/auth backend.

**Key Characteristics:**
- Server Components handle all data fetching — no client-side fetching libraries (React Query, SWR, etc.)
- Server Actions (`"use server"`) handle all mutations (auth, onboarding, form submissions)
- Middleware enforces auth guards and role-based redirects before any page renders
- i18n is baked into the URL structure via a `[locale]` dynamic segment at the root of all routes
- The app is split into three distinct role-based sections: public marketing, `/student/*`, and `/teacher/*`

## Layers

**Middleware / Edge Layer:**
- Purpose: Auth session refresh, locale detection, role-based route protection, onboarding gate
- Location: `lib/supabase/middleware.ts` (exported as `updateSession`) — called from a root `middleware.ts` file (not present yet, likely `proxy.ts` wraps it)
- Contains: Supabase SSR session checks, redirect logic for unauthenticated/wrong-role users, onboarding completion checks
- Depends on: `lib/i18n/config.ts`, `lib/i18n/path.ts`, `types/database.ts`
- Used by: Next.js middleware pipeline

**Route / Page Layer:**
- Purpose: Compose page UI from queries, auth, and components
- Location: `app/[locale]/*/page.tsx` and `app/[locale]/*/layout.tsx`
- Contains: Async Server Components that call `requireRole*`, run queries, and render layout components
- Depends on: `lib/auth/session.ts`, `lib/queries/*`, `lib/i18n/*`, `components/*`, `config/navigation.ts`
- Used by: Next.js router

**Auth / Session Layer:**
- Purpose: Server-side session helpers, role enforcement, profile lookups
- Location: `lib/auth/session.ts`
- Contains: `getProfile()`, `requireProfile()`, `requireRole()`, `requireRoleFromParams()`, `getStudentRecord()`, `getTeacherRecord()`
- Depends on: `lib/supabase/server.ts`, `lib/i18n/*`, `lib/types/index.ts`
- Used by: Page layouts (`app/[locale]/student/layout.tsx`, `app/[locale]/teacher/layout.tsx`) and individual pages

**Server Actions Layer:**
- Purpose: Handle all form mutations; run server-side with `"use server"` directive
- Location: `lib/actions/auth.ts`, `lib/actions/onboarding.ts`, `lib/actions/locale.ts`
- Contains: `signUp()`, `signIn()`, `signOut()`, `completeStudentOnboarding()`, `completeTeacherOnboarding()`
- Depends on: `lib/supabase/server.ts`, `lib/auth/session.ts`, `lib/i18n/*`, Zod schema validation
- Used by: Form components in `components/auth/` and `components/onboarding/`

**Query Layer:**
- Purpose: Read-only Supabase data fetching, typed and mapped to domain types
- Location: `lib/queries/teachers.ts`, `lib/queries/student.ts`, `lib/queries/teacher-dashboard.ts`, `lib/queries/subjects.ts`
- Contains: Async functions that call `createClient()` (server), run `.select()` queries, and map raw rows to typed objects
- Depends on: `lib/supabase/server.ts`, `lib/types/index.ts`
- Used by: Page Server Components

**Services Layer (stub):**
- Purpose: Business logic operations planned for Phase 2+
- Location: `lib/services/bookings.ts`
- Contains: Type-only `BookingService` interface (not yet implemented)
- Note: Will wrap Supabase RPC calls for credit reserve/release/consume

**Component Layer:**
- Purpose: Reusable UI — layout shells, feature-specific components, primitives
- Location: `components/`
- Contains: Layout shells (`DashboardLayout`, `PublicLayout`), feature components (`TeacherCard`, `OnboardingForms`), and design-system primitives (`components/ui/`)
- Depends on: `lib/actions/*` (for Server Action form targets), `lib/i18n/*` (via `useI18n` context hook), `config/navigation.ts`
- Used by: Pages

**Data / Types Layer:**
- Purpose: Canonical database schema types and domain type aliases
- Location: `types/database.ts` (raw DB schema), `lib/types/index.ts` (re-exports and composite types)
- Contains: `Database` type with all table Row/Insert/Update shapes, `UserRole`, `BookingStatus`, `TeacherListItem`, `TeacherWithProfile`
- Depends on: Nothing
- Used by: All layers above

**i18n Layer:**
- Purpose: Locale resolution, dictionary loading, path utilities
- Location: `lib/i18n/`
- Contains: `config.ts` (supported locales, LOCALE_COOKIE), `get-dictionary.ts` (sync dictionary lookup), `path.ts` (localizedPath, stripLocale), `server.ts` (cookie-based locale resolution), `format.ts` (message interpolation), `subjects.ts` (subject name translation), `package-labels.ts`
- Depends on: `messages/de.ts`, `messages/en.ts`, `messages/types.ts`
- Used by: Middleware, pages, Server Actions, components

**Configuration Layer:**
- Purpose: Static app-wide config
- Location: `config/site.ts`, `config/navigation.ts`, `config/pricing.ts`, `config/earnings.ts`
- Contains: Brand constants, nav item generators (role-aware, locale-aware), pricing data
- Depends on: `lib/i18n/config.ts`, `lib/i18n/path.ts`, `messages/types.ts`
- Used by: Layout components and pages

## Data Flow

**Authentication (Sign-in):**

1. User submits the form in `components/auth/auth-form.tsx`
2. Server Action `signIn()` in `lib/actions/auth.ts` is invoked
3. Action calls `supabase.auth.signInWithPassword()` via `lib/supabase/server.ts`
4. On success, queries `profiles` table to read `role` and `onboarding_completed`
5. Redirects to `/{locale}/[role]/onboarding` if incomplete, else `/{locale}/[role]/dashboard`

**Page Render (Authenticated Dashboard):**

1. Request hits Next.js middleware (`lib/supabase/middleware.ts`)
2. Middleware refreshes Supabase session cookie, validates role against route prefix
3. Layout file (e.g., `app/[locale]/teacher/layout.tsx`) calls `requireRoleFromParams()` as a secondary guard
4. Page Server Component calls `requireRoleFromParams()`, fetches dashboard data via `lib/queries/teacher-dashboard.ts`
5. Page renders `DashboardLayout` with nav items from `config/navigation.ts` and fetched data

**Onboarding Flow:**

1. After sign-up, user is redirected to `/{locale}/[role]/onboarding`
2. Onboarding form component submits via Server Action (`completeStudentOnboarding` or `completeTeacherOnboarding`)
3. Action validates with Zod schema, upserts `profiles` + role table (`students` or `teachers`), sets `onboarding_completed = true`
4. `revalidatePath("/", "layout")` clears cache, redirect to role dashboard

**State Management:**
- No client-side global state store
- Server state flows through Server Components and is re-fetched on navigation
- React Context is used only for i18n (`I18nContext` in `components/i18n/locale-provider.tsx`) — provides `locale` and `dict` to Client Components
- Toast notifications via `sonner` (wired in root `app/layout.tsx`)

## Key Abstractions

**`requireRole` / `requireRoleFromParams`:**
- Purpose: Combined auth check + role enforcement + redirect; used as the "gate" in every protected layout and page
- Examples: `lib/auth/session.ts`, consumed by `app/[locale]/teacher/layout.tsx`, `app/[locale]/student/layout.tsx`, and all dashboard pages
- Pattern: Throws a `redirect()` (which Next.js catches) rather than returning an error

**`localizedPath`:**
- Purpose: All internal hrefs are constructed via this utility to ensure locale prefix is always present
- Examples: `lib/i18n/path.ts`
- Pattern: `localizedPath(locale, "/student/dashboard")` → `"/de/student/dashboard"`

**`createClient` (server vs. client):**
- Purpose: Two separate Supabase client factories — one for server context (uses `next/headers` cookies), one for browser context
- Examples: `lib/supabase/server.ts` (Server Components, Server Actions), `lib/supabase/client.ts` (Client Components)
- Pattern: Always import from the correct file depending on render context

**Query functions with row mappers:**
- Purpose: Queries return typed domain objects (e.g., `TeacherListItem`), not raw Supabase rows
- Examples: `lib/queries/teachers.ts` — `mapTeacher()` converts `TeacherRow` to `TeacherListItem`
- Pattern: Each query file defines a local `Row` type for the raw DB shape, then maps to the exported domain type

**Server Actions with `useActionState` pattern:**
- Purpose: Form mutations return `{ error?: string }` state consumed by `useActionState` in Client Components
- Examples: `lib/actions/auth.ts` exports `AuthState`, `lib/actions/onboarding.ts` exports `OnboardingState`
- Pattern: `(_prev: State, formData: FormData) => Promise<State>`

## Entry Points

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: All requests
- Responsibilities: Fonts (Inter, Manrope), global CSS, Sonner `<Toaster>` mount, `suppressHydrationWarning`

**Locale Layout:**
- Location: `app/[locale]/layout.tsx`
- Triggers: All requests under `/{locale}/*`
- Responsibilities: Validates locale segment, loads dictionary, wraps children in `LocaleProvider` and `SetHtmlLang`

**Role Layouts (secondary guards):**
- Location: `app/[locale]/student/layout.tsx`, `app/[locale]/teacher/layout.tsx`
- Triggers: Any request under `/{locale}/student/*` or `/{locale}/teacher/*`
- Responsibilities: Calls `requireRoleFromParams()` — provides a layout-level auth/role check in addition to middleware

**Auth Callback Route:**
- Location: `app/auth/callback/route.ts`
- Triggers: OAuth/magic-link redirects from Supabase
- Responsibilities: Exchanges code for session, redirects to role dashboard or `/login?error=auth`

## Error Handling

**Strategy:** Redirect-on-error for auth flows; `{ error?: string }` returned from Server Actions for form validation.

**Patterns:**
- Auth guards use Next.js `redirect()` from `next/navigation` — no error boundaries needed for auth failures
- `notFound()` used when locale segment is invalid
- Server Actions return `{ error: string }` sourced from the dictionary (translated error messages)
- Supabase query errors are handled by checking the `error` field and returning empty/null: `if (error || !data) return []`
- Onboarding actions use Zod `safeParse()` and return the dictionary-translated error if validation fails

## Cross-Cutting Concerns

**Logging:** No logging framework — `console.*` only (not detected in production code paths)
**Validation:** Zod used exclusively in Server Actions (`lib/actions/onboarding.ts`); no client-side validation layer
**Authentication:** Supabase SSR (`@supabase/ssr`) — session stored in cookies, refreshed in middleware on every request

---

*Architecture analysis: 2026-05-28*
