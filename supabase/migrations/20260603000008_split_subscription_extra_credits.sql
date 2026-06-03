-- Split student_credits into explicit subscription_credits and extra_credits columns.
-- This lets the UI display the two pools separately and fixes the renewal logic
-- (previously grant_subscription_credits wiped extra credits and reset used_credits to 0).

ALTER TABLE student_credits
  ADD COLUMN IF NOT EXISTS subscription_credits INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_credits INTEGER NOT NULL DEFAULT 0;

-- Migrate existing rows: treat all existing total_credits as extra (one-off) credits
-- since we have no historical data to distinguish them.
UPDATE student_credits
SET extra_credits = total_credits
WHERE extra_credits = 0 AND subscription_credits = 0;

-- grant_credits: adds to the extra (one-off purchase) pool only
CREATE OR REPLACE FUNCTION grant_credits(p_student_id UUID, p_credits INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE student_credits
  SET extra_credits  = extra_credits + p_credits,
      total_credits  = subscription_credits + extra_credits + p_credits,
      updated_at     = now()
  WHERE student_id = p_student_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'student_credits_not_found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- grant_subscription_credits: refreshes the subscription pool on renewal.
-- Assumes subscription credits are consumed before extra credits (FIFO), so the
-- "used" portion that belonged to the old subscription cycle is removed from
-- used_credits on renewal, letting extra credits carry over correctly.
CREATE OR REPLACE FUNCTION grant_subscription_credits(p_student_id UUID, p_credits INTEGER)
RETURNS void AS $$
DECLARE
  v_old_sub INTEGER;
BEGIN
  SELECT subscription_credits INTO v_old_sub
  FROM student_credits
  WHERE student_id = p_student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'student_credits_not_found';
  END IF;

  UPDATE student_credits
  SET subscription_credits = p_credits,
      total_credits         = p_credits + extra_credits,
      -- Remove the "used subscription" portion from used_credits so extra credits
      -- roll over correctly. Subscription credits do NOT roll over.
      used_credits          = GREATEST(0, used_credits - v_old_sub),
      -- reserved_credits intentionally left unchanged — active reservations remain valid.
      updated_at            = now()
  WHERE student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
