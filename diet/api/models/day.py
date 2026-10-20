"""Pydantic models for the daily diet and weight response."""

from __future__ import annotations

from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

Meal = Literal["breakfast", "lunch", "dinner", "snack"]
MealType = Literal["clean", "free"]


class MealRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    date: date
    meal: Meal
    food: str = Field(min_length=1, max_length=500)
    type: MealType


class WeightRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: date
    weight: float = Field(gt=0)


class DayRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: date
    weight: WeightRecord | None
    meals: dict[Meal, MealRecord | None]
