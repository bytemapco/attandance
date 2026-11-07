"""PRD 6.4: window rules, honest scores, idempotent saves, and no fabricated verification."""
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.services import occurrence_marking_service as marking
from app.services.occurrence_marking_service import (
    _score_problems,
    already_marked,
    location_remarks,
    require_open_window,
)

STUDENT = SimpleNamespace(id="stu-1", tenantId="tenant-1", userId="user-1")
OCCURRENCE = SimpleNamespace(id="occ-1", tenantId="tenant-1", courseSectionId="sec-1")


def scores(face=0.9, liveness=0.95, background=0.9, background_counted=True):
    return {"face": face, "liveness": liveness, "background": background, "background_counted": background_counted}


def config(**overrides):
    base = {
        "isGpsVerificationEnabled": True,
        "campusLatitude": 28.6139,
        "campusLongitude": 77.2090,
        "geofenceRadiusMeters": 100,
        "isFaceRecognitionEnabled": True,
        "isAiBackgroundValidationEnabled": True,
    }
    return SimpleNamespace(**{**base, **overrides})


class TestScoreProblems:
    def test_good_scores_raise_no_problem(self):
        assert _score_problems(scores()) == []

    def test_a_low_face_score_is_flagged(self):
        assert _score_problems(scores(face=0.59)) == ["Face match below threshold."]

    def test_the_face_threshold_itself_passes(self):
        assert _score_problems(scores(face=0.60)) == []

    def test_a_liveness_check_that_did_not_run_is_flagged_not_assumed_good(self):
        assert _score_problems(scores(liveness=None)) == ["Liveness check could not run."]

    def test_low_liveness_is_flagged(self):
        assert _score_problems(scores(liveness=0.49)) == ["Liveness below threshold."]

    def test_liveness_just_under_the_threshold_is_flagged(self):
        assert _score_problems(scores(liveness=0.92)) == ["Liveness below threshold."]

    def test_the_liveness_threshold_itself_passes(self):
        assert _score_problems(scores(liveness=0.93)) == []

    def test_a_background_check_that_is_switched_off_is_ignored(self):
        assert _score_problems(scores(background=None, background_counted=False)) == []

    def test_a_counted_background_check_that_did_not_run_is_flagged(self):
        assert _score_problems(scores(background=None)) == ["Background check could not run."]

    def test_a_failed_background_check_is_flagged(self):
        assert _score_problems(scores(background=0.2)) == ["Background check failed."]

    def test_every_failure_is_reported(self):
        assert len(_score_problems(scores(face=0.1, liveness=0.1, background=0.1))) == 3


class TestWindowAndDuplicates:
    def test_a_closed_window_is_a_409(self):
        closed = SimpleNamespace(
            verificationActive=False, verificationExpires=None, isAttendanceLocked=False, status="SCHEDULED"
        )
        with pytest.raises(HTTPException) as caught:
            require_open_window(closed)
        assert caught.value.status_code == 409

    def test_no_record_means_not_marked(self):
        assert already_marked(None) is False

    def test_an_absent_placeholder_can_still_be_upgraded(self):
        assert already_marked(SimpleNamespace(status="ABSENT")) is False

    @pytest.mark.parametrize("state", ["PRESENT", "LATE", "FLAGGED", "APPROVED", "EXCUSED"])
    def test_any_real_mark_blocks_a_second_one(self, state):
        assert already_marked(SimpleNamespace(status=state)) is True


class TestLocation:
    async def test_gps_off_skips_the_check(self):
        assert await location_remarks(config(isGpsVerificationEnabled=False), 0.0, 0.0, 5) == []

    async def test_a_missing_campus_location_flags_instead_of_guessing(self):
        remarks = await location_remarks(config(campusLatitude=None), 28.6, 77.2, 5)
        assert remarks == ["No campus location is set for this institution; location not verified."]

    async def test_inside_the_fence_adds_no_remark(self):
        assert await location_remarks(config(), 28.6139, 77.2090, 5) == []

    async def test_outside_the_fence_is_a_400_with_the_distance(self):
        with pytest.raises(HTTPException) as caught:
            await location_remarks(config(), 28.6339, 77.2090, 5)
        assert caught.value.status_code == 400
        assert "outside the campus location" in caught.value.detail


class TestEvaluateFace:
    @pytest.fixture
    def pipeline(self, monkeypatch):
        service = MagicMock()
        service.get_config = AsyncMock(return_value=config())
        monkeypatch.setattr(marking, "SystemConfigService", lambda: service)
        verify = AsyncMock(return_value=(scores(), []))
        monkeypatch.setattr(marking, "_verify_face", verify)
        return SimpleNamespace(service=service, verify=verify)

    async def evaluate(self):
        return await marking.evaluate_face(STUDENT, OCCURRENCE, 28.6139, 77.2090, 5, "/tmp/selfie.jpg")

    async def test_a_clean_check_is_present_with_the_real_scores(self, pipeline):
        data, _ = await self.evaluate()

        assert data["status"] == "PRESENT" and data["method"] == "AI_BIOMETRIC"
        assert data["faceScore"] == 0.9 and data["livenessScore"] == 0.95
        assert data["evidencePhotoUrl"] is None and data["remarks"] is None

    async def test_any_problem_flags_the_mark_and_keeps_the_evidence(self, pipeline):
        pipeline.verify.return_value = (scores(face=0.1), ["Face match below threshold."])

        data, _ = await self.evaluate()

        assert data["status"] == "FLAGGED"
        assert data["evidencePhotoUrl"] == "/tmp/selfie.jpg"
        assert "Face match below threshold." in data["remarks"]

    async def test_unavailable_ai_is_stored_as_not_checked_never_as_a_score(self, pipeline):
        pipeline.verify.return_value = (
            scores(face=None, liveness=None, background=None),
            ["AI verification unavailable."],
        )

        data, _ = await self.evaluate()

        assert data["status"] == "FLAGGED"
        assert data["faceScore"] is None and data["livenessScore"] is None

    async def test_face_verification_switched_off_sends_the_student_to_the_qr_code(self, pipeline):
        pipeline.service.get_config.return_value = config(isFaceRecognitionEnabled=False)

        with pytest.raises(HTTPException) as caught:
            await self.evaluate()

        assert caught.value.status_code == 409
        assert "QR" in caught.value.detail
        pipeline.verify.assert_not_awaited()


