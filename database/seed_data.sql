-- ============================================================================
-- TTTEnglishCenter Seed Data
-- Sample data for development and testing
-- ============================================================================

-- Clear existing data (in reverse order of dependencies)
TRUNCATE TABLE enrollments CASCADE;
TRUNCATE TABLE classes CASCADE;
TRUNCATE TABLE students CASCADE;
TRUNCATE TABLE teachers CASCADE;

-- ============================================================================
-- SEED TEACHERS (3 teachers)
-- ============================================================================

INSERT INTO teachers (id, email, password_hash, full_name, phone, zalo_id, role, specializations, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'nguyen.thu@tttenglish.vn', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS8e6F.3u', 'Nguyễn Thị Thu', '0912345678', 'nguyenthu_zalo', 'admin', ARRAY['IELTS', 'TOEFL', 'Elementary'], true),
    ('660e8400-e29b-41d4-a716-446655440001', 'tran.mai@tttenglish.vn', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS8e6F.3u', 'Trần Thị Mai', '0987654321', 'tranmai_zalo', 'teacher', ARRAY['TOEFL', 'SAT', 'Advanced'], true),
    ('770e8400-e29b-41d4-a716-446655440002', 'le.anh@tttenglish.vn', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS8e6F.3u', 'Lê Văn Anh', '0901234567', 'leanh_zalo', 'teacher', ARRAY['IELTS', 'Intermediate'], true);

-- Password for all: "password123"

COMMENT ON TABLE teachers IS 'Seeded with 3 teachers: Thu (admin/mom), Mai (aunt 1), Anh (aunt 2)';

-- ============================================================================
-- SEED STUDENTS (20 sample students)
-- ============================================================================

INSERT INTO students (id, full_name, date_of_birth, grade_level, phone, email, parent_name, parent_phone, parent_email, parent_zalo, address, district, city, english_level, payment_cluster, is_active) VALUES
    -- Primary students (5)
    ('880e8400-e29b-41d4-a716-446655440001', 'Phạm Minh Tuấn', '2015-03-15', 'primary_3', NULL, NULL, 'Phạm Văn Hùng', '0909111222', 'phamhung@gmail.com', 'phamhung_zalo', '123 Lê Lợi, Quận 1', 'Quận 1', 'Ho Chi Minh City', 'elementary', 'new_student', true),
    ('880e8400-e29b-41d4-a716-446655440002', 'Ngô Thanh Hà', '2014-07-22', 'primary_4', NULL, NULL, 'Ngô Minh Châu', '0909222333', 'ngochau@gmail.com', 'ngochau_zalo', '456 Nguyễn Huệ, Quận 1', 'Quận 1', 'Ho Chi Minh City', 'elementary', 'always_on_time', true),
    ('880e8400-e29b-41d4-a716-446655440003', 'Đặng Quốc Bảo', '2015-11-08', 'primary_3', NULL, NULL, 'Đặng Thị Lan', '0909333444', 'danglan@gmail.com', 'danglan_zalo', '789 Trần Hưng Đạo, Quận 5', 'Quận 5', 'Ho Chi Minh City', 'beginner', 'needs_reminder', true),
    ('880e8400-e29b-41d4-a716-446655440004', 'Võ Hoàng Anh', '2013-05-19', 'primary_5', NULL, NULL, 'Võ Thị Hoa', '0909444555', 'vohoa@gmail.com', 'vohoa_zalo', '321 Lý Thái Tổ, Quận 10', 'Quận 10', 'Ho Chi Minh City', 'pre_intermediate', 'always_on_time', true),
    ('880e8400-e29b-41d4-a716-446655440005', 'Bùi Thị Ngọc', '2014-09-30', 'primary_4', NULL, NULL, 'Bùi Văn Toàn', '0909555666', 'buitoan@gmail.com', 'buitoan_zalo', '654 Hai Bà Trưng, Quận 3', 'Quận 3', 'Ho Chi Minh City', 'elementary', 'new_student', true),
    
    -- Lower Secondary students (8)
    ('880e8400-e29b-41d4-a716-446655440006', 'Hoàng Minh Khôi', '2011-02-14', 'secondary_7', '0911111111', 'khoi.hoang@student.com', 'Hoàng Văn Nam', '0909666777', 'hoangnam@gmail.com', 'hoangnam_zalo', '111 Điện Biên Phủ, Bình Thạnh', 'Bình Thạnh', 'Ho Chi Minh City', 'intermediate', 'always_on_time', true),
    ('880e8400-e29b-41d4-a716-446655440007', 'Lý Thanh Tâm', '2012-06-25', 'secondary_6', '0911222222', 'tam.ly@student.com', 'Lý Thị Hương', '0909777888', 'lyhuong@gmail.com', 'lyhuong_zalo', '222 Cách Mạng Tháng 8, Quận 10', 'Quận 10', 'Ho Chi Minh City', 'pre_intermediate', 'needs_reminder', true),
    ('880e8400-e29b-41d4-a716-446655440008', 'Trịnh Quang Dũng', '2010-11-03', 'secondary_8', '0911333333', 'dung.trinh@student.com', 'Trịnh Văn Sơn', '0909888999', 'trinhson@gmail.com', 'trinhson_zalo', '333 Võ Văn Tần, Quận 3', 'Quận 3', 'Ho Chi Minh City', 'intermediate', 'high_risk', true),
    ('880e8400-e29b-41d4-a716-446655440009', 'Đỗ Thị Lan Anh', '2011-04-17', 'secondary_7', '0911444444', 'lananh.do@student.com', 'Đỗ Văn Phú', '0909000111', 'dophu@gmail.com', 'dophu_zalo', '444 Lê Văn Sỹ, Quận 3', 'Quận 3', 'Ho Chi Minh City', 'upper_intermediate', 'always_on_time', true),
    ('880e8400-e29b-41d4-a716-446655440010', 'Phan Công Minh', '2012-08-20', 'secondary_6', '0911555555', 'minh.phan@student.com', 'Phan Thị Thu', '0909111000', 'phanthu@gmail.com', 'phanthu_zalo', '555 Hoàng Văn Thụ, Tân Bình', 'Tân Bình', 'Ho Chi Minh City', 'intermediate', 'erratic', true),
    ('880e8400-e29b-41d4-a716-446655440011', 'Vương Thị Mai', '2010-12-05', 'secondary_8', '0911666666', 'mai.vuong@student.com', 'Vương Văn Tuấn', '0909222111', 'vuongtuan@gmail.com', 'vuongtuan_zalo', '666 Nguyễn Thị Minh Khai, Q1', 'Quận 1', 'Ho Chi Minh City', 'advanced', 'always_on_time', true),
    ('880e8400-e29b-41d4-a716-446655440012', 'Đinh Hoàng Long', '2011-01-28', 'secondary_7', '0911777777', 'long.dinh@student.com', 'Đinh Thị Nga', '0909333222', 'dinhnga@gmail.com', 'dinhnga_zalo', '777 Phan Xích Long, Phú Nhuận', 'Phú Nhuận', 'Ho Chi Minh City', 'intermediate', 'needs_reminder', true),
    ('880e8400-e29b-41d4-a716-446655440013', 'Nguyễn Bảo Trân', '2009-10-12', 'secondary_9', '0911888888', 'tran.nguyen@student.com', 'Nguyễn Văn Hải', '0909444333', 'nguyenhai@gmail.com', 'nguyenhai_zalo', '888 Nguyễn Văn Trỗi, Tân Bình', 'Tân Bình', 'Ho Chi Minh City', 'upper_intermediate', 'always_on_time', true),
    
    -- Upper Secondary students (7)
    ('880e8400-e29b-41d4-a716-446655440014', 'Trần Đức Anh', '2008-03-11', 'high_10', '0911999999', 'ducanh.tran@student.com', 'Trần Thị Bích', '0909555444', 'tranbich@gmail.com', 'tranbich_zalo', '999 Lý Thường Kiệt, Quận 10', 'Quận 10', 'Ho Chi Minh City', 'upper_intermediate', 'needs_reminder', true),
    ('880e8400-e29b-41d4-a716-446655440015', 'Lê Minh Tú', '2007-07-05', 'high_11', '0912000000', 'minhtu.le@student.com', 'Lê Văn Đức', '0909666555', 'leduc@gmail.com', 'leduc_zalo', '100 Trần Quốc Toản, Quận 3', 'Quận 3', 'Ho Chi Minh City', 'advanced', 'always_on_time', true),
    ('880e8400-e29b-41d4-a716-446655440016', 'Phùng Thị Hương', '2008-09-23', 'high_10', '0912111111', 'huong.phung@student.com', 'Phùng Văn Tài', '0909777666', 'phungtai@gmail.com', 'phungtai_zalo', '200 Nguyễn Đình Chiểu, Q3', 'Quận 3', 'Ho Chi Minh City', 'intermediate', 'high_risk', true),
    ('880e8400-e29b-41d4-a716-446655440017', 'Đào Quang Huy', '2006-11-30', 'high_12', '0912222222', 'quanghuy.dao@student.com', 'Đào Thị Lan', '0909888777', 'daolan@gmail.com', 'daolan_zalo', '300 Pasteur, Quận 1', 'Quận 1', 'Ho Chi Minh City', 'advanced', 'always_on_time', true),
    ('880e8400-e29b-41d4-a716-446655440018', 'Ngô Thị Phương', '2007-05-16', 'high_11', '0912333333', 'phuong.ngo@student.com', 'Ngô Văn Bình', '0909999888', 'ngobinh@gmail.com', 'ngobinh_zalo', '400 Hai Bà Trưng, Quận 1', 'Quận 1', 'Ho Chi Minh City', 'upper_intermediate', 'always_on_time', true),
    ('880e8400-e29b-41d4-a716-446655440019', 'Lâm Văn Thịnh', '2008-02-08', 'high_10', '0912444444', 'thinh.lam@student.com', 'Lâm Thị Hồng', '0900111222', 'lamhong@gmail.com', 'lamhong_zalo', '500 Cộng Hòa, Tân Bình', 'Tân Bình', 'Ho Chi Minh City', 'intermediate', 'erratic', true),
    ('880e8400-e29b-41d4-a716-446655440020', 'Vũ Minh Đức', '2006-12-19', 'high_12', '0912555555', 'minhduc.vu@student.com', 'Vũ Văn Thắng', '0900222333', 'vuthang@gmail.com', 'vuthang_zalo', '600 Nguyễn Trãi, Quận 5', 'Quận 5', 'Ho Chi Minh City', 'advanced', 'always_on_time', true);

COMMENT ON TABLE students IS 'Seeded with 20 students: 5 primary, 8 secondary, 7 high school';

-- ============================================================================
-- SEED CLASSES (6 classes across 3 teachers)
-- ============================================================================

INSERT INTO classes (id, class_code, class_name, teacher_id, day_of_week, start_time, end_time, room_number, level, curriculum, max_students, semester, start_date, end_date, total_sessions, sessions_per_month, tuition_per_session, status) VALUES
    -- Teacher Thu's classes
    ('990e8400-e29b-41d4-a716-446655440001', 'IELTS-7.0-MON-19H', 'IELTS Writing 7.0', '550e8400-e29b-41d4-a716-446655440000', 0, '19:00', '20:30', 'Room 1', 'advanced', 'IELTS Official', 12, 'Spring 2025', '2025-02-03', '2025-05-26', 48, 8, 400000, 'active'),
    ('990e8400-e29b-41d4-a716-446655440002', 'ELEM-4-WED-17H', 'Elementary Grade 4', '550e8400-e29b-41d4-a716-446655440000', 2, '17:00', '18:30', 'Room 2', 'elementary', 'Cambridge Young Learners', 15, 'Spring 2025', '2025-02-05', '2025-05-28', 48, 8, 300000, 'active'),
    
    -- Teacher Mai's classes
    ('990e8400-e29b-41d4-a716-446655440003', 'TOEFL-100-TUE-19H', 'TOEFL 100+ Intensive', '660e8400-e29b-41d4-a716-446655440001', 1, '19:00', '20:30', 'Room 1', 'advanced', 'TOEFL iBT Official', 10, 'Spring 2025', '2025-02-04', '2025-05-27', 48, 8, 450000, 'active'),
    ('990e8400-e29b-41d4-a716-446655440004', 'INTER-7-THU-17H', 'Intermediate Grade 7', '660e8400-e29b-41d4-a716-446655440001', 3, '17:00', '18:30', 'Room 2', 'intermediate', 'Oxford Solutions', 12, 'Spring 2025', '2025-02-06', '2025-05-29', 48, 8, 350000, 'active'),
    
    -- Teacher Anh's classes
    ('990e8400-e29b-41d4-a716-446655440005', 'IELTS-6.5-FRI-19H', 'IELTS Speaking 6.5', '770e8400-e29b-41d4-a716-446655440002', 4, '19:00', '20:30', 'Room 1', 'upper_intermediate', 'IELTS Official', 12, 'Spring 2025', '2025-02-07', '2025-05-30', 48, 8, 380000, 'active'),
    ('990e8400-e29b-41d4-a716-446655440006', 'INTER-6-SAT-14H', 'Intermediate Grade 6', '770e8400-e29b-41d4-a716-446655440002', 5, '14:00', '15:30', 'Room 3', 'pre_intermediate', 'Cambridge English', 15, 'Spring 2025', '2025-02-08', '2025-05-31', 48, 8, 320000, 'active');

COMMENT ON TABLE classes IS 'Seeded with 6 classes: 2 IELTS, 1 TOEFL, 3 grade-based';

-- ============================================================================
-- SEED ENROLLMENTS (Distribute students across classes)
-- ============================================================================

INSERT INTO enrollments (student_id, class_id, enrollment_date, status, agreed_tuition_per_session, discount_percent, discount_reason) VALUES
    -- ELEM-4-WED-17H (Primary students)
    ('880e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440002', '2025-01-15', 'active', 300000, 0, NULL),
    ('880e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', '2025-01-10', 'active', 300000, 10, 'Early bird discount'),
    ('880e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440002', '2025-01-20', 'active', 300000, 15, 'Sibling discount'),
    ('880e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440002', '2025-01-12', 'active', 300000, 0, NULL),
    ('880e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440002', '2025-01-25', 'active', 300000, 0, NULL),
    
    -- INTER-6-SAT-14H (Grade 6 students)
    ('880e8400-e29b-41d4-a716-446655440007', '990e8400-e29b-41d4-a716-446655440006', '2025-01-18', 'active', 320000, 0, NULL),
    ('880e8400-e29b-41d4-a716-446655440010', '990e8400-e29b-41d4-a716-446655440006', '2025-01-22', 'active', 320000, 10, 'Early bird discount'),
    
    -- INTER-7-THU-17H (Grade 7 students)
    ('880e8400-e29b-41d4-a716-446655440006', '990e8400-e29b-41d4-a716-446655440004', '2025-01-14', 'active', 350000, 0, NULL),
    ('880e8400-e29b-41d4-a716-446655440009', '990e8400-e29b-41d4-a716-446655440004', '2025-01-16', 'active', 350000, 15, 'Sibling discount'),
    ('880e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440004', '2025-01-19', 'active', 350000, 0, NULL),
    
    -- IELTS-6.5-FRI-19H (Upper intermediate)
    ('880e8400-e29b-41d4-a716-446655440009', '990e8400-e29b-41d4-a716-446655440005', '2025-01-17', 'active', 380000, 0, NULL),
    ('880e8400-e29b-41d4-a716-446655440013', '990e8400-e29b-41d4-a716-446655440005', '2025-01-21', 'active', 380000, 10, 'Early bird discount'),
    ('880e8400-e29b-41d4-a716-446655440018', '990e8400-e29b-41d4-a716-446655440005', '2025-01-23', 'active', 380000, 0, NULL),
    
    -- IELTS-7.0-MON-19H (Advanced)
    ('880e8400-e29b-41d4-a716-446655440011', '990e8400-e29b-41d4-a716-446655440001', '2025-01-11', 'active', 400000, 0, NULL),
    ('880e8400-e29b-41d4-a716-446655440015', '990e8400-e29b-41d4-a716-446655440001', '2025-01-13', 'active', 400000, 15, 'Scholarship (top student)'),
    ('880e8400-e29b-41d4-a716-446655440017', '990e8400-e29b-41d4-a716-446655440001', '2025-01-15', 'active', 400000, 0, NULL),
    ('880e8400-e29b-41d4-a716-446655440020', '990e8400-e29b-41d4-a716-446655440001', '2025-01-20', 'active', 400000, 10, 'Early bird discount'),
    
    -- TOEFL-100-TUE-19H (Advanced)
    ('880e8400-e29b-41d4-a716-446655440008', '990e8400-e29b-41d4-a716-446655440003', '2025-01-16', 'active', 450000, 0, NULL),
    ('880e8400-e29b-41d4-a716-446655440014', '990e8400-e29b-41d4-a716-446655440003', '2025-01-18', 'active', 450000, 15, 'Sibling discount'),
    ('880e8400-e29b-41d4-a716-446655440016', '990e8400-e29b-41d4-a716-446655440003', '2025-01-24', 'active', 450000, 0, NULL),
    ('880e8400-e29b-41d4-a716-446655440019', '990e8400-e29b-41d4-a716-446655440003', '2025-01-26', 'active', 450000, 0, NULL);

-- Update class enrollment counts
UPDATE classes SET current_enrollment = (
    SELECT COUNT(*) FROM enrollments 
    WHERE enrollments.class_id = classes.id 
      AND enrollments.status = 'active'
);

COMMENT ON TABLE enrollments IS 'Seeded with 20 enrollments distributed across 6 classes';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show summary
DO $$
DECLARE
    teacher_count INT;
    student_count INT;
    class_count INT;
    enrollment_count INT;
BEGIN
    SELECT COUNT(*) INTO teacher_count FROM teachers;
    SELECT COUNT(*) INTO student_count FROM students;
    SELECT COUNT(*) INTO class_count FROM classes;
    SELECT COUNT(*) INTO enrollment_count FROM enrollments;
    
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'TTTEnglishCenter Database Seeded!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Teachers: %', teacher_count;
    RAISE NOTICE 'Students: %', student_count;
    RAISE NOTICE 'Classes: %', class_count;
    RAISE NOTICE 'Enrollments: %', enrollment_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Login Credentials:';
    RAISE NOTICE '  Admin: nguyen.thu@tttenglish.vn / password123';
    RAISE NOTICE '  Teacher: tran.mai@tttenglish.vn / password123';
    RAISE NOTICE '  Teacher: le.anh@tttenglish.vn / password123';
    RAISE NOTICE '====================================';
END $$;