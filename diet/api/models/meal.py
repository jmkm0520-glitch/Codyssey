"""Pydantic models for meal create/update requests and responses."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from api.lib.validators import validate_record_date

Meal = Literal["breakfast", "lunch", "dinner", "snack"]
MealType = Literal["clean", "free"]


class MealUpsertRequest(BaseModel):
    """Validated input for saving one meal in a daily slot."""

    model_config = ConfigDict(extra="forbid")

    date: date
    meal: Meal
    food: str = Field(min_length=1, max_length=500)
    type: MealType

    @field_validator("date")
    @classmethod
    def reject_future_date(cls, value: date) -> date:
        """Do not allow meal records after the current local date."""

        return validate_record_date(value)

    @field_validator("food")
    @classmethod
    def trim_and_require_food(cls, value: str) -> str:
        """Store clean food text and reject input that is only whitespace."""

        trimmed = value.strip()
        if not trimmed:
            raise ValueError("food must contain non-whitespace text")
        return trimmed


class MealResponse(BaseModel):
    """A saved meal record returned by the API."""

    model_config = ConfigDict(extra="forbid")

    id: UUID
    date: date
    meal: Meal
    food: str = Field(min_length=1, max_length=500)
    type: MealType
    created_at: datetime
    updated_at: datetime
