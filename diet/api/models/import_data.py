"""Validated bulk import request models."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator

from api.lib.validators import validate_record_date
from api.models.meal import Meal, MealType


class ImportedMeal(BaseModel):
    model_config = ConfigDict(extra="forbid")
    meal: Meal
    food: str = Field(min_length=1, max_length=500)
    type: MealType


class ImportedDay(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    date: date
    weight: float | None = Field(default=None, gt=0, le=9999.99)
    meals: list[ImportedMeal] = Field(default_factory=list, max_length=4)

    @field_validator("date")
    @classmethod
    def reject_future_date(cls, value: date) -> date:
        return validate_record_date(value)


class ImportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rows: list[ImportedDay] = Field(min_length=1, max_length=500)

    @field_validator("rows")
    @classmethod
    def validate_rows(cls, value: list[ImportedDay]) -> list[ImportedDay]:
        dates = [row.date for row in value]
        if len(dates) != len(set(dates)):
            raise ValueError("dates must be unique")
        if any(row.weight is None and not row.meals for row in value):
            raise ValueError("empty rows are not allowed")
        return value
