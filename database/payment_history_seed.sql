-- ============================================================
-- TTTEnglishCenter — Payment History Seed (v2)
-- Fixes: removed discount_percent (not in schema)
--        fixed grade_level values (individual not ranges)
-- ============================================================

-- Drop and recreate to ensure clean state
DROP TABLE IF EXISTS payment_history CASCADE;

CREATE TABLE payment_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount      DECIMAL(12, 0) NOT NULL,
    paid_date   DATE,
    due_date    DATE NOT NULL,
    status      VARCHAR(10) NOT NULL CHECK (status IN ('paid', 'late', 'missed')),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_history_student_id ON payment_history(student_id);
CREATE INDEX idx_payment_history_due_date   ON payment_history(due_date);

-- ============================================================
-- Seed 6 months: July–December 2025
-- Tuition by grade:
--   primary_1-5    → 800,000 VND
--   secondary_6-9  → 1,000,000 VND
--   high_10-12     → 1,200,000 VND
--   adult          → 1,500,000 VND
-- ============================================================

DO $$
DECLARE
    r RECORD;
    month_offset INT;
    due DATE;
    paid DATE;
    amt DECIMAL;
    stat VARCHAR(10);
    rand FLOAT;
BEGIN
    FOR r IN
        SELECT id, payment_cluster, grade_level
        FROM students
        WHERE is_active = true
    LOOP
        -- Base tuition by grade level
        amt := CASE
            WHEN r.grade_level IN ('primary_1','primary_2','primary_3','primary_4','primary_5')       THEN 800000
            WHEN r.grade_level IN ('secondary_6','secondary_7','secondary_8','secondary_9')           THEN 1000000
            WHEN r.grade_level IN ('high_10','high_11','high_12')                                     THEN 1200000
            WHEN r.grade_level = 'adult'                                                              THEN 1500000
            ELSE 1000000
        END;

        -- 6 months: July=0 through December=5
        FOR month_offset IN 0..5 LOOP
            due := DATE '2025-07-05' + (month_offset * INTERVAL '1 month');
            rand := random();

            IF r.payment_cluster = 'always_on_time' THEN
                stat := 'paid';
                paid := due - (FLOOR(random() * 3))::INT;

            ELSIF r.payment_cluster = 'needs_reminder' THEN
                IF rand < 0.75 THEN
                    stat := 'paid';
                    paid := due + (FLOOR(random() * 7))::INT;
                ELSIF rand < 0.90 THEN
                    stat := 'late';
                    paid := due + (7 + FLOOR(random() * 14))::INT;
                ELSE
                    stat := 'missed';
                    paid := NULL;
                END IF;

            ELSIF r.payment_cluster = 'erratic' THEN
                IF rand < 0.50 THEN
                    stat := 'paid';
                    paid := due + (FLOOR(random() * 5))::INT;
                ELSIF rand < 0.75 THEN
                    stat := 'late';
                    paid := due + (10 + FLOOR(random() * 20))::INT;
                ELSE
                    stat := 'missed';
                    paid := NULL;
                END IF;

            ELSIF r.payment_cluster = 'high_risk' THEN
                IF rand < 0.25 THEN
                    stat := 'paid';
                    paid := due + (FLOOR(random() * 10))::INT;
                ELSIF rand < 0.50 THEN
                    stat := 'late';
                    paid := due + (14 + FLOOR(random() * 30))::INT;
                ELSE
                    stat := 'missed';
                    paid := NULL;
                END IF;

            ELSE -- new_student
                IF rand < 0.85 THEN
                    stat := 'paid';
                    paid := due + (FLOOR(random() * 5))::INT;
                ELSIF rand < 0.95 THEN
                    stat := 'late';
                    paid := due + (5 + FLOOR(random() * 10))::INT;
                ELSE
                    stat := 'missed';
                    paid := NULL;
                END IF;
            END IF;

            INSERT INTO payment_history (student_id, amount, paid_date, due_date, status)
            VALUES (r.id, amt, paid, due, stat);

        END LOOP;
    END LOOP;
END $$;

-- ============================================================
-- Verify
-- ============================================================
SELECT
    s.full_name,
    s.payment_cluster,
    s.grade_level,
    COUNT(*)                                                        AS months,
    SUM(CASE WHEN ph.status = 'paid'   THEN 1 ELSE 0 END)          AS paid,
    SUM(CASE WHEN ph.status = 'late'   THEN 1 ELSE 0 END)          AS late,
    SUM(CASE WHEN ph.status = 'missed' THEN 1 ELSE 0 END)          AS missed,
    TO_CHAR(SUM(ph.amount), 'FM999,999,999')                       AS total_billed_vnd
FROM payment_history ph
JOIN students s ON s.id = ph.student_id
GROUP BY s.full_name, s.payment_cluster, s.grade_level
ORDER BY s.payment_cluster, s.full_name;