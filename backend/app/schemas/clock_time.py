from typing import Annotated
from pydantic import StringConstraints

ClockTime = Annotated[str, StringConstraints(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")]
"""A 24 hour clock time as "HH:MM", for example "09:30"."""


def require_end_after_start(start_time: str, end_time: str) -> None:
    if end_time <= start_time:
        raise ValueError("end_time must be after start_time")
