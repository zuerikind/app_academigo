-- Fix create_booking to use explicit pool sum (subscription_credits + extra_credits)
-- instead of the denormalized total_credits column, matching student_available_credits().
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
