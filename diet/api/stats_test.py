"""Tests for the recent-days diet statistics aggregation."""

from __future__ import annotations

from datetime import timedelta

import pytest

from api.lib.validators import app_today
from api.stats import (
    DEFAULT_DAYS,
    MAX_DAYS,
    build_stats,
    clean_ratio,
    empty_stats,
    previous_window_bounds,
    requested_days,
    top_meal,
    window_bounds,
    window_dates,
)


def meal(date: str, type: str, slot: str = "dinner") -> dict:
    return {"date": date, "meal": slot, "type": type}


def test_window_defaults_to_the_last_seven_days_including_today() -> None:
    start, end = window_bounds(DEFAULT_DAYS)

    assert end == app_today().isoformat()
    assert start == (app_today() - timedelta(days=6)).isoformat()


def test_requested_days_reads_the_optional_window_size() -> None:
    assert requested_days("/api/stats") == DEFAULT_DAYS
    assert requested_days("/api/stats?days=30") == 30
    assert requested_days(f"/api/stats?days={MAX_DAYS}") == MAX_DAYS


@pytest.mark.parametrize(
    "query", ["days=0", "days=-1", f"days={MAX_DAYS + 1}", "days=week", "days=7&days=8"]
)
def test_requested_days_rejects_values_outside_the_allowed_window(query: str) -> None:
    with pytest.raises(ValueError):
        requested_days(f"/api/stats?{query}")


def test_counts_clean_and_free_meals_across_the_window() -> None:
    rows = [
        meal("2026-08-14", "clean"),
        meal("2026-08-14", "clean"),
        meal("2026-08-15", "free"),
        meal("2026-08-16", "clean"),
    ]

    stats = build_stats(7, "2026-08-14", "2026-08-20", rows)

    assert stats["total"] == 4
    assert stats["clean"] == 3
    assert stats["free"] == 1
    assert stats["range"] == {"start": "2026-08-14", "end": "2026-08-20", "days": 7}


def test_reports_the_example_ratio_from_the_requirements() -> None:
    rows = [meal("2026-08-14", "clean") for _ in range(16)]
    rows += [meal("2026-08-15", "free") for _ in range(5)]

    stats = build_stats(7, "2026-08-14", "2026-08-20", rows)

    assert stats["total"] == 21
    assert stats["clean"] == 16
    assert stats["free"] == 5
    assert stats["cleanRatio"] == 76


def test_counts_days_that_hold_at_least_one_record() -> None:
    rows = [
        meal("2026-08-14", "clean"),
        meal("2026-08-14", "free"),
        meal("2026-08-16", "clean"),
    ]

    assert build_stats(7, "2026-08-14", "2026-08-20", rows)["recordedDays"] == 2


def test_an_empty_window_reports_zeroes_instead_of_failing() -> None:
    stats = build_stats(7, "2026-08-14", "2026-08-20", [])

    assert stats["total"] == 0
    assert stats["clean"] == 0
    assert stats["free"] == 0
    assert stats["cleanRatio"] == 0
    assert stats["recordedDays"] == 0


def test_a_row_with_an_unknown_type_is_skipped_rather_than_raising() -> None:
    rows = [
        meal("2026-08-14", "clean"),
        meal("2026-08-14", "brunch"),
        {"date": "2026-08-15"},
    ]

    stats = build_stats(7, "2026-08-14", "2026-08-20", rows)

    assert stats["total"] == 1
    assert stats["clean"] == 1
    assert stats["recordedDays"] == 1


def test_empty_stats_matches_a_window_with_no_records() -> None:
    assert empty_stats(7, "2026-08-14", "2026-08-20") == build_stats(
        7, "2026-08-14", "2026-08-20", []
    )


@pytest.mark.parametrize(
    ("clean", "total", "expected"),
    [(0, 0, 0), (16, 21, 76), (1, 3, 33), (2, 3, 67), (7, 7, 100), (0, 4, 0)],
)
def test_clean_ratio_rounds_to_a_whole_percent(clean: int, total: int, expected: int) -> None:
    assert clean_ratio(clean, total) == expected


def test_window_dates_covers_every_day_from_the_start() -> None:
    assert window_dates("2026-08-18", 3) == ["2026-08-18", "2026-08-19", "2026-08-20"]


def test_daily_breakdown_keeps_one_entry_per_day_in_order() -> None:
    rows = [
        meal("2026-08-18", "clean"),
        meal("2026-08-18", "free"),
        meal("2026-08-20", "clean"),
    ]

    daily = build_stats(3, "2026-08-18", "2026-08-20", rows)["daily"]

    assert daily == [
        {"date": "2026-08-18", "clean": 1, "free": 1, "weight": None},
        {"date": "2026-08-19", "clean": 0, "free": 0, "weight": None},
        {"date": "2026-08-20", "clean": 1, "free": 0, "weight": None},
    ]


def test_a_day_without_records_stays_in_the_breakdown_as_zero() -> None:
    daily = build_stats(7, "2026-08-14", "2026-08-20", [])["daily"]

    assert len(daily) == 7
    assert all(entry["clean"] == 0 and entry["free"] == 0 for entry in daily)


def test_a_row_outside_the_window_counts_in_the_total_but_creates_no_day() -> None:
    rows = [meal("2026-08-18", "clean"), meal("2026-01-01", "free")]

    stats = build_stats(3, "2026-08-18", "2026-08-20", rows)

    assert stats["total"] == 2
    assert len(stats["daily"]) == 3
    assert [entry["date"] for entry in stats["daily"]] == [
        "2026-08-18",
        "2026-08-19",
        "2026-08-20",
    ]


def test_recorded_days_is_derived_from_the_daily_breakdown() -> None:
    rows = [meal("2026-08-18", "clean"), meal("2026-08-20", "free")]

    assert build_stats(3, "2026-08-18", "2026-08-20", rows)["recordedDays"] == 2


def test_previous_window_sits_directly_before_the_current_one() -> None:
    assert previous_window_bounds("2026-08-14", 7) == ("2026-08-07", "2026-08-13")


def test_top_meal_reports_the_most_recorded_slot() -> None:
    rows = [
        meal("2026-08-18", "clean", "breakfast"),
        meal("2026-08-18", "free", "dinner"),
        meal("2026-08-19", "clean", "dinner"),
    ]

    assert top_meal(rows) == "dinner"


def test_top_meal_breaks_a_tie_by_the_order_meals_happen() -> None:
    rows = [
        meal("2026-08-18", "clean", "dinner"),
        meal("2026-08-18", "clean", "breakfast"),
    ]

    assert top_meal(rows) == "breakfast"


def test_top_meal_is_none_when_nothing_is_recorded() -> None:
    assert top_meal([]) is None
    assert top_meal([{"date": "2026-08-18", "meal": "dinner", "type": "brunch"}]) is None


def test_compares_the_clean_ratio_against_the_previous_window() -> None:
    current = [meal("2026-08-18", "clean") for _ in range(3)] + [meal("2026-08-18", "free")]
    previous = [meal("2026-08-11", "clean")] + [meal("2026-08-11", "free") for _ in range(3)]

    stats = build_stats(7, "2026-08-14", "2026-08-20", current, previous)

    assert stats["cleanRatio"] == 75
    assert stats["previous"] == {"total": 4, "clean": 1, "free": 3, "cleanRatio": 25}
    assert stats["cleanRatioDelta"] == 50


def test_delta_is_zero_when_the_previous_window_holds_nothing() -> None:
    stats = build_stats(7, "2026-08-14", "2026-08-20", [meal("2026-08-18", "clean")], [])

    assert stats["previous"]["total"] == 0
    assert stats["cleanRatioDelta"] == 0


def test_weights_land_on_their_day_and_leave_the_rest_empty() -> None:
    daily = build_stats(
        3,
        "2026-08-18",
        "2026-08-20",
        [meal("2026-08-18", "clean")],
        [],
        [{"date": "2026-08-18", "weight": 55.5}, {"date": "2026-08-20", "weight": 55.1}],
    )["daily"]

    assert [entry["weight"] for entry in daily] == [55.5, None, 55.1]


def test_a_weight_outside_the_window_is_ignored() -> None:
    daily = build_stats(
        2, "2026-08-19", "2026-08-20", [], [], [{"date": "2026-01-01", "weight": 60.0}]
    )["daily"]

    assert all(entry["weight"] is None for entry in daily)
