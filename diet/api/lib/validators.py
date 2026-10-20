"""Small, reusable validators for API input values."""

from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo

APP_TIME_ZONE = ZoneInfo("Asia/Seoul")


def app_today() -> date:
    """Return today's date in the timezone used by the diet tracker."""

    return datetime.now(APP_TIME_ZONE).date()


def validate_record_date(value: date) -> date:
    """Reject attempts to create or update records after today."""

    if value > app_today():
        raise ValueError("future dates cannot contain records")
    return value


def validate_date(value: str) -> str:
    """Return a valid YYYY-MM-DD date or raise a clear validation error."""

    if not isinstance(value, str):
        raise ValueError("date must be a string in YYYY-MM-DD format")

    try:
        parsed = date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError("date must be a real date in YYYY-MM-DD format") from exc

    if parsed.isoformat() != value:
        raise ValueError("date must be a real date in YYYY-MM-DD format")

    return value
