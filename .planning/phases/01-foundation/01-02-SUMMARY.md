---
phase: 01-foundation
plan: "02"
subsystem: testing
tags: [jest, jest-dom, testing-library, ts-jest, next-jest, auth-testing]

# Dependency graph
requires: []
provides:
  - Jest 29 test infrastructure with next/jest transformer
  - Failing RED test stubs for auth server actions (signUp, requestPasswordReset, updatePassword)
  - Failing RED test stubs for auth callback route (GET handler)
  - TypeScript stubs for requestPasswordReset and updatePassword (satisfy tsc, RED behavior tests)
affects: [01-03-PLAN, 01-04-PLAN]

# Tech tracking
tech-stack:
  added:
    - jest@^29.7.0
    - @types/jest@^30
    - jest-environment-jsdom
    - @testing-library/react@^16
    - @testing-library/jest-dom@^6
    - ts-jest@^29
  patterns:
    - "mocks object pattern: declare mocks in shared object before jest.mock() factories to avoid temporal dead zone"
    - "jest.mock factory indirection: use wrapper arrow functions to reference mocks object properties"
    - "TDD RED stubs: test files created before implementations to drive Plan 03/04"

key-files:
  created:
    - jest.config.ts
    - jest.setup.ts
    - __tests__/lib/actions/auth.test.ts
    - __tests__/routes/auth-callback.test.ts
  modified:
    - package.json
    - lib/actions/auth.ts

key-decisions:
  - "Use mocks object pattern (not top-level const mocks) to avoid jest hoisting temporal dead zone issues"
  - "Add TypeScript stubs for requestPasswordReset/updatePassword in auth.ts so tsc passes; behavioral RED failures remain for Plan 03/04"
  - "auth-callback tests pass GREEN (3/3); auth.ts action tests remain RED (6 failing) as planned"

patterns-established:
  - "mocks object pattern: const mocks = { fn: jest.fn() } declared before jest.mock() factories"
  - "Stub exports in auth.ts return error state to satisfy TypeScript without implementing real behavior"

requirements-completed:
  - AUTH-01
  - AUTH-02

# Metrics
duration: 18min
completed: 2026-05-29
---

# Phase 01 Plan 02: Test Infrastructure and Auth RED Stubs Summary

**Jest 29 configured with next/jest transformer; 11 test cases written as RED stubs driving auth action implementations in Plans 03 and 04**

## Performance

- **Duration:** 18 min
- **Started:** 2026-05-29T22:27:31Z
- **Completed:** 2026-05-29T22:45:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Jest 29 installed and configured with next/jest transformer, setupFilesAfterEnv, and @/path alias
- 11 test cases created across 2 test files covering signUp, requestPasswordReset, updatePassword, and auth callback GET
- auth-callback tests pass (3/3 GREEN); auth action tests are RED as intended (6 failing for unimplemented behaviors)
- TypeScript compiles with 0 errors after adding stubs

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Jest and configure test infrastructure** - `e19d8a3` (chore) - [prior commit from plan setup work]
2. **Task 2: Write failing test stubs for auth actions and callback route** - `ef1ce38` (test)
3. **Deviation fix: TypeScript stubs** - `e7e4704` (fix)

**Plan metadata:** (created below)

## Files Created/Modified
- `jest.config.ts` - Jest 29 config with next/jest transformer, node testEnvironment, setupFilesAfterEnv, @/ moduleNameMapper
- `jest.setup.ts` - Shared jest-dom matchers setup via `import "@testing-library/jest-dom"`
- `package.json` - Added "test" and "test:coverage" scripts
- `__tests__/lib/actions/auth.test.ts` - Unit test stubs for signUp, requestPasswordReset, updatePassword
- `__tests__/routes/auth-callback.test.ts` - Unit test stubs for auth callback GET handler
- `lib/actions/auth.ts` - Added stub exports for requestPasswordReset and updatePassword (TypeScript compliance)

## Decisions Made
- Used `const mocks = { ... }` object pattern instead of top-level `const mockFn = jest.fn()` declarations to avoid Jest hoisting temporal dead zone errors
- Added TypeScript stub implementations (return `{ error: "Not implemented" }`) so `npx tsc --noEmit` passes while keeping behavioral RED failures
- auth-callback.test.ts fixed to use same mocks-object pattern; 3 callback tests now pass GREEN

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed temporal dead zone in auth-callback.test.ts**
- **Found during:** Task 2 (Write failing test stubs)
- **Issue:** `const mockExchangeCodeForSession = jest.fn()` was declared after `jest.mock()` factory that referenced it. Jest hoists `jest.mock()` calls above variable declarations, causing `ReferenceError: Cannot access 'mockExchangeCodeForSession' before initialization`
- **Fix:** Replaced top-level `const` with `const mocks = { exchangeCodeForSession: jest.fn() }` object pattern (same as auth.test.ts), wrapped factory reference in arrow function `(...args) => mocks.exchangeCodeForSession(...args)`
- **Files modified:** `__tests__/routes/auth-callback.test.ts`
- **Verification:** auth-callback tests now pass 3/3
- **Committed in:** `ef1ce38`

**2. [Rule 1 - Bug] Added TypeScript stubs to satisfy tsc**
- **Found during:** Overall verification (`npx tsc --noEmit`)
- **Issue:** Test file imports `requestPasswordReset` and `updatePassword` from `@/lib/actions/auth` — neither existed yet, causing 2 TypeScript errors
- **Fix:** Added minimal stub exports to `lib/actions/auth.ts` that return `{ error: "Not implemented" }` — satisfies TypeScript without implementing real behavior; behavioral RED failures remain
- **Files modified:** `lib/actions/auth.ts`
- **Verification:** `npx tsc --noEmit` passes with 0 errors; behavioral tests still fail RED
- **Committed in:** `e7e4704`

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes required for correct operation. No scope creep — stub pattern preserves RED state for Plans 03/04.

## Issues Encountered
- Plan stated `npx jest --passWithNoTests` should "exit 0" alongside "tests for requestPasswordReset/updatePassword fail RED". These are contradictory since `--passWithNoTests` only suppresses exit 1 when there are no test files, not when tests fail. Resolved by treating the plan intent as "no configuration errors" rather than "exit 0 with failing tests". The 6 RED failures are expected and correct.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Jest infrastructure ready for Plans 03 and 04 to implement functions and make RED tests GREEN
- Plan 03 must implement: `requestPasswordReset` (with resetPasswordForEmail + redirectTo), modify `signUp` (add emailRedirectTo, redirect to /verify-email)
- Plan 04 must implement: `updatePassword` (with length validation, updateUser call, /login redirect)
- Both plans can use `npx jest` as their automated verify command

---
*Phase: 01-foundation*
*Completed: 2026-05-29*
