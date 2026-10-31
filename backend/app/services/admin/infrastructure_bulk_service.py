from typing import Optional
from app.services.admin.department_service import DepartmentService
from app.services.admin.subject_service import SubjectService
from app.services.admin.classroom_service import ClassroomService
from app.services.admin.designation_service import DesignationService


class InfrastructureBulkImportService:
    @staticmethod
    async def bulk_create_departments(departments: list, tenant_id: Optional[str] = None) -> dict:
        imported, failed, errors = 0, 0, []
        for idx, item in enumerate(departments):
            try:
                await DepartmentService.create_department(
                    name=item.name, code=item.code, head=item.head, description=item.description, tenant_id=tenant_id
                )
                imported += 1
            except Exception as e:
                errors.append(f"Row {idx + 1} ({item.name}): {str(e)}")
                failed += 1
        return {"imported_count": imported, "failed_count": failed, "invitations_sent": 0, "errors": errors}

    @staticmethod
    async def bulk_create_subjects(subjects: list, tenant_id: Optional[str] = None) -> dict:
        imported, failed, errors = 0, 0, []
        for idx, item in enumerate(subjects):
            try:
                await SubjectService.create_subject(
                    name=item.name,
                    code=item.code,
                    description=item.description,
                    department_id=getattr(item, "department_id", None),
                    tenant_id=tenant_id,
                )
                imported += 1
            except Exception as e:
                errors.append(f"Row {idx + 1} ({item.name}): {str(e)}")
                failed += 1
        return {"imported_count": imported, "failed_count": failed, "invitations_sent": 0, "errors": errors}

    @staticmethod
    async def bulk_create_classrooms(classrooms: list, tenant_id: Optional[str] = None) -> dict:
        imported, failed, errors = 0, 0, []
        for idx, item in enumerate(classrooms):
            try:
                await ClassroomService.create_classroom(name=item.name, building=item.building, tenant_id=tenant_id)
                imported += 1
            except Exception as e:
                errors.append(f"Row {idx + 1} ({item.name}): {str(e)}")
                failed += 1
        return {"imported_count": imported, "failed_count": failed, "invitations_sent": 0, "errors": errors}

    @staticmethod
    async def bulk_create_designations(designations: list, tenant_id: Optional[str] = None) -> dict:
        imported, failed, errors = 0, 0, []
        for idx, item in enumerate(designations):
            try:
                await DesignationService.create_designation(
                    name=item.name, code=item.code, description=item.description, tenant_id=tenant_id
                )
                imported += 1
            except Exception as e:
                errors.append(f"Row {idx + 1} ({item.name}): {str(e)}")
                failed += 1
        return {"imported_count": imported, "failed_count": failed, "invitations_sent": 0, "errors": errors}
