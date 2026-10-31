from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.api.dependencies import RoleChecker, get_tenant_context
from app.schemas.timetable import (
    CourseSectionCreate,
    CourseSectionResponse,
    CourseEnrollmentBulkRequest,
    TimetableRuleCreate,
    TimetableRuleResponse,
)
from app.services.timetable_service import TimetableService

router = APIRouter(prefix="/timetable", tags=["Institutional Timetable & Sections"])

admin_or_teacher = Depends(RoleChecker(allowed_roles=["ADMIN", "SUPER_ADMIN", "TEACHER"]))
admin_only = Depends(RoleChecker(allowed_roles=["ADMIN", "SUPER_ADMIN"]))


@router.get("/sections", response_model=List[CourseSectionResponse], dependencies=[admin_or_teacher])
async def list_course_sections(
    academic_year_id: Optional[str] = Query(None, description="Filter by Academic Year / Semester ID"),
    term_id: Optional[str] = Query(None, description="Deprecated filter alias for Academic Year ID"),
    subject_id: Optional[str] = Query(None, description="Filter by Subject ID"),
    tenant_id: str = Depends(get_tenant_context),
):
    sections = await TimetableService.list_course_sections(
        tenant_id, year_id=academic_year_id, term_id=term_id, subject_id=subject_id
    )
    return [
        CourseSectionResponse(
            id=s.id,
            tenant_id=s.tenantId,
            academic_year_id=s.academicYearId,
            academic_term_id=s.academicYearId,
            subject_id=s.subjectId,
            department_id=s.departmentId,
            name=s.name,
            batch=s.batch,
            default_room_id=s.defaultRoomId,
            created_at=s.createdAt,
            updated_at=s.updatedAt,
            subject_name=s.subject.name if s.subject else None,
            subject_code=s.subject.code if s.subject else None,
            default_room_name=s.defaultRoom.name if s.defaultRoom else None,
            enrolled_count=len(s.enrollments) if s.enrollments else 0,
        )
        for s in sections
    ]


@router.post(
    "/sections",
    response_model=CourseSectionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[admin_only],
)
async def create_course_section(
    data: CourseSectionCreate,
    tenant_id: str = Depends(get_tenant_context),
):
    s = await TimetableService.create_course_section(tenant_id, data)
    return CourseSectionResponse(
        id=s.id,
        tenant_id=s.tenantId,
        academic_year_id=s.academicYearId,
        academic_term_id=s.academicYearId,
        subject_id=s.subjectId,
        department_id=s.departmentId,
        name=s.name,
        batch=s.batch,
        default_room_id=s.defaultRoomId,
        created_at=s.createdAt,
        updated_at=s.updatedAt,
    )


@router.post("/sections/enroll-bulk", dependencies=[admin_only])
async def enroll_students_bulk(
    data: CourseEnrollmentBulkRequest,
    tenant_id: str = Depends(get_tenant_context),
):
    return await TimetableService.enroll_students_bulk(tenant_id, data.course_section_id, data.student_ids)


@router.get("/rules", response_model=List[TimetableRuleResponse], dependencies=[admin_or_teacher])
async def list_timetable_rules(
    section_id: Optional[str] = Query(None, description="Filter by Course Section ID"),
    tenant_id: str = Depends(get_tenant_context),
):
    rules = await TimetableService.list_timetable_rules(tenant_id, section_id=section_id)
    return [
        TimetableRuleResponse(
            id=r.id,
            tenant_id=r.tenantId,
            course_section_id=r.courseSectionId,
            time_slot_id=r.timeSlotId,
            classroom_id=r.classroomId,
            teacher_id=r.teacherId,
            day_of_week=r.dayOfWeek,
            effective_from=r.effectiveFrom.date() if hasattr(r.effectiveFrom, "date") else r.effectiveFrom,
            effective_until=r.effectiveUntil.date() if hasattr(r.effectiveUntil, "date") else r.effectiveUntil,
            is_active=r.isActive,
            time_slot_name=r.timeSlot.name if r.timeSlot else None,
            start_time=r.timeSlot.startTime if r.timeSlot else None,
            end_time=r.timeSlot.endTime if r.timeSlot else None,
            teacher_name=f"{r.teacher.firstName} {r.teacher.lastName}".strip() if r.teacher else None,
            classroom_name=r.classroom.name if r.classroom else None,
        )
        for r in rules
    ]


@router.post(
    "/rules",
    response_model=TimetableRuleResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[admin_only],
)
async def create_timetable_rule(
    data: TimetableRuleCreate,
    tenant_id: str = Depends(get_tenant_context),
):
    r = await TimetableService.create_timetable_rule(tenant_id, data)
    return TimetableRuleResponse(
        id=r.id,
        tenant_id=r.tenantId,
        course_section_id=r.courseSectionId,
        time_slot_id=r.timeSlotId,
        classroom_id=r.classroomId,
        teacher_id=r.teacherId,
        day_of_week=r.dayOfWeek,
        effective_from=r.effectiveFrom.date() if hasattr(r.effectiveFrom, "date") else r.effectiveFrom,
        effective_until=r.effectiveUntil.date() if hasattr(r.effectiveUntil, "date") else r.effectiveUntil,
        is_active=r.isActive,
    )


@router.delete("/rules/{rule_id}", dependencies=[admin_only])
async def delete_timetable_rule(
    rule_id: str,
    tenant_id: str = Depends(get_tenant_context),
):
    return await TimetableService.delete_timetable_rule(tenant_id, rule_id)
