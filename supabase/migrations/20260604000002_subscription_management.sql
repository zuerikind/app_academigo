-- Store Stripe customer and subscription IDs for portal access and cancellation handling.

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
