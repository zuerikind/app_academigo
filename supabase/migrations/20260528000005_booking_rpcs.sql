-- Migration: Atomic booking RPC functions
-- These functions enforce credit locking (FOR UPDATE) and state machine rules at the DB level.
-- Called by Phase 3 lib/services/bookings.ts via supabase.rpc().

-- Function 1: Reserve credits and create booking atomically
CREATE OR REPLACE FUNCTION create_booking(
  p_student_id UUID,
  p_teacher_id UUID,
  p_subject_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_credits_to_reserve INTEGER
) RETURNS UUID AS $$
DECLARE
  v_available INTEGER;
  v_booking_id UUID;
BEGIN
  -- Lock student credits row to prevent concurrent booking race condition
  SELECT (total_credits - used_credits - reserved_credits)
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
    start_time, end_time, status, credits_reserved
  )
  VALUES (
    p_student_id, p_teacher_id, p_subject_id,
    p_start_time, p_end_time, 'pending', p_credits_to_reserve
  )
  RETURNING id INTO v_booking_id;

  UPDATE student_credits
  SET reserved_credits = reserved_credits + p_credits_to_reserve,
      updated_at = now()
  WHERE student_id = p_student_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function 2: Complete booking — consume reserved credits and record teacher earnings
CREATE OR REPLACE FUNCTION complete_booking(p_booking_id UUID) RETURNS void AS $$
DECLARE
  v_booking bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking_not_found';
  END IF;

  IF v_booking.status != 'confirmed' THEN
    RAISE EXCEPTION 'invalid_booking_status';
  END IF;

  UPDATE bookings SET status = 'completed', updated_at = now()
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

-- Function 3: Cancel booking — release reserved credits with state validation
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID) RETURNS void AS $$
DECLARE
  v_booking bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking_not_found';
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
