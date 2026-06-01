---
phase: 03-core-transaction
plan: "03"
subsystem: availability
tags: [supabase, server-actions, availability, google-meet, file-upload]

# Dependency graph
requires:
  - phase: 03-core-transaction
    provides: 03-01 Phase 3 schema (teacher_availability_ranges, teacher_availability_blockers tables)
provides:
  - generateSlots pure function (15-min slot generation from weekly ranges minus blocked/booked)
  - getTeacherAvailabilityRanges, getTeacherAvailabilityBlockers, getAvailableSlotsForDay, getAvailableDaysForMonth queries
  - setAvailabilityRange, removeAvailabilityRange, setAvailabilityBlocker, removeAvailabilityBlocker Server Actions
  - Teacher availability management page (add/remove weekly ranges, block specific dates)
  - default_meet_link field in teacher onboarding and settings forms
  - lib/storage/avatars.ts shared upload helper (isValidAvatarFile, uploadAvatar)
affects: [03-06, 03-07, 03-08, booking-flow, teacher-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - generateSlots pure function with 15-min increment slots and booked-slot overlap filtering
    - AvailabilityForm client wrapper using useActionState for Server Action error state
    - Shared lib/storage/avatars.ts helper for all avatar uploads across actions

key-files:
  created:
    - lib/utils/slots.ts
    - lib/queries/availability.ts
    - lib/actions/availability.ts
    - lib/storage/avatars.ts
    - components/teacher/availability-form.tsx
  modified:
    - app/[locale]/teacher/availability/page.tsx
    - lib/actions/onboarding.ts
    - lib/actions/teacher.ts
    - app/[locale]/teacher/settings/page.tsx
    - components/teacher/settings-form.tsx
    - components/onboarding/teacher-onboarding-form.tsx

key-decisions:
  - "lib/storage/avatars.ts helper centralizes isValidAvatarFile + uploadAvatar for reuse across onboarding and profile edit actions"
  - "availability page uses Server Component + inline 'use server' wrappers for remove actions (no useActionState needed for remove); AddAvailabilityRangeForm is a separate Client Component"
  - "default_meet_link validated in teacher.ts as startsWith(https://) rather than full URL regex to accept Google Meet and other HTTPS links"

patterns-established:
  - "Pattern: Availability actions all follow requireRole → validate → upsert/delete → revalidatePath('/','layout') pattern"
  - "Pattern: generateSlots uses local time construction (new Date(`${dateStr}T${time}:00`)) — acceptable for v1 Zurich-only platform"

requirements-completed: [AVAIL-01, AVAIL-02, AVAIL-03]

# Metrics
duration: ~30min
completed: 2026-06-01
---

# Phase 03 Plan 03: Availability Management Summary

**Weekly availability ranges + slot generation utility (generateSlots, 15-min increments) + default_meet_link in teacher onboarding and settings, with centralized avatar upload helper**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-06-01T06:00:00Z
- **Completed:** 2026-06-01T07:00:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- `generateSlots` pure function: walks weekly ranges in 15-min steps, filters booked-slot overlaps, returns ISO datetime strings — AVAIL-03 test stub GREEN
- Full availability Server Actions (setAvailabilityRange, removeAvailabilityRange, setAvailabilityBlocker, removeAvailabilityBlocker) with Zod validation and requireRole guard
- Teacher availability page: add/remove weekly ranges, block/unblock specific dates
- `default_meet_link` field wired through teacher onboarding schema, onboarding form UI, teacher settings action, and settings form
- `lib/storage/avatars.ts` centralized helper refactors avatar upload out of individual action files

## Task Commits

Each task was committed atomically:

1. **Task 1: generateSlots utility + availability queries + Server Actions** - `89da2b7` (feat)
2. **Task 2: Teacher availability page + default_meet_link in onboarding and settings** - `64db2de` + `bd8b582` (feat)

## Files Created/Modified

- `lib/utils/slots.ts` - generateSlots pure function, LESSON_DURATION_MINUTES, SLOT_INCREMENT_MINUTES exports
- `lib/queries/availability.ts` - getTeacherAvailabilityRanges, getTeacherAvailabilityBlockers, getAvailableSlotsForDay, getAvailableDaysForMonth
- `lib/actions/availability.ts` - setAvailabilityRange, removeAvailabilityRange, setAvailabilityBlocker, removeAvailabilityBlocker Server Actions
- `lib/storage/avatars.ts` - isValidAvatarFile and uploadAvatar helpers (new — extracted from actions)
- `app/[locale]/teacher/availability/page.tsx` - Full availability manager replacing stub (Server Component + client form wrappers)
- `components/teacher/availability-form.tsx` - AddAvailabilityRangeForm and AddBlockerForm client components
- `lib/actions/onboarding.ts` - Added defaultMeetLink to teacherSchema + saves default_meet_link; refactored avatar upload to use shared helper
- `lib/actions/teacher.ts` - updateTeacherSettings saves default_meet_link; refactored to use shared avatar upload helper
- `app/[locale]/teacher/settings/page.tsx` - Fetches default_meet_link and passes to TeacherSettingsForm
- `components/teacher/settings-form.tsx` - Default Google Meet Link input field
- `components/onboarding/teacher-onboarding-form.tsx` - Google Meet Link (optional) field, last step before submit

## Decisions Made

- `lib/storage/avatars.ts` helper centralizes isValidAvatarFile + uploadAvatar for reuse across onboarding and profile edit actions, removing 10+ lines of duplicated inline upload code from each action
- Availability page uses inline `"use server"` wrapper functions for remove actions (single-arg form action) rather than useActionState — correct for fire-and-forget removes
- `default_meet_link` validated as `startsWith("https://")` in teacher.ts to accept Google Meet, Zoom, and any HTTPS link without over-constraining the field

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restored avatar_url from regression in onboarding.ts**
- **Found during:** Task 2 verification
- **Issue:** Working tree `lib/actions/onboarding.ts` was missing `avatar_url: avatarUrl` from the final `profiles.update({ onboarding_completed: true })` call — HEAD had it, working tree dropped it
- **Fix:** Restored `avatar_url: avatarUrl` to the final profiles update at line 277
- **Files modified:** lib/actions/onboarding.ts
- **Verification:** File content matches HEAD intent; tests pass
- **Committed in:** bd8b582 (Task 2 commit)

**2. [Rule 3 - Blocking] Added untracked lib/storage/avatars.ts to commit**
- **Found during:** Task 2 commit
- **Issue:** lib/storage/avatars.ts was new and untracked — both lib/actions/onboarding.ts and lib/actions/teacher.ts imported from it, making it required for the build
- **Fix:** Staged and committed the file
- **Files modified:** lib/storage/avatars.ts (new file)
- **Committed in:** bd8b582 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug/regression, 1 untracked required file)
**Impact on plan:** Both auto-fixes necessary for correctness and build integrity. No scope creep.

## Issues Encountered

- Task 2 work was partially committed in a large prior commit (64db2de) that combined multiple features; the avatar upload refactor and storage helper were not yet committed, requiring a separate Task 2 commit (bd8b582)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- AVAIL-01, AVAIL-02, AVAIL-03 requirements all satisfied
- generateSlots and availability queries ready for booking flow (plans 03-06, 03-07)
- default_meet_link persisted in teachers table, ready to auto-populate booking confirmations in 03-08

---
*Phase: 03-core-transaction*
*Completed: 2026-06-01*
