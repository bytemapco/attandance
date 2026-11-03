from typing import Any, Optional

from app.services.notification_service import create_in_app_notification


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
