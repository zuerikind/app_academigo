-- Migration: booking_subjects junction table
-- Allows a booking to be associated with one or more subjects.
-- The existing bookings.subject_id column stores the primary subject for backward compat.

CREATE TABLE IF NOT EXISTS booking_subjects (
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (booking_id, subject_id)
);

ALTER TABLE booking_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_subjects_select" ON booking_subjects;
DROP POLICY IF EXISTS "booking_subjects_insert" ON booking_subjects;
DROP POLICY IF EXISTS "booking_subjects_admin" ON booking_subjects;

CREATE POLICY "booking_subjects_select"
  ON booking_subjects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND (
          b.student_id = auth_student_id()
          OR b.teacher_id = auth_teacher_id()
          OR auth_is_admin()
        )
    )
  );

CREATE POLICY "booking_subjects_insert"
  ON booking_subjects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND b.student_id = auth_student_id()
    )
  );

CREATE POLICY "booking_subjects_admin"
  ON booking_subjects FOR ALL
  USING (auth_is_admin())
  WITH CHECK (auth_is_admin());
