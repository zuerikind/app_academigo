# Technology Stack

**Analysis Date:** 2026-05-28

## Languages

**Primary:**
- TypeScript 5.x - All application code (`app/`, `lib/`, `components/`, `config/`, `types/`)
- SQL (PostgreSQL dialect) - Database schema and migrations (`supabase/migrations/`)

**Secondary:**
- CSS - Global design tokens and Tailwind base (`app/globals.css`)

## Runtime

**Environment:**
- Node.js v24.x (detected at analysis time; no `.nvmrc` or `.node-version` present)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.2.6 - Full-stack React framework (App Router). Uses Turbopack in dev (`next.config.ts`). Root configured via `turbopack.root`. This version has breaking changes from prior Next.js releases.
- React 19.2.4 - UI library

**Build/Dev:**
- Turbopack - Dev bundler (configured in `next.config.ts` via `turbopack.root`)
- TypeScript 5.x - Strict mode enabled, `moduleResolution: bundler`, path alias `@/*` maps to `./*`
- PostCSS with `@tailwindcss/postcss` v4 - CSS processing (`postcss.config.mjs`)
- ESLint 9 with `eslint-config-next` 16.2.6 - Linting (`eslint.config.mjs` using flat config format)

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.106.2 - Primary Supabase client (auth, database, storage)
- `@supabase/ssr` ^0.10.3 - SSR-safe Supabase client creation for Next.js server/browser/middleware contexts
- `tailwindcss` ^4 - Utility-first CSS (v4 — breaking changes from v3; imported via `@import "tailwindcss"` in CSS)
- `zod` ^4.4.3 - Schema validation (v4 — breaking changes from v3)

**UI & Motion:**
- `framer-motion` ^12.40.0 - Animation library; shared variants in `lib/motion.ts`
- `lucide-react` ^1.17.0 - Icon library; re-exported through `lib/icons.ts`
- `sonner` ^2.0.7 - Toast notifications; `<Toaster>` mounted in `app/layout.tsx`
- `clsx` ^2.1.1 - Conditional class names
- `tailwind-merge` ^3.6.0 - Tailwind class conflict resolution

## Configuration

**Environment:**
- `.env*` files excluded from git (`.gitignore`)
- Required public env vars (referenced in code):
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- No additional env vars detected in source (Stripe SDK not yet installed; `stripe_price_id` is a DB column only)

**Build:**
- `next.config.ts` - Next.js config (Turbopack root, Supabase storage image hostname allowlist)
- `tsconfig.json` - TypeScript config (strict, `ES2017` target, `bundler` resolution, `@/*` alias)
- `postcss.config.mjs` - PostCSS (Tailwind v4 plugin only)
- `eslint.config.mjs` - ESLint flat config (Next.js core-web-vitals + TypeScript rules)

## Platform Requirements

**Development:**
- Node.js >=20 (per `@types/node ^20`; actual runtime is v24)
- npm (lockfile committed)
- Supabase project (or local Supabase CLI) with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Production:**
- Vercel (implied by `eslint-config-next` web vitals rules, `.vercel` in `.gitignore`, and brand domain `academigo.xyz`)
- Supabase hosted project (PostgreSQL 15+)

---

*Stack analysis: 2026-05-28*
