export type TenantType = "COLLEGE";
export type TenantStatus = "ACTIVE" | "SUSPENDED" | "TRIAL" | "PROVISIONING";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  type: TenantType;
  status: TenantStatus;
  license_count: number;
  created_at: string;
  student_count?: number;
  teacher_count?: number;
  class_count?: number;
  config?: Record<string, unknown>;
}

export interface TenantDetailAdminUser {
  id: string;
  email: string;
  role: string;
  is_active?: boolean;
  created_at?: string;
  invitation_sent?: boolean;
}

export interface TenantDetail extends Tenant {
  department_count?: number;
  subject_count?: number;
  active_sessions_count?: number;
  total_attendance_count?: number;
  admin_users: TenantDetailAdminUser[];
}

export type LicenseRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface LicenseRequestItem {
  id: string;
  tenant_id: string;
  tenant_name?: string | null;
  tenant_slug?: string | null;
  requested_by_id: string;
  requested_by_email?: string | null;
  requested_by_name?: string | null;
  requested_count: number;
  status: LicenseRequestStatus;
  processed_by_id?: string | null;
  processed_by_email?: string | null;
  processed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedLicenseRequests {
  items: LicenseRequestItem[];
  total_items: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface TenantLicenseUsage {
  tenant_id: string;
  tenant_name: string;
  license_count: number;
  student_count: number;
  teacher_count: number;
  total_used: number;
  remaining: number;
}

export interface SuperAdminStats {
  total_tenants: number;
  active_tenants: number;
  total_students: number;
  total_teachers: number;
  active_sessions: number;
  total_attendance: number;
}

export interface TenantAdminProvisionItem {
  name: string;
  email: string;
  role?: string;
}

export interface TenantProvisionRequest {
  name: string;
  slug: string;
  license_count?: number;
  admin_email?: string;
  admin_name?: string;
  admin_password?: string;
  admins?: TenantAdminProvisionItem[];
  config?: Record<string, unknown>;
}

export interface TenantUpdateRequest {
  name?: string;
  slug?: string;
  status?: TenantStatus;
  license_count?: number;
  config?: Record<string, unknown>;
}

export interface GlobalUser {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "TENANT_ADMIN" | "TEACHER" | "STUDENT";
  is_active: boolean;
  tenant_id?: string | null;
  tenant_name?: string | null;
  tenant_slug?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  identifier?: string | null;
  created_at: string;
}

export interface SuperAdminAuditLog {
  id: string;
  timestamp: string;
  event_type: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "ERROR";
  actor: string;
  target: string;
  description: string;
  ip_address?: string | null;
  tenant_id?: string | null;
  tenant_name?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ServiceHealthItem {
  status: "healthy" | "warning" | "down" | "not_configured";
  latency_ms: number | null;
  details: Record<string, unknown> | null;
}

export interface PlatformHealth {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    postgresql: ServiceHealthItem;
    redis_cache: ServiceHealthItem;
    object_storage: ServiceHealthItem;
    email_worker: ServiceHealthItem;
    ai_hardware: ServiceHealthItem;
  };
  /** How long the API process has been running. */
  server_uptime_seconds: number;
}

export interface GlobalBroadcastRequest {
  title: string;
  message: string;
  target_role: "ALL" | "ADMIN" | "TEACHER" | "STUDENT";
  target_tenant_id?: string;
  type: "info" | "warning" | "critical" | "success";
  category: "system" | "maintenance" | "security" | "update";
  /** Show it from this moment (ISO, UTC). Empty means now. */
  publish_at?: string;
}

export interface BroadcastResult {
  status: "sent" | "scheduled";
  audience_count: number;
  title: string;
}

export interface BroadcastHistoryItem {
  id: string;
  publish_at: string;
  title: string;
  message: string;
  type: GlobalBroadcastRequest["type"];
  audience: GlobalBroadcastRequest["target_role"];
  tenant_name: string | null;
  sender: string | null;
  audience_count: number;
  status: BroadcastResult["status"];
}

export interface PaginatedBroadcasts {
  items: BroadcastHistoryItem[];
  total_items: number;
  page: number;
  page_size: number;
  total_pages: number;
}


