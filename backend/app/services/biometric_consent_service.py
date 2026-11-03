from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any

from prisma.errors import UniqueViolationError
from prisma.models import Student

from app.core.logging_config import get_logger
from app.db.client import db
from app.repositories.student_repository import StudentRepository
from app.services.s3_service import S3Service

logger = get_logger("app.biometric.consent")


class BiometricConsentService:
    DEFAULT_POLICY_VERSION = "2026.1"

    def __init__(self, s3_service: Optional[S3Service] = None) -> None:
        self.s3_service = s3_service or S3Service()

    async def _active_consent(self, student_id: str):
        return await db.biometricconsent.find_first(where={"studentId": student_id, "revokedAt": None})

    async def record_consent(
        self,
        student: Student,
        policy_version: str = DEFAULT_POLICY_VERSION,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        recorded_by_id: Optional[str] = None,
    ):
        """Stores the grant in the database. A second grant while one is active returns the first."""
        existing = await self._active_consent(student.id)
        if existing:
            return existing
        try:
            consent = await db.biometricconsent.create(
                data={
                    "tenantId": student.tenantId,
                    "studentId": student.id,
                    "policyVersion": policy_version,
                    "ipAddress": ip_address,
                    "userAgent": user_agent,
                    "recordedById": recorded_by_id,
                }
            )
        except UniqueViolationError:
            return await self._active_consent(student.id)
        logger.info("Biometric consent recorded for student %s under policy %s", student.id, policy_version)
        return consent

    async def revoke_consent(self, student_id: str) -> bool:
        """Ends the active consent and deletes the stored face template. Returns False if none was active."""
        revoked = await db.biometricconsent.update_many(
            where={"studentId": student_id, "revokedAt": None},
            data={"revokedAt": datetime.now(timezone.utc)},
        )
        await StudentRepository().clear_face_embedding(student_id)
        logger.info("Biometric consent revoked and face template deleted for student %s", student_id)
        return revoked > 0

    async def has_consent(self, student_id: str) -> bool:
        return await self._active_consent(student_id) is not None

    async def get_consent_status(self, student_id: str) -> Dict[str, Any]:
        consent = await self._active_consent(student_id)
        if not consent:
            return {
                "student_id": student_id,
                "has_consent": False,
                "consent_required": True,
                "policy_version": self.DEFAULT_POLICY_VERSION,
                "message": "Explicit biometric consent required prior to facial verification.",
            }
        return {
            "student_id": student_id,
            "has_consent": True,
            "consent_required": False,
            "consented_at": consent.grantedAt.isoformat(),
            "policy_version": consent.policyVersion,
        }

    async def purge_attendance_photos(self, tenant_id: str, retention_days: int = 30) -> Dict[str, Any]:
        """Deletes flagged-mark selfies older than the retention period. The attendance record itself stays."""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=retention_days)
        records = await db.attendancerecord.find_many(
            where={"tenantId": tenant_id, "verifiedAt": {"lt": cutoff_date}, "evidencePhotoUrl": {"not": None}},
            take=500,
        )

        s3_deleted_count = 0
        for rec in records:
            try:
                if self.s3_service.delete_file(rec.evidencePhotoUrl):
                    s3_deleted_count += 1
            except Exception as exc:
                logger.warning("Failed to purge evidence photo %s from S3: %s", rec.evidencePhotoUrl, exc)
                continue
            await db.attendancerecord.update(where={"id": rec.id}, data={"evidencePhotoUrl": None})

        logger.info(
            "Purged evidence photos for %d records older than %d days (%d files deleted from S3)",
            len(records),
            retention_days,
            s3_deleted_count,
        )
        return {
            "purged_count": len(records),
            "s3_deleted_count": s3_deleted_count,
            "retention_days": retention_days,
            "cutoff_date": cutoff_date.isoformat(),
            "status": "completed",
        }
