-- Security patch: handle_new_user trigger — close admin role bypass
-- Before: trigger accepted role='admin' from signup metadata (auth API bypass risk)
-- After:  only 'teacher' is accepted from metadata; all others default to 'student'
-- This must be applied before Phase 2 admin portal ships.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Security: only accept 'teacher' from client metadata
  -- 'admin' and any other value defaults to 'student' — admin accounts
  -- must be created directly in the DB by existing admins.
  user_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' = 'teacher' THEN 'teacher'
    ELSE 'student'
  END;

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
