from typing import Optional
from app.db.client import db
from app.services.admin.bulk_import_service import BulkImportService
from app.services.admin.infrastructure_bulk_service import InfrastructureBulkImportService


class AdminBulkService:
    @staticmethod
    async def bulk_create_students(students: list, send_invite: bool = True, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        res = await BulkImportService.bulk_create_students(students, send_invite=send_invite, tenant_id=tenant_id)
        if res["imported_count"] > 0:
            await AdminBulkService._log("BULK_IMPORT_STUDENTS", actor, f"Bulk imported {res['imported_count']} students", ip, tenant_id)
        return res

    @staticmethod
    async def bulk_create_teachers(teachers: list, send_invite: bool = True, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        res = await BulkImportService.bulk_create_teachers(teachers, send_invite=send_invite, tenant_id=tenant_id)
        if res["imported_count"] > 0:
            await AdminBulkService._log("BULK_IMPORT_TEACHERS", actor, f"Bulk imported {res['imported_count']} faculty", ip, tenant_id)
        return res

    @staticmethod
    async def bulk_create_departments(departments: list, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        res = await InfrastructureBulkImportService.bulk_create_departments(departments, tenant_id=tenant_id)
        if res["imported_count"] > 0:
            await AdminBulkService._log("BULK_IMPORT_DEPARTMENTS", actor, f"Bulk imported {res['imported_count']} departments", ip, tenant_id)
        return res

    @staticmethod
    async def bulk_create_subjects(subjects: list, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        res = await InfrastructureBulkImportService.bulk_create_subjects(subjects, tenant_id=tenant_id)
        if res["imported_count"] > 0:
            await AdminBulkService._log("BULK_IMPORT_SUBJECTS", actor, f"Bulk imported {res['imported_count']} subjects", ip, tenant_id)
        return res

    @staticmethod
    async def bulk_create_classrooms(classrooms: list, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        res = await InfrastructureBulkImportService.bulk_create_classrooms(classrooms, tenant_id=tenant_id)
        if res["imported_count"] > 0:
            await AdminBulkService._log("BULK_IMPORT_CLASSROOMS", actor, f"Bulk imported {res['imported_count']} classrooms", ip, tenant_id)
        return res

    @staticmethod
    async def bulk_create_designations(designations: list, actor: str = "system", ip: Optional[str] = None, tenant_id: Optional[str] = None) -> dict:
        res = await InfrastructureBulkImportService.bulk_create_designations(designations, tenant_id=tenant_id)
        if res["imported_count"] > 0:
            await AdminBulkService._log("BULK_IMPORT_DESIGNATIONS", actor, f"Bulk imported {res['imported_count']} designations", ip, tenant_id)
        return res

    @staticmethod
    async def _log(event_type: str, actor: str, desc: str, ip: Optional[str], tenant_id: Optional[str]) -> None:
        log_data = {"eventType": event_type, "severity": "INFO", "actor": actor, "target": "SYSTEM", "description": desc, "ipAddress": ip}
        if tenant_id and tenant_id != "default-institution":
            log_data["tenantId"] = tenant_id
        await db.auditlog.create(data=log_data)
