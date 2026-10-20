"""Validation tests for monthly calendar response models."""

from __future__ import annotations

import pytest

from api.models.calendar import CalendarDay, CalendarMonthResponse


def test_calendar_day_supports_weight_and_diet_status() -> None:
    day = CalendarDay(date="2026-08-12", weight=60.5, status="clean")

    assert day.model_dump(mode="json") == {
        "date": "2026-08-12",
        "weight": 60.5,
        "status": "clean",
    }


def test_calendar_day_allows_empty_diet_status_and_weight() -> None:
    day = CalendarDay(date="2026-08-13", weight=None, status=None)

    assert day.status is None
    assert day.weight is None


@pytest.mark.parametrize("status", ["mixed", "angel", ""])
def test_calendar_day_rejects_unknown_status(status: str) -> None:
    with pytest.raises(ValueError):
        CalendarDay(date="2026-08-12", weight=60, status=status)


def test_calendar_month_requires_valid_year_and_month() -> None:
    with pytest.raises(ValueError):
        CalendarMonthResponse(year=2026, month=13, days=[])
