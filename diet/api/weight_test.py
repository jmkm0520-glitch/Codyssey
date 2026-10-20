"""Tests for date-based weight upsert behavior."""

from __future__ import annotations

from datetime import timedelta

import pytest

from api.lib.validators import app_today
from api.models.weight import WeightUpsertRequest
from api.weight import final_weight_record, upsert_weight


class FakeTable:
    def __init__(self) -> None:
        self.payload = None
        self.conflict = None

    def upsert(self, payload, on_conflict):
        self.payload = payload
        self.conflict = on_conflict
        return self

    def execute(self):
        return self


class FakeClient:
    def __init__(self) -> None:
        self.table_instance = FakeTable()

    def table(self, name):
        assert name == "weights"
        return self.table_instance


class InMemoryWeightTable:
    def __init__(self) -> None:
        self.rows: dict[str, dict] = {}
        self.payload: dict | None = None

    def upsert(self, payload, on_conflict):
        assert on_conflict == "date"
        self.payload = payload
        return self

    def execute(self):
        assert self.payload is not None
        self.rows[self.payload["date"]] = self.payload
        return type("Result", (), {"data": [self.payload]})()


class InMemoryWeightClient:
    def __init__(self) -> None:
        self.table_instance = InMemoryWeightTable()

    def table(self, name):
        assert name == "weights"
        return self.table_instance


def test_weight_request_rejects_a_future_date() -> None:
    with pytest.raises(ValueError):
        WeightUpsertRequest(date=app_today() + timedelta(days=1), weight=60.5)


def test_weight_upsert_uses_date_conflict_key() -> None:
    client = FakeClient()
    upsert_weight(client, WeightUpsertRequest(date="2026-08-12", weight=60.5))
    assert client.table_instance.conflict == "date"
    assert client.table_instance.payload == {"date": "2026-08-12", "weight": 60.5}


def test_weight_upsert_accepts_positive_integer_and_decimal_values() -> None:
    for value in (60, 60.5):
        client = FakeClient()
        request = WeightUpsertRequest(date="2026-08-12", weight=value)

        upsert_weight(client, request)

        assert client.table_instance.payload == {"date": "2026-08-12", "weight": float(value)}


def test_resaving_a_date_updates_its_existing_weight() -> None:
    client = InMemoryWeightClient()

    upsert_weight(client, WeightUpsertRequest(date="2026-08-12", weight=60))
    result = upsert_weight(client, WeightUpsertRequest(date="2026-08-12", weight=59.5))

    assert len(client.table_instance.rows) == 1
    assert final_weight_record(result) == {"date": "2026-08-12", "weight": 59.5}
    assert client.table_instance.rows["2026-08-12"] == {"date": "2026-08-12", "weight": 59.5}


def test_updating_one_date_does_not_change_another_dates_weight() -> None:
    client = InMemoryWeightClient()

    upsert_weight(client, WeightUpsertRequest(date="2026-08-11", weight=61))
    upsert_weight(client, WeightUpsertRequest(date="2026-08-12", weight=60))
    upsert_weight(client, WeightUpsertRequest(date="2026-08-12", weight=59.5))

    assert client.table_instance.rows == {
        "2026-08-11": {"date": "2026-08-11", "weight": 61.0},
        "2026-08-12": {"date": "2026-08-12", "weight": 59.5},
    }


def test_weight_response_contains_final_saved_record() -> None:
    saved = {
        "date": "2026-08-12",
        "weight": 60.5,
        "created_at": "2026-08-12T00:00:00+00:00",
        "updated_at": "2026-08-12T00:00:00+00:00",
    }
    assert final_weight_record(type("Result", (), {"data": [saved]})()) == saved
