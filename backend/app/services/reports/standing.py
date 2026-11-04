"""How a student stands against the attendance threshold. Pure functions, no database."""
import math
from dataclasses import dataclass
from typing import Optional, Sequence

from app.services.attendance_percentage import ATTENDED_STATUSES, attendance_percentage, percentage

# An excused class is not held against the student, so it counts as attended (PRD 5.3).
COUNTED_AS_ATTENDED = ATTENDED_STATUSES | {"EXCUSED"}


@dataclass(frozen=True)
class Standing:
    attended: int
    held: int
    percentage: Optional[float]


def standing(statuses: Sequence[Optional[str]]) -> Standing:
    """`statuses` has one entry per class held; None means the class was held and the student has no record."""
    recorded = [status for status in statuses if status is not None]
    return Standing(
        attended=sum(1 for status in recorded if status in COUNTED_AS_ATTENDED),
        held=len(statuses),
        percentage=attendance_percentage(recorded, len(statuses)),
    )


def combine(parts: Sequence[Standing]) -> Standing:
    """Several subjects as one figure: total attended over total held, not an average of percentages."""
    attended = sum(part.attended for part in parts)
    held = sum(part.held for part in parts)
    return Standing(attended, held, percentage(attended, held))


def classes_needed(attended: int, held: int, threshold: float) -> Optional[int]:
    """Classes the student must attend, without missing any, to reach the threshold. None when it cannot be reached."""
    if held > 0 and attended * 100 >= threshold * held:
        return 0
    if threshold >= 100:
        return None
    return max(0, math.ceil((threshold * held - 100 * attended) / (100 - threshold) - 1e-9))
