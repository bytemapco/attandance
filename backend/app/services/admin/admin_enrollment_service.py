from typing import List, Optional
from app.db.client import db
from app.repositories.class_repository import ClassRepository
from app.repositories.enrollment_repository import EnrollmentRepository
from app.repositories.student_repository import StudentRepository


class AdminEnrollmentService:
    def __init__(self) -> None:
        self.class_repo = ClassRepository()
        self.student_repo = StudentRepository()
        self.enrollment_repo = EnrollmentRepository()

    async def enroll_students(
        self,
        class_id: str,
        student_ids: List[str],
        actor: str = "system",
        ip: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> int:
        if tenant_id and db.is_connected():
            academic_class = await db.academicclass.find_first(
                where={"id": class_id, "tenantId": tenant_id}
            )
            if not academic_class:
                raise ValueError("Academic class not found.")
        else:
            if not await self.class_repo.get_by_id(class_id):
                raise ValueError("Academic class not found.")

        count = 0
        for sid in student_ids:
            if tenant_id and db.is_connected():
                stu = await db.student.find_first(
                    where={"id": sid, "user": {"is": {"tenantId": tenant_id}}}
                )
                if not stu:
                    continue
            else:
                if not await self.student_repo.get_by_id(sid):
                    continue

            existing = await db.enrollment.find_first(
                where={"studentId": sid, "academicClassId": class_id}
            )
            if not existing:
                await self.enrollment_repo.enroll_student(sid, class_id)
                count += 1

        log_data = {
            "eventType": "ENROLL_STUDENTS",
            "severity": "INFO",
            "actor": actor,
            "target": class_id,
            "description": f"Enrolled {count} student(s) in class",
            "ipAddress": ip,
        }
        if tenant_id and tenant_id != "default-institution":
            log_data["tenantId"] = tenant_id

        await db.auditlog.create(data=log_data)
        return count
