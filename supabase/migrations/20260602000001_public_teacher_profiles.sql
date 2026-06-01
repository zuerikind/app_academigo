-- Allow public read of profile name + avatar for approved, active teachers.
-- Without this, nested profiles(...) in teacher queries return null for anonymous visitors.

DROP POLICY IF EXISTS "profiles_select_approved_teacher_public" ON profiles;

CREATE POLICY "profiles_select_approved_teacher_public"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM teachers t
      WHERE t.profile_id = profiles.id
        AND t.is_approved = true
        AND t.is_active = true
    )
  );
