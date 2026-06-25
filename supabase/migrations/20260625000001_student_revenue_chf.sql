-- Add student_revenue_chf to bookings: actual CHF paid by student for this session,
-- computed at completion time using FIFO price from their oldest payment.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS student_revenue_chf NUMERIC(10, 2);

-- Rewrite complete_booking to capture student_revenue_chf at completion time.
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

  IF v_booking.status != 'confirmed' THEN
    RAISE EXCEPTION 'invalid_booking_status';
  END IF;

  -- FIFO: price per credit from student's oldest completed payment
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

-- Backfill existing completed bookings using same FIFO logic
UPDATE bookings b
SET student_revenue_chf = b.credits_reserved * COALESCE(
  (
    SELECT p.amount / NULLIF(cp.credits, 0)
      FROM payments p
      JOIN credit_packages cp ON cp.id = p.package_id
     WHERE p.student_id = b.student_id
       AND p.status = 'completed'
       AND p.package_id IS NOT NULL
     ORDER BY p.created_at ASC
     LIMIT 1
  ),
  0
)
WHERE b.status = 'completed' AND b.student_revenue_chf IS NULL;
