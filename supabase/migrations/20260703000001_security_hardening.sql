-- Security hardening (2026-07-03 audit):
-- 1. Block role escalation via profiles UPDATE
-- 2. Lock grant_credits / grant_subscription_credits to service role only
-- 3. Add caller ownership checks inside all SECURITY DEFINER booking/lesson RPCs
-- 4. Prevent double payouts (admin UPDATE policy on teacher_earnings)
-- 5. Booking slot overlap exclusion constraint (double-booking race)
-- 6. Unique index on payments.stripe_session_id (webhook idempotency race)
-- 7. Narrow bookings UPDATE policy to teacher/admin (students go through RPCs)
-- 8. Allow 'pending' status on recurring_schedules (approval flow)
-- 9. student_available_credits(p_student_id) reads student_credits (was stale credit_wallets)

-- ===========================================================================
-- 1. Role escalation: WITH CHECK can't see the OLD row, so use a trigger.
-- auth.role() is NULL for direct SQL (dashboard/psql) — those stay allowed.
-- ===========================================================================
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.role() IN ('anon', 'authenticated')
     AND NOT auth_is_admin() THEN
    RAISE EXCEPTION 'role_change_not_allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_prevent_role_escalation ON profiles;
CREATE TRIGGER profiles_prevent_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_escalation();

-- ===========================================================================
-- 2. Credit-granting RPCs: webhook (service role) is the only legitimate caller.
-- ===========================================================================
REVOKE EXECUTE ON FUNCTION grant_credits(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION grant_subscription_credits(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION grant_credits(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION grant_subscription_credits(UUID, INTEGER) TO service_role;

-- Parameterized balance lookup: unused by app clients, leaks balances — service only.
REVOKE EXECUTE ON FUNCTION student_available_credits(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION student_available_credits(UUID) TO service_role;

-- ===========================================================================
-- 5. Double-booking: exclusion constraint on overlapping pending/confirmed
-- bookings per teacher. Atomic — closes the concurrent-booking race.
-- ===========================================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    teacher_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status IN ('pending', 'confirmed'));

-- ===========================================================================
-- 6. Webhook idempotency: enforce at the DB, not read-then-insert.
-- ===========================================================================
CREATE UNIQUE INDEX IF NOT EXISTS payments_stripe_session_id_key
  ON payments (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- ===========================================================================
-- 3a. create_booking: caller must be the student they book for.
-- ===========================================================================
CREATE OR REPLACE FUNCTION create_booking(
  p_student_id UUID,
  p_teacher_id UUID,
  p_subject_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_credits_to_reserve INTEGER,
  p_topic_note TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_available INTEGER;
  v_booking_id UUID;
BEGIN
  IF auth.role() IN ('anon', 'authenticated')
     AND p_student_id IS DISTINCT FROM auth_student_id() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF p_start_time >= p_end_time THEN
    RAISE EXCEPTION 'invalid_time_range';
  END IF;

  SELECT (subscription_credits + extra_credits - used_credits - reserved_credits)
  INTO v_available
  FROM student_credits
  WHERE student_id = p_student_id
  FOR UPDATE;

  IF v_available IS NULL THEN
    RAISE EXCEPTION 'student_credits_not_found';
  END IF;

  IF v_available < p_credits_to_reserve THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  INSERT INTO bookings (
    student_id, teacher_id, subject_id,
    start_time, end_time, status, credits_reserved, topic_note
  )
  VALUES (
    p_student_id, p_teacher_id, p_subject_id,
    p_start_time, p_end_time, 'pending', p_credits_to_reserve, p_topic_note
  )
  RETURNING id INTO v_booking_id;

  UPDATE student_credits
  SET reserved_credits = reserved_credits + p_credits_to_reserve,
      updated_at = now()
  WHERE student_id = p_student_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===========================================================================
-- 3b. cancel_booking: caller must be a participant (or admin/service).
-- ===========================================================================
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID) RETURNS void AS $$
DECLARE
  v_booking bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking_not_found';
  END IF;

  IF auth.role() IN ('anon', 'authenticated')
     AND NOT auth_is_admin()
     AND v_booking.student_id IS DISTINCT FROM auth_student_id()
     AND v_booking.teacher_id IS DISTINCT FROM auth_teacher_id() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF v_booking.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'booking_not_cancellable';
  END IF;

  UPDATE bookings SET status = 'cancelled', updated_at = now()
  WHERE id = p_booking_id;

  UPDATE student_credits
  SET reserved_credits = reserved_credits - v_booking.credits_reserved,
      updated_at = now()
  WHERE student_id = v_booking.student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===========================================================================
-- 3c. complete_booking: caller must be the booking's teacher (or admin/service).
-- Body otherwise identical to 20260625000001 (student_revenue_chf FIFO).
-- ===========================================================================
CREATE OR REPLACE FUNCTION complete_booking(
  p_booking_id UUID,
  p_session_rating TEXT DEFAULT NULL,
  p_teacher_notes TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_price_per_credit NUMERIC;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking_not_found';
  END IF;

  IF auth.role() IN ('anon', 'authenticated')
     AND NOT auth_is_admin()
     AND v_booking.teacher_id IS DISTINCT FROM auth_teacher_id() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF v_booking.status != 'confirmed' THEN
    RAISE EXCEPTION 'invalid_booking_status';
  END IF;

  SELECT p.amount / NULLIF(cp.credits, 0)
    INTO v_price_per_credit
    FROM payments p
    JOIN credit_packages cp ON cp.id = p.package_id
   WHERE p.student_id = v_booking.student_id
     AND p.status = 'completed'
     AND p.package_id IS NOT NULL
   ORDER BY p.created_at ASC
   LIMIT 1;

  UPDATE bookings
  SET status = 'completed',
      session_rating = p_session_rating,
      teacher_private_notes = p_teacher_notes,
      student_revenue_chf = v_booking.credits_reserved * COALESCE(v_price_per_credit, 0),
      updated_at = now()
  WHERE id = p_booking_id;

  UPDATE student_credits
  SET used_credits = used_credits + v_booking.credits_reserved,
      reserved_credits = reserved_credits - v_booking.credits_reserved,
      updated_at = now()
  WHERE student_id = v_booking.student_id;

  INSERT INTO teacher_earnings (teacher_id, booking_id, amount, status)
  SELECT v_booking.teacher_id, p_booking_id, t.payout_rate, 'available'
  FROM teachers t WHERE t.id = v_booking.teacher_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===========================================================================
-- 3d. complete_lesson: teacher-only + deduct from student_credits (the real
-- ledger — credit_wallets was never credited by purchases) with a floor check.
-- ===========================================================================
CREATE OR REPLACE FUNCTION complete_lesson(p_lesson_id UUID) RETURNS void AS $$
DECLARE
  v_lesson lessons%ROWTYPE;
  v_available INTEGER;
BEGIN
  SELECT * INTO v_lesson FROM lessons WHERE id = p_lesson_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'lesson_not_found'; END IF;

  IF auth.role() IN ('anon', 'authenticated')
     AND NOT auth_is_admin()
     AND v_lesson.teacher_id IS DISTINCT FROM auth_teacher_id() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF v_lesson.status != 'confirmed' THEN RAISE EXCEPTION 'invalid_lesson_status'; END IF;

  SELECT (subscription_credits + extra_credits - used_credits - reserved_credits)
    INTO v_available
    FROM student_credits
   WHERE student_id = v_lesson.student_id
   FOR UPDATE;

  IF v_available IS NULL THEN RAISE EXCEPTION 'student_credits_not_found'; END IF;
  IF v_available < 1 THEN RAISE EXCEPTION 'insufficient_credits'; END IF;

  UPDATE lessons SET status = 'completed', updated_at = now() WHERE id = p_lesson_id;

  UPDATE student_credits
  SET used_credits = used_credits + 1, updated_at = now()
  WHERE student_id = v_lesson.student_id;

  INSERT INTO credit_transactions (student_id, lesson_id, amount, type)
  VALUES (v_lesson.student_id, p_lesson_id, -1, 'completion_deduction');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===========================================================================
-- 3e. approve_reschedule / reject_reschedule: participant check.
-- ===========================================================================
CREATE OR REPLACE FUNCTION approve_reschedule(p_lesson_id UUID) RETURNS UUID AS $$
DECLARE
  v_lesson lessons%ROWTYPE;
  v_new_lesson_id UUID;
BEGIN
  SELECT * INTO v_lesson FROM lessons WHERE id = p_lesson_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'lesson_not_found'; END IF;

  IF auth.role() IN ('anon', 'authenticated')
     AND NOT auth_is_admin()
     AND v_lesson.student_id IS DISTINCT FROM auth_student_id()
     AND v_lesson.teacher_id IS DISTINCT FROM auth_teacher_id() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF v_lesson.status != 'reschedule_requested' THEN RAISE EXCEPTION 'invalid_lesson_status'; END IF;
  IF v_lesson.reschedule_proposed_start IS NULL THEN RAISE EXCEPTION 'no_proposed_time'; END IF;

  UPDATE lessons SET status = 'cancelled', updated_at = now() WHERE id = p_lesson_id;

  INSERT INTO lessons (student_id, teacher_id, schedule_id, start_time, end_time, meet_link, status)
  VALUES (
    v_lesson.student_id, v_lesson.teacher_id, v_lesson.schedule_id,
    v_lesson.reschedule_proposed_start, v_lesson.reschedule_proposed_end,
    v_lesson.meet_link, 'confirmed'
  )
  RETURNING id INTO v_new_lesson_id;

  RETURN v_new_lesson_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION reject_reschedule(p_lesson_id UUID) RETURNS void AS $$
DECLARE
  v_lesson lessons%ROWTYPE;
BEGIN
  SELECT * INTO v_lesson FROM lessons WHERE id = p_lesson_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'lesson_not_found'; END IF;

  IF auth.role() IN ('anon', 'authenticated')
     AND NOT auth_is_admin()
     AND v_lesson.student_id IS DISTINCT FROM auth_student_id()
     AND v_lesson.teacher_id IS DISTINCT FROM auth_teacher_id() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF v_lesson.status != 'reschedule_requested' THEN RAISE EXCEPTION 'invalid_lesson_status'; END IF;

  UPDATE lessons
  SET status = 'confirmed',
      reschedule_proposed_start = NULL,
      reschedule_proposed_end   = NULL,
      reschedule_requested_by   = NULL,
      updated_at                = now()
  WHERE id = p_lesson_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===========================================================================
-- 4. Payouts: admins need to mark earnings paid with their own session
-- (markPayoutProcessed previously no-op'd — no UPDATE policy existed).
-- ===========================================================================
DROP POLICY IF EXISTS "teacher_earnings_admin_update" ON teacher_earnings;
CREATE POLICY "teacher_earnings_admin_update" ON teacher_earnings
  FOR UPDATE USING (auth_is_admin()) WITH CHECK (auth_is_admin());

-- ===========================================================================
-- 7. Students must not PATCH bookings directly (status/meeting_link/credits);
-- all student mutations go through the RPCs above. Teachers still update
-- (confirm, meet link, notes).
-- ===========================================================================
DROP POLICY IF EXISTS "bookings_update_participants" ON bookings;
DROP POLICY IF EXISTS "bookings_update_teacher_or_admin" ON bookings;
CREATE POLICY "bookings_update_teacher_or_admin" ON bookings
  FOR UPDATE
  USING (teacher_id = auth_teacher_id() OR auth_is_admin())
  WITH CHECK (teacher_id = auth_teacher_id() OR auth_is_admin());

-- ===========================================================================
-- 8. Recurring schedules approval flow: allow 'pending' (createSchedule
-- inserted it but the CHECK constraint rejected it).
-- ===========================================================================
ALTER TABLE recurring_schedules DROP CONSTRAINT IF EXISTS recurring_schedules_status_check;
ALTER TABLE recurring_schedules ADD CONSTRAINT recurring_schedules_status_check
  CHECK (status IN ('pending', 'active', 'paused', 'cancelled'));

-- ===========================================================================
-- 9. Parameterized balance RPC: read the real ledger, not stale credit_wallets.
-- ===========================================================================
CREATE OR REPLACE FUNCTION student_available_credits(p_student_id UUID) RETURNS integer AS $$
  SELECT GREATEST(0,
    COALESCE(subscription_credits, 0)
    + COALESCE(extra_credits, 0)
    - COALESCE(used_credits, 0)
    - COALESCE(reserved_credits, 0)
  )
  FROM student_credits
  WHERE student_id = p_student_id
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
