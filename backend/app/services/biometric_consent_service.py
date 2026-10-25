import json
import re
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List


from app.core.logging_config import get_logger
from app.db.redis import get_redis
from app.db.client import db
from app.services.s3_service import S3Service

logger = get_logger("app.biometric.consent")


class BiometricConsentService:
    CONSENT_PREFIX = "biometric:consent:"
    CONSENT_TTL_SECONDS = 365 * 24 * 3600  # 1 year consent validity

    def __init__(self, s3_service: Optional[S3Service] = None) -> None:
        self.s3_service = s3_service or S3Service()

    async def record_consent(
        self,
        student_id: str,
        policy_version: str = "2026.1-BIPA",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Dict[str, Any]:
        consent_record = {
            "student_id": student_id,
            "consented": True,
            "consented_at": datetime.now(timezone.utc).isoformat(),
            "policy_version": policy_version,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "retention_schedule_days": 365,
        }

        r = await get_redis()
        await r.setex(
            f"{self.CONSENT_PREFIX}{student_id}",
            self.CONSENT_TTL_SECONDS,
            json.dumps(consent_record),
        )
        logger.info("Biometric consent recorded for student %s under policy %s", student_id, policy_version)
        return consent_record

    async def has_consent(self, student_id: str) -> bool:
        r = await get_redis()
        raw = await r.get(f"{self.CONSENT_PREFIX}{student_id}")
        if not raw:
            return False
        data = json.loads(raw)
        return bool(data.get("consented", False))

    async def get_consent_status(self, student_id: str) -> Dict[str, Any]:
        r = await get_redis()
        raw = await r.get(f"{self.CONSENT_PREFIX}{student_id}")
        if not raw:
            return {
                "student_id": student_id,
                "has_consent": False,
                "consent_required": True,
                "policy_version": "2026.1-BIPA",
                "message": "Explicit biometric consent required prior to facial verification.",
            }
        data = json.loads(raw)
        return {
            "student_id": student_id,
            "has_consent": True,
            "consent_required": False,
            "consented_at": data.get("consented_at"),
            "policy_version": data.get("policy_version"),
        }

    async def purge_attendance_photos(
        self, retention_days: int = 30, tenant_id: Optional[str] = None
    ) -> Dict[str, Any]:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=retention_days)
        where_cond: dict = {
            "createdAt": {"lt": cutoff_date},
        }
        if tenant_id:
            where_cond["student"] = {"is": {"user": {"is": {"tenantId": tenant_id}}}}
        records = await db.attendance.find_many(
            where=where_cond,
            take=500,
        )

        purged_count = 0
        s3_deleted_count = 0
        for rec in records:
            remarks = rec.remarks or ""
            note = rec.studentNote or ""
            if "photo_purged" in remarks:
                continue

            found_refs: List[str] = []
            combined_text = f"{remarks} {note}"
            photo_bracket_matches = re.findall(r"\[photo:(.*?)\]", combined_text)
            url_matches = re.findall(r"(https?://[^\s\]]+)", combined_text)
            key_matches = re.findall(
                r"((?:tenants/|attendance/)[^\s\]]+\.(?:jpg|jpeg|png|webp))", combined_text, re.IGNORECASE
            )

            for ref in photo_bracket_matches + url_matches + key_matches:
                ref_clean = ref.strip()
                if ref_clean and ref_clean not in found_refs:
                    found_refs.append(ref_clean)

            for ref in found_refs:
                try:
                    if self.s3_service.delete_file(ref):
                        s3_deleted_count += 1
                except Exception as exc:
                    logger.warning("Failed to purge biometric photo %s from S3: %s", ref, exc)

            purged_count += 1
            cleaned_remarks = re.sub(r"\[photo:.*?\]", "", remarks).strip()
            new_remarks = f"{cleaned_remarks} [photo_purged_for_data_minimization]".strip()
            await db.attendance.update(
                where={"id": rec.id},
                data={"remarks": new_remarks},
            )

        logger.info(
            "Purged raw biometric verification artifacts for %d records older than %d days (%d files deleted from S3)",
            purged_count,
            retention_days,
            s3_deleted_count,
        )
        return {
            "purged_count": purged_count,
            "s3_deleted_count": s3_deleted_count,
            "retention_days": retention_days,
            "cutoff_date": cutoff_date.isoformat(),
            "status": "completed",
        }
