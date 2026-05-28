# Coding Conventions

**Analysis Date:** 2026-05-28

## Naming Patterns

**Files:**
- React components: `kebab-case.tsx` — e.g., `auth-form.tsx`, `teacher-card.tsx`, `dashboard-layout.tsx`
- Utility/lib modules: `kebab-case.ts` — e.g., `get-dictionary.ts`, `teacher-dashboard.ts`
- Config files: `kebab-case.ts` — e.g., `navigation.ts`, `site.ts`, `pricing.ts`
- Type definition files: `kebab-case.ts` — e.g., `database.ts`, `index.ts`
- Next.js conventions followed: `page.tsx`, `layout.tsx`, `route.ts`

**Functions (exported):**
- React components: `PascalCase` — e.g., `Button`, `LoginForm`, `TeacherCard`, `StatCard`
- Server actions: `camelCase` verb-noun — e.g., `signUp`, `signIn`, `signOut`, `completeStudentOnboarding`
- Query functions: `camelCase` verb-noun — e.g., `getApprovedTeachers`, `getTeacherById`, `getStudentDashboardData`
- Auth helpers: `camelCase` verb-noun — e.g., `requireProfile`, `requireRole`, `getSessionUser`
- Utility functions: `camelCase` verb-noun — e.g., `localizedPath`, `stripLocale`, `formatMessage`, `formatChf`
- Config getter functions: `camelCase` get-noun — e.g., `getPublicNav`, `getStudentNav`, `getTeacherNav`

**Variables and parameters:**
- `camelCase` throughout — e.g., `formData`, `profileId`, `teacherId`, `fullName`
- Single-letter shorthand for local translations: `const t = dict.teacher.dashboard;`, `const tc = dict.common;`
- Raw locale params use `raw` suffix: `const { locale: raw } = await params;`

**Types and Interfaces:**
- `PascalCase` for named types — e.g., `ButtonVariant`, `ButtonSize`, `TeacherRow`, `AuthState`
- Exported state types use `[Feature]State` suffix — e.g., `AuthState`, `OnboardingState`
- `type` keyword preferred over `interface` throughout
- Database row types aliased via `lib/types/index.ts` using `Database["public"]["Tables"]["name"]["Row"]`

**Constants/config objects:**
- `camelCase` for config objects — e.g., `siteConfig`, `defaultLocale`, `LOCALE_COOKIE`
- `SCREAMING_SNAKE_CASE` for exported constants — e.g., `LOCALE_COOKIE`
- Variant maps: `Record<VariantType, string>` pattern — e.g., `variants`, `sizes`, `paddings`, `tones`

## Code Style

**Formatting:**
- Prettier (implied by consistent formatting), trailing commas enforced in multi-line
- 2-space indentation throughout
- Strings: double quotes for JSX attributes; double quotes in TypeScript
- Trailing comma in multi-line arrays and objects
- Arrow function bodies use parentheses for multi-line returns

**Linting:**
- ESLint v9 flat config at `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- No custom rule overrides beyond default ignores

**TypeScript:**
- `strict: true` in `tsconfig.json` — all strict checks enabled
- `noEmit: true` — type-check only, Turbopack handles compilation
- Non-null assertions (`!`) used for env vars: `process.env.NEXT_PUBLIC_SUPABASE_URL!`
- `as unknown as X` cast pattern when Supabase returns untyped join results
- `type` imports distinguished with `import type` consistently

## Import Organization

**Order (observed pattern):**
1. Next.js built-ins — `next/navigation`, `next/cache`, `next/link`, `next/font/google`
2. React — `react`, `react/...`
3. Third-party packages — `zod`, `framer-motion`, `clsx`, etc.
4. Internal `@/components/...`
5. Internal `@/config/...`
6. Internal `@/lib/...`
7. Internal `@/messages/...`
8. Internal `@/types/...`

**Path Aliases:**
- `@/*` maps to project root — defined in `tsconfig.json`
- All internal imports use `@/` prefix — no relative paths used across module boundaries
- Relative imports only within the same file's component (not observed in codebase)

## Server vs. Client Directive Pattern

- `"use server"` at top of all files in `lib/actions/` — e.g., `lib/actions/auth.ts`, `lib/actions/onboarding.ts`, `lib/actions/locale.ts`
- `"use client"` at top of interactive components — e.g., `components/auth/auth-form.tsx`, `components/i18n/locale-provider.tsx`, `components/layout/sidebar.tsx`
- No directive = Server Component (default) — applies to all page files and most layout components
- Pass server action functions as props to client components rather than importing in client components

## Error Handling

**Server actions pattern:**
- Return typed state objects: `AuthState = { error?: string }`, `OnboardingState = { error?: string }`
- Early return on validation failure: `if (!email || !password) return { error: dict.auth.errors.emailPasswordRequired };`
- Supabase errors destructured immediately: `const { error } = await supabase.auth.signUp(...); if (error) return { error: error.message };`
- Use `redirect()` from `next/navigation` for success paths — never return success states
- `_prev` convention for unused previous state in `useActionState` pairs

**Query functions pattern:**
- Return `null` or empty arrays on error: `if (error || !data) return [];` / `if (error || !data) return null;`
- Never throw in query functions — callers handle null/empty
- Supabase `.maybeSingle()` preferred over `.single()` when record may not exist

**Session/auth guards pattern:**
- `requireProfile()` redirects to `/login` if no session — throws via `redirect()`
- `requireRole(role)` redirects to role-appropriate dashboard if wrong role
- `requireRoleFromParams(role, rawLocale)` used in page-level components

**Client component error display:**
- Error stored in action state, rendered inline in form: `{state.error && <ErrorMessage>{state.error}</ErrorMessage>}`
- Error styling: `border-[color:var(--academy-danger)]/25 bg-[color:var(--academy-danger-soft)] text-[color:var(--academy-danger)]`

## Logging

**Framework:** None — no logging library in dependencies

**Patterns:**
- Inline comments used for intentional silent catches: `// Called from Server Component — middleware refreshes session.` (see `lib/supabase/server.ts`)
- No `console.log` calls observed in source code
- Errors from Supabase propagated as user-facing messages, not logged

## Comments

**When to Comment:**
- File-level JSDoc for modules with non-obvious purpose: `lib/services/bookings.ts`, `lib/icons.ts`
- TSDoc `/** ... */` on exported functions/types with non-obvious behavior
- Inline comments for intentional no-ops or future work markers: `// Phase 2: create pending booking...`
- No commented-out code observed

**Example:**
```typescript
/**
 * Booking & credit operations — implemented in Phase 2–3.
 * Reserve/release/consume credits will live here as Supabase RPC wrappers.
 */
```

## Function Design

**Size:** Functions kept focused and short; query functions typically 20–40 lines

**Parameters:** Props typed inline as object literals for components; function params typed inline for utilities

**Return Values:**
- Async server actions return `Promise<StateType>` where `StateType = { error?: string }`
- Query functions return `Promise<ModelType | null>` or `Promise<ModelType[]>`
- Pure utilities return primitive values directly

## Module Design

**Exports:**
- Named exports used exclusively — no default exports for components or utilities
- Exception: Next.js required defaults — `page.tsx`, `layout.tsx`, `route.ts` use `export default`
- Config files use `export const` for named exports

**Barrel Files:**
- `lib/types/index.ts` is the only barrel — re-exports database row types and domain types
- `messages/types.ts` exposes `Dictionary` type derived from `de.ts` structure
- No `index.ts` barrels in `components/` — imports are direct to file

## Validation

**Zod used in server actions:**
- Schema defined at module level as `const [feature]Schema = z.object({...})`
- `.safeParse()` used, never `.parse()` — prevents thrown exceptions
- Error message from dictionary, not Zod's default: `return { error: dict.student.onboarding.errors.required };`

**Example:**
```typescript
const studentSchema = z.object({
  fullName: z.string().min(2),
  preferredModality: z.enum(["online", "in_person", "both"]),
  preferredSubjectId: z.string().uuid(),
});

const parsed = studentSchema.safeParse({ ... });
if (!parsed.success) {
  return { error: dict.student.onboarding.errors.required };
}
```

## Styling

**Approach:** Tailwind CSS v4 utility classes only — no CSS modules, no styled-components

**Utility helper:** `cn()` from `lib/utils.ts` (clsx + tailwind-merge) used for conditional class merging

**Design token usage:**
- CSS custom properties via `[color:var(--token-name)]` inline syntax for Tailwind CSS v4
- Semantic color names: `academy-navy`, `academy-slate`, `academy-line`, `academy-mist`, `brand-deep`, `brand-tint`
- Pixel-precise sizing used directly in classes: `text-[13px]`, `h-[22px]`, `rounded-[10px]`

**Variant map pattern (preferred for multi-variant components):**
```typescript
const variants: Record<ButtonVariant, string> = {
  primary: "bg-[color:var(--brand-deep)] text-white ...",
  secondary: "bg-white text-academy-navy ...",
};
// Used as: cn(variants[variant], ...)
```

---

*Convention analysis: 2026-05-28*
