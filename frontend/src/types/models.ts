export interface StudentCreate {
  email: string;
  password?: string;
  enrollment_number: string;
  first_name: string;
  last_name: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  semester?: number;
  batch_id: string;
  department_id: string;
}

export interface StudentResponse {
  id: string;
  user_id: string;
  enrollment_number: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  department_id: string;
  department_name: string;
  semester?: number | null;
  batch?: string | null;
  batch_id?: string | null;
  is_active?: boolean | null;
  invitation_sent?: boolean | null;
}

export type BatchStatus = "ACTIVE" | "ARCHIVED";

export interface BatchResponse {
  id: string;
  department_id: string;
  section: string;
  number: number;
  code: string;
  status: BatchStatus;
  student_count: number;
  class_count: number;
  created_at: string;
  updated_at: string;
}


export interface TeacherCreate {
  email: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  name_initials?: string;
  department_id: string;
  designation_id: string;
  phone?: string;
}

export interface TeacherResponse {
  id: string;
  user_id: string;
  email: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  name_initials?: string | null;
  department_id: string;
  designation_id: string;
  department: string;
  designation: string;
  phone?: string | null;
  is_active?: boolean | null;
  invitation_sent?: boolean | null;
}

export interface ClassCreate {
  name: string;
  subject_id: string;
  teacher_id: string;
  classroom_id?: string;
  semester?: number;
  batch?: string;
}

export interface ClassResponse {
  id: string;
  name: string;
  subject_name: string;
  subject_code: string;
  teacherId?: string;
  teacher_id?: string;
  classroom_name?: string | null;
  semester?: number | null;
  batch?: string | null;
  academic_term_id?: string | null;
  term_name?: string | null;
  enrolled_count: number;
  enrolled_student_ids?: string[];
}

export interface DepartmentCreate {
  name: string;
  code: string;
  head?: string;
  description?: string;
}

export interface DepartmentResponse {
  id: string;
  name: string;
  code: string;
  head?: string | null;
  description?: string | null;
  classCount: number;
}

export interface SubjectCreate {
  name: string;
  code: string;
  description?: string;
  department_id?: string;
}

export interface SubjectResponse {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  department_id?: string | null;
}

export interface ClassroomCreate {
  name: string;
  building?: string;
}

export interface ClassroomResponse {
  id: string;
  name: string;
  building?: string | null;
}

export interface DesignationCreate {
  name: string;
  code: string;
  description?: string;
}

export interface DesignationResponse {
  id: string;
  name: string;
  code: string;
  description?: string | null;
}

export interface DeviceChangeRequest {
  id: string;
  student_id: string;
  student_name: string;
  enrollment_number: string;
  new_device_uuid: string;
  reason: string | null;
  status: string;
  created_at: string;
}

export interface StudentFilterFacetsResponse {
  semesters: number[];
}

export type AcademicYearStatus = "PLANNING" | "ACTIVE" | "LOCKED" | "ARCHIVED";

export interface AcademicYearCreate {
  name: string;
  start_date: string;
  end_date: string;
  attendance_start_date?: string;
  attendance_end_date?: string;
  min_attendance_pct?: number;
  saturday_enabled?: boolean;
  verification_window_min?: number;
}

export interface AcademicYearUpdate extends Partial<AcademicYearCreate> {
  status?: AcademicYearStatus;
}

export interface AcademicYearResponse {
  id: string;
  tenant_id: string;
  name: string;
  start_date: string;
  end_date: string;
  attendance_start_date?: string | null;
  attendance_end_date?: string | null;
  min_attendance_pct: number;
  saturday_enabled: boolean;
  verification_window_min: number;
  status: AcademicYearStatus;
  created_at: string;
  updated_at: string;
  sections_count?: number;
}

export interface TimeSlotCreate {
  slot_number: number;
  name: string;
  start_time: string;
  end_time: string;
  is_break?: boolean;
  is_lab_block?: boolean;
}

export type TimeSlotUpdate = Partial<TimeSlotCreate>;

export interface SemesterCreate {
  number: number;
  start_date: string;
  end_date: string;
}

export type SemesterUpdate = Partial<SemesterCreate>;

export interface SemesterResponse {
  id: string;
  tenant_id: string;
  academic_year_id: string;
  number: number;
  start_date: string;
  end_date: string;
  classes_count?: number;
  created_at: string;
  updated_at: string;
}

export interface TimeSlotResponse {
  id: string;
  tenant_id?: string | null;
  slot_number: number;
  name: string;
  start_time: string;
  end_time: string;
  is_break: boolean;
  is_lab_block: boolean;
}

export type CalendarEventType = "HOLIDAY" | "EXAM_DAY" | "NON_INSTRUCTIONAL" | "TIMETABLE_OVERRIDE";

export interface CalendarEventCreate {
  academic_year_id: string;
  title: string;
  date: string;
  event_type: CalendarEventType;
  affects_all_courses?: boolean;
  substitute_day_of_week?: number;
  description?: string;
}

export interface CalendarEventResponse {
  id: string;
  tenant_id: string;
  academic_year_id: string;
  title: string;
  date: string;
  event_type: CalendarEventType;
  affects_all_courses: boolean;
  substitute_day_of_week?: number | null;
  description?: string | null;
  created_at: string;
}
