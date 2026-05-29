-- Migration: Update teacher_level CHECK constraint to 3-tier system
-- Replaces: CHECK (teacher_level IN ('standard', 'verified'))
-- With:     CHECK (teacher_level IN ('junior', 'academigo_teacher', 'verified'))
-- Migrates: All existing rows from 'standard' -> 'junior'

BEGIN;

-- Drop old 2-value constraint
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_teacher_level_check;

-- Add new 3-value constraint
ALTER TABLE teachers ADD CONSTRAINT teachers_teacher_level_check
  CHECK (teacher_level IN ('junior', 'academigo_teacher', 'verified'));

-- Update column default
ALTER TABLE teachers ALTER COLUMN teacher_level SET DEFAULT 'junior';

-- Migrate existing data: standard -> junior
UPDATE teachers SET teacher_level = 'junior' WHERE teacher_level = 'standard';

COMMIT;
