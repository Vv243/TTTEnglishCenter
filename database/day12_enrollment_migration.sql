-- Day 12 Migration: Enrollment Status Overhaul
-- Old statuses: active, dropped, completed, suspended, waitlisted
-- New statuses: pending, enrolled, waitlisted, withdrawn

BEGIN;

-- 1. Drop the old status constraint
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_status_check;

-- 2. Drop the unique index that keys on 'active' — will recreate for 'enrolled'
DROP INDEX IF EXISTS idx_unique_active_enrollment;

-- 3. Migrate existing data to new statuses
UPDATE enrollments SET status = 'enrolled'   WHERE status = 'active';
UPDATE enrollments SET status = 'withdrawn'  WHERE status IN ('dropped', 'completed', 'suspended');
-- 'waitlisted' stays as-is

-- 4. Update the column default
ALTER TABLE enrollments ALTER COLUMN status SET DEFAULT 'pending';

-- 5. Add new status constraint
ALTER TABLE enrollments ADD CONSTRAINT enrollments_status_check
  CHECK (status IN ('pending', 'enrolled', 'waitlisted', 'withdrawn'));

-- 6. Recreate unique index for 'enrolled' (prevent duplicate active enrollments)
CREATE UNIQUE INDEX idx_unique_enrolled_enrollment
  ON enrollments (student_id, class_id)
  WHERE status = 'enrolled';

COMMIT;