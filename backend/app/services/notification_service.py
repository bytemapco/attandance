from typing import Any, Dict, List, Optional

from app.core.logging_config import get_logger
from app.db.client import db

logger = get_logger("app.notification")


async def create_in_app_notification(
    title: str,
    message: str,
    user_id: Optional[str] = None,
    role: Optional[str] = None,
    tenant_id: Optional[str] = None,
    type: str = "info",
    category: str = "system",
    link: Optional[str] = None,
) -> Dict[str, Any]:
    try:
        notif_data: Dict[str, Any] = {
            "title": title,
            "message": message,
            "userId": user_id,
            "role": role,
            "type": type,
            "category": category,
            "link": link,
            "isRead": False,
        }
        if tenant_id and tenant_id != "default-institution":
            notif_data["tenantId"] = tenant_id

        notif = await db.notification.create(data=notif_data)

        # Broadcast real-time event via WebSocket
        try:
            from app.api.websocket import manager

            payload = {
                "event": "NOTIFICATION_RECEIVED",
                "data": {
                    "id": notif.id,
                    "user_id": notif.userId,
                    "role": notif.role,
                    "tenant_id": getattr(notif, "tenantId", None),
                    "title": notif.title,
                    "message": notif.message,
                    "type": notif.type,
                    "category": notif.category,
                    "link": notif.link,
                    "is_read": notif.isRead,
                    "created_at": notif.createdAt.isoformat(),
                },
            }
            if user_id:
                await manager.send_personal_message(payload, user_id)
            else:
                await manager.broadcast(payload, target_role=role, tenant_id=tenant_id)
        except Exception as ws_err:
            logger.debug("WebSocket notification broadcast skipped: %s", ws_err)

        return {
            "id": notif.id,
            "user_id": notif.userId,
            "role": notif.role,
            "tenant_id": getattr(notif, "tenantId", None),
            "title": notif.title,
            "message": notif.message,
            "type": notif.type,
            "category": notif.category,
            "link": notif.link,
            "is_read": notif.isRead,
            "created_at": notif.createdAt,
        }
    except Exception as err:
        logger.error("Failed to create in-app notification: %s", err, exc_info=True)
        return {}


async def get_user_notifications(
    user_id: str,
    user_role: str,
    tenant_id: Optional[str] = None,
    unread_only: bool = False,
    category: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> Dict[str, Any]:
    recipient_filter = {"OR": [{"userId": user_id}, {"role": user_role}, {"role": None}]}
    where_conditions: List[Dict[str, Any]] = [recipient_filter]

    if tenant_id and tenant_id != "default-institution" and user_role != "SUPER_ADMIN":
        where_conditions.append({"OR": [{"tenantId": tenant_id}, {"tenantId": None}]})

    if unread_only:
        where_conditions.append({"isRead": False})
    if category and category != "all":
        where_conditions.append({"category": category})

    where_query = {"AND": where_conditions}

    total_count = await db.notification.count(where=where_query)
    unread_conditions = list(where_conditions)
    if not unread_only:
        unread_conditions.append({"isRead": False})
    unread_count = await db.notification.count(where={"AND": unread_conditions})

    skip = (max(1, page) - 1) * page_size
    items = await db.notification.find_many(
        where=where_query,
        order={"createdAt": "desc"},
        skip=skip,
        take=page_size,
    )

    formatted_items = [
        {
            "id": item.id,
            "user_id": item.userId,
            "role": item.role,
            "title": item.title,
            "message": item.message,
            "type": item.type,
            "category": item.category,
            "link": item.link,
            "is_read": item.isRead,
            "created_at": item.createdAt,
        }
        for item in items
    ]

    return {
        "items": formatted_items,
        "total_count": total_count,
        "unread_count": unread_count,
    }


async def mark_notification_read(notification_id: str, user_id: str) -> bool:
    try:
        await db.notification.update(
            where={"id": notification_id},
            data={"isRead": True},
        )
        return True
    except Exception as err:
        logger.error("Failed to mark notification %s read: %s", notification_id, err)
        return False


async def mark_all_notifications_read(user_id: str, user_role: str) -> int:
    try:
        result = await db.notification.update_many(
            where={
                "AND": [
                    {"OR": [{"userId": user_id}, {"role": user_role}, {"role": None}]},
                    {"isRead": False},
                ]
            },
            data={"isRead": True},
        )
        return result
    except Exception as err:
        logger.error("Failed to mark all notifications read: %s", err)
        return 0


async def delete_notification(notification_id: str, user_id: str) -> bool:
    try:
        await db.notification.delete(where={"id": notification_id})
        return True
    except Exception as err:
        logger.error("Failed to delete notification %s: %s", notification_id, err)
        return False


async def delete_multiple_notifications(notification_ids: List[str], user_id: str) -> int:
    try:
        result = await db.notification.delete_many(where={"id": {"in": notification_ids}})
        return result
    except Exception as err:
        logger.error("Failed to delete notifications: %s", err)
        return 0


async def delete_all_user_notifications(user_id: str, user_role: str) -> int:
    try:
        result = await db.notification.delete_many(
            where={"OR": [{"userId": user_id}, {"role": user_role}, {"role": None}]}
        )
        return result
    except Exception as err:
        logger.error("Failed to delete all notifications for user %s: %s", user_id, err)
        return 0


async def broadcast_announcement(
    title: str,
    message: str,
    target_role: Optional[str] = "ALL",
    tenant_id: Optional[str] = None,
    type: str = "info",
    category: str = "system",
    link: Optional[str] = None,
) -> Dict[str, Any]:
    role_enum = target_role if target_role and target_role != "ALL" else None
    notif = await create_in_app_notification(
        title=title,
        message=message,
        role=role_enum,
        tenant_id=tenant_id,
        type=type,
        category=category,
        link=link,
    )
    return notif


async def notify_teacher_attendance_flagged(
    teacher_user_id: str, student_name: str, class_name: str, attendance_id: str
):
    await create_in_app_notification(
        user_id=teacher_user_id,
        title="Flagged Attendance Record",
        message=f"{student_name}'s attendance for {class_name} was flagged by verification and awaits your review.",
        type="warning",
        category="attendance",
        link=f"/teacher/review/{attendance_id}",
    )


async def notify_teacher_session_concluded(
    teacher_user_id: str, class_name: str, session_id: str, present_count: int, total_count: int, flagged_count: int = 0
):
    pct = (present_count / max(1, total_count)) * 100
    flagged_msg = f" ({flagged_count} flagged)" if flagged_count > 0 else ""
    await create_in_app_notification(
        user_id=teacher_user_id,
        title=f"Session Concluded: {class_name}",
        message=f"Attendance closed. {present_count}/{total_count} present ({pct:.1f}%){flagged_msg}.",
        type="success" if pct >= 75 else "warning",
        category="attendance",
        link=f"/teacher/sessions/{session_id}",
    )


async def notify_teacher_leave_submitted(
    teacher_user_id: str,
    student_name: str,
    class_name: Optional[str] = None,
    leave_id: Optional[str] = None,
    start_date: Optional[Any] = None,
    end_date: Optional[Any] = None,
    reason: Optional[str] = None,
):
    date_str = f" ({start_date} to {end_date})" if start_date and end_date else ""
    target_str = f" for {class_name}" if class_name else ""
    msg = f"{student_name} submitted a leave application{target_str}{date_str}."
    if reason:
        msg = f"{msg} Reason: {reason[:100]}"
    link = f"/teacher/leaves?leave_id={leave_id}" if leave_id else "/teacher/leaves"
    await create_in_app_notification(
        user_id=teacher_user_id,
        title="New Leave Request",
        message=msg,
        type="info",
        category="leave",
        link=link,
    )
