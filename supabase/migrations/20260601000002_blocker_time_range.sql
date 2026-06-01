-- Add optional time range to availability blockers.
-- NULL start_time/end_time means the entire day is blocked.
-- A non-null pair means only that time window is blocked.

ALTER TABLE teacher_availability_blockers
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME;

-- Drop the whole-day unique constraint; teachers can now have multiple
-- partial-day blockers on the same date with different time windows.
ALTER TABLE teacher_availability_blockers
  DROP CONSTRAINT IF EXISTS teacher_availability_blockers_teacher_id_blocked_date_key;
