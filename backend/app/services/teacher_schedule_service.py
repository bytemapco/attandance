from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from app.core.datetime_utils import get_ist_today
from app.db.client import db
from app.services.occurrence_closer import close_occurrence, load_for_close
from app.services.system_config_service import SystemConfigService


class TeacherScheduleService:
    @staticmethod
    async def get_weekly_timetable(tenant_id: str, faculty_id: str):
        where: dict = {
            "tenantId": tenant_id,
            "isActive": True,
            "OR": [
                {"teacherId": faculty_id},
                {"courseSection": {"is": {"faculties": {"some": {"teacherId": faculty_id}}}}},
            ],
        }

        rules = await db.timetablerule.find_many(
            where=where,
            include={
                "classroom": True,
                "courseSection": {"include": {"subject": True, "enrollments": True}},
            },
            order={"dayOfWeek": "asc"},
        )
        config = await SystemConfigService().get_config(tenant_id=tenant_id)
        return [
            {
                "id": r.id,
                "course_section_id": r.courseSectionId,
                "day_of_week": r.dayOfWeek,
                "start_time": r.startTime,
                "end_time": r.endTime,
                "classroom_name": r.classroom.name if r.classroom else "TBA",
                "classroom_id": r.classroomId,
                "section_name": r.courseSection.name if r.courseSection else "",
                "subject_name": r.courseSection.subject.name if r.courseSection and r.courseSection.subject else "",
                "subject_code": r.courseSection.subject.code if r.courseSection and r.courseSection.subject else "",
                "enrolled_count": len(r.courseSection.enrollments) if r.courseSection and r.courseSection.enrollments else 0,
                "saturday_enabled": config.saturdayEnabled,
            }
            for r in rules
        ]

    @staticmethod
    async def start_occurrence_attendance(tenant_id: str, faculty_id: str, occurrence_id: str):
        occurrence = await db.classoccurrence.find_first(
            where={"id": occurrence_id, "tenantId": tenant_id},
            include={"courseSection": {"include": {"subject": True}}},
        )
        if not occurrence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class occurrence not found.")
        if occurrence.facultyId != faculty_id and occurrence.substituteFacultyId != faculty_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized for this occurrence.")
        if occurrence.isAttendanceLocked:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Occurrence attendance is locked.")
        if occurrence.status == "CANCELLED":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This class was cancelled.")
        if occurrence.date.date() != get_ist_today():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attendance can only be started on the day of the class.")

        config = await SystemConfigService().get_config(tenant_id=tenant_id)
        window_min = config.verificationWindowMin

        now = datetime.now(timezone.utc)
        expires = now + timedelta(minutes=window_min)

        return await db.classoccurrence.update(
            where={"id": occurrence_id},
            data={
                "verificationActive": True,
                "verificationExpires": expires,
                "status": "CONDUCTED",
                "conductedAt": now,
            },
        )

    @staticmethod
    async def stop_occurrence_attendance(tenant_id: str, faculty_id: str, user_id: str, occurrence_id: str):
        occurrence = await load_for_close(tenant_id, occurrence_id)
        if not occurrence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class occurrence not found.")
        if occurrence.facultyId != faculty_id and occurrence.substituteFacultyId != faculty_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized for this occurrence.")

        marked_count = await close_occurrence(tenant_id, occurrence, user_id)
        return {
            "success": True,
            "occurrence_id": occurrence_id,
            "status": "LOCKED",
            "absent_marked_count": marked_count,
        }
