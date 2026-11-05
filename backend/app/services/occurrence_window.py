"""Whether a class's attendance window is open. Kept free of the AI imports so any service can use it."""
from datetime import datetime, timezone


def window_is_open(occurrence) -> bool:
    expires = occurrence.verificationExpires
    if expires is not None and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    return bool(
        occurrence.verificationActive
        and expires
        and expires > datetime.now(timezone.utc)
        and not occurrence.isAttendanceLocked
        and occurrence.status != "CANCELLED"
    )
