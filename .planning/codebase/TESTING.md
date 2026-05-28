# Testing Patterns

**Analysis Date:** 2026-05-28

## Test Framework

**Runner:** None configured

No test runner, assertion library, or test configuration file is present in the project. The `package.json` `scripts` block contains only `dev`, `build`, `start`, and `lint` — no `test` script exists.

**Config files:** Not present (`jest.config.*`, `vitest.config.*`, `playwright.config.*` are all absent)

**Test dependencies:** None in `dependencies` or `devDependencies` in `package.json`

## Test File Organization

**Location:** No test files exist in the codebase.

A search across all `.ts` and `.tsx` files under `app/`, `components/`, `lib/`, `config/`, `types/`, and `messages/` finds zero files matching `*.test.*` or `*.spec.*`.

## Test Structure

Not applicable — no tests exist.

## Mocking

Not applicable — no mocking infrastructure present.

## Fixtures and Factories

Not applicable — no test fixtures or factory functions present.

## Coverage

**Requirements:** None enforced — no coverage tooling configured.

## Test Types

**Unit Tests:** Not present.

**Integration Tests:** Not present.

**E2E Tests:** Not present. No Playwright, Cypress, or similar tooling installed.

## What Should Be Tested (Priority Guide for First Test Phase)

Given the application structure, the highest-value areas to cover first are:

**Server Actions (`lib/actions/`):**
- `lib/actions/auth.ts` — `signUp`, `signIn`, `signOut`: validation logic, role routing, redirect targets
- `lib/actions/onboarding.ts` — `completeStudentOnboarding`, `completeTeacherOnboarding`: Zod schema validation paths (success, missing fields, wrong role)

**Pure Utility Functions (`lib/utils.ts`, `lib/i18n/`):**
- `lib/utils.ts` — `cn()`, `formatChf()`: no side effects, easily unit tested
- `lib/i18n/path.ts` — `localizedPath()`, `stripLocale()`: pure string transforms
- `lib/i18n/config.ts` — `isLocale()`: pure predicate

**Query Mappers (`lib/queries/`):**
- `lib/queries/teachers.ts` — `mapTeacher()` is a pure mapping function; consider exporting for unit testing
- `lib/queries/student.ts`, `lib/queries/subjects.ts` — map/transform functions

**Middleware (`lib/supabase/middleware.ts`):**
- `updateSession()` redirect logic: unauthenticated access to protected routes, role mismatch, onboarding incomplete — high complexity, high value to test

**Session Utilities (`lib/auth/session.ts`):**
- `requireProfile()`, `requireRole()` — redirect behavior under missing session or wrong role

## Recommended Test Setup

When adding tests, the following setup is recommended based on the stack (Next.js, React 19, TypeScript, Zod, Supabase):

```bash
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event
npm install --save-dev @types/node
```

**Suggested config file:** `vitest.config.ts` at project root

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

**Suggested `package.json` scripts to add:**
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Test file placement convention (recommended):**
- Co-locate with source: `lib/utils.test.ts` alongside `lib/utils.ts`
- Or use a top-level `__tests__/` directory mirroring the `lib/` structure

## Supabase Mocking Pattern (for future tests)

Server actions and queries call `createClient()` from `lib/supabase/server.ts`. Mock this module in tests:

```typescript
import { vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
    }),
  }),
}));
```

Next.js server-only modules (`next/navigation`, `next/cache`, `next/headers`) also need mocking in unit test environments:

```typescript
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}));
```

---

*Testing analysis: 2026-05-28*
