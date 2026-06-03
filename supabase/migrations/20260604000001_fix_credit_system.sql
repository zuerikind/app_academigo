-- Fix 1: Sync total_credits with subscription_credits + extra_credits (may be stale)
UPDATE student_credits
SET total_credits = subscription_credits + extra_credits
WHERE total_credits IS DISTINCT FROM subscription_credits + extra_credits;

-- Fix 2: student_available_credits — bypass total_credits, compute from actual columns
CREATE OR REPLACE FUNCTION student_available_credits()
RETURNS INTEGER AS $$
DECLARE
  v_student_id UUID;
  v_row student_credits%ROWTYPE;
BEGIN
  SELECT s.id INTO v_student_id
  FROM students s
  JOIN profiles p ON p.id = s.profile_id
  WHERE p.user_id = auth.uid();

  SELECT * INTO v_row
  FROM student_credits
  WHERE student_id = v_student_id;

  IF NOT FOUND THEN RETURN 0; END IF;

  RETURN GREATEST(
    0,
    COALESCE(v_row.subscription_credits, 0)
    + COALESCE(v_row.extra_credits, 0)
    - COALESCE(v_row.used_credits, 0)
    - COALESCE(v_row.reserved_credits, 0)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public;

-- Fix 3: grant_credits — correctly adds to extra pool and syncs total
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

-- Fix 4: grant_subscription_credits — refresh monthly pool WITHOUT destroying extra credits
-- Subscription pool resets each cycle; extra credits (one-off purchases) persist.
CREATE OR REPLACE FUNCTION grant_subscription_credits(p_student_id UUID, p_credits INTEGER)
RETURNS void AS $$
DECLARE
  v_old_sub INTEGER;
  v_used    INTEGER;
BEGIN
  SELECT subscription_credits, used_credits
  INTO v_old_sub, v_used
  FROM student_credits
  WHERE student_id = p_student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'student_credits_not_found';
  END IF;

  UPDATE student_credits
  SET subscription_credits = p_credits,
      total_credits         = p_credits + extra_credits,
      -- Remove only the subscription portion of used_credits so extra-credit
      -- usage is preserved across the renewal boundary.
      used_credits          = GREATEST(0, v_used - LEAST(v_used, v_old_sub)),
      updated_at            = now()
  WHERE student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
