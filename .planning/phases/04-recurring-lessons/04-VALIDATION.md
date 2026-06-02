---
phase: 4
slug: recurring-lessons
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-02
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts (exists from Phase 3) |
| **Quick run command** | `npx jest --testPathPattern="04-" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="04-" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-migration | 01 | 0 | CRED-01..04, SCHED-01..03, LES-01..03 | migration | `npx supabase db reset --local` | ❌ W0 | ⬜ pending |
| 04-02-wallet | 02 | 1 | CRED-01, CRED-02, CRED-03, CRED-04 | unit | `npx jest --testPathPattern="wallet"` | ❌ W0 | ⬜ pending |
| 04-02-schedule | 02 | 1 | SCHED-01..03 | unit | `npx jest --testPathPattern="schedule"` | ❌ W0 | ⬜ pending |
| 04-02-lesson-gen | 02 | 1 | LES-01, LES-02 | unit | `npx jest --testPathPattern="lesson-gen"` | ❌ W0 | ⬜ pending |
| 04-03-reschedule | 03 | 2 | RESC-01..03 | unit | `npx jest --testPathPattern="reschedule"` | ❌ W0 | ⬜ pending |
| 04-04-teacher-dash | 04 | 3 | TDASH-01..04 | manual | browser | N/A | ⬜ pending |
| 04-05-student-dash | 05 | 3 | SDASH-01..04 | manual | browser | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/lib/actions/wallet.test.ts` — stubs for CRED-01..04 (balance query, transaction log, deduct-on-complete, no-deduct-on-cancel)
- [ ] `__tests__/lib/utils/schedule.test.ts` — stubs for lesson generation (ISO weekday conversion, idempotency check, 6-week window)
- [ ] `__tests__/lib/actions/reschedule.test.ts` — stubs for RESC-01..03 (request, approve cancel+create, reject reverts)

*Existing jest infrastructure from Phase 3 covers the framework install.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Teacher dashboard shows active student list with credit balances | TDASH-01 | Requires live Supabase rows and rendered UI | Log in as teacher → navigate to `/teacher/lessons` → verify student rows show names + credit counts |
| Student wallet shows credit history entries | SDASH-02 | Requires Stripe webhook + lesson completion to produce history rows | Complete a lesson → navigate to `/student/wallet` → verify transaction appears |
| Lesson auto-generation creates correct dates across DST boundary | LES-01 | DST edge case is non-trivial to test in unit scope | Manually verify lessons near DST transitions (late March / late October) |
| Reschedule end-to-end: request → approve → new lesson visible | RESC-01..03 | Multi-role browser flow | Student requests reschedule → teacher approves → both see updated lesson |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
