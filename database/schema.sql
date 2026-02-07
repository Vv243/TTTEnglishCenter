-- ============================================================================
-- TTTEnglishCenter Database Schema
-- Phase 1: Core Entities (Teachers, Students, Classes, Enrollments)
-- ============================================================================
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';


-- ============================================================================
-- 1. TEACHERS TABLE
-- ============================================================================
CREATe TABLE teachers(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Authentication & Identity
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,

    -- Vietnamese-specific fields
    zalo_id VARCHAR(50),
    whatsapp_number VARCHAR(20),

     -- Role & Permissions
    role VARCHAR(20) NOT NULL DEFAULT 'teacher' 
        CHECK (role IN ('admin', 'teacher', 'assistant')),
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Profile
    bio TEXT,
    specializations TEXT[],

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE TRIGGER update_teachers_updated_at 
    BEFORE UPDATE ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE teachers IS 'Teacher profiles, authentication, and contact info';


-- ============================================================================
-- 2. STUDENTS TABLE
-- ============================================================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Student Identity
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    grade_level VARCHAR(20) NOT NULL 
        CHECK (grade_level IN (
            'primary_1', 'primary_2', 'primary_3', 'primary_4', 'primary_5',
            'secondary_6', 'secondary_7', 'secondary_8', 'secondary_9',
            'high_10', 'high_11', 'high_12',
            'ielts', 'toefl', 'sat', 'toeic'
        )),
    
    -- Contact
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Parent/Guardian Contact
    parent_name VARCHAR(100) NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,
    parent_email VARCHAR(255),
    parent_zalo VARCHAR(50),
    secondary_contact_name VARCHAR(100),
    secondary_contact_phone VARCHAR(20),
    
    -- Address
    address TEXT NOT NULL,
    district VARCHAR(100),
    city VARCHAR(100) NOT NULL DEFAULT 'Ho Chi Minh City',
    
    -- Academic Info
    english_level VARCHAR(20) CHECK (english_level IN (
        'beginner', 'elementary', 'pre_intermediate', 
        'intermediate', 'upper_intermediate', 'advanced'
    )),
    target_exam VARCHAR(50),
    current_school_name VARCHAR(200),
    current_school_type VARCHAR(20) CHECK (current_school_type IN (
        'public', 'private', 'international', 'unknown'
    )),
    
    -- Payment Behavior (ML)
    payment_cluster VARCHAR(20) DEFAULT 'new_student' 
        CHECK (payment_cluster IN (
            'new_student', 'always_on_time', 'needs_reminder', 
            'high_risk', 'erratic'
        )),
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    withdrawal_date DATE,
    withdrawal_reason TEXT,
    
    -- Notes
    notes TEXT,
    medical_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE students ADD CONSTRAINT check_withdrawal_after_enrollment
    CHECK (withdrawal_date IS NULL OR withdrawal_date >= enrollment_date);

ALTER TABLE students ADD CONSTRAINT check_reasonable_age
    CHECK (date_of_birth >= CURRENT_DATE - INTERVAL '20 years' 
       AND date_of_birth <= CURRENT_DATE - INTERVAL '5 years');

COMMENT ON TABLE students IS 'Student profiles with parent contacts (Vietnam education system)';

-- ============================================================================
-- 3. CLASSES TABLE
-- ============================================================================
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Class Identity
    class_code VARCHAR(20) NOT NULL UNIQUE,
    class_name VARCHAR(100) NOT NULL,
    
    -- Teacher Assignment
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    assistant_teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    
    -- Schedule
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CHECK (end_time > start_time),
    
    -- Location
    room_number VARCHAR(20),
    building VARCHAR(50),
    
    -- Academic Details
    level VARCHAR(20) NOT NULL CHECK (level IN (
        'elementary', 'pre_intermediate', 'intermediate', 
        'upper_intermediate', 'advanced', 'ielts', 'toefl', 'sat'
    )),
    curriculum VARCHAR(50),
    textbook VARCHAR(100),
    
    -- Capacity
    max_students INTEGER NOT NULL DEFAULT 15 CHECK (max_students > 0 AND max_students <= 30),
    current_enrollment INTEGER NOT NULL DEFAULT 0 CHECK (current_enrollment >= 0),
    CHECK (current_enrollment <= max_students),
    
    -- Semester/Term
    semester VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CHECK (end_date > start_date),
    total_sessions INTEGER NOT NULL CHECK (total_sessions > 0),
    sessions_per_month INTEGER NOT NULL DEFAULT 4 CHECK (sessions_per_month > 0 AND sessions_per_month <= 20),
    
    -- Pricing
    tuition_per_session DECIMAL(10, 2) NOT NULL CHECK (tuition_per_session > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    
    -- Notes
    description TEXT,
    prerequisites TEXT,
    learning_objectives TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_classes_updated_at 
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Prevent teacher double-booking
CREATE UNIQUE INDEX idx_teacher_schedule_unique ON classes (
    teacher_id, day_of_week, start_time
) WHERE status IN ('scheduled', 'active');

-- Prevent room conflicts
CREATE UNIQUE INDEX idx_room_schedule_unique ON classes (
    room_number, day_of_week, start_time
) WHERE status IN ('scheduled', 'active') AND room_number IS NOT NULL;

COMMENT ON TABLE classes IS 'Class schedules, teacher assignments, and curriculum';

-- ============================================================================
-- 4. ENROLLMENTS TABLE
-- ============================================================================
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    
    -- Enrollment Details
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'dropped', 'completed', 'suspended', 'waitlisted')),
    
    -- Waitlist tracking
    waitlist_position INTEGER CHECK (waitlist_position > 0),
    waitlist_date TIMESTAMP WITH TIME ZONE,
    
    -- Drop/Withdrawal Info
    drop_date DATE,
    drop_reason TEXT,
    CHECK (drop_date IS NULL OR drop_date >= enrollment_date),
    
    -- Payment Agreement
    agreed_tuition_per_session DECIMAL(10, 2) NOT NULL CHECK (agreed_tuition_per_session > 0),
    discount_percent DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    discount_reason TEXT,
    
    -- Academic Progress (Cached)
    attendance_rate DECIMAL(5, 2) DEFAULT 0 CHECK (attendance_rate >= 0 AND attendance_rate <= 100),
    average_score DECIMAL(5, 2) CHECK (average_score >= 0 AND average_score <= 100),
    last_test_score DECIMAL(5, 2) CHECK (last_test_score >= 0 AND last_test_score <= 100),
    last_test_date DATE,
    progress_trend VARCHAR(20) CHECK (progress_trend IN ('improving', 'stable', 'declining', 'insufficient_data')),
    predicted_final_score DECIMAL(5, 2) CHECK (predicted_final_score >= 0 AND predicted_final_score <= 100),
    prediction_confidence DECIMAL(5, 2) CHECK (prediction_confidence >= 0 AND prediction_confidence <= 100),
    prediction_updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_enrollments_updated_at 
    BEFORE UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE UNIQUE INDEX idx_unique_active_enrollment ON enrollments (student_id, class_id)
    WHERE status = 'active';

CREATE UNIQUE INDEX idx_unique_waitlist_position ON enrollments (class_id, waitlist_position)
    WHERE status = 'waitlisted';

-- Waitlist validation
CREATE OR REPLACE FUNCTION check_waitlist_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'waitlisted' THEN
        IF NEW.waitlist_position IS NULL OR NEW.waitlist_date IS NULL THEN
            RAISE EXCEPTION 'Waitlisted enrollments must have waitlist_position and waitlist_date';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_waitlist_data
    BEFORE INSERT OR UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION check_waitlist_data();

COMMENT ON TABLE enrollments IS 'Student-class relationships with academic tracking and waitlist';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Teachers
CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_teachers_role ON teachers(role) WHERE is_active = true;

-- Students
CREATE INDEX idx_students_parent_phone ON students(parent_phone);
CREATE INDEX idx_students_payment_cluster ON students(payment_cluster);
CREATE INDEX idx_students_is_active ON students(is_active);
CREATE INDEX idx_students_grade_level ON students(grade_level);

-- Classes
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX idx_classes_semester ON classes(semester);
CREATE INDEX idx_classes_status ON classes(status);
CREATE INDEX idx_classes_schedule ON classes(day_of_week, start_time);

-- Enrollments
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);