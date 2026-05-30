---
phase: 02
slug: admin-portal
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-30
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 + ts-jest |
| **Config file** | `jest.config.ts` (exists) |
| **Quick run command** | `npx jest --passWithNoTests` |
| **Full suite command** | `npx jest --passWithNoTests` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --passWithNoTests`
- **After every plan wave:** Run `npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green + human browser checkpoint
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-W0-01 | W0 | 0 | ADMIN-03,ADMIN-04,ADMIN-08 | unit | `npx jest __tests__/lib/actions/admin.test.ts --passWithNoTests` | ❌ W0 | ⬜ pending |
| 02-W0-02 | W0 | 0 | ADMIN-02,ADMIN-05,ADMIN-06,ADMIN-07 | unit | `npx jest __tests__/lib/queries/admin.test.ts --passWithNoTests` | ❌ W0 | ⬜ pending |
| 02-W0-03 | W0 | 0 | Table UI | unit | `npx jest __tests__/components/ui/table.test.tsx --passWithNoTests` | ❌ W0 | ⬜ pending |
| 02-xx-01 | infra | 1 | ADMIN-01 | human | Manual browser login as admin | N/A | ⬜ pending |
| 02-xx-02 | infra | 1 | ADMIN-02 | unit | `npx jest __tests__/lib/queries/admin.test.ts -t "getAdminTeachers"` | ❌ W0 | ⬜ pending |
| 02-xx-03 | infra | 1 | ADMIN-03 | unit | `npx jest __tests__/lib/actions/admin.test.ts -t "approveTeacher"` | ❌ W0 | ⬜ pending |
| 02-xx-04 | infra | 1 | ADMIN-04 | unit | `npx jest __tests__/lib/actions/admin.test.ts -t "approvePromotion"` | ❌ W0 | ⬜ pending |
| 02-xx-05 | infra | 1 | ADMIN-05 | unit | `npx jest __tests__/lib/queries/admin.test.ts -t "getAdminStudents"` | ❌ W0 | ⬜ pending |
| 02-xx-06 | infra | 1 | ADMIN-06 | unit | `npx jest __tests__/lib/queries/admin.test.ts -t "getAdminBookings"` | ❌ W0 | ⬜ pending |
| 02-xx-07 | infra | 1 | ADMIN-07 | unit | `npx jest __tests__/lib/queries/admin.test.ts -t "getAdminPayouts"` | ❌ W0 | ⬜ pending |
| 02-xx-08 | infra | 1 | ADMIN-08 | unit | `npx jest __tests__/lib/actions/admin.test.ts -t "markPayoutProcessed"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/lib/actions/admin.test.ts` — RED stubs for approveTeacher, approvePromotion, rejectPromotion, markPayoutProcessed
- [ ] `__tests__/lib/queries/admin.test.ts` — RED stubs for getAdminTeachers, getAdminStudents, getAdminBookings, getAdminPayouts
- [ ] `__tests__/components/ui/table.test.tsx` — RED stub for Table component render

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin login → /admin/dashboard redirect | ADMIN-01 | Middleware routing requires live browser + Supabase session | Sign in as admin; confirm redirect to /admin/dashboard and page renders (not 404) |
| All admin pages render without error | UI render | Full page render requires live Supabase + server environment | Browser tour: dashboard, teachers, students, bookings, promotions, payouts |

---

## Mocking Pattern

Follow existing `__tests__/lib/actions/auth.test.ts` pattern — mocks object (not top-level const) to avoid Jest hoisting TDZ:

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

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
