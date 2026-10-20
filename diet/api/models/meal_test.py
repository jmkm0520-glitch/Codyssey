"""Validation tests for meal save requests."""

from __future__ import annotations

import pytest

from api.models.meal import MealUpsertRequest


@pytest.mark.parametrize(
    "payload",
    [
        {"date": "not-a-date", "meal": "breakfast", "food": "두부", "type": "clean"},
        {"date": "2026-08-12", "meal": "brunch", "food": "두부", "type": "clean"},
        {"date": "2026-08-12", "meal": "breakfast", "food": "두부", "type": "mixed"},
        {"date": "2026-08-12", "meal": "breakfast", "type": "clean"},
    ],
)
def test_invalid_meal_save_fields_are_rejected(payload: dict) -> None:
    with pytest.raises(ValueError):
        MealUpsertRequest.model_validate(payload)


def test_valid_meal_save_fields_are_accepted() -> None:
    record = MealUpsertRequest.model_validate(
        {"date": "2026-08-12", "meal": "lunch", "food": "연어 포케", "type": "clean"}
    )

    assert record.model_dump(mode="json") == {
        "date": "2026-08-12",
        "meal": "lunch",
        "food": "연어 포케",
        "type": "clean",
    }


def test_food_is_trimmed_before_saving() -> None:
    record = MealUpsertRequest(date="2026-08-12", meal="dinner", food="  닭가슴살  ", type="clean")

    assert record.food == "닭가슴살"


@pytest.mark.parametrize("food", ["", "   ", "\n\t"])
def test_blank_food_is_rejected(food: str) -> None:
    with pytest.raises(ValueError):
        MealUpsertRequest(date="2026-08-12", meal="dinner", food=food, type="clean")


def test_overly_long_food_is_rejected() -> None:
    with pytest.raises(ValueError):
        MealUpsertRequest(date="2026-08-12", meal="dinner", food="가" * 501, type="clean")


@pytest.mark.parametrize("meal", ["brunch", "morning", "BREAKFAST"])
def test_invalid_meal_type_is_rejected(meal: str) -> None:
    with pytest.raises(ValueError):
        MealUpsertRequest(date="2026-08-12", meal=meal, food="두부", type="clean")


@pytest.mark.parametrize("type", ["mixed", "diet", "CLEAN"])
def test_invalid_diet_type_is_rejected(type: str) -> None:
    with pytest.raises(ValueError):
        MealUpsertRequest(date="2026-08-12", meal="breakfast", food="두부", type=type)
