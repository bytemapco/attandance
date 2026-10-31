from datetime import datetime, timezone
from typing import List, Optional
from app.db.client import db
from app.repositories.teacher_repository import TeacherRepository
from app.repositories.class_repository import ClassRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.enrollment_repository import EnrollmentRepository
from app.schemas.admin import ClassCreate, ClassResponse
from app.services.admin.admin_enrollment_service import AdminEnrollmentService


class ClassAdminService:
    def __init__(self):
        self.teacher_repo = TeacherRepository()
        self.class_repo = ClassRepository()
        self.student_repo = StudentRepository()
        self.enrollment_repo = EnrollmentRepository()
        self.enrollment_svc = AdminEnrollmentService()

    async def create_class(self, data: ClassCreate, tenant_id: Optional[str] = None) -> ClassResponse:
        subject_id = data.subject_id
        if not subject_id and db.is_connected():
            sub = None
            if data.department_id:
                sub = await db.subject.find_first(where={"tenantId": tenant_id, "departmentId": data.department_id})
            if not sub and tenant_id:
                sub = await db.subject.find_first(where={"tenantId": tenant_id})
            if not sub:
                sub = await db.subject.find_first()
            if not sub:
                sub = await db.subject.create(data={
                    "name": "General Studies",
                    "code": "GEN101",
                    "tenantId": tenant_id,
                    "departmentId": data.department_id,
                })
            subject_id = sub.id

        teacher_id = data.teacher_id
        if not teacher_id and db.is_connected():
            t = None
            if data.department_id:
                t = await db.teacher.find_first(where={"departmentId": data.department_id, "tenantId": tenant_id})
            if not t and tenant_id:
                t = await db.teacher.find_first(where={"tenantId": tenant_id})
            if not t:
                t = await db.teacher.find_first()
            if not t:
                raise ValueError("No teacher profile available to assign to this class.")
            teacher_id = t.id

        if tenant_id and db.is_connected():
            if not await db.teacher.find_first(where={"id": teacher_id}):
                raise ValueError("Teacher profile not found.")
            if not await db.subject.find_first(where={"id": subject_id}):
                raise ValueError(f"Subject with id '{subject_id}' not found.")
            if data.classroom_id and not await db.classroom.find_first(where={"id": data.classroom_id, "tenantId": tenant_id}):
                raise ValueError(f"Classroom with id '{data.classroom_id}' not found.")

        year_id = data.academic_year_id or data.academic_term_id
        resolved_name = (data.name or "").strip()
        if not resolved_name:
            resolved_name = data.batch or f"Class Sem-{data.semester or 1}"

        create_data = {
            k: v for k, v in {
                "name": resolved_name,
                "teacherId": teacher_id,
                "subjectId": subject_id,
                "classroomId": data.classroom_id,
                "academicYearId": year_id,
                "semester": data.semester,
                "batch": data.batch,
            }.items() if v is not None
        }
        if tenant_id:
            create_data["tenantId"] = tenant_id

        academic_class = await db.academicclass.create(
            data=create_data,
            include={"subject": True, "classroom": True, "enrollments": True, "academicYear": True},
        )

        if data.batch and db.is_connected():
            where_stu: dict = {"batch": data.batch}
            if tenant_id:
                where_stu["tenantId"] = tenant_id
            if data.semester:
                where_stu["semester"] = data.semester
            if data.department_id:
                where_stu["departmentId"] = data.department_id
            matching = await db.student.find_many(where=where_stu)
            if matching:
                await self.enrollment_svc.enroll_students(
                    academic_class.id, [s.id for s in matching], tenant_id=tenant_id
                )
                academic_class = await db.academicclass.find_unique(
                    where={"id": academic_class.id},
                    include={"subject": True, "classroom": True, "enrollments": True, "academicYear": True},
                )

        return self._format_class_response(academic_class)

    async def get_all_classes(
        self,
        page: int = 1,
        page_size: int = 10,
        sort_by: Optional[str] = None,
        sort_order: str = "asc",
        q: Optional[str] = None,
        subject_id: Optional[str] = None,
        term_id: Optional[str] = None,
        active_only: bool = False,
        tenant_id: Optional[str] = None,
    ) -> dict:
        where: dict = {}
        if tenant_id:
            where["tenantId"] = tenant_id
        if subject_id and subject_id != "all":
            where["subjectId"] = subject_id
        if term_id:
            where["academicYearId"] = term_id
        elif active_only:
            now = datetime.now(timezone.utc)
            where["OR"] = [
                {"academicYearId": None},
                {"academicYear": {"is": {"endDate": {"gte": now}}}},
            ]

        if q and q.strip():
            query_str = q.strip()
            where["OR"] = [
                {"name": {"contains": query_str, "mode": "insensitive"}},
                {"subject": {"is": {"name": {"contains": query_str, "mode": "insensitive"}}}},
                {"subject": {"is": {"code": {"contains": query_str, "mode": "insensitive"}}}},
            ]

        order_col = {"name": "name", "created_at": "createdAt", "semester": "semester"}.get(sort_by, "createdAt")
        order_dir = "desc" if sort_order.lower() == "desc" else "asc"

        total_items = await db.academicclass.count(where=where)
        skip = (page - 1) * page_size
        classes = await db.academicclass.find_many(
            where=where,
            include={"subject": True, "classroom": True, "enrollments": True, "academicYear": True},
            skip=skip,
            take=page_size,
            order={order_col: order_dir},
        )
        items = [self._format_class_response(c) for c in classes]
        total_pages = max(1, (total_items + page_size - 1) // page_size) if total_items > 0 else 1
        return {
            "items": items,
            "page": page,
            "page_size": page_size,
            "total_items": total_items,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }

    async def update_class(self, class_id: str, data: dict, tenant_id: Optional[str] = None) -> ClassResponse:
        if tenant_id and db.is_connected():
            existing = await db.academicclass.find_first(where={"id": class_id, "tenantId": tenant_id})
            if not existing:
                raise ValueError("Academic class not found.")

        year_id = data.get("academic_year_id") or data.get("academic_term_id")
        mapping = {
            "name": "name",
            "subject_id": "subjectId",
            "classroom_id": "classroomId",
            "teacher_id": "teacherId",
            "semester": "semester",
            "batch": "batch",
        }
        update_data = {mapping[k]: v for k, v in data.items() if k in mapping and v is not None}
        if year_id is not None:
            update_data["academicYearId"] = year_id

        academic_class = await db.academicclass.update(
            where={"id": class_id},
            data=update_data,
            include={"subject": True, "classroom": True, "enrollments": True, "academicYear": True},
        )
        return self._format_class_response(academic_class)

    async def assign_teacher(self, class_id: str, teacher_id: str, tenant_id: Optional[str] = None) -> ClassResponse:
        if tenant_id and db.is_connected():
            if not await db.academicclass.find_first(where={"id": class_id, "tenantId": tenant_id}):
                raise ValueError("Academic class not found.")
            if not await db.teacher.find_first(where={"id": teacher_id, "user": {"is": {"tenantId": tenant_id}}}):
                raise ValueError("Teacher profile not found.")

        academic_class = await db.academicclass.update(
            where={"id": class_id},
            data={"teacherId": teacher_id},
            include={"subject": True, "classroom": True, "enrollments": True, "academicYear": True},
        )
        return self._format_class_response(academic_class)

    async def enroll_students(self, class_id: str, student_ids: List[str], tenant_id: Optional[str] = None) -> int:
        return await self.enrollment_svc.enroll_students(class_id, student_ids, tenant_id=tenant_id)

    def _format_class_response(self, c) -> ClassResponse:
        year_obj = getattr(c, "academicYear", None)
        return ClassResponse(
            id=c.id,
            name=c.name,
            subject_name=c.subject.name if c.subject else "",
            subject_code=c.subject.code if c.subject else "",
            teacherId=c.teacherId,
            classroom_name=c.classroom.name if c.classroom else None,
            academicYearId=c.academicYearId,
            year_name=year_obj.name if year_obj else None,
            academicTermId=c.academicYearId,
            term_name=year_obj.name if year_obj else None,
            semester=c.semester,
            batch=c.batch,
            enrolled_count=len(c.enrollments) if c.enrollments else 0,
            enrolled_student_ids=[e.studentId for e in c.enrollments] if c.enrollments else [],
        )
