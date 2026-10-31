from datetime import datetime, timezone
from typing import Any, Dict, Optional
from app.db.client import db


class PlatformLicenseService:
    @staticmethod
    async def get_tenant_license_usage(tenant_id: str) -> Dict[str, Any]:
        tenant = await db.tenant.find_unique(where={"id": tenant_id})
        if not tenant:
            raise ValueError(f"Tenant with id '{tenant_id}' not found.")

        student_count = await db.user.count(where={"tenantId": tenant_id, "role": "STUDENT"})
        teacher_count = await db.user.count(where={"tenantId": tenant_id, "role": "TEACHER"})
        total_used = student_count + teacher_count
        license_count = tenant.licenseCount
        remaining = max(0, license_count - total_used)

        return {
            "tenant_id": tenant_id,
            "tenant_name": tenant.name,
            "license_count": license_count,
            "student_count": student_count,
            "teacher_count": teacher_count,
            "total_used": total_used,
            "remaining": remaining,
        }

    @staticmethod
    async def create_license_request(tenant_id: str, requested_by_user_id: str, requested_count: int) -> Dict[str, Any]:
        if requested_count <= 0:
            raise ValueError("Requested count must be positive.")

        tenant = await db.tenant.find_unique(where={"id": tenant_id})
        if not tenant:
            raise ValueError(f"Tenant with id '{tenant_id}' not found.")

        requester = await db.user.find_unique(where={"id": requested_by_user_id})
        if not requester:
            raise ValueError(f"User with id '{requested_by_user_id}' not found.")

        if requester.tenantId != tenant_id:
            raise ValueError("Requester does not belong to this tenant.")

        if requester.role not in ["TENANT_ADMIN", "ADMIN"]:
            raise ValueError("Only tenant administrators can request licenses.")

        license_request = await db.licenserequest.create(
            data={
                "tenantId": tenant_id,
                "requestedById": requested_by_user_id,
                "requestedCount": requested_count,
                "status": "PENDING",
            }
        )

        await db.auditlog.create(
            data={
                "eventType": "LICENSE_REQUEST_CREATED",
                "severity": "INFO",
                "actor": requested_by_user_id,
                "target": license_request.id,
                "tenantId": tenant_id,
                "description": f"License request for {requested_count} additional licenses created by {requester.email}",
            }
        )

        return {
            "id": license_request.id,
            "tenant_id": license_request.tenantId,
            "requested_by_id": license_request.requestedById,
            "requested_count": license_request.requestedCount,
            "status": license_request.status,
            "created_at": license_request.createdAt,
        }

    @staticmethod
    async def get_license_requests(
        status: Optional[str] = None,
        tenant_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        where: dict = {}
        if status:
            where["status"] = status
        if tenant_id:
            where["tenantId"] = tenant_id

        total_items = await db.licenserequest.count(where=where)
        skip = (page - 1) * page_size
        requests = await db.licenserequest.find_many(
            where=where,
            skip=skip,
            take=page_size,
            order={"createdAt": "desc"},
            include={"tenant": True, "requestedBy": True, "processedBy": True},
        )

        items = []
        for r in requests:
            items.append(
                {
                    "id": r.id,
                    "tenant_id": r.tenantId,
                    "tenant_name": r.tenant.name if r.tenant else None,
                    "tenant_slug": r.tenant.slug if r.tenant else None,
                    "requested_by_id": r.requestedById,
                    "requested_by_email": r.requestedBy.email if r.requestedBy else None,
                    "requested_by_name": r.requestedBy.email if r.requestedBy else None,
                    "requested_count": r.requestedCount,
                    "status": r.status,
                    "processed_by_id": r.processedById,
                    "processed_by_email": r.processedBy.email if r.processedBy else None,
                    "processed_at": r.processedAt,
                    "created_at": r.createdAt,
                    "updated_at": r.updatedAt,
                }
            )

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

    @staticmethod
    async def process_license_request(request_id: str, super_admin_user_id: str, approve: bool) -> Dict[str, Any]:
        license_request = await db.licenserequest.find_unique(where={"id": request_id}, include={"tenant": True})
        if not license_request:
            raise ValueError(f"License request with id '{request_id}' not found.")

        if license_request.status != "PENDING":
            raise ValueError(f"License request is already {license_request.status.lower()}.")

        processor = await db.user.find_unique(where={"id": super_admin_user_id})
        if not processor:
            raise ValueError(f"Processor user with id '{super_admin_user_id}' not found.")

        if processor.role != "SUPER_ADMIN":
            raise ValueError("Only super admins can process license requests.")

        if approve:
            new_license_count = license_request.tenant.licenseCount + license_request.requestedCount
            await db.tenant.update(where={"id": license_request.tenantId}, data={"licenseCount": new_license_count})
            new_status = "APPROVED"
            description = f"License request for {license_request.requestedCount} licenses approved. Tenant license count increased to {new_license_count}."
        else:
            new_status = "REJECTED"
            description = f"License request for {license_request.requestedCount} licenses rejected."

        updated_request = await db.licenserequest.update(
            where={"id": request_id},
            data={
                "status": new_status,
                "processedById": super_admin_user_id,
                "processedAt": datetime.now(timezone.utc),
            },
        )

        await db.auditlog.create(
            data={
                "eventType": f"LICENSE_REQUEST_{new_status}",
                "severity": "INFO",
                "actor": super_admin_user_id,
                "target": request_id,
                "tenantId": license_request.tenantId,
                "description": description,
            }
        )

        return {
            "id": updated_request.id,
            "tenant_id": updated_request.tenantId,
            "requested_by_id": updated_request.requestedById,
            "requested_count": updated_request.requestedCount,
            "status": updated_request.status,
            "processed_by_id": updated_request.processedById,
            "processed_at": updated_request.processedAt,
            "created_at": updated_request.createdAt,
            "updated_at": updated_request.updatedAt,
        }
