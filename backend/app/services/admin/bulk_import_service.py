import asyncio
from typing import Optional
from app.core.logging_config import get_logger
from app.core.security import hash_password, generate_temporary_password
from app.db.client import db

logger = get_logger("app.services.admin.bulk_import")


InviteJob = tuple[int, str, str, str, str, str, str, Optional[str]]


async def _send_invitation(job: InviteJob, semaphore: asyncio.Semaphore) -> bool:
    row_number, email, user_id, name, role, identifier_label, identifier, password = job
    async with semaphore:
        try:
            from app.services.auth_service import AuthService
            from app.services.email_service import email_service

            token = await AuthService().create_invitation_token(user_id, email, role, name)
            sent = await email_service.send_invitation_email(
                to_email=email,
                recipient_name=name,
                role=role,
                invite_token=token,
                identifier_label=identifier_label,
                identifier_value=identifier,
                temp_password=password,
            )
            if not sent:
                logger.warning("Bulk import invitation was not delivered for row %s", row_number)
            return sent
        except Exception:
            logger.exception("Bulk import invitation failed for row %s", row_number)
            return False


async def _deliver_invites(jobs: list[InviteJob]) -> tuple[int, list[str]]:
    semaphore = asyncio.Semaphore(5)
    results = await asyncio.gather(*(_send_invitation(job, semaphore) for job in jobs))
    sent_count = sum(results)
    failures = [
        f"Row {job[0]}: account created, but invitation email delivery failed. Check SMTP settings."
        for job, sent in zip(jobs, results)
        if not sent
    ]
    return sent_count, failures


class BulkImportService:
    @staticmethod
    async def _check_license_capacity(tenant_id: str, additional_count: int) -> None:
        """Check if tenant has enough license capacity for additional users."""
        if not tenant_id:
            return
        tenant = await db.tenant.find_unique(where={"id": tenant_id})
        if not tenant:
            return
        current_count = await db.user.count(where={"tenantId": tenant_id, "role": {"in": ["STUDENT", "TEACHER"]}})
        if current_count + additional_count > tenant.licenseCount:
            available = max(0, tenant.licenseCount - current_count)
            raise ValueError(
                f"Bulk import exceeds license capacity. Available seats: {available}, requested: {additional_count}. "
                "Request additional licenses from your super administrator."
            )

    @staticmethod
    async def bulk_create_students(students: list, send_invite: bool = True, tenant_id: Optional[str] = None) -> dict:
        await BulkImportService._check_license_capacity(tenant_id, len(students))

        imported_count = 0
        failed_count = 0
        invitations_sent = 0
        errors = []
        invite_jobs: list[InviteJob] = []

        for idx, item in enumerate(students):
            try:
                if await db.user.find_unique(where={"email": item.email}):
                    errors.append(f"Row {idx + 1}: Email '{item.email}' already registered.")
                    failed_count += 1
                    continue
                if await db.student.find_unique(where={"enrollmentNumber": item.enrollment_number}):
                    errors.append(f"Row {idx + 1}: Enrollment '{item.enrollment_number}' already exists.")
                    failed_count += 1
                    continue

                dept_id = None
                if item.department_id:
                    dept_where = {
                        "OR": [
                            {"id": item.department_id},
                            {"code": {"equals": item.department_id, "mode": "insensitive"}},
                            {"name": {"equals": item.department_id, "mode": "insensitive"}},
                        ]
                    }
                    if tenant_id:
                        dept_where["tenantId"] = tenant_id
                    found_dept = await db.department.find_first(where=dept_where)
                    if not found_dept:
                        errors.append(f"Row {idx + 1}: Department '{item.department_id}' not found.")
                        failed_count += 1
                        continue
                    dept_id = found_dept.id

                batch_id, batch_code = None, None
                if item.batch_code:
                    found_batch = await db.batch.find_first(
                        where={"tenantId": tenant_id, "departmentId": dept_id, "code": item.batch_code.strip()}
                    ) if tenant_id else await db.batch.find_first(
                        where={"departmentId": dept_id, "code": item.batch_code.strip()}
                    )
                    if not found_batch or found_batch.status != "ACTIVE":
                        errors.append(f"Row {idx + 1}: Active batch '{item.batch_code}' not found in this department.")
                        failed_count += 1
                        continue
                    batch_id, batch_code = found_batch.id, found_batch.code

                plain_password = getattr(item, "password", None) or generate_temporary_password()
                must_change = not bool(getattr(item, "password", None))
                user_data = {
                    "email": item.email,
                    "hashedPassword": hash_password(plain_password),
                    "role": "STUDENT",
                    "mustChangePassword": must_change,
                }
                if tenant_id:
                    user_data["tenantId"] = tenant_id

                user = await db.user.create(data=user_data)
                try:
                    await db.student.create(
                        data={
                            k: v
                            for k, v in {
                                "userId": user.id,
                                "tenantId": tenant_id,
                                "enrollmentNumber": item.enrollment_number,
                                "firstName": item.first_name,
                                "lastName": item.last_name,
                                "gender": item.gender,
                                "phone": item.phone,
                                "dateOfBirth": getattr(item, "date_of_birth", None),
                                "semester": item.semester,
                                "batchId": batch_id,
                                "batch": batch_code,
                                "departmentId": dept_id,
                            }.items()
                            if v is not None
                        }
                    )
                except Exception as create_exc:
                    try:
                        await db.user.delete(where={"id": user.id})
                    except Exception as cleanup_exc:
                        logger.error("Failed to rollback user %s: %s", user.id, cleanup_exc)
                    raise create_exc

                imported_count += 1

                if send_invite:
                    name = f"{item.first_name or ''} {item.last_name or ''}".strip() or "Student"
                    invite_jobs.append(
                        (idx + 1, user.email, user.id, name, "STUDENT", "Enrollment Number", item.enrollment_number, plain_password)
                    )
            except Exception as e:
                errors.append(f"Row {idx + 1} ({item.email}): {str(e)}")
                failed_count += 1

        invitations_sent, invite_errors = await _deliver_invites(invite_jobs)
        errors.extend(invite_errors)
        return {
            "imported_count": imported_count,
            "failed_count": failed_count,
            "invitations_sent": invitations_sent,
            "errors": errors,
        }

    @staticmethod
    async def bulk_create_teachers(teachers: list, send_invite: bool = True, tenant_id: Optional[str] = None) -> dict:
        await BulkImportService._check_license_capacity(tenant_id, len(teachers))

        imported_count = 0
        failed_count = 0
        invitations_sent = 0
        errors = []
        invite_jobs: list[InviteJob] = []

        first_dept = await db.department.find_first(where={"tenantId": tenant_id} if tenant_id else {})
        default_dept_id = first_dept.id if first_dept else None
        first_desig = await db.designation.find_first(where={"tenantId": tenant_id} if tenant_id else {})
        default_desig_id = first_desig.id if first_desig else None

        for idx, item in enumerate(teachers):
            try:
                if await db.user.find_unique(where={"email": item.email}):
                    errors.append(f"Row {idx + 1}: Email '{item.email}' already registered.")
                    failed_count += 1
                    continue
                if await db.teacher.find_unique(where={"employeeId": item.employee_id}):
                    errors.append(f"Row {idx + 1}: Employee ID '{item.employee_id}' already exists.")
                    failed_count += 1
                    continue

                if item.department_id:
                    dept_where = {
                        "OR": [
                            {"id": item.department_id},
                            {"code": {"equals": item.department_id, "mode": "insensitive"}},
                            {"name": {"equals": item.department_id, "mode": "insensitive"}},
                        ]
                    }
                    if tenant_id:
                        dept_where["tenantId"] = tenant_id
                    found_dept = await db.department.find_first(where=dept_where)
                    if not found_dept:
                        errors.append(f"Row {idx + 1}: Department '{item.department_id}' not found.")
                        failed_count += 1
                        continue
                    dept_id = found_dept.id
                else:
                    dept_id = default_dept_id

                if not dept_id:
                    dept_data = {"name": "General Academics", "code": "GEN"}
                    if tenant_id:
                        dept_data["tenantId"] = tenant_id
                    created_dept = await db.department.create(data=dept_data)
                    default_dept_id = created_dept.id
                    dept_id = default_dept_id

                if item.designation_id:
                    desig_where = {
                        "OR": [
                            {"id": item.designation_id},
                            {"code": {"equals": item.designation_id, "mode": "insensitive"}},
                            {"name": {"equals": item.designation_id, "mode": "insensitive"}},
                        ]
                    }
                    if tenant_id:
                        desig_where["tenantId"] = tenant_id
                    found_desig = await db.designation.find_first(where=desig_where)
                    if not found_desig:
                        errors.append(f"Row {idx + 1}: Designation '{item.designation_id}' not found.")
                        failed_count += 1
                        continue
                    desig_id = found_desig.id
                else:
                    desig_id = default_desig_id

                if not desig_id:
                    desig_data = {"name": "Lecturer", "code": "LEC"}
                    if tenant_id:
                        desig_data["tenantId"] = tenant_id
                    created_desig = await db.designation.create(data=desig_data)
                    default_desig_id = created_desig.id
                    desig_id = default_desig_id

                plain_password = getattr(item, "password", None) or generate_temporary_password()
                must_change = not bool(getattr(item, "password", None))
                user_data = {
                    "email": item.email,
                    "hashedPassword": hash_password(plain_password),
                    "role": "TEACHER",
                    "mustChangePassword": must_change,
                }
                if tenant_id:
                    user_data["tenantId"] = tenant_id
                user = await db.user.create(data=user_data)
                try:
                    await db.teacher.create(
                        data={
                            k: v
                            for k, v in {
                                "tenantId": tenant_id,
                                "userId": user.id,
                                "employeeId": item.employee_id,
                                "firstName": item.first_name,
                                "lastName": item.last_name,
                                "nameInitials": item.name_initials,
                                "phone": item.phone,
                                "departmentId": dept_id,
                                "designationId": desig_id,
                            }.items()
                            if v is not None
                        }
                    )
                except Exception as create_exc:
                    try:
                        await db.user.delete(where={"id": user.id})
                    except Exception as cleanup_exc:
                        logger.error("Failed to rollback user %s: %s", user.id, cleanup_exc)
                    raise create_exc

                imported_count += 1

                if send_invite:
                    name = f"{item.first_name or ''} {item.last_name or ''}".strip() or "Faculty"
                    invite_jobs.append(
                        (idx + 1, user.email, user.id, name, "TEACHER", "Employee ID", item.employee_id, plain_password)
                    )
            except Exception as e:
                errors.append(f"Row {idx + 1} ({item.email}): {str(e)}")
                failed_count += 1

        invitations_sent, invite_errors = await _deliver_invites(invite_jobs)
        errors.extend(invite_errors)
        return {
            "imported_count": imported_count,
            "failed_count": failed_count,
            "invitations_sent": invitations_sent,
            "errors": errors,
        }

    @staticmethod
    async def bulk_create_classes(classes: list, tenant_id: Optional[str] = None) -> dict:
        imported_count = 0
        failed_count = 0
        errors = []
        for idx, item in enumerate(classes):
            try:
                sub_where = {
                    "OR": [
                        {"code": {"equals": item.subject_code, "mode": "insensitive"}},
                        {"name": {"equals": item.subject_code, "mode": "insensitive"}},
                    ]
                }
                if tenant_id:
                    sub_where["tenantId"] = tenant_id
                subject = await db.subject.find_first(where=sub_where)
                if not subject:
                    errors.append(f"Row {idx + 1} ({item.name}): Subject '{item.subject_code}' not found.")
                    failed_count += 1
                    continue

                teacher_where = {
                    "user": {
                        "is": {
                            "email": {"equals": item.teacher_email, "mode": "insensitive"},
                        }
                    }
                }
                if tenant_id:
                    teacher_where["user"]["is"]["tenantId"] = tenant_id
                teacher = await db.teacher.find_first(where=teacher_where, include={"user": True})
                if not teacher:
                    errors.append(f"Row {idx + 1} ({item.name}): Teacher with email '{item.teacher_email}' not found.")
                    failed_count += 1
                    continue

                classroom_id = None
                if item.classroom_name:
                    cr_where = {"name": {"equals": item.classroom_name, "mode": "insensitive"}}
                    if tenant_id:
                        cr_where["tenantId"] = tenant_id
                    classroom = await db.classroom.find_first(where=cr_where)
                    if classroom:
                        classroom_id = classroom.id

                class_data = {
                    "name": item.name,
                    "subjectId": subject.id,
                    "teacherId": teacher.id,
                    "classroomId": classroom_id,
                    "semester": item.semester,
                    "batch": item.batch,
                }
                if tenant_id:
                    class_data["tenantId"] = tenant_id
                await db.academicclass.create(data=class_data)
                imported_count += 1
            except Exception as e:
                errors.append(f"Row {idx + 1} ({item.name}): {str(e)}")
                failed_count += 1
        return {"imported_count": imported_count, "failed_count": failed_count, "invitations_sent": 0, "errors": errors}
