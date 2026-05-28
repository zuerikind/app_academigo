# Architecture Patterns

**Domain:** Swiss tutoring marketplace — Phase 2 additions
**Researched:** 2026-05-28

---

## Existing Architecture (Baseline)

The app follows a strict server-first layering:

```
proxy.ts (edge)
  └─ lib/supabase/middleware.ts  (auth guards, locale, role enforcement)
       └─ app/[locale]/layout.tsx  (locale + i18n context)
            └─ app/[locale]/[role]/layout.tsx  (secondary auth guard via requireRoleFromParams)
                 └─ app/[locale]/[role]/*/page.tsx  (Server Components — query + render)
                      └─ lib/queries/*.ts  (read-only Supabase fetchers)
                      └─ lib/actions/*.ts  ("use server" mutations)
                           └─ lib/supabase/server.ts  (server Supabase client)
```

No client-side state, no fetch libraries. All mutations go through Server Actions. All reads happen in Server Components via query functions. The existing `proxy.ts` already bypasses `/api/*` paths — Route Handlers placed at `app/api/` are excluded from locale-redirect and session-update logic.

---

## Recommended Architecture

### Component Map

```
┌─────────────────────────────────────────────────────────────────────┐
│  EXTERNAL LAYER                                                       │
│  Stripe Checkout  ──POST──►  app/api/stripe/webhook/route.ts         │
│  Stripe API  ◄──────────────  lib/services/stripe.ts (SDK wrapper)  │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────┐
│  SERVICE LAYER  (lib/services/)                                       │
│  bookings.ts   — credit reserve/release/consume (DB transactions)   │
│  stripe.ts     — Stripe SDK wrapper (createCheckoutSession, etc.)   │
│  earnings.ts   — record earning per completed booking               │
└────────┬──────────────────┬──────────────────┬──────────────────────┘
         │                  │                  │
┌────────▼──────┐  ┌────────▼──────┐  ┌───────▼────────────────────┐
│ ACTIONS LAYER │  │ QUERY LAYER   │  │ ROUTE HANDLERS             │
│ lib/actions/  │  │ lib/queries/  │  │ app/api/stripe/webhook/    │
│ bookings.ts   │  │ bookings.ts   │  │   route.ts  (POST — Stripe) │
│ availability. │  │ availability. │  │ app/api/stripe/checkout/   │
│ admin.ts      │  │ admin.ts      │  │   route.ts  (POST — create) │
│ earnings.ts   │  │ earnings.ts   │  └───────────────────────────-┘
│ reviews.ts    │  │ reviews.ts    │
│ teacher-tier. │  │ teacher-tier. │
└────────┬──────┘  └────────┬──────┘
         │                  │
┌────────▼──────────────────▼───────────────────────────────────────┐
│  PAGE LAYER  (app/[locale]/*/page.tsx)                             │
│  student/packages         → credit purchase UI                     │
│  student/bookings         → booking list + review prompt           │
│  teacher/availability     → slot management UI                     │
│  teacher/bookings         → confirm/decline incoming requests      │
│  teacher/earnings         → earnings history + payout request      │
│  admin/dashboard          → platform stats                         │
│  admin/teachers           → approve, tier promotions               │
│  admin/bookings           → all-platform booking view              │
│  admin/payouts            → process payout requests                │
│  admin/pricing            → set per-level rates                    │
└────────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `lib/services/stripe.ts` | Stripe SDK wrapper — creates Checkout sessions, verifies webhook signatures | Called by Route Handlers only |
| `lib/services/bookings.ts` | Multi-step credit reserve/release/consume; booking state transitions | Called by Server Actions only |
| `lib/services/earnings.ts` | Record teacher earnings per completed booking | Called by bookings service on completion |
| `app/api/stripe/webhook/route.ts` | Receives Stripe events, validates signature, grants credits | Calls `lib/services/stripe.ts`, writes to Supabase via service key |
| `app/api/stripe/checkout/route.ts` | Creates Stripe Checkout session for a credit package | Calls `lib/services/stripe.ts`, authenticates via Supabase session |
| `lib/actions/bookings.ts` | Student creates booking, teacher confirms/rejects, either party cancels | Calls `lib/services/bookings.ts` |
| `lib/actions/availability.ts` | Teacher saves weekly recurring slots and blocked dates | Calls Supabase directly (simple CRUD, no multi-step logic) |
| `lib/actions/reviews.ts` | Student submits rating + comment for completed booking | Validates booking is completed + student owns it |
| `lib/actions/earnings.ts` | Teacher submits payout request | Validates `teacher_earnings` balance |
| `lib/actions/admin.ts` | Admin approves teachers, processes payouts, sets pricing, reviews tier promotions | Enforces `requireRole("admin")` at start |
| `lib/actions/teacher-tier.ts` | Teacher submits tier promotion application; admin approves/rejects | Updates `teachers.teacher_level`, writes to a `level_promotion_requests` table |
| `lib/queries/bookings.ts` | Reads booking lists for student dashboard, teacher dashboard, admin view | Server Components only |
| `lib/queries/availability.ts` | Reads teacher slots for scheduling UI and booking form | Server Components only |
| `lib/queries/admin.ts` | Platform-wide reads for admin portal (all users, all bookings, payout queue) | Admin pages only; enforces Supabase RLS `auth_is_admin()` |
| `app/[locale]/admin/layout.tsx` | Secondary auth guard for all `/admin/*` routes | Calls `requireRoleFromParams("admin", locale)` — same pattern as student/teacher layouts |

---

## Data Flow

### Stripe Credit Purchase

```
1. Student clicks "Buy Package" on /student/packages
2. Client Component calls Server Action purchaseCreditPackage(packageId)
   OR: POST to app/api/stripe/checkout/route.ts
   Recommendation: use Route Handler for Checkout creation
   — it returns a redirect URL, not form state, making Server Action pattern awkward

3. Route Handler:
   a. authenticates via createClient() (server) + auth.getUser()
   b. looks up credit_packages row by id (validates stripe_price_id exists)
   c. calls stripe.checkout.sessions.create({ line_items, mode, success_url, cancel_url })
      success_url → /[locale]/student/packages?success=1
      cancel_url  → /[locale]/student/packages
   d. returns { url: session.url } — client redirects

4. Stripe sends POST to app/api/stripe/webhook/route.ts on checkout.session.completed:
   a. reads raw body (request.text()) — MUST be raw, not parsed JSON, for signature verification
   b. reads stripe-signature header
   c. stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET) — throws on invalid
   d. on checkout.session.completed: reads metadata.student_id + metadata.package_id
   e. increments student_credits.total_credits via Supabase service role client
   f. inserts payments row with status = 'completed'
   g. returns Response(null, { status: 204 })

Note: Webhook route MUST use export const dynamic = 'force-dynamic' and must NOT parse body
as JSON before signature verification. Use request.text() to read the raw body.
```

### Booking State Machine

```
States: pending → confirmed → completed
                ↘ rejected
        pending → cancelled (by student before confirmed)
        confirmed → cancelled (by either party)

Transitions are Server Actions in lib/actions/bookings.ts:

createBooking (student):
  1. requireRole("student")
  2. validate: slot exists, teacher is_approved, student has available credits >= session cost
  3. INSERT booking (status = 'pending')
  4. UPDATE student_credits.reserved_credits += credits_reserved
  — credits are reserved, not consumed yet

confirmBooking (teacher):
  1. requireRole("teacher") + verify booking.teacher_id matches caller
  2. UPDATE booking status = 'confirmed'
  — no credit change; teacher provides meeting link (stored on booking row)

completeBooking (admin or cron or teacher):
  For v1: admin marks completed after session date passes
  1. UPDATE booking status = 'completed'
  2. UPDATE student_credits: used_credits += credits_reserved, reserved_credits -= credits_reserved
  3. INSERT teacher_earnings (amount = teacher.payout_rate)
  — atomicity: wrap steps 1-3 in Supabase RPC function (plpgsql) to avoid partial failure

cancelBooking (student or teacher):
  1. requireRole check — student or teacher owns this booking
  2. UPDATE booking status = 'cancelled'
  3. UPDATE student_credits.reserved_credits -= credits_reserved (return reservation)
  — only refund reserved, not used

rejectBooking (teacher):
  1. requireRole("teacher") + verify ownership
  2. UPDATE booking status = 'rejected'
  3. UPDATE student_credits.reserved_credits -= credits_reserved (return reservation)
```

### Teacher Availability

```
Teacher sets availability → lib/actions/availability.ts:
  1. requireRole("teacher")
  2. DELETE existing future recurring slots for this teacher (full replace pattern)
  3. INSERT new availability_slots rows
     — is_recurring = true for weekly slots
     — recurrence_rule stores day-of-week + time (e.g., "MON:09:00-10:00")
     — Materialized into concrete TIMESTAMPTZ rows for the next N weeks (e.g., 8 weeks forward)

Student books → lib/queries/availability.ts:
  1. SELECT availability_slots WHERE teacher_id = ? AND is_booked = false AND start_time > now()
  2. Filter out dates in teacher_unavailable_dates
  3. Display as calendar/slot picker in booking UI

On booking creation:
  UPDATE availability_slots SET is_booked = true WHERE id = slot_id
On booking rejection/cancellation:
  UPDATE availability_slots SET is_booked = false WHERE id = slot_id

Schema gap to address: bookings table does not have availability_slot_id FK.
Add this column in a new migration before building booking UI.
```

### Admin Portal

```
Admin pages are Server Components with full data reads. No special client
interactivity needed for v1 — approve/reject/process are form submissions.

Data flow:
Page (Server Component)
  → requireRoleFromParams("admin", locale)  [same pattern as student/teacher]
  → lib/queries/admin.ts  [reads all data — bypasses "own data" RLS via admin check]
  → renders table + action forms

Admin actions (lib/actions/admin.ts):
  → requireRole("admin") at top of every action
  → updateTeacherApproval(teacherId, approved: boolean)
  → updateTeacherLevel(teacherId, level: "1" | "2" | "3")
  → processPayoutRequest(payoutId, status: "approved" | "rejected")
  → updateSessionPrice(level: string, priceChf: number)

Admin layout: app/[locale]/admin/layout.tsx
  → calls requireRoleFromParams("admin", locale)
  → identical pattern to app/[locale]/student/layout.tsx and teacher/layout.tsx
  → proxy.ts already protects /admin/* paths (ADMIN_PREFIX defined in middleware.ts)
```

### Teacher Tier System

```
Current DB state:
  teachers.teacher_level: TEXT DEFAULT 'standard' CHECK (IN ('standard', 'verified'))
  — only 2 levels in schema; needs migration to add 3-tier system

Required migration:
  ALTER TABLE teachers
    DROP CONSTRAINT teachers_teacher_level_check,
    ADD CONSTRAINT teachers_teacher_level_check
      CHECK (teacher_level IN ('junior', 'academigo', 'verified'));

Add table: level_promotion_requests
  id, teacher_id, requested_level, status (pending/approved/rejected), created_at

Promotion data flow:
  Teacher submits request → lib/actions/teacher-tier.ts → requestLevelPromotion()
    INSERT level_promotion_requests (status = 'pending')

  Admin reviews → lib/actions/admin.ts → approveLevelPromotion(requestId) or rejectLevelPromotion
    UPDATE level_promotion_requests.status
    UPDATE teachers.teacher_level (on approval)

Badge display:
  lib/queries/teachers.ts → extend getApprovedTeachers() to include teacher_level
  components/teachers/teacher-card.tsx → render badge from level
  Directory sort: ORDER BY CASE teacher_level WHEN 'verified' THEN 0 WHEN 'academigo' THEN 1 ELSE 2 END
```

### Reviews

```
Review trigger: student visits completed booking, sees "Leave Review" CTA
  Only shown if: booking.status = 'completed' AND no existing review for booking_id

Data flow:
  lib/queries/bookings.ts → getStudentCompletedBookings() includes LEFT JOIN reviews
    → page knows which bookings have no review yet

  Student submits → lib/actions/reviews.ts → submitReview(bookingId, rating, comment)
    1. requireRole("student")
    2. Verify booking exists, status = 'completed', student_id matches caller
    3. Verify no review exists yet for booking_id (UNIQUE constraint on reviews.booking_id)
    4. INSERT reviews row
    5. revalidatePath for teacher profile page (review count updates)

Teacher profile display:
  lib/queries/teachers.ts → extend getTeacherProfileDetail() to include:
    AVG(reviews.rating) AS average_rating
    COUNT(reviews.id) AS review_count
```

### Teacher Earnings and Payouts

```
Earning creation (automatic, on booking completion):
  lib/services/earnings.ts → recordEarning(bookingId, teacherId, amount)
    INSERT teacher_earnings (status = 'pending')
    UPDATE to 'available' after a holding period (or immediately for v1 simplicity)

Teacher views earnings → lib/queries/earnings.ts → getTeacherEarnings(teacherId)
  SELECT teacher_earnings WHERE teacher_id = ? ORDER BY created_at DESC

Teacher submits payout request → lib/actions/earnings.ts → requestPayout(amount)
  1. requireRole("teacher")
  2. Validate sum of available earnings >= requested amount
  3. INSERT payout_requests (status = 'pending')
  4. UPDATE relevant teacher_earnings rows to status = 'requested'

Admin processes payout → lib/actions/admin.ts → processPayout(payoutId, outcome)
  1. requireRole("admin")
  2. UPDATE payout_requests.status = 'paid' | 'rejected'
  3. On 'paid': UPDATE teacher_earnings.status = 'paid' for linked rows
```

---

## Patterns to Follow

### Pattern 1: Admin Auth Guard (same as existing role guards)

Every admin page layout calls `requireRoleFromParams("admin", locale)`. Every admin Server Action calls `requireRole("admin")` as its first line.

```typescript
// app/[locale]/admin/layout.tsx
export default async function AdminLayout({
  children, params
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await requireRoleFromParams("admin", locale);
  return <DashboardLayout nav={getAdminNav(locale, dict)}>{children}</DashboardLayout>;
}
```

### Pattern 2: Stripe Webhook — Raw Body Before Signature Check

```typescript
// app/api/stripe/webhook/route.ts
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const rawBody = await request.text(); // NOT request.json()
  const sig = request.headers.get('stripe-signature') ?? '';
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response('Webhook signature verification failed', { status: 400 });
  }
  // handle event.type === 'checkout.session.completed'
  return new Response(null, { status: 204 });
}
```

The webhook route uses the Supabase **service role** client (not the anon key client) because it runs outside a user session. Add `lib/supabase/service.ts` for this pattern.

### Pattern 3: Multi-Step Booking as Supabase RPC

Credit reserve/release/consume involve multiple rows and must be atomic. Wrap as a PostgreSQL function called via `supabase.rpc()`:

```typescript
// lib/services/bookings.ts
export async function completeBookingTransaction(bookingId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('complete_booking', { p_booking_id: bookingId });
  if (error) throw new Error(error.message);
}
```

The SQL function updates bookings, student_credits, and inserts teacher_earnings in a single transaction. This is the same pattern already established by `student_available_credits` RPC in the existing schema.

### Pattern 4: Stripe Checkout via Route Handler (not Server Action)

Stripe Checkout returns a redirect URL. Server Actions cannot return URLs for client redirect without a workaround. Route Handler pattern is cleaner:

```typescript
// Client Component
async function handleBuyPackage(packageSlug: string) {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({ packageSlug }),
    headers: { 'Content-Type': 'application/json' },
  });
  const { url } = await res.json();
  window.location.href = url;
}
```

This is the only place in the app that requires a Client Component calling a Route Handler instead of a Server Action — justified because `window.location.href` is a client-side operation.

### Pattern 5: Admin Queries Bypass RLS via auth_is_admin()

No special client needed. The existing RLS policies already grant admin reads via `auth_is_admin()`. Admin page queries in `lib/queries/admin.ts` use the same `createClient()` (server) as other queries — the admin user's session satisfies the RLS policy.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Parsing Stripe Webhook Body as JSON Before Signature Verification

**What goes wrong:** Calling `request.json()` before `stripe.webhooks.constructEvent()` consumes the body stream and transforms it, breaking the HMAC signature check.

**Instead:** Always call `request.text()` first, store the string, then parse it manually only after the signature is verified.

### Anti-Pattern 2: Using Server Actions for Stripe Checkout Session Creation

**What goes wrong:** Server Actions return form state (`{ error?: string }`). A Checkout session returns a URL that requires a client-side redirect. Forcing this pattern leads to ugly workarounds.

**Instead:** Use a Route Handler at `app/api/stripe/checkout/route.ts`. It is the one justified exception to the "no Route Handlers for user-triggered operations" rule, because it returns data (a URL) rather than a form state.

### Anti-Pattern 3: Booking State Transitions as Direct Supabase Queries in Actions

**What goes wrong:** Credit reserve/consume involves 2-3 table writes. If they are done as separate `.update()` calls in an action, a failure mid-way leaves credits in an inconsistent state.

**Instead:** Implement state transitions as Supabase RPC functions (plpgsql) so all writes happen atomically.

### Anti-Pattern 4: Admin Route Without Layout-Level Auth Guard

**What goes wrong:** Middleware guards `/admin/*` but the layout-level guard (`requireRoleFromParams`) is the established secondary defense. Skipping it leaves a gap if middleware logic changes.

**Instead:** Add `app/[locale]/admin/layout.tsx` that calls `requireRoleFromParams("admin", locale)` — mirrors the existing student and teacher layouts exactly.

### Anti-Pattern 5: Exposing Service Role Key to Client

**What goes wrong:** The Supabase service role key bypasses all RLS. If used in a client-side context it exposes full DB access.

**Instead:** Only use `createServiceClient()` (from `lib/supabase/service.ts`) inside Route Handlers and server-only code. Never import it in components or client-side files.

---

## Suggested Build Order

Dependencies flow from bottom to top. Each step unblocks the next.

### Step 1 — Schema + DB Migrations (unblocks everything)

- Migrate `teachers.teacher_level` from 2-value to 3-value constraint (`junior`, `academigo`, `verified`)
- Add `availability_slot_id` FK column to `bookings`
- Add `level_promotion_requests` table
- Add `complete_booking` RPC function (atomic: booking update + credit consume + earnings insert)
- Add `cancel_booking` RPC function (atomic: booking update + credit release)
- Update `types/database.ts` to match

**Why first:** Every other component depends on correct types and DB functions.

### Step 2 — Auth Completion (unblocks admin onboarding)

- Email verification flow
- Password reset flow
- Fix role-from-form-data security (prevent admin via signup)

**Why second:** Admin user creation requires email verification to work. Needs to land before admin portal.

### Step 3 — Admin Portal + Teacher Management (unblocks teacher approval gate)

- `app/[locale]/admin/layout.tsx` (auth guard)
- `app/[locale]/admin/dashboard/page.tsx`
- `app/[locale]/admin/teachers/page.tsx` (approve, reject, view all)
- `lib/queries/admin.ts`
- `lib/actions/admin.ts` (approval mutations)

**Why third:** Teachers approved here become visible in the directory, unblocking all student-facing flows.

### Step 4 — Teacher Tier System (depends on admin portal)

- `lib/actions/teacher-tier.ts` (teacher submits promotion request)
- Admin portal page: `/admin/teachers/[id]/promote` (review + approve/reject)
- Update teacher card and profile to show tier badge
- Update teacher directory sort by tier level

**Why after admin portal:** Promotion requests are approved by admin. Admin portal must exist first.

### Step 5 — Teacher Availability (unblocks booking)

- `app/[locale]/teacher/availability/page.tsx` (actual UI, currently placeholder)
- `lib/actions/availability.ts` (save weekly slots)
- `lib/queries/availability.ts` (read available slots for booking form)

**Why before booking:** Student booking form depends on slot data.

### Step 6 — Stripe + Credits (unblocks booking, independent of availability)

- Install Stripe SDK (`stripe` npm package)
- `lib/supabase/service.ts` (service role client)
- `lib/services/stripe.ts` (SDK wrapper)
- `app/api/stripe/checkout/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/[locale]/student/packages/page.tsx` (actual buy UI)
- `config/pricing.ts` — wire `stripe_price_id` values from environment

**Why before booking confirmation:** Credits must be purchasable before students can reserve them for bookings.

### Step 7 — Booking Flow (depends on availability + credits)

- `lib/services/bookings.ts` (implement the stub — use RPC for atomic transitions)
- `lib/actions/bookings.ts` (createBooking, confirmBooking, rejectBooking, cancelBooking)
- `lib/queries/bookings.ts` (student list, teacher list, admin list)
- `app/[locale]/student/bookings/page.tsx` (student booking list with cancel)
- `app/[locale]/student/teachers/[id]/page.tsx` — add slot picker + book button
- `app/[locale]/teacher/bookings/page.tsx` (confirm/decline, provide meeting link)
- `app/[locale]/admin/bookings/page.tsx`

**Why after availability + credits:** Booking requires slot selection and credit reservation.

### Step 8 — Reviews (depends on bookings reaching "completed" state)

- `lib/actions/reviews.ts`
- `lib/queries/reviews.ts`
- Review prompt on completed booking in student dashboard
- Review display on teacher profile

**Why last in student flow:** Cannot exist without completed bookings.

### Step 9 — Earnings + Payouts (depends on bookings completing)

- `lib/services/earnings.ts` (triggered by completeBooking RPC or admin action)
- `lib/actions/earnings.ts` (teacher submits payout request)
- `lib/queries/earnings.ts`
- `app/[locale]/teacher/earnings/page.tsx`
- `app/[locale]/admin/payouts/page.tsx`

**Why last:** Earnings only exist after completed bookings.

---

## Where New Code Lives in the Existing Layer Structure

| New Component | Layer | Location |
|---------------|-------|----------|
| Stripe SDK wrapper | Service | `lib/services/stripe.ts` |
| Booking state machine | Service | `lib/services/bookings.ts` (implement existing stub) |
| Earnings recording | Service | `lib/services/earnings.ts` |
| Supabase service role client | Supabase | `lib/supabase/service.ts` |
| Stripe Checkout creation | Route Handler | `app/api/stripe/checkout/route.ts` |
| Stripe webhook receiver | Route Handler | `app/api/stripe/webhook/route.ts` |
| Booking mutations | Actions | `lib/actions/bookings.ts` |
| Availability mutations | Actions | `lib/actions/availability.ts` |
| Review mutations | Actions | `lib/actions/reviews.ts` |
| Payout request | Actions | `lib/actions/earnings.ts` |
| Admin mutations | Actions | `lib/actions/admin.ts` |
| Teacher tier mutations | Actions | `lib/actions/teacher-tier.ts` |
| Booking reads | Queries | `lib/queries/bookings.ts` |
| Availability reads | Queries | `lib/queries/availability.ts` |
| Admin reads | Queries | `lib/queries/admin.ts` |
| Earnings reads | Queries | `lib/queries/earnings.ts` |
| Admin layout guard | Route/Page | `app/[locale]/admin/layout.tsx` |
| All admin pages | Route/Page | `app/[locale]/admin/*/page.tsx` |
| Teacher earnings page | Route/Page | `app/[locale]/teacher/earnings/page.tsx` |
| Slot picker component | Component | `components/booking/slot-picker.tsx` |
| Booking card component | Component | `components/booking/booking-card.tsx` |
| Review form component | Component | `components/reviews/review-form.tsx` |
| Tier badge component | Component | `components/teachers/tier-badge.tsx` |
| Level promotion config | Config | `config/teacher-levels.ts` |
| 3-tier system migration | Migration | `supabase/migrations/YYYYMMDD_teacher_levels.sql` |
| Atomic booking RPCs | Migration | `supabase/migrations/YYYYMMDD_booking_rpcs.sql` |

---

## Scalability Notes

The architecture has no scalability concerns at v1 scale (hundreds of concurrent users). All operations are single-database, single-tenant Supabase. The only external scaling concern is Stripe webhook delivery — if the webhook handler is slow, Stripe will retry. Keep the handler fast: do minimal DB writes and return 204 immediately. Avoid doing expensive computation inside the webhook route.

---

## Sources

- Next.js 16 Route Handlers docs: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` (HIGH confidence — bundled with installed version)
- Next.js 16 BFF / webhook pattern: `node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md` (HIGH confidence)
- Next.js 16 Server Actions / mutating data: `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` (HIGH confidence)
- Existing codebase: `lib/supabase/middleware.ts`, `proxy.ts`, `lib/auth/session.ts`, `types/database.ts`, `supabase/migrations/*.sql` (HIGH confidence — source of truth)
- Stripe raw body requirement for webhook signature: established pattern, verified against Next.js route handler body consumption behavior from official docs (MEDIUM confidence — confirmed by docs behavior, not direct Stripe source)
