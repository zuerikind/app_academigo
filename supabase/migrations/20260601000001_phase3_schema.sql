-- Migration: Phase 3 Core Transaction schema additions
-- Adds availability tables, booking columns, meet link, review constraint, credit grant RPCs
-- Safe to re-run: uses IF NOT EXISTS and CREATE OR REPLACE throughout

-- ===========================================================================
-- 1. teacher_availability_ranges
-- ===========================================================================
CREATE TABLE IF NOT EXISTS teacher_availability_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  UNIQUE (teacher_id, day_of_week, start_time),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE teacher_availability_ranges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "avail_ranges_select_all" ON teacher_availability_ranges;
DROP POLICY IF EXISTS "avail_ranges_teacher_manage" ON teacher_availability_ranges;

CREATE POLICY "avail_ranges_select_all"
  ON teacher_availability_ranges FOR SELECT
  USING (true);

CREATE POLICY "avail_ranges_teacher_manage"
  ON teacher_availability_ranges FOR ALL
  USING (teacher_id = auth_teacher_id() OR auth_is_admin())
  WITH CHECK (teacher_id = auth_teacher_id() OR auth_is_admin());

-- ===========================================================================
-- 2. teacher_availability_blockers
-- ===========================================================================
CREATE TABLE IF NOT EXISTS teacher_availability_blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  UNIQUE (teacher_id, blocked_date),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE teacher_availability_blockers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "avail_blockers_select_all" ON teacher_availability_blockers;
DROP POLICY IF EXISTS "avail_blockers_teacher_manage" ON teacher_availability_blockers;

CREATE POLICY "avail_blockers_select_all"
  ON teacher_availability_blockers FOR SELECT
  USING (true);

CREATE POLICY "avail_blockers_teacher_manage"
  ON teacher_availability_blockers FOR ALL
  USING (teacher_id = auth_teacher_id() OR auth_is_admin())
  WITH CHECK (teacher_id = auth_teacher_id() OR auth_is_admin());

-- ===========================================================================
-- 3. Extend teachers table: default_meet_link
-- ===========================================================================
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS default_meet_link TEXT;

-- ===========================================================================
-- 4. Extend bookings table: meeting_link, topic_note, reminder tracking
-- ===========================================================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_link TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS topic_note TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_1h_sent_at TIMESTAMPTZ;

-- ===========================================================================
-- 5. Update create_booking RPC to accept optional topic_note
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
    start_time, end_time, status, credits_reserved,
    topic_note
  )
  VALUES (
    p_student_id, p_teacher_id, p_subject_id,
    p_start_time, p_end_time, 'pending', p_credits_to_reserve,
    p_topic_note
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
-- 6. Reviews: add unique constraint to enforce one review per booking
-- ===========================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_booking_id_unique'
  ) THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_booking_id_unique UNIQUE (booking_id);
  END IF;
END
$$;

-- ===========================================================================
-- 7. grant_credits and grant_subscription_credits RPCs
-- ===========================================================================

-- grant_credits: adds p_credits on top of existing balance (one-off purchase)
CREATE OR REPLACE FUNCTION grant_credits(p_student_id UUID, p_credits INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE student_credits
  SET total_credits = total_credits + p_credits,
      updated_at = now()
  WHERE student_id = p_student_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'student_credits_not_found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- grant_subscription_credits: resets balance on monthly renewal (credits do not roll over)
CREATE OR REPLACE FUNCTION grant_subscription_credits(p_student_id UUID, p_credits INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE student_credits
  SET total_credits = p_credits,
      used_credits = 0,
      reserved_credits = 0,
      updated_at = now()
  WHERE student_id = p_student_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'student_credits_not_found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
