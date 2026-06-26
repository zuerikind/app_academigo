-- Clear all test data before go-live.
-- Keeps: profiles, students, teachers, credit_packages, subjects, teacher_subjects,
--        availability_slots, teacher_availability_ranges, teacher_availability_blockers,
--        teacher_unavailable_dates, platform_settings.

DELETE FROM reviews;
DELETE FROM payout_requests;
DELETE FROM teacher_earnings;
DELETE FROM payments;
DELETE FROM bookings;
DELETE FROM level_promotion_requests;
DELETE FROM credit_transactions;
DELETE FROM credit_wallets;
DELETE FROM student_credits;

-- Reset Stripe customer IDs so live-mode IDs are assigned fresh on first real payment
UPDATE students SET stripe_customer_id = NULL;
