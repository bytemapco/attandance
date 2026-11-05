"""The numbers behind a student's analytics screen. Pure functions; the service loads the rows."""
from datetime import date, timedelta
from typing import Iterable, List, Optional

from app.schemas.student_analytics import AttendanceFigures, Standing, WeekFigures
from app.services.attendance_percentage import ATTENDED_STATUSES, attendance_margin, percentage
from app.services.student_class_ledger import HeldClass

AT_RISK_MARGIN = 5.0
TREND_WEEKS = 8


def standing(pct: Optional[float], threshold: float) -> Standing:
    if pct is None:
        return "NO_DATA"
    if pct < threshold:
        return "SHORTAGE"
    if pct < threshold + AT_RISK_MARGIN:
        return "AT_RISK"
    return "OK"


def figures(attended: int, conducted: int, threshold: float) -> AttendanceFigures:
    pct = percentage(attended, conducted)
    can_miss, must_attend = attendance_margin(attended, conducted, threshold)
    return AttendanceFigures(
        conducted=conducted,
        attended=attended,
        percentage=pct,
        can_miss=can_miss,
        must_attend=must_attend,
        standing=standing(pct, threshold),
    )


def _counts_as_attended(status: Optional[str]) -> bool:
    # The same rule as the subject percentage: approved leave counts as present.
    return status in ATTENDED_STATUSES or status == "EXCUSED"


def _monday(day: date) -> date:
    return day - timedelta(days=day.weekday())


def weekly_trend(classes: Iterable[HeldClass], today: date, weeks: int = TREND_WEEKS) -> List[WeekFigures]:
    """The last `weeks` weeks (Monday start), oldest first, ending with the week of `today`."""
    first = _monday(today) - timedelta(weeks=weeks - 1)
    totals = {first + timedelta(weeks=i): [0, 0] for i in range(weeks)}
    for held in classes:
        bucket = totals.get(_monday(held.occurrence_date))
        if bucket is None:
            continue
        bucket[1] += 1
        bucket[0] += _counts_as_attended(held.status)
    return [
        WeekFigures(week_start=start, conducted=conducted, attended=attended, percentage=percentage(attended, conducted))
        for start, (attended, conducted) in sorted(totals.items())
    ]
