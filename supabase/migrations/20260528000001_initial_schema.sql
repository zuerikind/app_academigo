-- Academigo MVP — initial schema (Phase 1 foundation)

-- gen_random_uuid() is built-in on Supabase (PG 15+). Skip pgcrypto unless needed.

-- Enums via check constraints on text columns

-- Profiles (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX profiles_user_id_idx ON profiles(user_id);
CREATE INDEX profiles_role_idx ON profiles(role);

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  school_level TEXT,
  learning_goal TEXT,
  preferred_language TEXT,
  preferred_modality TEXT CHECK (preferred_modality IN ('online', 'in_person', 'both')),
  preferred_subject_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teachers
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  education TEXT,
  experience TEXT,
  teaching_style TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  teacher_level TEXT NOT NULL DEFAULT 'standard' CHECK (teacher_level IN ('standard', 'verified')),
  payout_rate NUMERIC(10, 2) NOT NULL DEFAULT 40,
  location TEXT,
  languages TEXT[] DEFAULT '{}',
  offers_online BOOLEAN NOT NULL DEFAULT true,
  offers_in_person BOOLEAN NOT NULL DEFAULT false,
  payout_info_placeholder TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subjects
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_coming_soon BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK after subjects exists
ALTER TABLE students
  ADD CONSTRAINT students_preferred_subject_id_fkey
  FOREIGN KEY (preferred_subject_id) REFERENCES subjects(id) ON DELETE SET NULL;

-- Teacher subjects (many-to-many)
CREATE TABLE teacher_subjects (
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, subject_id)
);

-- Teacher unavailable dates (Phase 2+)
CREATE TABLE teacher_unavailable_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  unavailable_date DATE NOT NULL,
  UNIQUE (teacher_id, unavailable_date)
);

-- Availability slots (Phase 2)
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX availability_slots_teacher_id_idx ON availability_slots(teacher_id);
CREATE INDEX availability_slots_start_time_idx ON availability_slots(start_time);

-- Bookings (Phase 2)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')
  ),
  credits_reserved INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bookings_student_id_idx ON bookings(student_id);
CREATE INDEX bookings_teacher_id_idx ON bookings(teacher_id);
CREATE INDEX bookings_status_idx ON bookings(status);

-- Credit packages (catalog)
CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0,
  price_chf NUMERIC(10, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_subscription BOOLEAN NOT NULL DEFAULT false,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student credits
CREATE TABLE student_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  total_credits INTEGER NOT NULL DEFAULT 0,
  used_credits INTEGER NOT NULL DEFAULT 0,
  reserved_credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments (Phase 3)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  package_id UUID REFERENCES credit_packages(id) ON DELETE SET NULL,
  stripe_session_id TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'completed', 'failed', 'refunded')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teacher earnings (Phase 4)
CREATE TABLE teacher_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'available', 'requested', 'paid')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payout requests (Phase 4)
CREATE TABLE payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'paid', 'rejected')
  ),
  payout_type TEXT DEFAULT 'immediate' CHECK (payout_type IN ('immediate', 'monthly')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at trigger helper
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER teachers_updated_at
  BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- New user → profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_email TEXT;
  user_name TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  IF user_role NOT IN ('student', 'teacher', 'admin') THEN
    user_role := 'student';
  END IF;
  user_email := NEW.email;
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO profiles (user_id, role, full_name, email)
  VALUES (NEW.id, user_role, user_name, user_email);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Student row → credits row
CREATE OR REPLACE FUNCTION handle_new_student()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_credits (student_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_student_created ON students;
CREATE TRIGGER on_student_created
  AFTER INSERT ON students FOR EACH ROW EXECUTE PROCEDURE handle_new_student();

-- Available credits helper (computed)
CREATE OR REPLACE FUNCTION student_available_credits(p_student_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(
    (SELECT total_credits - used_credits - reserved_credits
     FROM student_credits WHERE student_id = p_student_id),
    0
  );
$$ LANGUAGE sql STABLE;
