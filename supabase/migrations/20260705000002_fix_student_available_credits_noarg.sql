-- Fix: the no-arg student_available_credits() on production still read from
-- credit_wallets (migration-order drift — 20260604000001's redefinition to
-- student_credits did not win on prod). 20260705000001 dropped credit_wallets,
-- so the function now errors. Redefine it to read the real ledger, matching the
-- parameterized overload fixed in 20260703000001.
CREATE OR REPLACE FUNCTION student_available_credits() RETURNS integer AS $$
  SELECT COALESCE((
    SELECT GREATEST(0,
      COALESCE(sc.subscription_credits, 0)
      + COALESCE(sc.extra_credits, 0)
      - COALESCE(sc.used_credits, 0)
      - COALESCE(sc.reserved_credits, 0)
    )
    FROM student_credits sc
    JOIN students s   ON s.id = sc.student_id
    JOIN profiles p   ON p.id = s.profile_id
    WHERE p.user_id = auth.uid()
  ), 0);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
