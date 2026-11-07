export interface StudentCreate {
  email: string;
  password?: string;
  enrollment_number: string;
  first_name: string;
  last_name: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
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

export interface DepartmentCreate {
  name: string;
  code: string;
}

export interface DepartmentResponse {
  id: string;
  name: string;
  code: string;
  classCount: number;
}

export interface SubjectCreate {
  name: string;
  code: string;
  department_id?: string;
}

export interface SubjectResponse {
  id: string;
  name: string;
  code: string;
  department_id?: string | null;
}

export interface ClassroomCreate {
  name: string;
}

export interface ClassroomResponse {
  id: string;
  name: string;
}

export interface DesignationCreate {
  name: string;
  code: string;
}

export interface DesignationResponse {
  id: string;
  name: string;
  code: string;
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

