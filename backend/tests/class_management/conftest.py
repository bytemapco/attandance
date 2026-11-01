from unittest.mock import AsyncMock, MagicMock
import pytest

from app.services import batch_service
from app.services.class_management import (
    class_member_service,
    class_schedule_service,
    class_section_service,
    class_term_service,
    common,
    enrollment_sync,
    promotion_service,
)

MODULES = [
    batch_service,
    common,
    enrollment_sync,
    class_term_service,
    class_member_service,
    class_section_service,
    class_schedule_service,
    promotion_service,
]
MODELS = [
    "classterm", "classmember", "student", "studentgroup", "semester", "academicyear", "department",
    "courseenrollment", "coursesection", "coursefaculty", "subject", "teacher", "classroom",
    "timetablerule", "timeslot", "classoccurrence", "attendancerecord", "batch",
]
METHODS = [
    "find_first", "find_many", "find_unique", "create", "create_many", "update", "update_many",
    "delete", "delete_many", "count",
]


@pytest.fixture
def fake_db(monkeypatch: pytest.MonkeyPatch) -> MagicMock:
    fake = MagicMock()
    for module in MODULES:
        monkeypatch.setattr(module, "db", fake)
    for model in MODELS:
        for method in METHODS:
            default = [] if method == "find_many" else None
            setattr(getattr(fake, model), method, AsyncMock(return_value=default))
    return fake
