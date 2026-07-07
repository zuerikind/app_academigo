# Academigo — Pricing

> Source of truth: `config/pricing.ts`, `messages/en.ts` (`faq`, `pricing`), `app/api/chat/route.ts`,
> `supabase/migrations/20260622000001_new_pricing_model.sql`, `supabase/migrations/20260626000001_stripe_live_price_ids.sql`.
> **Never guess or interpolate prices. Only the three packages below are configured.**

## Credit packages (one-time purchases, all CHF)
| Package | Price (CHF) | Credits | Price per lesson | Label |
|---|---|---|---|---|
| Academigo **Starter** | 89 | 1 | 89 | — |
| Academigo **Focus** | 425 | 5 | 85 | Most popular · saves CHF 20 vs. Starter |
| Academigo **Excellence** | 790 | 10 | 79 | Best value · saves CHF 100 vs. Starter |

- Values are exactly as in `config/pricing.ts`. Savings are computed against Starter (5×89−425 = 20; 10×89−790 = 100) and are the only "discount" that exists.
- Slugs `starter` / `focus` / `excellence` match the Supabase `credit_packages` rows and their Stripe live price IDs (`20260626000001`).

## What a credit is
- **1 credit = 1 lesson = 50 minutes.** (`config/pricing.ts` — `lessonDurationMinutes = 50`, `CREDIT_COST_PER_SESSION = 1`)
- A credit is **deducted when the session is completed**, not when booked. (`messages` FAQ; `complete_booking` RPC)

## Credit validity
- **Credits never expire.** (`messages` FAQ: "Credits never expire")
- **Credits pool across purchases** — buying more packages adds to one shared balance. (`messages` FAQ; `grant_credits` adds to `extra_credits`)

## Subscriptions
- **None.** All packages are one-time purchases. The subscription code path was removed; `createCheckoutSession` filters `is_subscription = false`. Do **not** claim any recurring/subscription plan exists.

## Payment methods
- **Credit/debit cards:** Visa, Mastercard, American Express.
- **TWINT.**
- Processed securely via **Stripe** (Stripe Checkout). (`messages` FAQ; `lib/actions/payments.ts`)

## Trial lessons & discount codes
- **No free trial lesson is configured.** Information not verified for any trial offer.
- **No promotional/discount codes exist** in the codebase. The only price advantage is the per-lesson savings on the Focus and Excellence packages.

## Refunds (money)
- There is **no automated money-refund flow** in the product. (`payments.status` can technically be `refunded`, but nothing in the code sets it.)
- On a **timely cancellation** the **credit** (not money) is returned — see `policies.md`.
- Money-refund requests must be handled by a human → **escalate to WhatsApp.**
