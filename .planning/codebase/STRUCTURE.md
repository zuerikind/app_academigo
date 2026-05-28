# Codebase Structure

**Analysis Date:** 2026-05-28

## Directory Layout

```
app_academigo/
├── app/                        # Next.js App Router pages and layouts
│   ├── layout.tsx              # Root HTML shell (fonts, Toaster, global CSS)
│   ├── globals.css             # Global Tailwind CSS entry point
│   ├── favicon.ico             # Site favicon
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts        # OAuth/magic-link code exchange handler
│   └── [locale]/               # All UI routes scoped under a locale segment
│       ├── layout.tsx          # Locale layout: validates locale, provides i18n context
│       ├── page.tsx            # Public home page
│       ├── about/page.tsx
│       ├── login/page.tsx
│       ├── pricing/page.tsx
│       ├── signup/page.tsx
│       ├── subjects/page.tsx
│       ├── teachers/
│       │   ├── page.tsx        # Public teacher directory
│       │   └── [id]/page.tsx   # Public teacher profile
│       ├── student/
│       │   ├── layout.tsx      # Student authenticated shell
│       │   ├── dashboard/page.tsx
│       │   ├── bookings/page.tsx
│       │   ├── onboarding/page.tsx
│       │   ├── packages/page.tsx
│       │   ├── settings/page.tsx
│       │   └── teachers/
│       │       ├── page.tsx    # Student-facing teacher browser
│       │       └── [id]/page.tsx
│       └── teacher/
│           ├── layout.tsx      # Teacher authenticated shell
│           ├── dashboard/page.tsx
│           ├── availability/page.tsx
│           ├── bookings/page.tsx
│           ├── onboarding/page.tsx
│           ├── profile/page.tsx
│           └── settings/page.tsx
├── components/                 # Shared React components
│   ├── auth/                   # Login/signup form and shell
│   ├── i18n/                   # LocaleProvider context component
│   ├── icons/                  # app-icon.tsx wrapper
│   ├── layout/                 # Navbar, sidebar, footer, dashboard-layout, public-layout, language-switcher
│   ├── marketing/              # home-hero.tsx, home-features.tsx
│   ├── motion/                 # motion-section.tsx (Framer Motion wrapper)
│   ├── onboarding/             # onboarding-shell.tsx, student-onboarding-form.tsx, teacher-onboarding-form.tsx
│   ├── pricing/                # pricing-card.tsx
│   ├── subjects/               # subject-card.tsx
│   ├── teachers/               # teacher-card.tsx
│   └── ui/                     # Primitive design-system components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── container.tsx
│       ├── empty-state.tsx
│       ├── input.tsx
│       ├── page-header.tsx
│       ├── section.tsx
│       ├── stat-card.tsx
│       ├── status-badge.tsx
│       └── trust-strip.tsx
├── config/                     # Static application configuration
│   ├── database.ts             # DB-level config constants
│   ├── earnings.ts             # Earnings/payout config
│   ├── navigation.ts           # getPublicNav, getStudentNav, getTeacherNav
│   ├── pricing.ts              # Pricing tier definitions
│   └── site.ts                 # siteConfig (brand name, domain, contact links)
├── lib/                        # Server and shared logic
│   ├── utils.ts                # cn() (clsx+tailwind-merge), formatChf()
│   ├── icons.ts                # IconName type and icon map
│   ├── motion.ts               # Animation variant helpers
│   ├── actions/                # "use server" Next.js Server Actions
│   │   ├── auth.ts             # signUp, signIn, signOut
│   │   ├── locale.ts           # getActionLocale() helper
│   │   ├── onboarding.ts       # completeStudentOnboarding, completeTeacherOnboarding
│   │   ├── student.ts          # Student profile mutations
│   │   ├── subjects.ts         # Subject mutations
│   │   ├── teacher-dashboard.ts
│   │   └── teachers.ts         # Teacher profile mutations
│   ├── auth/
│   │   └── session.ts          # requireProfile() — throws if unauthenticated
│   ├── i18n/
│   │   ├── config.ts           # locales, defaultLocale, isLocale, LOCALE_COOKIE
│   │   ├── format.ts           # Date/number formatting helpers
│   │   ├── get-dictionary.ts   # getDictionary(locale) → Dictionary
│   │   ├── package-labels.ts   # i18n labels for packages
│   │   ├── path.ts             # localizedPath, stripLocale, resolveLocale
│   │   ├── server.ts           # Server-side locale resolution
│   │   └── bookings.ts         # i18n helpers for booking statuses
│   ├── queries/                # Read-only Supabase data fetchers (server-side)
│   │   ├── auth.ts
│   │   ├── student.ts
│   │   ├── subjects.ts
│   │   ├── teacher-dashboard.ts
│   │   └── teachers.ts         # getApprovedTeachers(), getTeacherById()
│   ├── services/               # Business logic / multi-step operations
│   │   └── config.ts           # service-level config
│   ├── supabase/
│   │   ├── client.ts           # createClient() for browser (createBrowserClient)
│   │   ├── server.ts           # createClient() for server (createServerClient + cookies)
│   │   ├── middleware.ts       # updateSession(), setLocaleCookie(), route-guard logic
│   │   └── session.ts          # session helpers
│   └── types/
│       └── index.ts            # Re-exports: Profile, Student, Teacher, TeacherListItem, etc.
├── messages/                   # i18n translation files
│   ├── de.ts                   # German (default locale)
│   ├── en.ts                   # English
│   └── types.ts                # Dictionary type derived from translations
├── types/
│   └── database.ts             # Hand-maintained Supabase schema types (Row/Insert/Update)
├── supabase/
│   └── migrations/             # Ordered SQL migration files
│       ├── 20260528000000_reset.sql
│       ├── 20260528000001_initial_schema.sql
│       ├── 20260528000002_rls_policies.sql
│       └── 20260528000003_storage.sql
├── public/
│   └── brand/
│       ├── logo-full.png
│       └── logo-icon.png
├── proxy.ts                    # Next.js middleware entry (locale redirect + session update)
├── next.config.ts              # Next.js config (Turbopack, image remote patterns)
├── tsconfig.json               # TypeScript config (strict, @/* path alias)
├── eslint.config.mjs           # ESLint flat config
├── postcss.config.mjs          # PostCSS config (Tailwind)
└── package.json
```

## Directory Purposes

**`app/[locale]/`:**
- Purpose: All user-facing pages, scoped under a locale URL segment (`/de/...` or `/en/...`)
- Contains: `page.tsx` and `layout.tsx` files only — no business logic
- Key files: `app/[locale]/layout.tsx` (locale validation + i18n context), `app/layout.tsx` (root HTML shell)

**`components/ui/`:**
- Purpose: Low-level, reusable design-system primitives
- Contains: Stateless presentational components with no data-fetching
- Key files: `button.tsx`, `card.tsx`, `input.tsx`, `container.tsx`, `section.tsx`

**`components/layout/`:**
- Purpose: Page-level chrome components used across multiple routes
- Key files: `navbar.tsx`, `sidebar.tsx`, `dashboard-layout.tsx`, `public-layout.tsx`, `footer.tsx`, `language-switcher.tsx`

**`lib/actions/`:**
- Purpose: All `"use server"` Server Actions invoked from forms
- Contains: Form handlers that validate input, call Supabase, then redirect
- Key files: `auth.ts`, `onboarding.ts`

**`lib/queries/`:**
- Purpose: Read-only async data fetchers that call `createClient()` (server)
- Contains: Functions returning typed data for Server Components
- Key files: `teachers.ts`, `student.ts`

**`lib/i18n/`:**
- Purpose: Locale detection, path prefixing, and dictionary loading
- Key files: `config.ts` (locale list + cookie name), `path.ts` (localizedPath), `get-dictionary.ts`

**`lib/supabase/`:**
- Purpose: Supabase client factories for different execution contexts
- Key files: `client.ts` (browser), `server.ts` (server components/actions), `middleware.ts` (route guards)

**`config/`:**
- Purpose: Static, non-secret application configuration constants
- Key files: `site.ts` (brand config), `navigation.ts` (nav item builders), `pricing.ts`

**`messages/`:**
- Purpose: Translation dictionaries exported as typed TypeScript objects
- Key files: `de.ts` (default), `en.ts`, `types.ts` (Dictionary type)

**`types/`:**
- Purpose: Hand-maintained Supabase database schema as TypeScript types
- Key files: `database.ts` (Row/Insert/Update for every table)

**`supabase/migrations/`:**
- Purpose: Ordered SQL files applied via `supabase db push`
- Generated: No (hand-authored)
- Committed: Yes

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root HTML document shell — fonts, global CSS, Toaster
- `app/[locale]/layout.tsx`: Locale validation and i18n context injection
- `proxy.ts`: Middleware — locale redirect and Supabase session refresh
- `app/auth/callback/route.ts`: OAuth/magic-link code exchange

**Configuration:**
- `next.config.ts`: Next.js config (Turbopack root, image domains)
- `tsconfig.json`: TypeScript config (`@/*` alias maps to project root)
- `config/site.ts`: Brand name, domain, contact links
- `config/navigation.ts`: Nav item factory functions per role
- `lib/i18n/config.ts`: Supported locales, default locale, cookie name

**Core Logic:**
- `lib/supabase/middleware.ts`: Route guard — unauthenticated redirect, role enforcement, onboarding gate
- `lib/actions/auth.ts`: signUp, signIn, signOut Server Actions
- `lib/actions/onboarding.ts`: Onboarding completion Server Actions
- `lib/queries/teachers.ts`: Teacher listing and profile queries
- `lib/auth/session.ts`: `requireProfile()` — used in Server Actions to assert authentication

**Type Definitions:**
- `types/database.ts`: Source of truth for all DB row/insert/update shapes
- `lib/types/index.ts`: Re-exports and composite types (`TeacherWithProfile`, `TeacherListItem`)
- `messages/types.ts`: `Dictionary` type for i18n

## Naming Conventions

**Files:**
- Kebab-case for all files: `teacher-card.tsx`, `auth-form.tsx`, `get-dictionary.ts`
- Page segments follow Next.js convention: `page.tsx`, `layout.tsx`, `route.ts`

**Directories:**
- Kebab-case: `lib/actions/`, `components/onboarding/`
- Next.js dynamic segments use brackets: `[locale]`, `[id]`

**Components:**
- PascalCase named exports matching the filename: `TeacherCard` in `teacher-card.tsx`

**Functions:**
- camelCase: `getApprovedTeachers`, `localizedPath`, `requireProfile`
- Server Actions prefixed by verb: `signUp`, `completeStudentOnboarding`

## Where to Add New Code

**New page route:**
- Add `app/[locale]/<section>/page.tsx` for public pages
- Add `app/[locale]/student/<section>/page.tsx` for authenticated student pages
- Add `app/[locale]/teacher/<section>/page.tsx` for authenticated teacher pages
- Middleware route-guard in `lib/supabase/middleware.ts` auto-protects `/student/*` and `/teacher/*`

**New Server Action (form mutation):**
- Add to `lib/actions/<domain>.ts` with `"use server"` directive at top
- Follow the pattern in `lib/actions/auth.ts`: read locale, validate, call Supabase, redirect

**New data query (read):**
- Add to `lib/queries/<domain>.ts`
- Import `createClient` from `@/lib/supabase/server`

**New UI primitive:**
- Add to `components/ui/<component-name>.tsx`

**New feature component:**
- Add to the matching `components/<feature>/` directory (e.g., `components/teachers/`)

**New static config:**
- Add to `config/<concern>.ts`

**New translation string:**
- Add to both `messages/de.ts` and `messages/en.ts`
- Update `messages/types.ts` if the Dictionary type needs extending

**New DB type:**
- Update `types/database.ts` Row/Insert/Update manually to match migration

**New migration:**
- Add SQL file to `supabase/migrations/` following the `YYYYMMDDHHMMSS_description.sql` naming pattern

## Special Directories

**`.next/`:**
- Purpose: Next.js build output and dev cache
- Generated: Yes
- Committed: No

**`.planning/`:**
- Purpose: GSD planning documents and codebase maps
- Generated: Yes (by GSD tooling)
- Committed: Yes

**`node_modules/`:**
- Purpose: Installed npm dependencies
- Generated: Yes
- Committed: No

**`public/brand/`:**
- Purpose: Static brand assets served at `/brand/*`
- Generated: No
- Committed: Yes

**`supabase/migrations/`:**
- Purpose: Database schema evolution history
- Generated: No (hand-authored)
- Committed: Yes

---

*Structure analysis: 2026-05-28*
