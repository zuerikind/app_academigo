-- Link teacher_earnings rows to the payout_request they belong to.
-- Earnings created before this migration will have payout_request_id = NULL;
-- they are considered "orphaned" and the detail view will show no sessions for them.

ALTER TABLE teacher_earnings
  ADD COLUMN IF NOT EXISTS payout_request_id UUID REFERENCES payout_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS teacher_earnings_payout_request_id_idx
  ON teacher_earnings (payout_request_id);
