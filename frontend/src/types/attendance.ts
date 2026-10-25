export interface BulkMarkRecord {
  student_id: string;
  status: "Present" | "Absent";
}

export interface BulkMarkRequest {
  records: BulkMarkRecord[];
}

export interface AttendanceExportRow {
  enrollment_number: string;
  first_name: string;
  last_name: string;
  email: string;
  session_date: string;
  class_name: string;
  subject: string;
  status: string;
  final_ai_score: number;
  remarks?: string;
}

export interface FlaggedAttendanceResponse {
  id: string;
  enrollment_number: string;
  student_name: string;
  class_name: string;
  subject: string;
  face_score: number;
  liveness_score: number;
  background_score: number;
  final_ai_score: number;
  gps_latitude: number;
  gps_longitude: number;
  created_at: string;
  student_note?: string | null;
}

export interface PendingLeaveItem {
  id: string;
  student_id: string;
  student_name: string;
  enrollment_number: string;
  start_date: string;
  end_date: string;
  reason: string;
  document_url: string | null;
  status: string;
  approved_by?: string | null;
  approver_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StatusDistribution {
  present: number;
  absent: number;
  flagged: number;
  approved: number;
}

export interface DistributionTiers {
  below_50: number;
  between_50_75: number;
  between_75_85: number;
  above_85: number;
}

export interface StudentAttendanceSummaryItem {
  student_id: string;
  enrollment_number: string;
  full_name: string;
  email: string;
  total_sessions: number;
  attended_sessions: number;
  attendance_percentage: number;
  at_risk: boolean;
  last_attended_at?: string | null;
}

export interface SessionTrendItem {
  session_id: string;
  session_name: string;
  session_date?: string | null;
  attendance_percentage: number;
}

export interface ClassStatsResponse {
  class_id: string;
  class_name?: string;
  subject?: string;
  total_sessions: number;
  total_students: number;
  overall_attendance_percentage: number;
  at_risk_count?: number;
  status_distribution?: StatusDistribution;
  distribution_tiers?: DistributionTiers;
  history?: SessionTrendItem[];
  students?: StudentAttendanceSummaryItem[];
}

export interface StudentClassSessionLog {
  session_id: string;
  session_name: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: "Present" | "Absent" | "Flagged" | "Approved" | string;
  final_ai_score: number;
  marked_at?: string | null;
  remarks?: string | null;
  student_note?: string | null;
}

export interface StudentClassHistoryResponse {
  student_id: string;
  student_name: string;
  enrollment_number: string;
  email: string;
  class_id: string;
  class_name: string;
  subject: string;
  total_sessions: number;
  attended_sessions: number;
  attendance_percentage: number;
  at_risk: boolean;
  sessions: StudentClassSessionLog[];
}

export interface AttendanceMatrixSessionItem {
  session_id: string;
  session_name: string;
  session_date: string;
}

export interface AttendanceMatrixStudentItem {
  student_id: string;
  enrollment_number: string;
  full_name: string;
  attendance_percentage: number;
  statuses: Record<string, string>;
}

export interface AttendanceMatrixResponse {
  class_id: string;
  class_name: string;
  subject: string;
  sessions: AttendanceMatrixSessionItem[];
  students: AttendanceMatrixStudentItem[];
}

export interface AnomalyResult {
  student_id: string;
  anomaly_score: number;
  total_absences: number;
  student_name?: string;
  enrollment_number?: string;
  primary_pattern?: string;
  day_breakdown?: Record<string, number>;
  [key: string]: unknown;
}
