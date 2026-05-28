-- OPTIONAL: Run only if migrations failed halfway and tables already exist.
-- Safe on empty DB: uses IF EXISTS everywhere.
-- Skip this file entirely on a brand-new project — go straight to 000001.

-- Auth trigger (auth.users always exists on Supabase)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Tables (CASCADE also removes triggers on these tables)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payout_requests CASCADE;
DROP TABLE IF EXISTS teacher_earnings CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS student_credits CASCADE;
DROP TABLE IF EXISTS credit_packages CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS availability_slots CASCADE;
DROP TABLE IF EXISTS teacher_unavailable_dates CASCADE;
DROP TABLE IF EXISTS teacher_subjects CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Functions (from migrations 1 & 2)
DROP FUNCTION IF EXISTS student_available_credits(UUID);
DROP FUNCTION IF EXISTS handle_new_student() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS auth_profile_id() CASCADE;
DROP FUNCTION IF EXISTS auth_is_admin() CASCADE;
DROP FUNCTION IF EXISTS auth_teacher_id() CASCADE;
DROP FUNCTION IF EXISTS auth_student_id() CASCADE;
