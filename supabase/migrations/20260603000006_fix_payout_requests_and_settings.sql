-- Fix 1: Align payout_requests columns with application code expectations.
-- The initial_schema.sql created the table with 'amount'/'requested_at', but
-- admin_tables.sql (CREATE TABLE IF NOT EXISTS, a no-op) expected 'amount_chf'/'created_at'.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payout_requests' AND column_name = 'amount'
  ) THEN
    ALTER TABLE payout_requests RENAME COLUMN amount TO amount_chf;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payout_requests' AND column_name = 'requested_at'
  ) THEN
    ALTER TABLE payout_requests RENAME COLUMN requested_at TO created_at;
  END IF;
END $$;

ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS note        TEXT;
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT now();
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ DEFAULT now();

-- Expand status check to include 'processed' (used by admin mark-processed action)
ALTER TABLE payout_requests DROP CONSTRAINT IF EXISTS payout_requests_status_check;
ALTER TABLE payout_requests ADD CONSTRAINT payout_requests_status_check
  CHECK (status IN ('pending', 'processed', 'approved', 'paid', 'rejected'));

-- Fix 2: Platform settings — stores configurable tier rates and promotion thresholds.

CREATE TABLE IF NOT EXISTS platform_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_all"    ON platform_settings;
DROP POLICY IF EXISTS "settings_admin_write"   ON platform_settings;

-- Anyone can read (rates shown to teachers)
CREATE POLICY "settings_select_all" ON platform_settings
  FOR SELECT USING (true);

-- Only admins can write
CREATE POLICY "settings_admin_write" ON platform_settings
  FOR INSERT WITH CHECK (auth_is_admin());

CREATE POLICY "settings_admin_update" ON platform_settings
  FOR UPDATE USING (auth_is_admin()) WITH CHECK (auth_is_admin());

INSERT INTO platform_settings (key, value) VALUES
  ('tier_junior_rate_chf',              '30'),
  ('tier_junior_sessions_to_promote',   '15'),
  ('tier_junior_rating_to_promote',     '4.0'),
  ('tier_mid_rate_chf',                 '45'),
  ('tier_mid_sessions_to_promote',      '30'),
  ('tier_mid_rating_to_promote',        '4.5'),
  ('tier_top_rate_chf',                 '60')
ON CONFLICT (key) DO NOTHING;
