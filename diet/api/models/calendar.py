"""Pydantic models for month-based calendar records."""

from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

CalendarStatus = Literal["clean", "free"]


class CalendarDay(BaseModel):
    """The information displayed in one calendar date cell."""

    model_config = ConfigDict(extra="forbid")

    date: date
    weight: float | None = Field(default=None, gt=0, le=9999.99)
    status: CalendarStatus | None = None


class CalendarMonthResponse(BaseModel):
    """A month of calendar cells returned by the calendar API."""

    model_config = ConfigDict(extra="forbid")

    year: int = Field(ge=1, le=9999)
    month: int = Field(ge=1, le=12)
    days: list[CalendarDay]
