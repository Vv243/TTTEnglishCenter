-- Day 12 Migration: Attendance Table
-- Records per-session attendance for enrolled students

BEGIN;

CREATE TABLE attendance (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    enrollment_id   UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    session_date    DATE NOT NULL,
    session_type    VARCHAR(10) NOT NULL DEFAULT 'regular'
                    CHECK (session_type IN ('regular', 'makeup')),
    session_status  VARCHAR(10) NOT NULL DEFAULT 'completed'
                    CHECK (session_status IN ('completed', 'cancelled')),
    status          VARCHAR(10) NOT NULL DEFAULT 'present'
                    CHECK (status IN ('present', 'absent', 'late')),
    note            TEXT,
    makeup_reason   TEXT,
    recorded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicate records for same student/session
CREATE UNIQUE INDEX idx_attendance_unique
    ON attendance (enrollment_id, session_date);

-- Fast lookups by class + date (primary query pattern)
CREATE INDEX idx_attendance_class_date
    ON attendance (class_id, session_date);

-- Fast lookups by student
CREATE INDEX idx_attendance_student
    ON attendance (student_id);

-- Session cancellations — one record per cancelled session
CREATE TABLE session_cancellations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    session_date    DATE NOT NULL,
    reason          TEXT,
    message_sent    TEXT,
    cancelled_by    UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (class_id, session_date)
);

COMMIT;