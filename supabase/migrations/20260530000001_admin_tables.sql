-- Migration: Admin portal tables
-- level_promotion_requests: teacher tier promotion requests for admin review
-- payout_requests: teacher payout requests for admin processing

BEGIN;

CREATE TABLE IF NOT EXISTS level_promotion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  requested_level TEXT NOT NULL CHECK (requested_level IN ('academigo_teacher', 'verified')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  amount_chf NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for admin list queries (ordered by created_at DESC)
CREATE INDEX IF NOT EXISTS level_promotion_requests_created_at_idx ON level_promotion_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS payout_requests_status_idx ON payout_requests(status);

COMMIT;
