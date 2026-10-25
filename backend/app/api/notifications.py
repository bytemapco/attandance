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
from app.services.notification_service import (
    broadcast_announcement,
    delete_all_user_notifications,
    delete_multiple_notifications,
    delete_notification,
    get_user_notifications,
    mark_all_notifications_read,
    mark_notification_read,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])
require_admin = RoleChecker(["ADMIN"])


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    category: Optional[str] = Query(None, description="Category filter (attendance, leave, system, etc.)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """Retrieve notifications for the current authenticated user + active role broadcasts."""
    tenant_id = getattr(current_user, "tenantId", None)
    return await get_user_notifications(
        user_id=current_user.id,
        user_role=current_user.role,
        tenant_id=tenant_id,
        unread_only=unread_only,
        category=category,
        page=page,
        page_size=page_size,
    )


@router.patch("/{notification_id}/read", response_model=ActionSuccessResponse)
async def mark_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
):
    """Mark a specific notification as read."""
    success = await mark_notification_read(notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found or update failed")
    return ActionSuccessResponse(success=True, message="Notification marked as read")


@router.patch("/mark-all-read", response_model=ActionSuccessResponse)
async def mark_all_read(
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications for the current authenticated user as read."""
    count = await mark_all_notifications_read(current_user.id, current_user.role)
    return ActionSuccessResponse(success=True, message=f"{count} notifications marked as read")


@router.post("/bulk-delete", response_model=ActionSuccessResponse)
async def bulk_delete_notifications(
    payload: NotificationBulkDeleteRequest,
    current_user: User = Depends(get_current_user),
):
    """Delete multiple notifications by ID."""
    count = await delete_multiple_notifications(payload.ids, current_user.id)
    return ActionSuccessResponse(success=True, message=f"{count} notifications deleted")


@router.delete("/all", response_model=ActionSuccessResponse)
async def clear_all_notifications(
    current_user: User = Depends(get_current_user),
):
    """Delete all notifications for the current user."""
    count = await delete_all_user_notifications(current_user.id, current_user.role)
    return ActionSuccessResponse(success=True, message=f"{count} notifications cleared")


@router.delete("/{notification_id}", response_model=ActionSuccessResponse)
async def remove_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a notification."""
    success = await delete_notification(notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return ActionSuccessResponse(success=True, message="Notification deleted")


require_broadcast_sender = RoleChecker(["ADMIN", "TEACHER"])


@router.post("/broadcast", response_model=ActionSuccessResponse, dependencies=[Depends(require_broadcast_sender)])
async def broadcast_notification(
    payload: NotificationBroadcastCreate,
    current_user: User = Depends(get_current_user),
):
    """Endpoint for Admins and Faculty Teachers to broadcast announcements to students or campus-wide."""
    tenant_id = getattr(current_user, "tenantId", None)
    await broadcast_announcement(
        title=payload.title,
        message=payload.message,
        target_role=payload.target_role,
        tenant_id=tenant_id,
        type=payload.type,
        category=payload.category,
        link=payload.link,
    )
    return ActionSuccessResponse(success=True, message="Broadcast announcement dispatched successfully")
