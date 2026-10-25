import api from "@/lib/api";
import type {
  SuperAdminStats,
  Tenant,
  TenantDetail,
  TenantProvisionRequest,
  TenantUpdateRequest,
  GlobalUser,
  SuperAdminAuditLog,
  PlatformHealth,
  GlobalBroadcastRequest,
  PaginatedBroadcasts,
  LicenseRequestItem,
  PaginatedLicenseRequests,
  TenantLicenseUsage,
} from "@/types/tenant";

export interface TenantListParams {
  page?: number;
  page_size?: number;
  q?: string;
  status?: string;
  type?: string;
}

export interface PaginatedTenants {
  items: Tenant[];
  total_items: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  q?: string;
  role?: string;
  tenant_id?: string;
  is_active?: boolean;
}

export interface PaginatedUsers {
  items: GlobalUser[];
  total_items: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface AuditLogListParams {
  page?: number;
  page_size?: number;
  severity?: string;
  event_type?: string;
  tenant_id?: string;
  actor?: string;
}

export interface PaginatedAuditLogs {
  items: SuperAdminAuditLog[];
  total_items: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface LicenseRequestListParams {
  page?: number;
  page_size?: number;
  status?: string;
}

export const superAdminService = {
  async getStats(): Promise<SuperAdminStats> {
    const { data } = await api.get<SuperAdminStats>("/super-admin/stats");
    return data;
  },

  async getTenants(params?: TenantListParams): Promise<PaginatedTenants> {
    const { data } = await api.get<PaginatedTenants>("/super-admin/tenants", { params });
    return data;
  },

  async getTenant(id: string): Promise<TenantDetail> {
    const { data } = await api.get<TenantDetail>(`/super-admin/tenants/${id}`);
    return data;
  },

  async provisionTenant(payload: TenantProvisionRequest): Promise<TenantDetail> {
    const { data } = await api.post<TenantDetail>("/super-admin/tenants", payload);
    return data;
  },

  async updateTenant(id: string, payload: TenantUpdateRequest): Promise<TenantDetail> {
    const { data } = await api.put<TenantDetail>(`/super-admin/tenants/${id}`, payload);
    return data;
  },

  async deleteTenant(id: string): Promise<void> {
    await api.delete(`/super-admin/tenants/${id}`);
  },

  async addTenantAdmin(tenantId: string, payload: { name: string; email: string; role?: string }): Promise<{ id: string; email: string; role: string }> {
    const { data } = await api.post<{ id: string; email: string; role: string }>(`/super-admin/tenants/${tenantId}/admins`, payload);
    return data;
  },

  async triggerPasswordReset(userId: string): Promise<{ id: string; email: string; status: string }> {
    const { data } = await api.post<{ id: string; email: string; status: string }>(`/super-admin/users/${userId}/reset-password`);
    return data;
  },

  async getUsers(params?: UserListParams): Promise<PaginatedUsers> {
    const { data } = await api.get<PaginatedUsers>("/super-admin/users", { params });
    return data;
  },

  async getAuditLogs(params?: AuditLogListParams): Promise<PaginatedAuditLogs> {
    const { data } = await api.get<PaginatedAuditLogs>("/super-admin/audit-logs", { params });
    return data;
  },

  async getAuditEventTypes(): Promise<string[]> {
    const { data } = await api.get<string[]>("/super-admin/audit-logs/event-types");
    return data;
  },

  async getSystemHealth(): Promise<PlatformHealth> {
    const { data } = await api.get<PlatformHealth>("/super-admin/system-health");
    return data;
  },

  async createBroadcast(payload: GlobalBroadcastRequest): Promise<{ status: string; delivered_count: number; title: string }> {
    const { data } = await api.post<{ status: string; delivered_count: number; title: string }>("/super-admin/broadcast", payload);
    return data;
  },

  async getBroadcasts(page = 1, pageSize = 20): Promise<PaginatedBroadcasts> {
    const { data } = await api.get<PaginatedBroadcasts>("/super-admin/broadcasts", {
      params: { page, page_size: pageSize },
    });
    return data;
  },

  async getLicenseRequests(params?: LicenseRequestListParams): Promise<PaginatedLicenseRequests> {
    const { data } = await api.get<PaginatedLicenseRequests>("/super-admin/license-requests", { params });
    return data;
  },

  async processLicenseRequest(requestId: string, approve: boolean): Promise<LicenseRequestItem> {
    const { data } = await api.post<LicenseRequestItem>(
      `/super-admin/license-requests/${requestId}/process`,
      { approve }
    );
    return data;
  },

  async requestLicenses(requestedCount: number): Promise<LicenseRequestItem> {
    const { data } = await api.post<LicenseRequestItem>("/admin/licenses/request", {
      requested_count: requestedCount,
    });
    return data;
  },

  async getLicenseUsage(): Promise<TenantLicenseUsage> {
    const { data } = await api.get<TenantLicenseUsage>("/admin/licenses");
    return data;
  },

  async getTenantLicenseRequests(): Promise<PaginatedLicenseRequests> {
    const { data } = await api.get<PaginatedLicenseRequests>("/admin/licenses/requests");
    return data;
  },
};


