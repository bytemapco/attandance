from datetime import date, datetime, timezone
from fastapi import HTTPException, status
from app.db.client import db
from app.schemas.class_management import ClassDetail, ClassSectionCreate, ClassSectionUpdate
from app.services.class_management.common import build_detail, class_code, get_class_term
from app.services.class_management.enrollment_sync import enroll_students


async def _require(model, tenant_id: str, record_id: str, label: str) -> None:
    if not await model.find_first(where={"id": record_id, "tenantId": tenant_id}):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label} not found.")


async def _require_teacher(tenant_id: str, teacher_id: str) -> None:
    teacher = await db.teacher.find_first(where={"id": teacher_id, "user": {"is": {"tenantId": tenant_id}}})
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found.")


def _find_section(term, section_id: str):
    section = next((s for s in term.courseSections or [] if s.id == section_id), None)
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found in this class.")
    return section


async def _set_primary_teacher(section_id: str, teacher_id: str) -> None:
    await db.coursefaculty.delete_many(where={"courseSectionId": section_id, "isPrimary": True})
    await db.coursefaculty.create(
        data={
            "courseSectionId": section_id,
            "teacherId": teacher_id,
            "isPrimary": True,
            "roleDescription": "Primary Instructor",
        }
    )


async def create_section(tenant_id: str, class_id: str, data: ClassSectionCreate) -> ClassDetail:
    term = await get_class_term(tenant_id, class_id)
    await _require(db.subject, tenant_id, data.subject_id, "Subject")
    if data.primary_teacher_id:
        await _require_teacher(tenant_id, data.primary_teacher_id)
    if data.default_room_id:
        await _require(db.classroom, tenant_id, data.default_room_id, "Classroom")
    if any(s.subjectId == data.subject_id for s in term.courseSections or []):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This subject is already added to the class.")
    section = await db.coursesection.create(
        data={
            "tenantId": tenant_id,
            "academicYearId": term.semester.academicYearId,
            "subjectId": data.subject_id,
            "departmentId": term.group.departmentId,
            "name": class_code(term.group.department.code, term.group.batch),
            "defaultRoomId": data.default_room_id,
            "classTermId": class_id,
        }
    )
    if data.primary_teacher_id:
        await _set_primary_teacher(section.id, data.primary_teacher_id)
    await enroll_students([section.id], [m.studentId for m in term.members or []])
    return build_detail(await get_class_term(tenant_id, class_id))


async def update_section(tenant_id: str, class_id: str, section_id: str, data: ClassSectionUpdate) -> ClassDetail:
    term = await get_class_term(tenant_id, class_id)
    _find_section(term, section_id)
    await _require_teacher(tenant_id, data.primary_teacher_id)
    await _set_primary_teacher(section_id, data.primary_teacher_id)
    await db.timetablerule.update_many(
        where={"courseSectionId": section_id}, data={"teacherId": data.primary_teacher_id}
    )
    today = datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc)
    await db.classoccurrence.update_many(
        where={
            "courseSectionId": section_id,
            "date": {"gte": today},
            "status": "SCHEDULED",
            "isAttendanceLocked": False,
        },
        data={"facultyId": data.primary_teacher_id},
    )
    return build_detail(await get_class_term(tenant_id, class_id))


async def delete_section(tenant_id: str, class_id: str, section_id: str) -> ClassDetail:
    term = await get_class_term(tenant_id, class_id)
    _find_section(term, section_id)
    marked = await db.attendancerecord.count(where={"occurrence": {"is": {"courseSectionId": section_id}}})
    if marked:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attendance has already been recorded for this subject, so it cannot be removed.",
        )
    await db.coursesection.delete(where={"id": section_id})
    return build_detail(await get_class_term(tenant_id, class_id))
