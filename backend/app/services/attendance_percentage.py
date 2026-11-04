from typing import Iterable, Optional

ATTENDED_STATUSES = frozenset({"PRESENT", "LATE", "APPROVED"})


def percentage(attended: int, conducted: int) -> Optional[float]:
    """attended / conducted as a percentage, or None when nothing has been conducted (never a fake 0% or 100%)."""
    if conducted <= 0:
        return None
    return round(attended * 100 / conducted, 2)


def attendance_percentage(
    statuses: Iterable[str], conducted: int, excused_counts_as_present: bool = True
) -> Optional[float]:
    """PRD 5.3: (PRESENT + LATE + EXCUSED_if_counted) / conducted occurrences.

    `conducted` must already exclude cancelled classes and classes still being taken.
    """
    attended = sum(
        1 for status in statuses if status in ATTENDED_STATUSES or (excused_counts_as_present and status == "EXCUSED")
    )
    return percentage(attended, conducted)
