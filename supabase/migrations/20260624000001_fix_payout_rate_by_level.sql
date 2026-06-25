-- Fix payout_rate to match teacher_level for all existing rows.
-- Rates: junior=30, academigo_teacher=40, verified=50 (mirrors config/earnings.ts)

UPDATE teachers SET payout_rate = CASE teacher_level
  WHEN 'junior'            THEN 30
  WHEN 'academigo_teacher' THEN 40
  WHEN 'verified'          THEN 50
  ELSE payout_rate
END;

-- New teachers are junior by default, so default should be 30
ALTER TABLE teachers ALTER COLUMN payout_rate SET DEFAULT 30;
