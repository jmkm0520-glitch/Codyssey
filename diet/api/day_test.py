"""Tests for daily date validation and empty-day behavior."""

from __future__ import annotations

import pytest

from api.day import _requested_date, build_day_data, delete_day_records


class DeleteTable:
    def __init__(self, rows: list[dict]) -> None:
        self.rows = rows
        self.deleted_date = None

    def delete(self):
        return self

    def eq(self, column, value):
        assert column == "date"
        self.deleted_date = value
        return self

    def execute(self):
        deleted = [row for row in self.rows if row["date"] == self.deleted_date]
        self.rows[:] = [row for row in self.rows if row["date"] != self.deleted_date]
        return type("Result", (), {"data": deleted})()


class DeleteDayClient:
    def __init__(self) -> None:
        self.tables = {
            "meals": DeleteTable(
                [
                    {"date": "2026-08-09", "meal": "breakfast"},
                    {"date": "2026-08-10", "meal": "dinner"},
                ]
            ),
            "weights": DeleteTable(
                [
                    {"date": "2026-08-09", "weight": 61},
                    {"date": "2026-08-10", "weight": 60.5},
                ]
            ),
        }

    def table(self, name):
        return self.tables[name]


def test_invalid_date_is_rejected() -> None:
    with pytest.raises(ValueError):
        _requested_date("/api/day?date=2026-02-30")


def test_missing_date_is_rejected() -> None:
    with pytest.raises(ValueError):
        _requested_date("/api/day")


def test_empty_day_is_valid_data() -> None:
    data = build_day_data("2026-08-12", [], [])
    assert data["weight"] is None
    assert set(data["meals"]) == {"breakfast", "lunch", "dinner", "snack"}
    assert all(value is None for value in data["meals"].values())


def test_returning_to_original_date_rebuilds_saved_data() -> None:
    saved_meal = {
        "id": "meal-1",
        "date": "2026-08-12",
        "meal": "lunch",
        "food": "연어 포케",
        "type": "clean",
    }
    first_view = build_day_data("2026-08-12", [saved_meal], [])
    other_day_view = build_day_data("2026-08-13", [], [])
    returned_view = build_day_data("2026-08-12", [saved_meal], [])

    assert first_view["meals"]["lunch"] == saved_meal
    assert other_day_view["meals"]["lunch"] is None
    assert returned_view == first_view


def test_day_reset_deletes_weight_and_meals_for_only_the_selected_date() -> None:
    client = DeleteDayClient()

    result = delete_day_records(client, "2026-08-09")

    assert result == {"date": "2026-08-09", "deletedMeals": 1, "deletedWeights": 1}
    assert client.tables["meals"].rows == [{"date": "2026-08-10", "meal": "dinner"}]
    assert client.tables["weights"].rows == [{"date": "2026-08-10", "weight": 60.5}]
