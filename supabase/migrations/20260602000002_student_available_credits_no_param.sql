-- Add parameterless overload of student_available_credits that resolves the caller
-- via auth.uid() → profiles → students. Called from server RPCs without a student_id arg.
CREATE OR REPLACE FUNCTION student_available_credits()
RETURNS INTEGER AS $$
DECLARE
  v_student_id UUID;
BEGIN
  SELECT s.id INTO v_student_id
  FROM students s
  JOIN profiles p ON p.id = s.profile_id
  WHERE p.user_id = auth.uid();

  RETURN COALESCE(
    (SELECT total_credits - used_credits - reserved_credits
     FROM student_credits WHERE student_id = v_student_id),
    0
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public;
