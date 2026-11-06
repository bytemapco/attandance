"""PRD 6.4: face verification inputs, and idempotent, audited saves of an attendance mark."""
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from prisma.errors import UniqueViolationError

from app.services import occurrence_marking_service as marking
from app.services.occurrence_marking_service import save_record

STUDENT = SimpleNamespace(id="stu-1", tenantId="tenant-1", userId="user-1")
OCCURRENCE = SimpleNamespace(id="occ-1", tenantId="tenant-1", courseSectionId="sec-1")
CONFIG = SimpleNamespace(isAiBackgroundValidationEnabled=True)


class TestVerifyFace:
    @pytest.fixture
    def stubs(self, monkeypatch):
        repo = MagicMock()
        repo.get_face_embedding = AsyncMock(return_value=[0.1, 0.2])
        monkeypatch.setattr(marking, "StudentRepository", lambda: repo)
        orchestrator = MagicMock()
        orchestrator.analyze_attendance = AsyncMock(
            return_value={"face_score": 0.9, "liveness_score": 0.8, "background_score": 0.7}
        )
        monkeypatch.setattr(marking, "AIOrchestrator", lambda: orchestrator)
        return SimpleNamespace(repo=repo, orchestrator=orchestrator)

    async def test_no_registered_face_is_a_400(self, stubs):
        stubs.repo.get_face_embedding.return_value = None
        with pytest.raises(HTTPException) as caught:
            await marking._verify_face(CONFIG, STUDENT, "/tmp/x.jpg")
        assert caught.value.status_code == 400

    async def test_no_selfie_is_a_400(self, stubs):
        with pytest.raises(HTTPException) as caught:
            await marking._verify_face(CONFIG, STUDENT, None)
        assert caught.value.status_code == 400

    async def test_the_background_check_follows_the_institutions_setting(self, stubs):
        off = SimpleNamespace(isAiBackgroundValidationEnabled=False)
        await marking._verify_face(off, STUDENT, "/tmp/x.jpg")
        assert stubs.orchestrator.analyze_attendance.await_args.kwargs["check_background"] is False

    async def test_a_missing_face_score_means_the_ai_was_unavailable(self, stubs):
        stubs.orchestrator.analyze_attendance.return_value = {
            "face_score": None, "liveness_score": None, "background_score": None,
        }
        result, problems = await marking._verify_face(CONFIG, STUDENT, "/tmp/x.jpg")
        assert result["face"] is None and problems == ["AI verification unavailable."]


class TestSaveRecord:
    @pytest.fixture
    def db(self, monkeypatch):
        fake = MagicMock()
        fake.attendancerecord.create = AsyncMock(return_value=SimpleNamespace(id="rec-1"))
        fake.attendancerecord.update = AsyncMock(return_value=SimpleNamespace(id="rec-1"))
        fake.attendancerecord.find_first = AsyncMock(return_value=SimpleNamespace(id="rec-original"))
        fake.attendanceauditlog.create = AsyncMock()
        monkeypatch.setattr(marking, "db", fake)
        return fake

    async def test_a_new_record_is_created_inside_the_students_tenant(self, db):
        await save_record(STUDENT, OCCURRENCE, None, {"status": "PRESENT", "method": "AI_BIOMETRIC"}, "why")

        data = db.attendancerecord.create.await_args.kwargs["data"]
        assert data["tenantId"] == "tenant-1" and data["occurrenceId"] == "occ-1" and data["studentId"] == "stu-1"
        assert data["verifiedAt"] is not None

    async def test_an_absent_placeholder_is_updated_not_duplicated(self, db):
        existing = SimpleNamespace(id="rec-0", status="ABSENT")

        await save_record(STUDENT, OCCURRENCE, existing, {"status": "PRESENT"}, "why")

        db.attendancerecord.update.assert_awaited_once()
        db.attendancerecord.create.assert_not_awaited()
        assert db.attendanceauditlog.create.await_args.kwargs["data"]["previousStatus"] == "ABSENT"

    async def test_every_mark_writes_an_audit_row_with_actor_and_reason(self, db):
        await save_record(STUDENT, OCCURRENCE, None, {"status": "FLAGGED"}, "Student face verification")

        audit = db.attendanceauditlog.create.await_args.kwargs["data"]
        assert audit["changedById"] == "user-1" and audit["reason"] == "Student face verification"
        assert audit["newStatus"] == "FLAGGED"

    async def test_a_retry_that_hits_the_unique_index_returns_the_original_record(self, db):
        db.attendancerecord.create.side_effect = UniqueViolationError.__new__(UniqueViolationError)

        record = await save_record(STUDENT, OCCURRENCE, None, {"status": "PRESENT"}, "why")

        assert record.id == "rec-original"
        db.attendanceauditlog.create.assert_not_awaited()
        where = db.attendancerecord.find_first.await_args.kwargs["where"]
        assert where == {"occurrenceId": "occ-1", "studentId": "stu-1"}
