from typing import List, Optional
from prisma.models import Department, Subject, Classroom, Designation
from app.db.client import db
from app.schemas.student import StudentCreate, StudentResponse
from app.schemas.teacher import TeacherCreate, TeacherResponse
from app.services.admin.student_admin_service import StudentAdminService
from app.services.admin.teacher_admin_service import TeacherAdminService
from app.services.admin.admin_bulk_service import AdminBulkService
from app.services.admin.department_service import DepartmentService
from app.services.admin.subject_service import SubjectService
from app.services.admin.classroom_service import ClassroomService
from app.services.admin.designation_service import DesignationService
from app.services.admin.audit_export_service import AuditExportService


class AdminService:
    @staticmethod
    async def _log_action(event_type: str, severity: str, actor: str, target: str, description: str, ip: Optional[str] = None, tenant_id: Optional[str] = None) -> None:
        log_data = {"eventType": event_type, "severity": severity, "actor": actor, "target": target, "description": description, "ipAddress": ip}
        if tenant_id and tenant_id != "default-institution":
            log_data["tenantId"] = tenant_id
        await db.auditlog.create(data=log_data)

    # Students
    async def create_student(self, data: StudentCreate, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> StudentResponse:
        res = await StudentAdminService.create_student(data, tenant_id=tenant_id)
        await self._log_action("CREATE_STUDENT", "INFO", actor, res.id, f"Created student {data.email}", ip, tenant_id=tenant_id)
        return res

    async def get_all_students(self, **kwargs) -> dict:
        return await StudentAdminService.get_all_students(**kwargs)

    async def get_student_filter_facets(self, tenant_id: Optional[str] = None) -> dict:
        return await StudentAdminService.get_filter_facets(tenant_id=tenant_id)

    async def update_student(self, id: str, data: dict, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> StudentResponse:
        res = await StudentAdminService.update_student(id, data, tenant_id=tenant_id)
        await self._log_action("UPDATE_STUDENT", "INFO", actor, id, f"Updated student {res.email}", ip, tenant_id=tenant_id)
        return res

    # Teachers
    async def create_teacher(self, data: TeacherCreate, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> TeacherResponse:
        res = await TeacherAdminService.create_teacher(data, tenant_id=tenant_id)
        await self._log_action("CREATE_TEACHER", "INFO", actor, res.id, f"Created teacher {data.email}", ip, tenant_id=tenant_id)
        return res

    async def get_all_teachers(self, **kwargs) -> dict:
        return await TeacherAdminService.get_all_teachers(**kwargs)

    async def update_teacher(self, id: str, data: dict, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> TeacherResponse:
        res = await TeacherAdminService.update_teacher(id, data, tenant_id=tenant_id)
        await self._log_action("UPDATE_TEACHER", "INFO", actor, id, f"Updated teacher {res.email}", ip, tenant_id=tenant_id)
        return res

    # Departments
    async def get_all_departments(self, tenant_id: Optional[str] = None) -> List[Department]:
        return await DepartmentService.get_all_departments(tenant_id=tenant_id)

    async def get_department_by_id(self, id: str, tenant_id: Optional[str] = None) -> Optional[Department]:
        return await DepartmentService.get_department_by_id(id, tenant_id=tenant_id)

    async def create_department(self, name: str, code: str, head: Optional[str] = None, description: Optional[str] = None, tenant_id: Optional[str] = None) -> Department:
        return await DepartmentService.create_department(name, code, head, description, tenant_id=tenant_id)

    async def update_department(self, id: str, data: dict, tenant_id: Optional[str] = None) -> Department:
        return await DepartmentService.update_department(id, data, tenant_id=tenant_id)

    async def delete_department(self, id: str, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> None:
        await DepartmentService.delete_department(id, tenant_id=tenant_id)
        await self._log_action("DELETE_DEPARTMENT", "WARNING", actor, id, f"Deleted department {id}", ip, tenant_id=tenant_id)

    # Subjects
    async def get_all_subjects(self, tenant_id: Optional[str] = None) -> List[Subject]:
        return await SubjectService.get_all_subjects(tenant_id=tenant_id)

    async def get_subject_by_id(self, id: str, tenant_id: Optional[str] = None) -> Optional[Subject]:
        return await SubjectService.get_subject_by_id(id, tenant_id=tenant_id)

    async def create_subject(self, name: str, code: str, description: Optional[str] = None, department_id: Optional[str] = None, tenant_id: Optional[str] = None) -> Subject:
        return await SubjectService.create_subject(name, code, description, department_id=department_id, tenant_id=tenant_id)

    async def update_subject(self, id: str, data: dict, tenant_id: Optional[str] = None) -> Subject:
        return await SubjectService.update_subject(id, data, tenant_id=tenant_id)

    async def delete_subject(self, id: str, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> None:
        await SubjectService.delete_subject(id, tenant_id=tenant_id)
        await self._log_action("DELETE_SUBJECT", "WARNING", actor, id, f"Deleted subject {id}", ip, tenant_id=tenant_id)

    # Classrooms
    async def get_all_classrooms(self, tenant_id: Optional[str] = None) -> List[Classroom]:
        return await ClassroomService.get_all_classrooms(tenant_id=tenant_id)

    async def get_classroom_by_id(self, id: str, tenant_id: Optional[str] = None) -> Optional[Classroom]:
        return await ClassroomService.get_classroom_by_id(id, tenant_id=tenant_id)

    async def create_classroom(self, name: str, building: Optional[str] = None, tenant_id: Optional[str] = None) -> Classroom:
        return await ClassroomService.create_classroom(name, building, tenant_id=tenant_id)

    async def update_classroom(self, id: str, data: dict, tenant_id: Optional[str] = None) -> Classroom:
        return await ClassroomService.update_classroom(id, data, tenant_id=tenant_id)

    async def delete_classroom(self, id: str, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> None:
        await ClassroomService.delete_classroom(id, tenant_id=tenant_id)
        await self._log_action("DELETE_CLASSROOM", "WARNING", actor, id, f"Deleted classroom {id}", ip, tenant_id=tenant_id)

    # Designations
    async def get_all_designations(self, tenant_id: Optional[str] = None) -> List[Designation]:
        return await DesignationService.get_all_designations(tenant_id=tenant_id)

    async def get_designation_by_id(self, id: str, tenant_id: Optional[str] = None) -> Optional[Designation]:
        return await DesignationService.get_designation_by_id(id, tenant_id=tenant_id)

    async def create_designation(self, name: str, code: str, description: Optional[str] = None, tenant_id: Optional[str] = None) -> Designation:
        return await DesignationService.create_designation(name, code, description, tenant_id=tenant_id)

    async def update_designation(self, id: str, data: dict, tenant_id: Optional[str] = None) -> Designation:
        return await DesignationService.update_designation(id, data, tenant_id=tenant_id)

    async def delete_designation(self, id: str, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> None:
        await DesignationService.delete_designation(id, tenant_id=tenant_id)
        await self._log_action("DELETE_DESIGNATION", "WARNING", actor, id, f"Deleted designation {id}", ip, tenant_id=tenant_id)

    # Audit & Stats
    async def get_audit_logs(self, **kwargs) -> dict:
        return await AuditExportService.get_audit_logs(**kwargs)

    async def get_stats(self, tenant_id: Optional[str] = None) -> dict:
        return await AuditExportService.get_stats(tenant_id=tenant_id)

    async def export_audit_logs_csv(self, tenant_id: Optional[str] = None) -> str:
        return await AuditExportService.export_audit_logs_csv(tenant_id=tenant_id)

    async def trigger_password_reset(self, user_id: str, actor: str = "system", ip: Optional[str] = None, frontend_url: Optional[str] = None) -> None:
        user = await db.user.find_unique(where={"id": user_id})
        if not user:
            raise ValueError("User not found.")
        from app.services.auth_service import AuthService

        await AuthService().request_password_reset(user.email, frontend_url=frontend_url)
        await self._log_action("TRIGGER_PASSWORD_RESET", "INFO", actor, user_id, f"Dispatched password reset email for {user.email}", ip, tenant_id=user.tenantId)

    # Bulk Operations (Delegated to AdminBulkService)
    async def bulk_create_students(self, students: list, send_invite: bool = True, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        return await AdminBulkService.bulk_create_students(students, send_invite=send_invite, actor=actor, ip=ip, tenant_id=tenant_id)

    async def bulk_create_teachers(self, teachers: list, send_invite: bool = True, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        return await AdminBulkService.bulk_create_teachers(teachers, send_invite=send_invite, actor=actor, ip=ip, tenant_id=tenant_id)

    async def bulk_create_departments(self, departments: list, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        return await AdminBulkService.bulk_create_departments(departments, actor=actor, ip=ip, tenant_id=tenant_id)

    async def bulk_create_subjects(self, subjects: list, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        return await AdminBulkService.bulk_create_subjects(subjects, actor=actor, ip=ip, tenant_id=tenant_id)

    async def bulk_create_classrooms(self, classrooms: list, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        return await AdminBulkService.bulk_create_classrooms(classrooms, actor=actor, ip=ip, tenant_id=tenant_id)

    async def bulk_create_designations(self, designations: list, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        return await AdminBulkService.bulk_create_designations(designations, actor=actor, ip=ip, tenant_id=tenant_id)
