"""Tests for date-and-meal based meal upserts."""

from __future__ import annotations

from datetime import timedelta

import pytest

from api.lib.validators import app_today
from api.meal import (
    delete_meals_for_date,
    final_meal_record,
    requested_date,
    requested_meal,
    upsert_meal,
)
from api.models.meal import MealUpsertRequest


class InMemoryMealTable:
    def __init__(self) -> None:
        self.rows: dict[tuple[str, str], dict] = {}
        self.payload: dict | None = None
        self.conflict: str | None = None
        self.delete_requested = False
        self.filter_date: str | None = None
        self.filter_meal: str | None = None

    def upsert(self, payload: dict, on_conflict: str):
        self.payload = payload
        self.conflict = on_conflict
        return self

    def delete(self):
        self.delete_requested = True
        return self

    def eq(self, column: str, value: str):
        if column == "date":
            self.filter_date = value
        else:
            assert column == "meal"
            self.filter_meal = value
        return self

    def execute(self):
        if self.delete_requested:
            deleted = [
                row
                for (date, meal), row in self.rows.items()
                if date == self.filter_date and (self.filter_meal is None or meal == self.filter_meal)
            ]
            self.rows = {
                key: row
                for key, row in self.rows.items()
                if not (key[0] == self.filter_date and (self.filter_meal is None or key[1] == self.filter_meal))
            }
            return type("Result", (), {"data": deleted})()
        assert self.payload is not None
        key = (self.payload["date"], self.payload["meal"])
        self.rows[key] = self.payload
        return type("Result", (), {"data": [self.payload]})()


class InMemoryMealClient:
    def __init__(self) -> None:
        self.table_instance = InMemoryMealTable()

    def table(self, name: str) -> InMemoryMealTable:
        assert name == "meals"
        return self.table_instance


def test_meal_request_rejects_a_future_date() -> None:
    with pytest.raises(ValueError):
        MealUpsertRequest(
            date=app_today() + timedelta(days=1),
            meal="breakfast",
            food="두부",
            type="clean",
        )


def test_meal_upsert_uses_date_and_meal_as_its_conflict_key() -> None:
    client = InMemoryMealClient()
    request = MealUpsertRequest(date="2026-08-12", meal="breakfast", food="두부", type="clean")

    upsert_meal(client, request)

    assert client.table_instance.conflict == "date,meal"


def test_resaving_the_same_date_and_meal_replaces_its_record() -> None:
    client = InMemoryMealClient()

    upsert_meal(
        client,
        MealUpsertRequest(date="2026-08-12", meal="breakfast", food="두부", type="clean"),
    )
    upsert_meal(
        client,
        MealUpsertRequest(date="2026-08-12", meal="breakfast", food="계란", type="free"),
    )

    assert client.table_instance.rows == {
        ("2026-08-12", "breakfast"): {
            "date": "2026-08-12",
            "meal": "breakfast",
            "food": "계란",
            "type": "free",
        }
    }


def test_meal_save_response_returns_the_final_record() -> None:
    saved = {
        "id": "8d8a8ee7-8338-4a2a-a5df-65a783a02411",
        "date": "2026-08-12",
        "meal": "lunch",
        "food": "연어 포케",
        "type": "clean",
        "created_at": "2026-08-12T00:00:00+00:00",
        "updated_at": "2026-08-12T00:00:00+00:00",
    }

    assert final_meal_record(type("Result", (), {"data": [saved]})()) == saved


@pytest.mark.parametrize(
    ("meal", "food", "type"),
    [
        ("breakfast", "두부", "clean"),
        ("lunch", "연어 포케", "clean"),
        ("dinner", "닭가슴살", "clean"),
        ("snack", "카페라떼", "free"),
    ],
)
def test_each_daily_meal_slot_can_be_saved_independently(meal: str, food: str, type: str) -> None:
    client = InMemoryMealClient()

    upsert_meal(
        client,
        MealUpsertRequest(date="2026-08-12", meal=meal, food=food, type=type),
    )

    assert client.table_instance.rows[("2026-08-12", meal)] == {
        "date": "2026-08-12",
        "meal": meal,
        "food": food,
        "type": type,
    }


def test_meal_reset_deletes_every_slot_for_only_the_selected_date() -> None:
    client = InMemoryMealClient()
    for date, meal in [
        ("2026-08-11", "breakfast"),
        ("2026-08-11", "lunch"),
        ("2026-08-12", "dinner"),
    ]:
        upsert_meal(
            client,
            MealUpsertRequest(date=date, meal=meal, food="테스트 음식", type="clean"),
        )

    result = delete_meals_for_date(client, "2026-08-11")

    assert len(result.data) == 2
    assert list(client.table_instance.rows) == [("2026-08-12", "dinner")]


def test_meal_reset_reads_the_selected_date_from_the_url() -> None:
    assert requested_date("/api/meal?date=2026-08-12") == "2026-08-12"

    with pytest.raises(ValueError):
        requested_date("/api/meal?date=not-a-date")


def test_meal_delete_can_target_one_slot() -> None:
    client = InMemoryMealClient()
    for meal in ["breakfast", "lunch"]:
        upsert_meal(
            client,
            MealUpsertRequest(date="2026-08-12", meal=meal, food="테스트 음식", type="clean"),
        )

    result = delete_meals_for_date(client, "2026-08-12", "breakfast")

    assert len(result.data) == 1
    assert list(client.table_instance.rows) == [("2026-08-12", "lunch")]
    assert requested_meal("/api/meal?date=2026-08-12&meal=lunch") == "lunch"
    assert requested_meal("/api/meal?date=2026-08-12") is None

    with pytest.raises(ValueError):
        requested_meal("/api/meal?date=2026-08-12&meal=brunch")
