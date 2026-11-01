export * from "./models";
export * from "./attendance";
export * from "./notification";
export * from "./tenant";
export * from "./auth";
export * from "./timetable";
export * from "./classManagement";

export interface AssignTeacherRequest {
  teacher_id: string;
}

export interface EnrollRequest {
  student_ids: string[];
}

export interface AuditLogResponse {
  id: string;
  timestamp: string;
  eventType: string;
  severity: string;
  actor: string;
  target: string;
  description: string;
  ip: string | null;
  meta: Record<string, unknown> | null;
}

export interface AdminStatsResponse {
  studentCount: number;
  teacherCount: number;
  classCount: number;
  attendanceCount?: number;
  biometricPassRate?: number;
}

export interface GeofenceResponse {
  id: string;
  academicClassId: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicClassWithGeofence {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
  geofence: GeofenceResponse | null;
}

export interface SessionResponse {
  id: string;
  academicClassId: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface SessionWithClassResponse {
  id: string;
  academicClassId: string;
  class_name: string;
  subject: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface SessionStudentAttendanceItem {
  student_id: string;
  enrollment_number: string;
  full_name: string;
  email: string;
  status: "Present" | "Flagged" | "Absent" | "Approved";
  final_score: number;
  marked_at: string | null;
}

export type StudentRosterItem = SessionStudentAttendanceItem;

export interface SessionAttendanceResponse {
  session_id: string;
  class_name: string;
  roster: SessionStudentAttendanceItem[];
  attendance_roll?: SessionStudentAttendanceItem[];
}


export interface ServiceHealthItem {
  status: "healthy" | "degraded" | "unhealthy";
  latency_ms: number;
  details?: Record<string, unknown>;
}

export interface SystemHealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  app_name: string;
  environment: string;
  version: string;
  timestamp: string;
  services: {
    database: ServiceHealthItem;
    redis: ServiceHealthItem;
    storage: ServiceHealthItem;
  };
}

export interface SystemConfigResponse {
  id: string;
  isFaceRecognitionEnabled: boolean;
  isGpsVerificationEnabled: boolean;
  isAiBackgroundValidationEnabled: boolean;
  updatedAt: string;
}

export interface SmartPassVerifyResponse {
  status: "success" | "already_marked" | "error";
  student_id: string;
  student_name: string;
  enrollment_number: string;
  attendance_status: string;
  session_id: string;
  message: string;
}

export interface TeacherSmartPassResponse {
  qr_token: string;
  session_id: string;
  class_name: string;
  subject: string;
  expires_at: string;
  refresh_interval_seconds: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface BulkImportResponse {
  imported_count: number;
  failed_count: number;
  invitations_sent: number;
  errors: string[];
}

export type SearchCategory = "student" | "faculty" | "class" | "session" | "action" | "navigation" | "tenant";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string | null;
  category: SearchCategory;
  href: string;
  badge?: string | null;
  icon_type?: string | null;
}

export interface GlobalSearchResponse {
  query: string;
  total_results: number;
  results: SearchResultItem[];
}
