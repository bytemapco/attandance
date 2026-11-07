from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from prisma.models import User

from app.api.dependencies import RoleChecker, get_current_user
from app.schemas.common import ActionSuccessResponse
from app.schemas.notification import (
    NotificationBroadcastCreate,
    NotificationBulkDeleteRequest,
    NotificationListResponse,
)
from app.services.announcements import inbox
from app.services.announcements.publisher import publish

router = APIRouter(prefix="/notifications", tags=["notifications"])
require_broadcast_sender = RoleChecker(["ADMIN", "TEACHER"])


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    category: Optional[str] = Query(None, description="Category filter (attendance, leave, system, etc.)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """The person's own notifications and the announcements they may see, newest first."""
    return await inbox.list_inbox(current_user, unread_only, category, page, page_size)


@router.patch("/{notification_id}/read", response_model=ActionSuccessResponse)
async def mark_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
):
    """Mark one notification or announcement as read, for the current person only."""
    if not await inbox.mark_read(current_user, notification_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return ActionSuccessResponse(success=True, message="Notification marked as read")


@router.patch("/mark-all-read", response_model=ActionSuccessResponse)
async def mark_all_read(
    current_user: User = Depends(get_current_user),
):
    count = await inbox.mark_all_read(current_user)
    return ActionSuccessResponse(success=True, message=f"{count} notifications marked as read")


@router.post("/bulk-delete", response_model=ActionSuccessResponse)
async def bulk_delete_notifications(
    payload: NotificationBulkDeleteRequest,
    current_user: User = Depends(get_current_user),
):
    """Remove several notifications or announcements from the current person's list."""
    count = await inbox.remove(current_user, payload.ids)
    return ActionSuccessResponse(success=True, message=f"{count} notifications deleted")


@router.delete("/all", response_model=ActionSuccessResponse)
async def clear_all_notifications(
    current_user: User = Depends(get_current_user),
):
    count = await inbox.remove_all(current_user)
    return ActionSuccessResponse(success=True, message=f"{count} notifications cleared")


@router.delete("/{notification_id}", response_model=ActionSuccessResponse)
async def remove_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
):
    if not await inbox.remove(current_user, [notification_id]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return ActionSuccessResponse(success=True, message="Notification deleted")


@router.post("/broadcast", response_model=ActionSuccessResponse, dependencies=[Depends(require_broadcast_sender)])
async def broadcast_notification(
    payload: NotificationBroadcastCreate,
    current_user: User = Depends(get_current_user),
):
    """An admin announces to their institution; a teacher announces to the institution's students."""
    if not current_user.tenantId:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You must belong to an institution to make an announcement.")
    if current_user.role == "TEACHER" and payload.target_role != "STUDENT":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Teachers may only announce to students within their institution.")

    announcement = await publish(
        current_user,
        title=payload.title,
        message=payload.message,
        audience=payload.target_role,
        tenant_id=current_user.tenantId,
        type=payload.type,
        category=payload.category,
        link=payload.link,
        publish_at=payload.publish_at,
    )
    scheduled = announcement.publishAt > datetime.now(timezone.utc)
    return ActionSuccessResponse(success=True, message="Announcement scheduled" if scheduled else "Announcement sent")
