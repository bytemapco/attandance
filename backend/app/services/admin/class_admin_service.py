from typing import List, Optional
from app.db.client import db
from app.repositories.teacher_repository import TeacherRepository
from app.repositories.class_repository import ClassRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.enrollment_repository import EnrollmentRepository
from app.schemas.admin import ClassCreate, ClassResponse


class ClassAdminService:
    def __init__(self):
        self.teacher_repo = TeacherRepository()
        self.class_repo = ClassRepository()
        self.student_repo = StudentRepository()
        self.enrollment_repo = EnrollmentRepository()

    async def create_class(self, data: ClassCreate, tenant_id: Optional[str] = None) -> ClassResponse:
        if tenant_id and db.is_connected():
            if not await db.teacher.find_first(where={"id": data.teacher_id, "user": {"is": {"tenantId": tenant_id}}}):
                raise ValueError("Teacher profile not found.")
            if not await db.subject.find_first(where={"id": data.subject_id, "tenantId": tenant_id}):
                raise ValueError(f"Subject with id '{data.subject_id}' not found.")
            if data.classroom_id and not await db.classroom.find_first(
                where={"id": data.classroom_id, "tenantId": tenant_id}
            ):
                raise ValueError(f"Classroom with id '{data.classroom_id}' not found.")
        else:
            if not await self.teacher_repo.get_by_id(data.teacher_id):
                raise ValueError("Teacher profile not found.")
            if not await db.subject.find_unique(where={"id": data.subject_id}):
                raise ValueError(f"Subject with id '{data.subject_id}' not found.")
            if data.classroom_id and not await db.classroom.find_unique(where={"id": data.classroom_id}):
                raise ValueError(f"Classroom with id '{data.classroom_id}' not found.")

        create_data = {
            k: v
            for k, v in {
                "name": data.name,
                "teacherId": data.teacher_id,
                "subjectId": data.subject_id,
                "classroomId": data.classroom_id,
                "semester": data.semester,
                "batch": data.batch,
            }.items()
            if v is not None
        }
        if tenant_id:
            create_data["tenantId"] = tenant_id

        cls = await db.academicclass.create(
            data=create_data,
            include={"subject": True, "classroom": True, "enrollments": True},
        )
        return ClassResponse(
            id=cls.id,
            name=cls.name,
            subject_name=cls.subject.name,
            subject_code=cls.subject.code,
            teacherId=cls.teacherId,
            classroom_name=cls.classroom.name if cls.classroom else None,
            semester=cls.semester,
            batch=cls.batch,
            enrolled_count=len(cls.enrollments) if cls.enrollments else 0,
            enrolled_student_ids=[e.studentId for e in cls.enrollments] if cls.enrollments else [],
        )

    async def get_all_classes(
        self,
        page: int = 1,
        page_size: int = 10,
        sort_by: Optional[str] = None,
        sort_order: str = "asc",
        q: Optional[str] = None,
        subject_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> dict:
        where: dict = {}
        if tenant_id:
            where["tenantId"] = tenant_id
        if subject_id and subject_id != "all":
            where["subjectId"] = subject_id

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
            include={"subject": True, "classroom": True, "enrollments": True},
            skip=skip,
            take=page_size,
            order={order_col: order_dir},
        )
        items = [
            ClassResponse(
                id=c.id,
                name=c.name,
                subject_name=c.subject.name if c.subject else "",
                subject_code=c.subject.code if c.subject else "",
                teacherId=c.teacherId,
                classroom_name=c.classroom.name if c.classroom else None,
                semester=c.semester,
                batch=c.batch,
                enrolled_count=len(c.enrollments) if c.enrollments else 0,
                enrolled_student_ids=[e.studentId for e in c.enrollments] if c.enrollments else [],
            )
            for c in classes
        ]
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

        if "teacher_id" in data and data["teacher_id"]:
            t_where = {"id": data["teacher_id"]}
            if tenant_id:
                t_where["user"] = {"is": {"tenantId": tenant_id}}
            if not await db.teacher.find_first(where=t_where):
                raise ValueError("Teacher not found.")

        if "subject_id" in data and data["subject_id"]:
            s_where = {"id": data["subject_id"]}
            if tenant_id:
                s_where["tenantId"] = tenant_id
            if not await db.subject.find_first(where=s_where):
                raise ValueError("Subject not found.")

        if "classroom_id" in data and data["classroom_id"]:
            c_where = {"id": data["classroom_id"]}
            if tenant_id:
                c_where["tenantId"] = tenant_id
            if not await db.classroom.find_first(where=c_where):
                raise ValueError("Classroom not found.")

        mapping = {
            "name": "name",
            "subject_id": "subjectId",
            "classroom_id": "classroomId",
            "teacher_id": "teacherId",
            "semester": "semester",
            "batch": "batch",
        }
        update_data = {mapping[k]: v for k, v in data.items() if k in mapping and v is not None}
        cls = await db.academicclass.update(
            where={"id": class_id}, data=update_data, include={"subject": True, "classroom": True, "enrollments": True}
        )
        return ClassResponse(
            id=cls.id,
            name=cls.name,
            subject_name=cls.subject.name if cls.subject else "",
            subject_code=cls.subject.code if cls.subject else "",
            teacherId=cls.teacherId,
            classroom_name=cls.classroom.name if cls.classroom else None,
            semester=cls.semester,
            batch=cls.batch,
            enrolled_count=len(cls.enrollments) if cls.enrollments else 0,
            enrolled_student_ids=[e.studentId for e in cls.enrollments] if cls.enrollments else [],
        )

    async def assign_teacher(self, class_id: str, teacher_id: str, tenant_id: Optional[str] = None) -> ClassResponse:
        if tenant_id and db.is_connected():
            cls_where = {"id": class_id, "tenantId": tenant_id}
            if not await db.academicclass.find_first(where=cls_where):
                raise ValueError("Academic class not found.")
            teacher_where = {"id": teacher_id, "user": {"is": {"tenantId": tenant_id}}}
            if not await db.teacher.find_first(where=teacher_where):
                raise ValueError("Teacher profile not found.")
        else:
            if not await self.class_repo.get_by_id(class_id):
                raise ValueError("Academic class not found.")
            if not await self.teacher_repo.get_by_id(teacher_id):
                raise ValueError("Teacher profile not found.")

        cls = await db.academicclass.update(
            where={"id": class_id},
            data={"teacherId": teacher_id},
            include={"subject": True, "classroom": True, "enrollments": True},
        )
        return ClassResponse(
            id=cls.id,
            name=cls.name,
            subject_name=cls.subject.name if cls.subject else "",
            subject_code=cls.subject.code if cls.subject else "",
            teacherId=cls.teacherId,
            classroom_name=cls.classroom.name if cls.classroom else None,
            semester=cls.semester,
            batch=cls.batch,
            enrolled_count=len(cls.enrollments) if cls.enrollments else 0,
            enrolled_student_ids=[e.studentId for e in cls.enrollments] if cls.enrollments else [],
        )

    async def enroll_students(self, class_id: str, student_ids: List[str], tenant_id: Optional[str] = None) -> int:
        if tenant_id and db.is_connected():
            cls_where = {"id": class_id, "tenantId": tenant_id}
            if not await db.academicclass.find_first(where=cls_where):
                raise ValueError("Academic class not found.")
        else:
            if not await self.class_repo.get_by_id(class_id):
                raise ValueError("Academic class not found.")

        count = 0
        for sid in student_ids:
            if tenant_id and db.is_connected():
                stu_where = {"id": sid, "user": {"is": {"tenantId": tenant_id}}}
                if not await db.student.find_first(where=stu_where):
                    continue
            else:
                if not await self.student_repo.get_by_id(sid):
                    continue

            existing = await db.enrollment.find_first(where={"studentId": sid, "academicClassId": class_id})
            if not existing:
                await self.enrollment_repo.enroll_student(sid, class_id)
                count += 1
        return count
