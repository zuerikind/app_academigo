# Academigo — Company

> Source of truth: `config/site.ts`, `.planning/PROJECT.md`, `messages/en.ts`, `app/api/chat/route.ts`.
> Every fact below is extracted from the codebase. Unverifiable items are marked **"Information not verified."**

## Identity
- **Company / brand name:** Academigo
- **What it is:** A Swiss academic tutoring marketplace where students find school-subject teachers, browse profiles and tier levels, and book paid 1:1 sessions through the platform. (`.planning/PROJECT.md`)
- **Marketing site:** https://academigo.xyz
- **App:** https://app.academigo.xyz
- **Tagline (DE, as configured):** "Persönliche Nachhilfe mit Struktur — online und in Zürich" (`config/site.ts`)
- **Currency:** CHF

## Mission / Value
- **Core value (verbatim from PROJECT.md):** "Students can find a qualified, vetted teacher for any school subject and book a paid session in under two minutes."
- **Mission / Vision statement (formal):** Information not verified. (No dedicated mission/vision string exists in the codebase beyond the tagline and core-value line above.)

## Target audience
- Swiss students from **primary school through Gymnasium and university**. (`app/api/chat/route.ts` SYSTEM_PROMPT)
- Typical goals: **exam preparation** (e.g. Gymiprüfung, Matura), **closing learning gaps**, **long-term academic support**.

## Countries & regions served
- **Country:** Switzerland (built around the Swiss curriculum, CHF pricing, DE/EN).
- **Online teaching:** Yes — lessons can be held online.
- **In-person teaching:** Yes — in person **in Zurich**. (Only Zurich is named in the codebase for in-person.)
- **Other in-person regions:** Information not verified.

## Languages
- **Platform UI languages:** German (default) and English. (`lib/i18n/config.ts` — `locales = ["de","en"]`, `defaultLocale = "de"`)
- **Teaching languages a teacher can list:** German, English, French, Italian, Spanish. (`lib/constants/teacher.ts` — `FIXED_LANGUAGES`)

## Student age groups / academic levels
- Selectable student levels at onboarding (`messages/*.ts` → `schoolLevels`):
  1. Primary
  2. Secondary I
  3. Secondary II / Gymnasium
  4. University
  5. Other
- **Specific age ranges (in years):** Information not verified. (Levels are named, not age-bounded, in the code.)

## Contact
- **Email:** omid@academigo.xyz
- **WhatsApp:** +41 78 693 68 98 — https://wa.me/41786936898 (also used for "book a consultation")
- **Support response time:** The chatbot prompt states "reply within 1–2 business days," but this SLA is **not defined anywhere in code/config — treat as unverified marketing copy.**
