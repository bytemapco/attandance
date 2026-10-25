from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

NotificationType = Literal["info", "success", "warning", "danger", "critical"]
NotificationCategory = Literal["attendance", "leave", "device", "security", "system", "maintenance", "update"]


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = Field(None, description="Target user ID if user-specific")
    role: Optional[str] = Field(None, description="Role target if broadcast")
    title: str
    message: str
    type: NotificationType = "info"
    category: NotificationCategory = "system"
    link: Optional[str] = None
    is_read: bool = Field(False, description="Read status for the notification")
    created_at: datetime


class NotificationListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[NotificationResponse]
    total_count: int
    unread_count: int


class NotificationBroadcastCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=2, max_length=150)
    message: str = Field(..., min_length=2, max_length=1000)
    target_role: Optional[Literal["ALL", "TEACHER", "STUDENT", "ADMIN"]] = "ALL"
    type: NotificationType = "info"
    category: NotificationCategory = "system"
    link: Optional[str] = Field(None, max_length=255)


class NotificationBulkDeleteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ids: List[str] = Field(..., min_length=1)
