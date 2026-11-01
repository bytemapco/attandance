from datetime import date, datetime
import zoneinfo

IST = zoneinfo.ZoneInfo("Asia/Kolkata")


def get_ist_now() -> datetime:
    """Return the current datetime in Indian Standard Time (Asia/Kolkata)."""
    return datetime.now(IST)


def get_ist_today() -> date:
    """Return today's date in Indian Standard Time (Asia/Kolkata)."""
    return get_ist_now().date()
