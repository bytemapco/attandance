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


def attendance_margin(attended: int, conducted: int, threshold: float) -> tuple[int, int]:
    """(can_miss, must_attend) against a minimum percentage.

    can_miss: the most classes the student can skip and still stay at or above the threshold.
    must_attend: the fewest classes in a row they must attend to get back to it.
    At most one is non-zero. Both are 0 when nothing has been conducted or the threshold is unreachable.
    """
    if conducted <= 0 or threshold <= 0:
        return 0, 0
    if attended * 100 >= threshold * conducted:
        return int(attended * 100 / threshold - conducted + 1e-9), 0
    if threshold >= 100:
        return 0, 0
    needed = (threshold * conducted - 100 * attended) / (100 - threshold)
    return 0, int(needed) if needed == int(needed) else int(needed) + 1
