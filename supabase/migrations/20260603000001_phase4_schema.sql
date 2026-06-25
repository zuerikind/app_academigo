-- Migration: Phase 4 Recurring Lessons schema
-- Creates credit_wallets, recurring_schedules, lessons, credit_transactions tables.
-- Adds RPCs: complete_lesson, approve_reschedule, reject_reschedule.
-- Updates student_available_credits RPCs to read from credit_wallets.
-- Seeds credit_wallets from existing student_credits.
-- Safe to re-run: uses IF NOT EXISTS and CREATE OR REPLACE throughout.

-- ===========================================================================
-- Section 1: credit_wallets
-- Must be created FIRST — recurring_schedules and lessons are independent,
-- but wallet seed comes last after student_credits data is available.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS credit_wallets (
  student_id  uuid NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  available_balance int NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE credit_wallets ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- Section 2: recurring_schedules (before lessons — lessons FK → schedules)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id  uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  weekday     int NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time  time NOT NULL,
  end_time    time NOT NULL,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- Section 3: lessons (before credit_transactions — transactions FK → lessons)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS lessons (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id                  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id                  uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  schedule_id                 uuid REFERENCES recurring_schedules(id) ON DELETE SET NULL,
  start_time                  timestamptz NOT NULL,
  end_time                    timestamptz NOT NULL,
  meet_link                   text,
  status                      text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','completed','cancelled','reschedule_requested')),
  reschedule_proposed_start   timestamptz,
  reschedule_proposed_end     timestamptz,
  reschedule_requested_by     text CHECK (reschedule_requested_by IN ('student','teacher')),
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Partial UNIQUE index: idempotency guard for cron lesson generator.
-- Only enforces uniqueness for recurring lessons (schedule_id IS NOT NULL).
CREATE UNIQUE INDEX IF NOT EXISTS lessons_schedule_start_unique
  ON lessons (schedule_id, start_time)
  WHERE schedule_id IS NOT NULL;

-- ===========================================================================
-- Section 4: credit_transactions (after lessons — FK to lessons now valid)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lesson_id   uuid REFERENCES lessons(id) ON DELETE SET NULL,
  amount      int NOT NULL,
  type        text NOT NULL CHECK (type IN ('purchase','completion_deduction','cancellation_refund','admin_grant')),
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- Section 5: RLS policies (follow bookings pattern from 20260528000002_rls_policies.sql)
-- Drop before create so this file is idempotent.
-- ===========================================================================

DROP POLICY IF EXISTS "credit_wallets_select" ON credit_wallets;
DROP POLICY IF EXISTS "credit_transactions_select" ON credit_transactions;
DROP POLICY IF EXISTS "recurring_schedules_select" ON recurring_schedules;
DROP POLICY IF EXISTS "recurring_schedules_insert" ON recurring_schedules;
DROP POLICY IF EXISTS "recurring_schedules_update" ON recurring_schedules;
DROP POLICY IF EXISTS "lessons_select" ON lessons;
DROP POLICY IF EXISTS "lessons_update" ON lessons;

-- credit_wallets: student reads own, admin reads all
CREATE POLICY "credit_wallets_select" ON credit_wallets FOR SELECT
  USING (student_id = auth_student_id() OR auth_is_admin());

-- credit_transactions: student reads own, admin reads all
CREATE POLICY "credit_transactions_select" ON credit_transactions FOR SELECT
  USING (student_id = auth_student_id() OR auth_is_admin());

-- recurring_schedules: participant or admin
CREATE POLICY "recurring_schedules_select" ON recurring_schedules FOR SELECT
  USING (student_id = auth_student_id() OR teacher_id = auth_teacher_id() OR auth_is_admin());
CREATE POLICY "recurring_schedules_insert" ON recurring_schedules FOR INSERT
  WITH CHECK (student_id = auth_student_id());
CREATE POLICY "recurring_schedules_update" ON recurring_schedules FOR UPDATE
  USING (student_id = auth_student_id() OR teacher_id = auth_teacher_id() OR auth_is_admin());

-- lessons: participant or admin; INSERT via SECURITY DEFINER RPCs only (service role bypasses for cron)
CREATE POLICY "lessons_select" ON lessons FOR SELECT
  USING (student_id = auth_student_id() OR teacher_id = auth_teacher_id() OR auth_is_admin());
CREATE POLICY "lessons_update" ON lessons FOR UPDATE
  USING (student_id = auth_student_id() OR teacher_id = auth_teacher_id() OR auth_is_admin());

-- ===========================================================================
-- Section 6: complete_lesson RPC
-- Mirrors complete_booking (SECURITY DEFINER + FOR UPDATE row lock).
-- Deducts 1 credit from credit_wallets and logs a credit_transactions row.
-- ===========================================================================
CREATE OR REPLACE FUNCTION complete_lesson(p_lesson_id UUID) RETURNS void AS $$
DECLARE
  v_lesson lessons%ROWTYPE;
  v_credits_to_deduct INTEGER := 1;
BEGIN
  SELECT * INTO v_lesson FROM lessons WHERE id = p_lesson_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'lesson_not_found'; END IF;
  IF v_lesson.status != 'confirmed' THEN RAISE EXCEPTION 'invalid_lesson_status'; END IF;

  UPDATE lessons SET status = 'completed', updated_at = now() WHERE id = p_lesson_id;

  UPDATE credit_wallets
  SET available_balance = available_balance - v_credits_to_deduct, updated_at = now()
  WHERE student_id = v_lesson.student_id;

  INSERT INTO credit_transactions (student_id, lesson_id, amount, type)
  VALUES (v_lesson.student_id, p_lesson_id, -v_credits_to_deduct, 'completion_deduction');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===========================================================================
-- Section 7: approve_reschedule RPC
-- Atomic cancel + new confirmed lesson. No credit change.
-- ===========================================================================
CREATE OR REPLACE FUNCTION approve_reschedule(p_lesson_id UUID) RETURNS UUID AS $$
DECLARE
  v_lesson lessons%ROWTYPE;
  v_new_lesson_id UUID;
BEGIN
  SELECT * INTO v_lesson FROM lessons WHERE id = p_lesson_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'lesson_not_found'; END IF;
  IF v_lesson.status != 'reschedule_requested' THEN RAISE EXCEPTION 'invalid_lesson_status'; END IF;
  IF v_lesson.reschedule_proposed_start IS NULL THEN RAISE EXCEPTION 'no_proposed_time'; END IF;

  UPDATE lessons SET status = 'cancelled', updated_at = now() WHERE id = p_lesson_id;

  INSERT INTO lessons (student_id, teacher_id, schedule_id, start_time, end_time, meet_link, status)
  VALUES (
    v_lesson.student_id, v_lesson.teacher_id, v_lesson.schedule_id,
    v_lesson.reschedule_proposed_start, v_lesson.reschedule_proposed_end,
    v_lesson.meet_link, 'confirmed'
  )
  RETURNING id INTO v_new_lesson_id;

  RETURN v_new_lesson_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===========================================================================
-- Section 8: reject_reschedule RPC
-- Reverts lesson to confirmed, clears reschedule fields.
-- ===========================================================================
CREATE OR REPLACE FUNCTION reject_reschedule(p_lesson_id UUID) RETURNS void AS $$
DECLARE
  v_lesson lessons%ROWTYPE;
BEGIN
  SELECT * INTO v_lesson FROM lessons WHERE id = p_lesson_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'lesson_not_found'; END IF;
  IF v_lesson.status != 'reschedule_requested' THEN RAISE EXCEPTION 'invalid_lesson_status'; END IF;

  UPDATE lessons
  SET status = 'confirmed',
      reschedule_proposed_start = NULL,
      reschedule_proposed_end   = NULL,
      reschedule_requested_by   = NULL,
      updated_at                = now()
  WHERE id = p_lesson_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===========================================================================
-- Section 9: Update student_available_credits RPCs to read from credit_wallets
-- ===========================================================================

-- Parameterless version (used by getSessionUser balance display)
CREATE OR REPLACE FUNCTION student_available_credits() RETURNS integer AS $$
  SELECT COALESCE(available_balance, 0)
  FROM credit_wallets
  WHERE student_id = (SELECT id FROM students WHERE profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Parameterized version (used by admin/teacher queries)
CREATE OR REPLACE FUNCTION student_available_credits(p_student_id UUID) RETURNS integer AS $$
  SELECT COALESCE(available_balance, 0)
  FROM credit_wallets
  WHERE student_id = p_student_id
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- ===========================================================================
-- Section 10: Wallet seed + transaction seed
-- Seed from student_credits using total_credits - used_credits (NOT subtracting
-- reserved — see RESEARCH.md Pitfall 4; reserved Phase 3 credits resolve via
-- their own RPCs independently).
-- ===========================================================================
INSERT INTO credit_wallets (student_id, available_balance)
SELECT student_id, GREATEST(0, total_credits - used_credits)
FROM student_credits
ON CONFLICT (student_id) DO NOTHING;

-- Seed an opening 'purchase' transaction for students who have credits.
-- Represents aggregate of all past purchases as a single opening balance entry.
INSERT INTO credit_transactions (student_id, amount, type, description)
SELECT student_id, total_credits, 'purchase', 'Opening balance from Phase 3 credit history'
FROM student_credits
WHERE total_credits > 0
ON CONFLICT DO NOTHING;

-- ===========================================================================
-- Section 11: updated_at triggers
-- ===========================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create triggers if they don't already exist (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_recurring_schedules_updated_at') THEN
    CREATE TRIGGER set_recurring_schedules_updated_at
      BEFORE UPDATE ON recurring_schedules
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_lessons_updated_at') THEN
    CREATE TRIGGER set_lessons_updated_at
      BEFORE UPDATE ON lessons
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
