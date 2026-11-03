export interface CourseSectionItem {
  id: string;
  tenant_id: string;
  subject_id: string;
  department_id?: string | null;
  name: string;
  batch?: string | null;
  default_room_id?: string | null;
  created_at: string;
  updated_at: string;
  subject_name?: string | null;
  subject_code?: string | null;
  default_room_name?: string | null;
  enrolled_count?: number;
}

export interface TimetableRuleItem {
  id: string;
  tenant_id: string;
  course_section_id: string;
  classroom_id?: string | null;
  teacher_id?: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  effective_from: string;
  effective_until?: string | null;
  is_active: boolean;
  teacher_name?: string | null;
  classroom_name?: string | null;
}

/** One dated class of the signed-in teacher, from GET /faculty/daily-schedule. */
export interface DailyOccurrenceItem {
  id: string;
  course_section_id: string;
  date: string;
  status: "SCHEDULED" | "CONDUCTED" | "CANCELLED" | "RESCHEDULED";
  is_attendance_locked: boolean;
  verification_active: boolean;
  verification_expires?: string | null;
  class_code: string;
  course_name: string;
  subject_code: string;
  section_name: string;
  classroom_name: string;
  start_time: string;
  end_time: string;
  present_count: number;
  total_enrolled: number;
}

export interface TeacherClassItem {
  course_section_id: string;
  class_code: string;
  subject_name: string;
  subject_code: string;
  department_name?: string | null;
  semester?: number | null;
  student_count: number;
  live_occurrence_id?: string | null;
  window_closes_at?: string | null;
  closed_occurrence_id?: string | null;
}

export interface HistoryItem {
  occurrence_id: string;
  course_section_id: string;
  date: string;
  class_code: string;
  subject_name: string;
  time_range: string;
  locked: boolean;
  present: number;
  flagged: number;
  total: number;
}

export interface FlaggedRecord {
  record_id: string;
  occurrence_id: string;
  student_name: string;
  enrollment_number: string;
  class_code: string;
  subject_name: string;
  date: string;
  time_range: string;
  method: string;
  remarks?: string | null;
  locked: boolean;
}

export interface StudentAttendanceRow {
  student_id: string;
  student_name: string;
  enrollment_number: string;
  attended: number;
  held: number;
  percentage?: number | null;
}

export interface ClassAnalytics {
  course_section_id: string;
  class_code: string;
  subject_name: string;
  sessions_held: number;
  student_count: number;
  average_percentage?: number | null;
  threshold: number;
  below_threshold: StudentAttendanceRow[];
  students: StudentAttendanceRow[];
}

export interface ClassSessionStartResult {
  occurrence_id: string;
  window_closes_at?: string | null;
}

export interface OccurrenceQrData {
  qr_token: string;
  expires_at: string;
  refresh_interval_seconds: number;
}

export interface RegisterStudentItem {
  student_id: string;
  student_name: string;
  enrollment_number: string;
  status: "PRESENT" | "ABSENT" | "FLAGGED" | "APPROVED" | "EXCUSED" | "LATE";
  method: string;
  face_score?: number | null;
  liveness_score?: number | null;
  evidence_photo_url?: string | null;
  remarks?: string | null;
  verified_at?: string | null;
}

export interface OccurrenceRegisterData {
  occurrence_id: string;
  date: string;
  status: string;
  is_attendance_locked: boolean;
  verification_active: boolean;
  verification_expires?: string | null;
  class_code: string;
  classroom_name?: string | null;
  course_name: string;
  section_name: string;
  time_range: string;
  students: RegisterStudentItem[];
}
