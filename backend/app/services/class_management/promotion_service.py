from fastapi import HTTPException, status
from app.db.client import db
from app.schemas.class_management import PromoteRequest, PromotionPreview
from app.services.class_management.class_member_service import close_member, place_students
from app.services.class_management.class_term_service import (
    get_or_create_semester,
    require_academic_year,
)
from app.services.class_management.common import get_class_term
from app.services.class_management.enrollment_sync import enroll_students

# Final semester of the programme. Programme length is not modelled yet (B.E./B.Tech = 8).
FINAL_SEMESTER = 8


async def _validate(tenant_id: str, term, data: PromoteRequest) -> None:
    member_ids = {
        m.studentId for m in await db.classmember.find_many(where={"classTermId": term.id})
    }
    flagged = set(data.detained_student_ids) | {b.student_id for b in data.backlogs}
    if not flagged <= member_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Detained/backlog students must belong to this class.")
    if set(data.detained_student_ids) & {b.student_id for b in data.backlogs}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A detained student cannot also receive backlog enrolments.")
    section_ids = list({b.course_section_id for b in data.backlogs})
    if not section_ids:
        return
    found = await db.coursesection.count(where={"id": {"in": section_ids}, "tenantId": tenant_id})
    if found != len(section_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Backlog course section not found.")


async def _find_next_class(tenant_id: str, term, next_year, next_number: int):
    semester = await db.semester.find_first(
        where={"tenantId": tenant_id, "academicYearId": next_year.id, "number": next_number}
    )
    if not semester:
        return None
    return await db.classterm.find_first(
        where={"tenantId": tenant_id, "groupId": term.groupId, "semesterId": semester.id}
    )


async def _ensure_next_class(tenant_id: str, term, next_year, next_number: int):
    existing = await _find_next_class(tenant_id, term, next_year, next_number)
    if existing:
        return existing
    semester = await get_or_create_semester(tenant_id, next_year, next_number)
    return await db.classterm.create(
        data={"tenantId": tenant_id, "groupId": term.groupId, "semesterId": semester.id}
    )


async def promote(tenant_id: str, class_id: str, data: PromoteRequest) -> PromotionPreview:
    term = await get_class_term(tenant_id, class_id)
    next_year = await require_academic_year(tenant_id, data.next_academic_year_id)
    await _validate(tenant_id, term, data)
    detained = set(data.detained_student_ids)
    promoting = [m.studentId for m in term.members or [] if m.studentId not in detained]
    detaining = [m.studentId for m in term.members or [] if m.studentId in detained]
    graduated = term.semester.number >= FINAL_SEMESTER
    next_number = None if graduated else term.semester.number + 1
    next_term = None if graduated else await _find_next_class(tenant_id, term, next_year, next_number)
    preview = PromotionPreview(
        dry_run=data.dry_run,
        next_class_id=next_term.id if next_term else None,
        next_semester_number=next_number,
        promoted=len(promoting),
        detained=len(detaining),
        backlog_enrollments=len(data.backlogs),
        graduated=graduated,
    )
    if data.dry_run:
        return preview
    for student_id in promoting:
        await close_member(term, student_id, "PROMOTED", "Promoted")
    for student_id in detaining:
        await close_member(term, student_id, "DETAINED", "Detained")
    if not graduated:
        next_term = await _ensure_next_class(tenant_id, term, next_year, next_number)
        preview.next_class_id = next_term.id
        await place_students(tenant_id, await get_class_term(tenant_id, next_term.id), promoting, "Promoted")
    for backlog in data.backlogs:
        await enroll_students([backlog.course_section_id], [backlog.student_id], "BACKLOG")
    if graduated and not detaining:
        await db.studentgroup.update(where={"id": term.groupId}, data={"status": "GRADUATED"})
    return preview
