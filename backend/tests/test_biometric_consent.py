from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from prisma.errors import UniqueViolationError

from app.services import biometric_consent_service as module
from app.services.biometric_consent_service import BiometricConsentService

STUDENT = SimpleNamespace(id="s1", tenantId="t1")


def consent_row(version: str = "2026.1"):
    return SimpleNamespace(policyVersion=version, grantedAt=datetime(2026, 11, 2, 9, 30, tzinfo=timezone.utc))


@pytest.fixture
def fake_db(monkeypatch):
    fake = MagicMock()
    fake.biometricconsent.find_first = AsyncMock(return_value=None)
    fake.biometricconsent.create = AsyncMock(return_value=consent_row())
    fake.biometricconsent.update_many = AsyncMock(return_value=1)
    monkeypatch.setattr(module, "db", fake)
    return fake


@pytest.fixture
def students(monkeypatch):
    repo = MagicMock()
    repo.clear_face_embedding = AsyncMock()
    monkeypatch.setattr(module, "StudentRepository", lambda: repo)
    return repo


def service() -> BiometricConsentService:
    return BiometricConsentService(s3_service=MagicMock())


async def test_consent_is_off_until_the_student_grants_it(fake_db):
    assert await service().has_consent("s1") is False
    status = await service().get_consent_status("s1")
    assert status["has_consent"] is False and status["consent_required"] is True


async def test_grant_is_written_to_the_database_with_the_tenant(fake_db):
    await service().record_consent(STUDENT, policy_version="2026.1", ip_address="10.0.0.5", recorded_by_id="u1")

    data = fake_db.biometricconsent.create.await_args.kwargs["data"]
    assert data["tenantId"] == "t1" and data["studentId"] == "s1"
    assert data["policyVersion"] == "2026.1" and data["ipAddress"] == "10.0.0.5" and data["recordedById"] == "u1"


async def test_granting_twice_keeps_the_first_grant(fake_db):
    first = consent_row("2026.1")
    fake_db.biometricconsent.find_first.return_value = first

    result = await service().record_consent(STUDENT, policy_version="2026.2")

    assert result is first
    fake_db.biometricconsent.create.assert_not_awaited()


async def test_two_simultaneous_grants_end_with_one_row(fake_db):
    winner = consent_row()
    fake_db.biometricconsent.find_first.side_effect = [None, winner]
    fake_db.biometricconsent.create.side_effect = UniqueViolationError.__new__(UniqueViolationError)

    assert await service().record_consent(STUDENT) is winner


async def test_status_reports_when_and_under_which_policy_consent_was_given(fake_db):
    fake_db.biometricconsent.find_first.return_value = consent_row("2026.1")

    status = await service().get_consent_status("s1")

    assert status["has_consent"] is True
    assert status["policy_version"] == "2026.1"
    assert status["consented_at"] == "2026-11-02T09:30:00+00:00"


async def test_revoking_ends_the_consent_and_deletes_the_face_template(fake_db, students):
    assert await service().revoke_consent("s1") is True

    where = fake_db.biometricconsent.update_many.await_args.kwargs["where"]
    assert where == {"studentId": "s1", "revokedAt": None}
    students.clear_face_embedding.assert_awaited_once_with("s1")


async def test_revoking_with_no_active_consent_still_clears_any_template(fake_db, students):
    fake_db.biometricconsent.update_many.return_value = 0

    assert await service().revoke_consent("s1") is False
    students.clear_face_embedding.assert_awaited_once_with("s1")
