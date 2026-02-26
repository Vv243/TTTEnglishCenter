// Teacher types
export interface Teacher {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  zalo_id: string | null;
  whatsapp_number: string | null;
  role: "admin" | "teacher" | "assistant";
  specializations: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Student types
export type GradeLevel =
  | "primary_1"
  | "primary_2"
  | "primary_3"
  | "primary_4"
  | "primary_5"
  | "secondary_6"
  | "secondary_7"
  | "secondary_8"
  | "secondary_9"
  | "high_10"
  | "high_11"
  | "high_12";
    "adult";

export type PaymentCluster =
  | "new_student"
  | "always_on_time"
  | "needs_reminder"
  | "high_risk"
  | "erratic";

export interface Student {
  id: string;
  full_name: string;
  date_of_birth: string;
  grade_level: GradeLevel | null;
  parent_name: string;
  parent_phone: string;
  parent_email: string | null;
  parent_zalo_id: string | null;
  parent_whatsapp: string | null;
  street_address: string | null;
  ward: string | null;
  province_city: string | null;
  english_level: string | null;
  target_exam: string | null;
  notes: string | null;
  payment_cluster: PaymentCluster;
  previous_center: string | null;
  referral_source: string | null;
  emergency_contact: string | null;
  medical_notes: string | null;
  is_active: boolean;
  enrollment_date: string;
  created_at: string;
  updated_at: string;
}

// Class types
export type ClassLevel =
  | "primary_1"
  | "primary_2"
  | "primary_3"
  | "primary_4"
  | "primary_5"
  | "secondary_6"
  | "secondary_7"
  | "secondary_8"
  | "secondary_9"
  | "high_10"
  | "high_11"
  | "high_12"
  | "starters"
  | "movers"
  | "flyers"
  | "ket"
  | "pet"
  | "fce"
  | "ielts"
  | "toefl"
  | "sat"
  | "general_english";

export type ClassStatus = "scheduled" | "active" | "completed" | "cancelled";

export interface Class {
  id: string;
  class_code: string;
  class_name: string;
  teacher_id: string;
  teacher?: Teacher;
  assistant_teacher_id: string | null;
  assistant_teacher?: Teacher | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  level: ClassLevel;
  room: string | null;
  max_students: number;
  current_enrollment: number;
  semester: string | null;
  academic_year: string | null;
  start_date: string;
  end_date: string;
  total_sessions: number;
  tuition_per_session: number;
  currency: string;
  description: string | null;
  syllabus_url: string | null;
  status: ClassStatus;
  created_at: string;
  updated_at: string;
}

// Enrollment types
export type EnrollmentStatus =
  | "active"
  | "dropped"
  | "completed"
  | "suspended"
  | "waitlisted";

export interface Enrollment {
  id: string;
  student_id: string;
  student?: Student;
  class_id: string;
  class?: Class;
  enrollment_date: string;
  status: EnrollmentStatus;
  agreed_tuition_per_session: number;
  discount_percent: number;
  attendance_rate: number | null;
  absences: number;
  tardies: number;
  average_score: number | null;
  last_test_score: number | null;
  last_test_date: string | null;
  progress_notes: string | null;
  parent_feedback: string | null;
  behavioral_notes: string | null;
  homework_completion_rate: number | null;
  participation_score: number | null;
  progress_trend: string | null;
  predicted_final_score: number | null;
  created_at: string;
  updated_at: string;
}

// Statistics types
export interface StatsSummary {
  active_teachers: number;
  active_students: number;
  active_classes: number;
  active_enrollments: number;
}

export interface DashboardStats {
  summary: StatsSummary;
  teachers: { total: number; active: number };
  students: {
    total: number;
    active: number;
    payment_clusters: Record<PaymentCluster, number>;
  };
  classes: { total: number; by_status: Record<ClassStatus, number> };
  enrollments: { total: number; active: number };
  teacher_class_count: Array<{ teacher_name: string; class_count: number }>; // ← add this
}

// API Response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// API Error type
export interface APIError {
  detail: string;
}
