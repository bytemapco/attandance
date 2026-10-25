export * from "./models";
export * from "./attendance";
export * from "./notification";
export * from "./tenant";

export type UserRole =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "ADMIN";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  must_change_password?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  tenant_id?: string | null;
  tenant_slug?: string | null;
  tenant_name?: string | null;
  must_change_password?: boolean;
  student_profile: {
    id: string;
    enrollment_number: string;
    first_name?: string;
    last_name?: string;
    face_registered?: boolean;
  } | null;
  teacher_profile: {
    id: string;
    employee_id: string;
    first_name: string;
    last_name: string;
    department: string;
    designation: string;
  } | null;
}

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

export interface StudentRosterItem {
  student_id: string;
  enrollment_number: string;
  full_name: string;
  email: string;
  status: "Present" | "Flagged" | "Absent" | "Approved";
  final_score: number;
  marked_at: string | null;
}

export interface SessionAttendanceResponse {
  session_id: string;
  class_name: string;
  roster: StudentRosterItem[];
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

export type SearchCategory = "student" | "faculty" | "class" | "session" | "action" | "navigation";

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
