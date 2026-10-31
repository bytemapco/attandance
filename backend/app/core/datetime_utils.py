from datetime import date, datetime, timezone
from typing import Union
import zoneinfo

IST = zoneinfo.ZoneInfo("Asia/Kolkata")


def get_ist_now() -> datetime:
    """Return the current datetime in Indian Standard Time (Asia/Kolkata)."""
    return datetime.now(IST)


def get_ist_today() -> date:
    """Return today's date in Indian Standard Time (Asia/Kolkata)."""
    return get_ist_now().date()


def to_ist_date(d: Union[date, datetime]) -> date:
    """Normalize a date or datetime object to an IST calendar date."""
    if isinstance(d, datetime):
        if d.tzinfo is None:
            # Assume UTC if naive
            d = d.replace(tzinfo=timezone.utc)
        return d.astimezone(IST).date()
    return d


def to_ist_datetime(d: date) -> datetime:
    """Convert an IST date to datetime at start of day in IST."""
    return datetime(d.year, d.month, d.day, 0, 0, 0, tzinfo=IST)
