from dataclasses import dataclass
from datetime import datetime


class CachedSession:
    def __init__(self, id: str, is_active: bool, academic_class_id: str, end_time: datetime):
        self.id = id
        self.isActive = is_active
        self.academicClassId = academic_class_id
        self.endTime = end_time


@dataclass(frozen=True)
class AttendanceSubmission:
    student_id: str
    session_id: str
    latitude: float
    longitude: float
    accuracy: float
    image_path: str | None = None
    image_bytes: bytes | None = None

