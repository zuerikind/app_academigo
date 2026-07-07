# Academigo — Subjects

> Source of truth: `config/subjects.ts` (`SUBJECT_SLUGS`), `messages/en.ts` (`subjectNames`), `supabase/seed.sql`.
> **22 subjects** are defined in the catalog. **Never guess whether a specific subject is bookable today** — live
> availability depends on whether an approved teacher exists, which is runtime data shown on the teachers page.

## Full subject catalog (22)
| # | Subject (EN) | Slug |
|---|---|---|
| 1 | Mathematics | `mathematics` |
| 2 | Applied Mathematics | `applied-mathematics` |
| 3 | Physics | `physics` |
| 4 | Chemistry | `chemistry` |
| 5 | Biology | `biology` |
| 6 | Computer Science | `computer-science` |
| 7 | German | `german` |
| 8 | French | `french` |
| 9 | Italian | `italian` |
| 10 | English | `english` |
| 11 | Spanish | `spanish` |
| 12 | Latin | `latin` |
| 13 | Greek | `greek` |
| 14 | History | `history` |
| 15 | Geography | `geography` |
| 16 | Economics & Law | `economics` |
| 17 | Philosophy | `philosophy` |
| 18 | Pedagogy & Psychology | `pedagogy-psychology` |
| 19 | Religious Studies | `religious-studies` |
| 20 | Visual Arts | `visual-arts` |
| 21 | Music | `music` |
| 22 | Sports | `sports` |

Display names are from `messages/en.ts → subjectNames`. (German names live in `messages/de.ts`.)

## Subject "families" (as used in teacher-recruiting copy, `messages/en.ts`)
- **STEM:** Mathematics, Physics, Chemistry, Biology, Computer Science.
- **Languages:** German, French, English, Italian, Spanish, Latin, Greek.
- **Humanities / society:** Geography, History, Economics & Law, Religious Studies.
- **Other:** Philosophy, Pedagogy & Psychology, Visual Arts, Music, Sports.

## Availability (which subjects are bookable now)
- The seed (`supabase/seed.sql`) defaults **Mathematics, Physics, Chemistry** to active and the other 19 to `is_coming_soon = true`. **This is only the seed default, not live production truth** (test data was cleared before go-live).
- Actual bookability = "does an approved, active teacher teach this subject." The **teachers page shows a green badge** for bookable subjects and "coming soon" otherwise.
- **Rule for the bot:** never assert a subject is or isn't available. Say the catalog covers it and direct the user to the teachers page (or escalate) for live availability.

## Per-subject descriptions, educational levels, exam-prep flags
- The database `subjects` table stores `name`, `slug`, `is_active`, `is_coming_soon` **only** — there are **no per-subject descriptions, level tags, or exam-prep flags** in the codebase.
- Exam preparation is offered **generally** (Gymiprüfung, Matura are named as goals), not as a per-subject configured feature. Any per-subject description/level/exam claim: **Information not verified.**
