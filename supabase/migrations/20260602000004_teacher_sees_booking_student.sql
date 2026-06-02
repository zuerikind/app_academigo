-- Allow teachers to read student records and profiles for their own bookings.
-- Without this, getTeacherBookings joins to students/profiles return null due
-- to the students_select_own_or_admin and profiles_select_own_or_admin policies.

DROP POLICY IF EXISTS "students_select_teacher_participant" ON students;
DROP POLICY IF EXISTS "profiles_select_booking_student" ON profiles;

-- Teachers can read a student record if there is any booking between them
CREATE POLICY "students_select_teacher_participant"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.student_id = students.id
        AND b.teacher_id = auth_teacher_id()
    )
  );

-- Teachers can read the profile of a student they have a booking with
CREATE POLICY "profiles_select_booking_student"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM students s
      JOIN bookings b ON b.student_id = s.id
      WHERE s.profile_id = profiles.id
        AND b.teacher_id = auth_teacher_id()
    )
  );
