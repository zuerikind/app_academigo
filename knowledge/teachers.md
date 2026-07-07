# Academigo — Teachers

> Source of truth: `lib/actions/onboarding.ts`, `components/onboarding/teacher-onboarding-form.tsx`,
> `app/[locale]/teacher/faq/page.tsx`, `config/earnings.ts`, `supabase/migrations/20260603000006_*` (`platform_settings`),
> `lib/actions/admin.ts` (`approvePromotion`).

## Becoming a teacher — application & onboarding
Flow (verified in `signUp` + `completeTeacherOnboarding`):
1. Sign up choosing the **Teacher** role → verify email.
2. Complete the teacher profile:
   - Full name, **bio** (min 20 chars), **education**, **experience**, **teaching style**.
   - **Subjects** (at least 1), **languages** (German/English/French/Italian/Spanish + free-text "other").
   - **Modality:** offers online and/or in person (with location if in person).
   - **Profile photo** (optional, image ≤ 5 MB).
   - **CV upload** (optional): PDF, DOC, or DOCX, **max 5 MB**, stored in a private bucket.
   - **Motivation letter** (required, **min 100 characters**).
   - **Payout details** (name, IBAN, address, TWINT) and an optional default video-meeting link.
3. Submit → the profile enters **admin review** (`is_approved = false`).
4. Admin verifies and approves → teacher goes live, sets **weekly availability**, and starts receiving bookings.
   An email notifies the teacher on approval.

## Verification
- Every teacher is **reviewed and approved by the Academigo team before going live.** (SYSTEM_PROMPT; `approveTeacher`)
- Admin sees the full profile plus the **motivation letter and a signed CV download link** on the teacher detail page.

## Availability system
- Teachers set a **weekly recurring schedule** (day-of-week time ranges) via the weekly schedule editor, plus **date/time blockers** for exceptions. (`saveWeeklySchedule`, `teacher_availability_ranges`, `teacher_availability_blockers`)
- Students book open **50-minute** slots; the teacher **confirms** each booking.

## Levels & pay — ⚠️ VALUES CONFLICT IN THE CODEBASE
The user-facing **Teacher FAQ page** and the chatbot prompt state:

| Level | Rate | Requirements | Badge |
|---|---|---|---|
| Junior Teacher | CHF 30 / lesson | Entry level — all newly approved teachers start here | — |
| Academigo Teacher | CHF 45 / lesson | ≥ 10 completed lessons · rating ≥ 4.0 ★ · admin approval | "Academigo Certified" |
| Verified Teacher | CHF 50–60 / lesson | ≥ 30 completed lessons · rating ≥ 4.5 ★ · admin approval | "Verified Teacher" + priority listing |

**These numbers are NOT internally consistent — flag, do not present as settled fact:**
- The backend `platform_settings` (which actually drives the teacher dashboard and `approvePromotion`) has **Academigo Teacher promotion at 15 completed lessons** (not 10), and a **Verified rate of exactly CHF 60** (not "50–60").
- `config/earnings.ts` (a fallback) has yet different rates: Junior 30, Academigo Teacher **40**, Verified **50**.
- Rates are described as "per completed lesson" in `config/earnings.ts` but written as "/ h" on the FAQ page (a lesson is 50 min).

**Bot guidance:** For general orientation, quote Junior CHF 30 / Academigo Teacher CHF 45 / Verified up to CHF 60 and note requirements grow with completed lessons and rating — but for any precise promotion threshold or exact rate, **escalate to WhatsApp / omid@academigo.xyz** rather than commit to a number.

## Promotion process
- Progress is tracked on the teacher dashboard ("Your teacher level").
- When requirements are met, the teacher **emails omid@academigo.xyz with subject "Level promotion."**
- The team reviews the profile and ratings and responds **within a few business days.** (Exact SLA not code-defined.)

## Payouts
- Earnings are credited **after the teacher marks a session complete** (a `teacher_earnings` row at the teacher's rate).
- The teacher **requests a payout**; an admin marks it processed and an email is sent.
- Paid out via **IBAN or TWINT**. The "3–5 business days" figure appears only in the chatbot prompt and is **not code-defined — treat as unverified.**
- Only one pending payout request is allowed at a time; a request sweeps all currently-available earnings.

## Teacher recruiting note
- The prompt says Academigo is "looking for teachers in STEM, languages, humanities, and creative subjects (min. 2–4 h/week availability)." The **2–4 h/week minimum is prompt copy, not enforced in code — unverified.**
