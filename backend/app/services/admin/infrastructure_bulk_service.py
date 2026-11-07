"""Importing many departments, subjects, classrooms or designations at once. The single-record services apply the rules."""
from typing import Optional

from app.schemas.admin.bulk import ClassroomBulkItem, DepartmentBulkItem, DesignationBulkItem, SubjectBulkItem
from app.services.admin.bulk_import_common import run_import
from app.services.admin.classroom_service import ClassroomService
from app.services.admin.department_service import DepartmentService
from app.services.admin.designation_service import DesignationService
from app.services.admin.subject_service import SubjectService


class InfrastructureBulkImportService:
    @staticmethod
    async def bulk_create_departments(departments: list, tenant_id: Optional[str] = None) -> dict:
        async def create(item: DepartmentBulkItem, row: int) -> None:
            await DepartmentService.create_department(name=item.name, code=item.code, tenant_id=tenant_id)

        return await run_import(departments, DepartmentBulkItem, create)

    @staticmethod
    async def bulk_create_subjects(subjects: list, tenant_id: Optional[str] = None) -> dict:
        async def create(item: SubjectBulkItem, row: int) -> None:
            await SubjectService.create_subject(
                name=item.name, code=item.code, department_id=item.department_id, tenant_id=tenant_id
            )

        return await run_import(subjects, SubjectBulkItem, create)

    @staticmethod
    async def bulk_create_classrooms(classrooms: list, tenant_id: Optional[str] = None) -> dict:
        async def create(item: ClassroomBulkItem, row: int) -> None:
            await ClassroomService.create_classroom(name=item.name, tenant_id=tenant_id)

        return await run_import(classrooms, ClassroomBulkItem, create)

    @staticmethod
    async def bulk_create_designations(designations: list, tenant_id: Optional[str] = None) -> dict:
        async def create(item: DesignationBulkItem, row: int) -> None:
            await DesignationService.create_designation(name=item.name, code=item.code, tenant_id=tenant_id)

        return await run_import(designations, DesignationBulkItem, create)
