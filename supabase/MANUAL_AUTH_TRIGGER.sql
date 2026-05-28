-- Run this ONLY if migration 1 fails on:
--   "permission denied" / "must be owner of relation users" for auth.users trigger
--
-- Alternative: Supabase Dashboard → Database → Triggers → New trigger
--   Table: auth.users | Events: Insert | Function: handle_new_user

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  IF user_role NOT IN ('student', 'teacher', 'admin') THEN
    user_role := 'student';
  END IF;
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (user_id, role, full_name, email)
  VALUES (NEW.id, user_role, user_name, NEW.email);

  RETURN NEW;
END;
$$;

-- Try creating the trigger (may require superuser in SQL Editor)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
