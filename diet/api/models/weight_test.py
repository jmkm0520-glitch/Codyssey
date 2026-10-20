"""Validation tests for weight requests."""

from __future__ import annotations

import math

import pytest

from api.models.weight import WeightUpsertRequest


@pytest.mark.parametrize(
    "value",
    [None, "", "60kg", "NaN", math.nan, math.inf, -math.inf, 0, -1, 10000],
)
def test_invalid_weight_values_are_rejected(value: object) -> None:
    with pytest.raises(ValueError):
        WeightUpsertRequest(date="2026-08-12", weight=value)


def test_positive_integer_and_decimal_are_accepted() -> None:
    assert WeightUpsertRequest(date="2026-08-12", weight=60).weight == 60
    assert WeightUpsertRequest(date="2026-08-12", weight=60.5).weight == 60.5
