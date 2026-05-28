-- Row Level Security
-- (Drop policies first so you can re-run this file after a partial failure)

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "students_select_own_or_admin" ON students;
DROP POLICY IF EXISTS "students_insert_own" ON students;
DROP POLICY IF EXISTS "students_update_own_or_admin" ON students;
DROP POLICY IF EXISTS "teachers_select_approved_public" ON teachers;
DROP POLICY IF EXISTS "teachers_insert_own" ON teachers;
DROP POLICY IF EXISTS "teachers_update_own_or_admin" ON teachers;
DROP POLICY IF EXISTS "subjects_select_all" ON subjects;
DROP POLICY IF EXISTS "subjects_admin_all" ON subjects;
DROP POLICY IF EXISTS "teacher_subjects_select_all" ON teacher_subjects;
DROP POLICY IF EXISTS "teacher_subjects_manage_own" ON teacher_subjects;
DROP POLICY IF EXISTS "unavailable_dates_teacher" ON teacher_unavailable_dates;
DROP POLICY IF EXISTS "availability_select_all" ON availability_slots;
DROP POLICY IF EXISTS "availability_teacher_manage" ON availability_slots;
DROP POLICY IF EXISTS "bookings_select_participants" ON bookings;
DROP POLICY IF EXISTS "bookings_insert_student" ON bookings;
DROP POLICY IF EXISTS "bookings_update_participants" ON bookings;
DROP POLICY IF EXISTS "credit_packages_select" ON credit_packages;
DROP POLICY IF EXISTS "credit_packages_admin" ON credit_packages;
DROP POLICY IF EXISTS "student_credits_select_own" ON student_credits;
DROP POLICY IF EXISTS "student_credits_admin_update" ON student_credits;
DROP POLICY IF EXISTS "payments_select_own" ON payments;
DROP POLICY IF EXISTS "teacher_earnings_select_own" ON teacher_earnings;
DROP POLICY IF EXISTS "payout_requests_teacher" ON payout_requests;
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_student" ON reviews;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_unavailable_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Helper: current profile id
CREATE OR REPLACE FUNCTION auth_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth_teacher_id()
RETURNS UUID AS $$
  SELECT t.id FROM teachers t
  JOIN profiles p ON p.id = t.profile_id
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth_student_id()
RETURNS UUID AS $$
  SELECT s.id FROM students s
  JOIN profiles p ON p.id = s.profile_id
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Profiles
CREATE POLICY "profiles_select_own_or_admin"
  ON profiles FOR SELECT
  USING (user_id = auth.uid() OR auth_is_admin());

CREATE POLICY "profiles_update_own_or_admin"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid() OR auth_is_admin());

-- Students
CREATE POLICY "students_select_own_or_admin"
  ON students FOR SELECT
  USING (profile_id = auth_profile_id() OR auth_is_admin());

CREATE POLICY "students_insert_own"
  ON students FOR INSERT
  WITH CHECK (profile_id = auth_profile_id());

CREATE POLICY "students_update_own_or_admin"
  ON students FOR UPDATE
  USING (profile_id = auth_profile_id() OR auth_is_admin());

-- Teachers: public read approved+active; own full access
CREATE POLICY "teachers_select_approved_public"
  ON teachers FOR SELECT
  USING (
    (is_approved = true AND is_active = true)
    OR profile_id = auth_profile_id()
    OR auth_is_admin()
  );

CREATE POLICY "teachers_insert_own"
  ON teachers FOR INSERT
  WITH CHECK (profile_id = auth_profile_id());

CREATE POLICY "teachers_update_own_or_admin"
  ON teachers FOR UPDATE
  USING (profile_id = auth_profile_id() OR auth_is_admin());

-- Subjects: public read
CREATE POLICY "subjects_select_all"
  ON subjects FOR SELECT USING (true);

CREATE POLICY "subjects_admin_all"
  ON subjects FOR ALL
  USING (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- Teacher subjects
CREATE POLICY "teacher_subjects_select_all"
  ON teacher_subjects FOR SELECT USING (true);

CREATE POLICY "teacher_subjects_manage_own"
  ON teacher_subjects FOR ALL
  USING (
    teacher_id = auth_teacher_id() OR auth_is_admin()
  )
  WITH CHECK (
    teacher_id = auth_teacher_id() OR auth_is_admin()
  );

-- Unavailable dates (teacher own)
CREATE POLICY "unavailable_dates_teacher"
  ON teacher_unavailable_dates FOR ALL
  USING (teacher_id = auth_teacher_id() OR auth_is_admin())
  WITH CHECK (teacher_id = auth_teacher_id() OR auth_is_admin());

-- Availability slots
CREATE POLICY "availability_select_all"
  ON availability_slots FOR SELECT USING (true);

CREATE POLICY "availability_teacher_manage"
  ON availability_slots FOR ALL
  USING (teacher_id = auth_teacher_id() OR auth_is_admin())
  WITH CHECK (teacher_id = auth_teacher_id() OR auth_is_admin());

-- Bookings (Phase 2)
CREATE POLICY "bookings_select_participants"
  ON bookings FOR SELECT
  USING (
    student_id = auth_student_id()
    OR teacher_id = auth_teacher_id()
    OR auth_is_admin()
  );

CREATE POLICY "bookings_insert_student"
  ON bookings FOR INSERT
  WITH CHECK (student_id = auth_student_id());

CREATE POLICY "bookings_update_participants"
  ON bookings FOR UPDATE
  USING (
    student_id = auth_student_id()
    OR teacher_id = auth_teacher_id()
    OR auth_is_admin()
  );

-- Credit packages: public read active
CREATE POLICY "credit_packages_select"
  ON credit_packages FOR SELECT USING (is_active = true OR auth_is_admin());

CREATE POLICY "credit_packages_admin"
  ON credit_packages FOR ALL
  USING (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- Student credits
CREATE POLICY "student_credits_select_own"
  ON student_credits FOR SELECT
  USING (student_id = auth_student_id() OR auth_is_admin());

CREATE POLICY "student_credits_admin_update"
  ON student_credits FOR UPDATE
  USING (auth_is_admin());

-- Payments, earnings, payouts: restricted (Phase 3+)
CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (student_id = auth_student_id() OR auth_is_admin());

CREATE POLICY "teacher_earnings_select_own"
  ON teacher_earnings FOR SELECT
  USING (teacher_id = auth_teacher_id() OR auth_is_admin());

CREATE POLICY "payout_requests_teacher"
  ON payout_requests FOR ALL
  USING (teacher_id = auth_teacher_id() OR auth_is_admin())
  WITH CHECK (teacher_id = auth_teacher_id() OR auth_is_admin());

-- Reviews
CREATE POLICY "reviews_select_all"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "reviews_insert_student"
  ON reviews FOR INSERT
  WITH CHECK (student_id = auth_student_id());
