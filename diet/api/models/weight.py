"""Pydantic models for weight create/update requests and responses."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator

from api.lib.validators import validate_record_date


class WeightUpsertRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

    date: date
    weight: float = Field(gt=0, le=9999.99)

    @field_validator("date")
    @classmethod
    def reject_future_date(cls, value: date) -> date:
        """Do not allow weight records after the current local date."""

        return validate_record_date(value)


class WeightResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

    date: date
    weight: float = Field(gt=0, le=9999.99)
    created_at: str
    updated_at: str
