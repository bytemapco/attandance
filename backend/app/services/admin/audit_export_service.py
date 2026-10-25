import io
import csv
from datetime import datetime
from typing import Optional
from app.db.client import db


class AuditExportService:
    @staticmethod
    async def get_audit_logs(
        page: int = 1,
        page_size: int = 20,
        sort_by: Optional[str] = None,
        sort_order: str = "desc",
        q: Optional[str] = None,
        severity: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> dict:
        where: dict = {}
        if tenant_id:
            where["tenantId"] = tenant_id
        if severity and severity != "all":
            where["severity"] = severity.upper()

        timestamp_filter: dict = {}
        if start_date:
            try:
                timestamp_filter["gte"] = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            except Exception as e:
                raise ValueError(f"Invalid start_date format '{start_date}'. Expected ISO-8601 string.") from e
        if end_date:
            try:
                dt_end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                if len(end_date) <= 10:
                    dt_end = dt_end.replace(hour=23, minute=59, second=59, microsecond=999999)
                timestamp_filter["lte"] = dt_end
            except Exception as e:
                raise ValueError(f"Invalid end_date format '{end_date}'. Expected ISO-8601 string.") from e

        if timestamp_filter:
            where["timestamp"] = timestamp_filter

        if q and q.strip():
            query_str = q.strip()
            where["OR"] = [
                {"eventType": {"contains": query_str, "mode": "insensitive"}},
                {"actor": {"contains": query_str, "mode": "insensitive"}},
                {"target": {"contains": query_str, "mode": "insensitive"}},
                {"description": {"contains": query_str, "mode": "insensitive"}},
            ]

        order_col = {"timestamp": "timestamp", "event_type": "eventType", "severity": "severity", "actor": "actor"}.get(
            sort_by, "timestamp"
        )
        order_dir = "asc" if sort_order.lower() == "asc" else "desc"

        total_items = await db.auditlog.count(where=where)
        skip = (page - 1) * page_size
        logs = await db.auditlog.find_many(where=where, skip=skip, take=page_size, order={order_col: order_dir})
        total_pages = max(1, (total_items + page_size - 1) // page_size) if total_items > 0 else 1
        return {
            "items": logs,
            "page": page,
            "page_size": page_size,
            "total_items": total_items,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }

    @staticmethod
    async def get_stats(tenant_id: Optional[str] = None) -> dict:
        user_where = {"tenantId": tenant_id} if tenant_id else {}
        class_where = {"tenantId": tenant_id} if tenant_id else {}
        total_students = await db.student.count(where={"user": {"is": user_where}} if tenant_id else {})
        total_teachers = await db.teacher.count(where={"user": {"is": user_where}} if tenant_id else {})
        total_classes = await db.academicclass.count(where=class_where)
        attendance_where = {"student": {"is": {"user": {"is": user_where}}}} if tenant_id else {}
        total_attendance = await db.attendance.count(where=attendance_where)
        passed_where = {"status": {"in": ["Present", "Late", "Approved"]}}
        if tenant_id:
            passed_where["student"] = {"is": {"user": {"is": user_where}}}
        passed_attendance = await db.attendance.count(where=passed_where)

        pass_rate = 0.0
        if total_attendance > 0:
            pass_rate = round((passed_attendance / total_attendance) * 100.0, 1)

        return {
            "studentCount": total_students,
            "teacherCount": total_teachers,
            "classCount": total_classes,
            "attendanceCount": total_attendance,
            "biometricPassRate": pass_rate,
        }

    @staticmethod
    async def export_audit_logs_csv(tenant_id: Optional[str] = None) -> str:
        where = {"tenantId": tenant_id} if tenant_id else {}
        logs = await db.auditlog.find_many(where=where, order={"timestamp": "desc"}, take=1000)
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Timestamp", "Event Type", "Severity", "Actor", "Target", "Description", "IP Address"])
        for log_entry in logs:
            writer.writerow(
                [
                    log_entry.id,
                    log_entry.timestamp.isoformat() if log_entry.timestamp else "",
                    log_entry.eventType,
                    log_entry.severity,
                    log_entry.actor,
                    log_entry.target,
                    log_entry.description,
                    log_entry.ipAddress or "",
                ]
            )
        return output.getvalue()
