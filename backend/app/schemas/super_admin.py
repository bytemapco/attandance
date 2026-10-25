from datetime import datetime
from typing import Optional, Any, Dict, List
from pydantic import BaseModel, EmailStr, Field


class TenantAdminInput(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    role: Optional[str] = Field(default="TENANT_ADMIN", pattern=r"^(TENANT_ADMIN|ADMIN)$")


class TenantProvisionRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    slug: str = Field(..., min_length=2, max_length=50, pattern=r"^[a-z0-9-]+$")
    type: str = Field(default="COLLEGE", pattern=r"^(SCHOOL|COLLEGE|COACHING_CENTER)$")
    domain: Optional[str] = None
    license_count: int = Field(default=0, ge=0)
    admin_email: Optional[EmailStr] = None
    admin_name: Optional[str] = Field(None, min_length=2, max_length=100)
    admin_password: Optional[str] = None
    admins: Optional[List[TenantAdminInput]] = None
    config: Optional[Dict[str, Any]] = None


class TenantUpdateRequest(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = Field(None, pattern=r"^[a-z0-9-]+$")
    type: Optional[str] = Field(None, pattern=r"^(SCHOOL|COLLEGE|COACHING_CENTER)$")
    status: Optional[str] = Field(None, pattern=r"^(ACTIVE|SUSPENDED|TRIAL|EXPIRED)$")
    domain: Optional[str] = None
    license_count: Optional[int] = Field(None, ge=0)
    config: Optional[Dict[str, Any]] = None


class TenantResponse(BaseModel):
    id: str
    slug: str
    name: str
    type: str
    status: str
    domain: Optional[str] = None
    license_count: int
    created_at: datetime
    student_count: Optional[int] = 0
    teacher_count: Optional[int] = 0
    class_count: Optional[int] = 0


class TenantDetailResponse(TenantResponse):
    config: Optional[Dict[str, Any]] = None
    admin_users: List[Dict[str, Any]] = []
    department_count: Optional[int] = 0
    subject_count: Optional[int] = 0
    active_sessions_count: Optional[int] = 0
    total_attendance_count: Optional[int] = 0


class LicenseRequestCreate(BaseModel):
    requested_count: int = Field(..., ge=1, le=100000)


class LicenseRequestProcessRequest(BaseModel):
    approve: bool


class LicenseRequestItem(BaseModel):
    id: str
    tenant_id: str
    tenant_name: Optional[str] = None
    tenant_slug: Optional[str] = None
    requested_by_id: str
    requested_by_email: Optional[str] = None
    requested_by_name: Optional[str] = None
    requested_count: int
    status: str
    processed_by_id: Optional[str] = None
    processed_by_email: Optional[str] = None
    processed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class PaginatedLicenseRequests(BaseModel):
    items: List[LicenseRequestItem]
    total_items: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class LicenseRequestProcessedResponse(BaseModel):
    id: str
    tenant_id: str
    requested_by_id: str
    requested_count: int
    status: str
    processed_by_id: Optional[str] = None
    processed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class SuperAdminStatsResponse(BaseModel):
    total_tenants: int
    active_tenants: int
    total_students: int
    total_teachers: int
    active_sessions: int
    total_attendance: int


class GlobalUserItem(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool
    tenant_id: Optional[str] = None
    tenant_name: Optional[str] = None
    tenant_slug: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    identifier: Optional[str] = None  # Roll no or employee id
    created_at: datetime


class GlobalUserStatusUpdateRequest(BaseModel):
    is_active: bool


class GlobalUserPasswordResetRequest(BaseModel):
    new_password: str = Field(..., min_length=6)


class SuperAdminAuditLogItem(BaseModel):
    id: str
    timestamp: datetime
    event_type: str
    severity: str
    actor: str
    target: str
    description: str
    ip_address: Optional[str] = None
    tenant_id: Optional[str] = None
    tenant_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class PlatformHealthService(BaseModel):
    status: str  # "healthy", "degraded", "down", "warning"
    latency_ms: Optional[float] = None
    details: Optional[Dict[str, Any]] = None


class PlatformHealthResponse(BaseModel):
    status: str
    timestamp: datetime
    services: Dict[str, PlatformHealthService]
    server_uptime_seconds: float
    database_pool: Dict[str, Any]
    redis_status: Dict[str, Any]
    hardware_status: Optional[Dict[str, Any]] = None
    storage_status: Optional[Dict[str, Any]] = None


class GlobalBroadcastRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    message: str = Field(..., min_length=5, max_length=1000)
    target_role: Optional[str] = Field(None, pattern=r"^(ALL|SUPER_ADMIN|ADMIN|TENANT_ADMIN|TEACHER|STUDENT)$")
    target_tenant_id: Optional[str] = None
    type: str = Field(default="info", pattern=r"^(info|warning|critical|success)$")
    category: str = Field(default="system", pattern=r"^(system|maintenance|security|update)$")


class BroadcastHistoryItem(BaseModel):
    id: str
    timestamp: datetime
    title: str
    description: str
    severity: str
    actor: str
    target: str
    delivered_count: int = 0


class PaginatedBroadcastHistory(BaseModel):
    items: List[BroadcastHistoryItem]
    total_items: int
    page: int
    page_size: int
    total_pages: int
