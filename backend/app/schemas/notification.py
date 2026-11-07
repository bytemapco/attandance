from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

NotificationType = Literal["info", "success", "warning", "danger", "critical"]
NotificationCategory = Literal["attendance", "leave", "device", "security", "system", "maintenance", "update"]


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    kind: Literal["personal", "announcement"] = Field("personal", description="Written for this person, or shared with a group")
    user_id: Optional[str] = Field(None, description="The person it was written for; empty for an announcement")
    title: str
    message: str
    type: NotificationType = "info"
    category: str = "system"  # any: the assistant and the briefing add their own
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
    target_role: Literal["ALL", "TEACHER", "STUDENT", "ADMIN"] = "ALL"
    type: NotificationType = "info"
    category: NotificationCategory = "system"
    link: Optional[str] = Field(None, max_length=255)
    publish_at: Optional[datetime] = Field(None, description="Show it from this time. Empty means now.")


class NotificationBulkDeleteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ids: List[str] = Field(..., min_length=1)
