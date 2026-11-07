from typing import Optional

from app.core.tenancy import is_real_tenant
from app.db.client import db
from app.services.admin.bulk_import_service import BulkImportService
from app.services.admin.infrastructure_bulk_service import InfrastructureBulkImportService


class AdminBulkService:
    """The bulk imports an administrator runs. Each one that adds something is written to the audit log."""

    @staticmethod
    async def bulk_create_students(students: list, send_invite: bool = True, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        result = await BulkImportService.bulk_create_students(students, tenant_id=tenant_id, send_invite=send_invite)
        return await AdminBulkService._audited("BULK_IMPORT_STUDENTS", "students", result, actor, ip, tenant_id)

    @staticmethod
    async def bulk_create_teachers(teachers: list, send_invite: bool = True, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        result = await BulkImportService.bulk_create_teachers(teachers, tenant_id=tenant_id, send_invite=send_invite)
        return await AdminBulkService._audited("BULK_IMPORT_TEACHERS", "faculty", result, actor, ip, tenant_id)

    @staticmethod
    async def bulk_create_departments(departments: list, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        result = await InfrastructureBulkImportService.bulk_create_departments(departments, tenant_id=tenant_id)
        return await AdminBulkService._audited("BULK_IMPORT_DEPARTMENTS", "departments", result, actor, ip, tenant_id)

    @staticmethod
    async def bulk_create_subjects(subjects: list, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        result = await InfrastructureBulkImportService.bulk_create_subjects(subjects, tenant_id=tenant_id)
        return await AdminBulkService._audited("BULK_IMPORT_SUBJECTS", "subjects", result, actor, ip, tenant_id)

    @staticmethod
    async def bulk_create_classrooms(classrooms: list, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        result = await InfrastructureBulkImportService.bulk_create_classrooms(classrooms, tenant_id=tenant_id)
        return await AdminBulkService._audited("BULK_IMPORT_CLASSROOMS", "classrooms", result, actor, ip, tenant_id)

    @staticmethod
    async def bulk_create_designations(designations: list, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        result = await InfrastructureBulkImportService.bulk_create_designations(designations, tenant_id=tenant_id)
        return await AdminBulkService._audited("BULK_IMPORT_DESIGNATIONS", "designations", result, actor, ip, tenant_id)

    @staticmethod
    async def _audited(event_type: str, noun: str, result: dict, actor: str, ip: Optional[str], tenant_id: Optional[str]) -> dict:
        if result["imported_count"] > 0:
            await AdminBulkService._log(event_type, actor, f"Bulk imported {result['imported_count']} {noun}", ip, tenant_id)
        return result

    @staticmethod
    async def _log(event_type: str, actor: str, desc: str, ip: Optional[str], tenant_id: Optional[str]) -> None:
        log_data = {"eventType": event_type, "severity": "INFO", "actor": actor, "target": "SYSTEM", "description": desc, "ipAddress": ip}
        if is_real_tenant(tenant_id):
            log_data["tenantId"] = tenant_id
        await db.auditlog.create(data=log_data)
