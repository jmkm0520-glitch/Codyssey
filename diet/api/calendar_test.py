"""Tests for the monthly calendar API helpers."""

from __future__ import annotations

import pytest

from api.calendar import build_calendar_month, meal_status, month_bounds, requested_month


def test_calendar_api_accepts_year_and_month_query_parameters() -> None:
    assert requested_month("/api/calendar?year=2026&month=8") == (2026, 8)


@pytest.mark.parametrize(
    "path",
    ["/api/calendar", "/api/calendar?year=2026", "/api/calendar?year=2026&month=13"],
)
def test_calendar_api_rejects_invalid_month_queries(path: str) -> None:
    with pytest.raises(ValueError):
        requested_month(path)


def test_calendar_api_returns_one_cell_for_each_day_and_saved_weights() -> None:
    result = build_calendar_month(2026, 8, [{"date": "2026-08-12", "weight": 60.5}], [])

    assert len(result["days"]) == 31
    assert result["days"][11] == {"date": "2026-08-12", "weight": 60.5, "status": None}


def test_calendar_api_accepts_weight_and_meal_rows_in_one_response() -> None:
    result = build_calendar_month(
        2026,
        8,
        [{"date": "2026-08-12", "weight": 60.5}],
        [{"date": "2026-08-12", "type": "clean"}],
    )

    assert result["days"][11] == {"date": "2026-08-12", "weight": 60.5, "status": "clean"}


@pytest.mark.parametrize("types", [["clean"], ["clean", "clean"], ["clean", "clean", "clean"]])
def test_partially_recorded_clean_meals_have_clean_status(types: list[str]) -> None:
    """One to three recorded meals are still clean when none is free."""
    assert meal_status(types) == "clean"


@pytest.mark.parametrize(
    "types",
    [["free"], ["clean", "free"], ["free", "clean", "clean"], ["clean", "clean", "free"]],
)
def test_any_free_meal_has_free_status(types: list[str]) -> None:
    """A free meal wins regardless of which meal was recorded as free."""
    assert meal_status(types) == "free"


@pytest.mark.parametrize(
    ("weight_rows", "day_index"),
    [([{"date": "2026-08-12", "weight": 60.5}], 11), ([], 12)],
)
def test_weight_only_or_empty_day_has_no_diet_status(
    weight_rows: list[dict], day_index: int
) -> None:
    result = build_calendar_month(2026, 8, weight_rows, [])

    assert meal_status([]) is None
    assert result["days"][day_index]["status"] is None


@pytest.mark.parametrize(
    ("year", "month", "expected"),
    [
        (2026, 2, ("2026-02-01", "2026-02-28")),
        (2028, 2, ("2028-02-01", "2028-02-29")),
        (2026, 12, ("2026-12-01", "2026-12-31")),
        (2027, 1, ("2027-01-01", "2027-01-31")),
    ],
)
def test_calendar_month_bounds_handle_short_months_and_year_boundaries(
    year: int, month: int, expected: tuple[str, str]
) -> None:
    assert month_bounds(year, month) == expected
