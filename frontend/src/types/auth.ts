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
