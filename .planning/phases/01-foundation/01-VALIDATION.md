---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-28
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts — Wave 0 installs |
| **Quick run command** | `npx jest --passWithNoTests` |
| **Full suite command** | `npx jest --passWithNoTests --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --passWithNoTests`
- **After every plan wave:** Run `npx jest --passWithNoTests --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | AUTH-01 | unit | `npx jest lib/actions/auth` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | AUTH-01 | manual | Supabase dashboard verify | N/A | ⬜ pending |
| 1-01-03 | 01 | 1 | AUTH-01 | unit | `npx jest lib/actions/auth` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | AUTH-02 | unit | `npx jest lib/actions/auth` | ❌ W0 | ⬜ pending |
| 1-01-05 | 01 | 1 | AUTH-03 | unit | `npx jest lib/actions/auth` | ❌ W0 | ⬜ pending |
| 1-01-06 | 01 | 1 | AUTH-04 | unit | `npx jest lib/actions/auth` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 0 | TIER-01 | manual | supabase db push | N/A | ⬜ pending |
| 1-02-02 | 02 | 1 | TIER-01 | manual | psql query teacher_level constraint | N/A | ⬜ pending |
| 1-03-01 | 03 | 1 | AUTH-01 | manual | DB RPC call test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/lib/actions/auth.test.ts` — stubs for AUTH-01, AUTH-02, AUTH-03, AUTH-04
- [ ] `jest.config.ts` — Next.js jest configuration
- [ ] `jest.setup.ts` — shared test setup
- [ ] `npm install --save-dev jest @types/jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest` — install jest framework

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Email verification flow end-to-end | AUTH-01 | Requires live Supabase SMTP + real email client | Sign up, check inbox, click link, verify redirect |
| Password reset email delivery | AUTH-02 | Requires live Supabase SMTP + real email client | Request reset, check inbox, click link, set new password |
| teacher_level migration correctness | TIER-01 | Requires live Supabase DB | Query: `SELECT teacher_level, count(*) FROM teachers GROUP BY 1` — expect no `standard` |
| Atomic booking RPC under concurrency | AUTH-03 | Requires live DB + concurrent clients | Two simultaneous `create_booking` calls for the same teacher credit slot |
| handle_new_user admin role rejection | AUTH-04 | Requires live Supabase Auth trigger | Attempt signup with `role=admin` in metadata, verify blocked |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
