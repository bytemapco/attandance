from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from prisma.errors import UniqueViolationError

from app.services import occurrence_face_review_service as review
from app.services import occurrence_marking_service as svc

STUDENT = SimpleNamespace(id="stu-1", userId="usr-1", tenantId="t-1")
FENCE = SimpleNamespace(latitude=19.0, longitude=72.0, radiusMeters=100.0)
GOOD_AI = {"face_score": 0.9, "liveness_score": 0.9, "background_score": 0.9}


def _occurrence(**kw) -> SimpleNamespace:
    base = dict(
        id="occ-1", courseSectionId="sec-1", verificationActive=True, isAttendanceLocked=False, status="CONDUCTED",
        verificationExpires=datetime.now(timezone.utc) + timedelta(minutes=30),
    )
    return SimpleNamespace(**{**base, **kw})


def _config(face: bool = True, gps: bool = True, background: bool = True) -> SimpleNamespace:
    return SimpleNamespace(
        isFaceRecognitionEnabled=face, isGpsVerificationEnabled=gps, isAiBackgroundValidationEnabled=background
    )


def _fake_redis() -> SimpleNamespace:
    store: dict[str, str] = {}

    async def setex(key: str, _ttl: int, value: str) -> None:
        store[key] = value

    async def delete(key: str) -> None:
        store.pop(key, None)

    return SimpleNamespace(setex=setex, get=AsyncMock(side_effect=store.get), delete=delete)


@pytest.fixture
def env():
    with patch.object(svc, "db") as db, patch.object(svc, "SystemConfigService") as cfg, patch.object(
        svc, "StudentRepository"
    ) as repo, patch.object(svc, "AIOrchestrator") as ai, patch.object(svc, "GamificationService") as game, patch.object(
        svc, "_discard_image"
    ) as discard, patch.object(review, "safe_redis", return_value=_fake_redis()):
        db.classoccurrence.find_first = AsyncMock(return_value=_occurrence())
        db.courseenrollment.find_first = AsyncMock(return_value=SimpleNamespace(id="enr-1"))
        db.attendancerecord.find_unique = AsyncMock(return_value=None)
        db.attendancerecord.find_first = AsyncMock()
        db.attendancerecord.create = AsyncMock(return_value=SimpleNamespace(id="rec-1"))
        db.attendancerecord.update = AsyncMock(return_value=SimpleNamespace(id="rec-1"))
        db.attendanceauditlog.create = AsyncMock()
        db.geofence.find_unique = AsyncMock(return_value=FENCE)
        cfg.return_value.get_config = AsyncMock(return_value=_config())
        repo.return_value.get_face_embedding = AsyncMock(return_value=[0.1] * 128)
        ai.return_value.analyze_attendance = AsyncMock(return_value=GOOD_AI)
        game.return_value.update_streak = AsyncMock()
        yield SimpleNamespace(db=db, cfg=cfg, repo=repo, ai=ai, discard=discard)


async def _analyze(lat: float = 19.0, lon: float = 72.0, image: str | None = "img.jpg") -> dict:
    return await review.analyze_occurrence(STUDENT, "occ-1", lat, lon, 5.0, image)


async def _mark(**kw):
    analysis = await _analyze(**kw)
    record, _ = await review.confirm_occurrence(STUDENT, analysis["review_token"])
    return record


async def _rejected(code: int, **kw) -> str:
    with pytest.raises(HTTPException) as exc:
        await _mark(**kw)
    assert exc.value.status_code == code
    return exc.value.detail


def _saved() -> dict:
    return svc.db.attendancerecord.create.await_args.kwargs["data"]


@pytest.mark.anyio
async def test_analyze_saves_nothing_until_confirm(env) -> None:
    analysis = await _analyze()
    assert (analysis["predicted_status"], analysis["final_ai_score"]) == ("Present", 0.9)
    env.db.attendancerecord.create.assert_not_awaited()


@pytest.mark.anyio
async def test_verified_mark_is_present_with_scores_and_audit(env) -> None:
    await _mark()
    data = _saved()
    assert (data["status"], data["method"], data["faceScore"], data["livenessScore"]) == ("PRESENT", "AI_BIOMETRIC", 0.9, 0.9)
    assert (data["tenantId"], data["occurrenceId"], data["studentId"]) == ("t-1", "occ-1", "stu-1")
    assert data["evidencePhotoUrl"] is None
    audit = env.db.attendanceauditlog.create.await_args.kwargs["data"]
    assert (audit["previousStatus"], audit["newStatus"], audit["changedById"]) == ("ABSENT", "PRESENT", "usr-1")
    env.discard.assert_called_once_with("img.jpg")


@pytest.mark.anyio
async def test_low_face_score_is_flagged_and_keeps_evidence(env) -> None:
    env.ai.return_value.analyze_attendance.return_value = {**GOOD_AI, "face_score": 0.3}
    await _mark()
    assert _saved()["status"] == "FLAGGED" and _saved()["evidencePhotoUrl"] == "img.jpg"
    env.discard.assert_not_called()


@pytest.mark.anyio
async def test_background_score_is_not_counted_when_disabled(env) -> None:
    env.cfg.return_value.get_config.return_value = _config(background=False)
    env.ai.return_value.analyze_attendance.return_value = {**GOOD_AI, "background_score": 0.1}
    analysis = await _analyze()
    assert (analysis["predicted_status"], analysis["final_ai_score"]) == ("Present", 0.9)


@pytest.mark.anyio
async def test_ai_outage_fails_closed_and_points_to_qr(env) -> None:
    env.ai.return_value.analyze_attendance.return_value = {"face_score": 0.0, "liveness_score": 0.0, "background_score": 0.0}
    assert "QR" in await _rejected(503)
    env.db.attendancerecord.create.assert_not_awaited()


@pytest.mark.anyio
async def test_outside_geofence_is_rejected_and_nothing_saved(env) -> None:
    assert "outside" in await _rejected(400, lat=19.5)
    env.db.attendancerecord.create.assert_not_awaited()


@pytest.mark.anyio
async def test_missing_geofence_flags_instead_of_trusting(env) -> None:
    env.db.geofence.find_unique.return_value = None
    await _mark()
    assert _saved()["status"] == "FLAGGED" and "geofence" in _saved()["remarks"]


@pytest.mark.anyio
async def test_gps_disabled_skips_the_location_check(env) -> None:
    env.cfg.return_value.get_config.return_value = _config(gps=False)
    await _mark(lat=50.0)
    env.db.geofence.find_unique.assert_not_awaited()
    assert _saved()["status"] == "PRESENT"


@pytest.mark.anyio
async def test_face_disabled_fails_closed(env) -> None:
    env.cfg.return_value.get_config.return_value = _config(face=False)
    assert "QR" in await _rejected(409)


@pytest.mark.anyio
async def test_requires_registered_face_and_selfie(env) -> None:
    env.repo.return_value.get_face_embedding.return_value = None
    await _rejected(400)
    env.repo.return_value.get_face_embedding.return_value = [0.1] * 128
    await _rejected(400, image=None)


@pytest.mark.anyio
async def test_not_enrolled_is_forbidden(env) -> None:
    env.db.courseenrollment.find_first.return_value = None
    await _rejected(403)


@pytest.mark.anyio
@pytest.mark.parametrize(
    "change",
    [
        dict(verificationActive=False),
        dict(isAttendanceLocked=True),
        dict(status="CANCELLED"),
        dict(verificationExpires=datetime.now(timezone.utc) - timedelta(minutes=1)),
    ],
)
async def test_mark_outside_window_is_rejected(env, change: dict) -> None:
    env.db.classoccurrence.find_first.return_value = _occurrence(**change)
    await _rejected(409)
    env.db.attendancerecord.create.assert_not_awaited()


@pytest.mark.anyio
async def test_already_marked_student_cannot_analyze_again(env) -> None:
    env.db.attendancerecord.find_unique.return_value = SimpleNamespace(id="rec-0", status="PRESENT")
    await _rejected(409)


@pytest.mark.anyio
async def test_review_token_is_single_use(env) -> None:
    analysis = await _analyze()
    await review.confirm_occurrence(STUDENT, analysis["review_token"])
    with pytest.raises(HTTPException) as exc:
        await review.confirm_occurrence(STUDENT, analysis["review_token"])
    assert exc.value.status_code == 400
    assert env.db.attendancerecord.create.await_count == 1


@pytest.mark.anyio
async def test_review_token_of_another_student_is_rejected(env) -> None:
    analysis = await _analyze()
    other = SimpleNamespace(id="stu-2", userId="usr-2", tenantId="t-1")
    with pytest.raises(HTTPException):
        await review.confirm_occurrence(other, analysis["review_token"])


@pytest.mark.anyio
async def test_teacher_placeholder_absent_is_upgraded_with_audit(env) -> None:
    env.db.attendancerecord.find_unique.return_value = SimpleNamespace(id="rec-9", status="ABSENT")
    await _mark()
    assert env.db.attendancerecord.update.await_args.kwargs["where"] == {"id": "rec-9"}
    env.db.attendancerecord.create.assert_not_awaited()
    assert env.db.attendanceauditlog.create.await_args.kwargs["data"]["previousStatus"] == "ABSENT"


@pytest.mark.anyio
async def test_concurrent_duplicate_returns_the_winning_record(env) -> None:
    winner = SimpleNamespace(id="rec-w", status="PRESENT")
    env.db.attendancerecord.create.side_effect = UniqueViolationError({"user_facing_error": {"message": "dup"}})
    env.db.attendancerecord.find_first.return_value = winner
    assert await _mark() is winner
    env.db.attendanceauditlog.create.assert_not_awaited()
