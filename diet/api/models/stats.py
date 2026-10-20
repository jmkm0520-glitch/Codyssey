"""Pydantic models for the recent-days diet statistics response."""

from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

MealSlot = Literal["breakfast", "lunch", "dinner", "snack"]


class StatsRange(BaseModel):
    """The calendar window the statistics were calculated over."""

    model_config = ConfigDict(extra="forbid")

    start: date
    end: date
    days: int = Field(ge=1, le=366)


class StatsDay(BaseModel):
    """One day inside the window, including days without any record."""

    model_config = ConfigDict(extra="forbid")

    date: date
    clean: int = Field(ge=0)
    free: int = Field(ge=0)
    weight: float | None = Field(default=None, gt=0, le=9999.99)


class StatsPrevious(BaseModel):
    """The same counts for the window immediately before this one."""

    model_config = ConfigDict(extra="forbid")

    total: int = Field(ge=0)
    clean: int = Field(ge=0)
    free: int = Field(ge=0)
    cleanRatio: int = Field(ge=0, le=100)


class StatsResponse(BaseModel):
    """Recent-days meal counts and the clean-meal ratio."""

    model_config = ConfigDict(extra="forbid")

    range: StatsRange
    total: int = Field(ge=0)
    clean: int = Field(ge=0)
    free: int = Field(ge=0)
    cleanRatio: int = Field(ge=0, le=100)
    recordedDays: int = Field(ge=0)
    daily: list[StatsDay]
    topMeal: MealSlot | None
    previous: StatsPrevious
    cleanRatioDelta: int = Field(ge=-100, le=100)
