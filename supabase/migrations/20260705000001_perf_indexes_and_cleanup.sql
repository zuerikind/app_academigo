-- Performance indexes + dead-object cleanup (2026-07-05 review, P1 + S3)
--
-- P1: index the FK/filter columns that every dashboard query hits but that
--     were never indexed. Low volume today, but these are sequential scans
--     that grow linearly with bookings/earnings.
-- S3: drop the credit_wallets table (no live reader/writer since complete_lesson
--     was moved to student_credits) and the unused student_available_credits(uuid)
--     overload (no caller passes p_student_id).

-- ===========================================================================
-- P1: indexes
-- ===========================================================================

-- Earnings: filtered by teacher_id in every earnings/payout query
CREATE INDEX IF NOT EXISTS teacher_earnings_teacher_id_idx
  ON teacher_earnings (teacher_id);

-- Reviews: filtered by teacher_id on every teacher card, profile, aggregate
CREATE INDEX IF NOT EXISTS reviews_teacher_id_idx
  ON reviews (teacher_id);

-- Join tables: looked up by their FK on nearly every booking/teacher render
CREATE INDEX IF NOT EXISTS booking_subjects_booking_id_idx
  ON booking_subjects (booking_id);
CREATE INDEX IF NOT EXISTS teacher_subjects_teacher_id_idx
  ON teacher_subjects (teacher_id);

-- Bookings: dashboards + availability filter (teacher|student, status) and
-- range/order by start_time. Composite serves all three predicates at once;
-- the existing single-column indexes only cover one.
CREATE INDEX IF NOT EXISTS bookings_teacher_status_start_idx
  ON bookings (teacher_id, status, start_time);
CREATE INDEX IF NOT EXISTS bookings_student_status_start_idx
  ON bookings (student_id, status, start_time);

-- ===========================================================================
-- S3: drop dead objects
-- ===========================================================================

-- credit_wallets: never credited by purchases; complete_lesson now deducts from
-- student_credits (20260703000001). No FK references it, no function reads it.
-- CASCADE removes its RLS policy.
DROP TABLE IF EXISTS credit_wallets CASCADE;

-- student_available_credits(uuid): no caller passes a parameter — only the
-- session-scoped no-arg overload is used. Keep student_available_credits().
DROP FUNCTION IF EXISTS student_available_credits(UUID);
