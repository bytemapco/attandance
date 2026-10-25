export interface StudentCreate {
  email: string;
  password?: string;
  enrollment_number: string;
  first_name: string;
  last_name: string;
  phone?: string;
  gender?: string;
  branch?: string;
  date_of_birth?: string;
  semester?: number;
  batch?: string;
  department_id?: string;
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
  branch?: string | null;
  date_of_birth?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  semester?: number | null;
  batch?: string | null;
  is_active?: boolean | null;
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
  branches: string[];
  batches: string[];
  semesters: number[];
}
