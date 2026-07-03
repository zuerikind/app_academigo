-- Privacy + policy fixes (2026-07-03 audit round 2):
-- 1. Move sensitive teacher columns (IBAN/payout info, motivation letter, CV,
--    default meet link) out of the publicly-readable teachers row into
--    teacher_private (own-or-admin RLS). Closes anon/authenticated REST leak.
-- 2. profiles: replace blanket "approved teacher profiles public" policy with
--    a participant-scoped policy (stops teacher email harvesting).
-- 3. reviews: snapshot reviewer_name at insert (RLS hid other students'
--    profiles, so names rendered as "Student"); harden insert policy to
--    require an own completed booking.
-- 4. complete_booking: cannot complete before the lesson has ended.
-- 5. cancel_booking: students cannot cancel confirmed bookings <24h before start.

-- ===========================================================================
-- 1. teacher_private
-- ===========================================================================
CREATE TABLE IF NOT EXISTS teacher_private (
  teacher_id UUID PRIMARY KEY REFERENCES teachers(id) ON DELETE CASCADE,
  payout_info_placeholder TEXT,
  motivation_letter TEXT,
  cv_url TEXT,
  default_meet_link TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE teacher_private ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teacher_private_select" ON teacher_private;
DROP POLICY IF EXISTS "teacher_private_insert" ON teacher_private;
DROP POLICY IF EXISTS "teacher_private_update" ON teacher_private;

CREATE POLICY "teacher_private_select" ON teacher_private FOR SELECT
  USING (teacher_id = auth_teacher_id() OR auth_is_admin());
CREATE POLICY "teacher_private_insert" ON teacher_private FOR INSERT
  WITH CHECK (teacher_id = auth_teacher_id() OR auth_is_admin());
CREATE POLICY "teacher_private_update" ON teacher_private FOR UPDATE
  USING (teacher_id = auth_teacher_id() OR auth_is_admin())
  WITH CHECK (teacher_id = auth_teacher_id() OR auth_is_admin());

-- Backfill while the source columns still exist, then drop them.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teachers' AND column_name = 'payout_info_placeholder'
  ) THEN
    INSERT INTO teacher_private (teacher_id, payout_info_placeholder, motivation_letter, cv_url, default_meet_link)
    SELECT id, payout_info_placeholder, motivation_letter, cv_url, default_meet_link FROM teachers
    ON CONFLICT (teacher_id) DO UPDATE
      SET payout_info_placeholder = EXCLUDED.payout_info_placeholder,
          motivation_letter       = EXCLUDED.motivation_letter,
          cv_url                  = EXCLUDED.cv_url,
          default_meet_link       = EXCLUDED.default_meet_link;
  END IF;
END $$;

ALTER TABLE teachers
  DROP COLUMN IF EXISTS payout_info_placeholder,
  DROP COLUMN IF EXISTS motivation_letter,
  DROP COLUMN IF EXISTS cv_url,
  DROP COLUMN IF EXISTS default_meet_link;

-- ===========================================================================
-- 2. profiles: participant-scoped instead of public
-- Public teacher pages read via the service client, so no anonymous access
-- to profiles is needed. Students only need the profile of teachers they
-- actually interact with (bookings / lessons / recurring schedules).
-- ===========================================================================
DROP POLICY IF EXISTS "profiles_select_approved_teacher_public" ON profiles;
DROP POLICY IF EXISTS "profiles_select_teacher_participant" ON profiles;

CREATE POLICY "profiles_select_teacher_participant" ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      WHERE t.profile_id = profiles.id
        AND (
          EXISTS (SELECT 1 FROM bookings b
                  WHERE b.teacher_id = t.id AND b.student_id = auth_student_id())
          OR EXISTS (SELECT 1 FROM lessons l
                     WHERE l.teacher_id = t.id AND l.student_id = auth_student_id())
          OR EXISTS (SELECT 1 FROM recurring_schedules rs
                     WHERE rs.teacher_id = t.id AND rs.student_id = auth_student_id())
        )
    )
  );

-- ===========================================================================
-- 3. reviews: reviewer name snapshot + hardened insert
-- ===========================================================================
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_name TEXT;

UPDATE reviews r
SET reviewer_name = p.full_name
FROM students s
JOIN profiles p ON p.id = s.profile_id
WHERE s.id = r.student_id AND r.reviewer_name IS NULL;

DROP POLICY IF EXISTS "reviews_insert_student" ON reviews;
CREATE POLICY "reviews_insert_student" ON reviews FOR INSERT
  WITH CHECK (
    student_id = auth_student_id()
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND b.student_id = auth_student_id()
        AND b.status = 'completed'
    )
  );

-- ===========================================================================
-- 4. complete_booking: add "lesson must be over" gate.
-- start_time/end_time store Zurich wall-clock labeled UTC, so compare the
-- naive wall-clock values: end_time AT TIME ZONE 'UTC' (strip fake UTC label)
-- vs now() AT TIME ZONE 'Europe/Zurich' (current Swiss wall clock).
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

  IF (v_booking.end_time AT TIME ZONE 'UTC') > (now() AT TIME ZONE 'Europe/Zurich') THEN
    RAISE EXCEPTION 'booking_not_finished';
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
-- 5. cancel_booking: student 24h window on confirmed bookings.
-- Teachers and admins may still cancel any time (they forfeit the lesson).
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

  -- ponytail: 24h window, students only; make configurable via platform_settings if rules change
  IF v_booking.status = 'confirmed'
     AND v_booking.student_id IS NOT DISTINCT FROM auth_student_id()
     AND NOT auth_is_admin()
     AND (v_booking.start_time AT TIME ZONE 'UTC') < (now() AT TIME ZONE 'Europe/Zurich') + interval '24 hours' THEN
    RAISE EXCEPTION 'cancellation_window_passed';
  END IF;

  UPDATE bookings SET status = 'cancelled', updated_at = now()
  WHERE id = p_booking_id;

  UPDATE student_credits
  SET reserved_credits = reserved_credits - v_booking.credits_reserved,
      updated_at = now()
  WHERE student_id = v_booking.student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
