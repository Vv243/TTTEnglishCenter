-- Day 11 Migration: Add new columns to payment_history
-- Run with:
-- Get-Content database/day11_migration.sql | docker exec -i tttenglish_postgres psql -U postgres -d tttenglish_dev

ALTER TABLE payment_history
  ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES enrollments(id),
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20),
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES users(id);

-- Add check constraint for payment_method
ALTER TABLE payment_history
  DROP CONSTRAINT IF EXISTS payment_history_method_check;

ALTER TABLE payment_history
  ADD CONSTRAINT payment_history_method_check
  CHECK (payment_method IN ('cash', 'bank_transfer') OR payment_method IS NULL);

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_history'
ORDER BY ordinal_position;