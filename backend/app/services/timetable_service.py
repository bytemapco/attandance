from datetime import date, datetime
from typing import List, Optional
from fastapi import HTTPException, status
from app.db.client import db
from app.schemas.timetable import (
    CourseSectionCreate,
    TimetableRuleCreate,
)


def _to_dt(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, 0, 0, 0)


class TimetableService:
    @staticmethod
    async def create_course_section(tenant_id: str, data: CourseSectionCreate):
        year_id = data.resolve_year_id()
        existing = await db.coursesection.find_first(
            where={
                "academicYearId": year_id,
                "subjectId": data.subject_id,
                "name": data.name,
                "batch": data.batch,
            }
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Section '{data.name}' already exists for this subject in this academic year",
            )
        section = await db.coursesection.create(
            data={
                "tenantId": tenant_id,
                "academicYearId": year_id,
                "subjectId": data.subject_id,
                "departmentId": data.department_id,
                "name": data.name,
                "batch": data.batch,
                "defaultRoomId": data.default_room_id,
            }
        )
        if data.primary_teacher_id:
            await db.coursefaculty.create(
                data={
                    "courseSectionId": section.id,
                    "teacherId": data.primary_teacher_id,
                    "isPrimary": True,
                    "roleDescription": "Primary Instructor",
                }
            )
        return section

    @staticmethod
    async def list_course_sections(
        tenant_id: str,
        year_id: Optional[str] = None,
        term_id: Optional[str] = None,
        subject_id: Optional[str] = None,
    ):
        where = {"tenantId": tenant_id}
        effective_year_id = year_id or term_id
        if effective_year_id:
            where["academicYearId"] = effective_year_id
        if subject_id:
            where["subjectId"] = subject_id
        return await db.coursesection.find_many(
            where=where,
            include={
                "subject": True,
                "defaultRoom": True,
                "faculties": {"include": {"teacher": {"include": {"user": True}}}},
                "enrollments": True,
            },
            order={"name": "asc"},
        )

    @staticmethod
    async def get_course_section(tenant_id: str, section_id: str):
        section = await db.coursesection.find_first(
            where={"id": section_id, "tenantId": tenant_id},
            include={
                "subject": True,
                "defaultRoom": True,
                "faculties": {"include": {"teacher": {"include": {"user": True}}}},
                "enrollments": {"include": {"student": {"include": {"user": True}}}},
                "timetableRules": {"include": {"timeSlot": True, "classroom": True}},
            },
        )
        if not section:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course section not found")
        return section

    @staticmethod
    async def enroll_students_bulk(tenant_id: str, section_id: str, student_ids: List[str]):
        await TimetableService.get_course_section(tenant_id, section_id)
        enrolled_count = 0
        for sid in student_ids:
            existing = await db.courseenrollment.find_unique(
                where={"courseSectionId_studentId": {"courseSectionId": section_id, "studentId": sid}}
            )
            if not existing:
                await db.courseenrollment.create(
                    data={"courseSectionId": section_id, "studentId": sid, "status": "ACTIVE"}
                )
                enrolled_count += 1
        return {"success": True, "enrolled_count": enrolled_count, "total_requested": len(student_ids)}

    @staticmethod
    async def create_timetable_rule(tenant_id: str, data: TimetableRuleCreate):
        if data.effective_from >= data.effective_until:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="effective_from must be before effective_until",
            )
        existing = await db.timetablerule.find_unique(
            where={
                "courseSectionId_timeSlotId_dayOfWeek": {
                    "courseSectionId": data.course_section_id,
                    "timeSlotId": data.time_slot_id,
                    "dayOfWeek": data.day_of_week,
                }
            }
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Timetable slot collision: A rule already exists for this section, slot, and day",
            )
        return await db.timetablerule.create(
            data={
                "tenantId": tenant_id,
                "courseSectionId": data.course_section_id,
                "timeSlotId": data.time_slot_id,
                "classroomId": data.classroom_id,
                "teacherId": data.teacher_id,
                "dayOfWeek": data.day_of_week,
                "effectiveFrom": _to_dt(data.effective_from),
                "effectiveUntil": _to_dt(data.effective_until),
                "isActive": data.is_active if data.is_active is not None else True,
            }
        )

    @staticmethod
    async def list_timetable_rules(tenant_id: str, section_id: Optional[str] = None):
        where = {"tenantId": tenant_id}
        if section_id:
            where["courseSectionId"] = section_id
        return await db.timetablerule.find_many(
            where=where,
            include={"timeSlot": True, "classroom": True, "teacher": {"include": {"user": True}}},
            order={"dayOfWeek": "asc"},
        )

    @staticmethod
    async def delete_timetable_rule(tenant_id: str, rule_id: str):
        rule = await db.timetablerule.find_first(where={"id": rule_id, "tenantId": tenant_id})
        if not rule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
        await db.timetablerule.delete(where={"id": rule_id})
        return {"success": True, "message": "Timetable rule deleted"}
