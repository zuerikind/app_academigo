-- Add teacher session evaluation fields to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS session_rating TEXT
    CHECK (session_rating IN ('excellent', 'good', 'challenging', 'no_show')),
  ADD COLUMN IF NOT EXISTS teacher_private_notes TEXT;

-- Replace complete_booking to accept optional evaluation data
CREATE OR REPLACE FUNCTION complete_booking(
  p_booking_id UUID,
  p_session_rating TEXT DEFAULT NULL,
  p_teacher_notes TEXT DEFAULT NULL
) RETURNS void AS $$
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

  UPDATE bookings
  SET status = 'completed',
      session_rating = p_session_rating,
      teacher_private_notes = p_teacher_notes,
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
