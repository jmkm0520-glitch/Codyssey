"""6단계 매출 CRUD API 검증 — 실제 Firestore 대신 가짜 저장소를 사용한다."""

from datetime import date as Date
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from backend.core.deps import get_data_repository
from backend.main import app
from backend.repositories.data_repository import (
    DataAlreadyExistsError,
    DataDateMismatchError,
    DataNotFoundError,
)


class FakeDataRepository:
    def __init__(self) -> None:
        self._docs: dict[str, dict] = {}

    def create(self, *, date: Date, value: float, memo: str) -> dict:
        doc_id = date.isoformat()
        if doc_id in self._docs:
            raise DataAlreadyExistsError(doc_id)

        now = datetime.now(timezone.utc)
        record = {
            "id": doc_id,
            "date": doc_id,
            "value": value,
            "memo": memo,
            "created_at": now,
            "updated_at": now,
        }
        self._docs[doc_id] = record
        return record

    def list_all(self) -> list[dict]:
        return sorted(self._docs.values(), key=lambda record: record["date"])

    def update(self, doc_id: str, *, date: Date, value: float, memo: str) -> dict:
        if doc_id not in self._docs:
            raise DataNotFoundError(doc_id)
        if date.isoformat() != doc_id:
            raise DataDateMismatchError(f"{doc_id} != {date.isoformat()}")

        record = self._docs[doc_id] | {
            "date": date.isoformat(),
            "value": value,
            "memo": memo,
            "updated_at": datetime.now(timezone.utc),
        }
        self._docs[doc_id] = record
        return record

    def delete(self, doc_id: str) -> None:
        if doc_id not in self._docs:
            raise DataNotFoundError(doc_id)
        del self._docs[doc_id]


@pytest.fixture
def client() -> TestClient:
    fake_repository = FakeDataRepository()
    app.dependency_overrides[get_data_repository] = lambda: fake_repository
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_data_repository, None)


def payload(**overrides: object) -> dict:
    base = {"date": "2010-12-01", "value": 58635.56, "memo": "거래 127건, 판매 수량 2,685개"}
    return base | overrides


def test_create_then_list_returns_sorted_records(client: TestClient) -> None:
    client.post("/api/data", json=payload(date="2010-12-03"))
    client.post("/api/data", json=payload(date="2010-12-01"))
    client.post("/api/data", json=payload(date="2010-12-02"))

    response = client.get("/api/data")

    assert response.status_code == 200
    dates = [item["date"] for item in response.json()]
    assert dates == ["2010-12-01", "2010-12-02", "2010-12-03"]


def test_create_sets_id_and_timestamps(client: TestClient) -> None:
    response = client.post("/api/data", json=payload())

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == "2010-12-01"
    assert body["created_at"] == body["updated_at"]


def test_duplicate_date_is_rejected(client: TestClient) -> None:
    client.post("/api/data", json=payload())
    response = client.post("/api/data", json=payload())

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "HTTP_409"


def test_update_changes_value_and_memo(client: TestClient) -> None:
    client.post("/api/data", json=payload())

    response = client.put(
        "/api/data/2010-12-01",
        json=payload(value=1000.0, memo="거래 1건, 판매 수량 10개"),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["value"] == 1000.0
    assert body["memo"] == "거래 1건, 판매 수량 10개"


def test_update_missing_record_returns_404(client: TestClient) -> None:
    response = client.put("/api/data/없는-날짜", json=payload())

    assert response.status_code == 404
    assert response.json() == {
        "error": {"code": "HTTP_404", "message": "수정하려는 매출 데이터를 찾을 수 없습니다."}
    }


def test_update_rejects_date_change(client: TestClient) -> None:
    client.post("/api/data", json=payload())

    response = client.put(
        "/api/data/2010-12-01",
        json=payload(date="2010-12-02"),
    )

    assert response.status_code == 409
    assert response.json()["error"]["message"].startswith("날짜는 매출 데이터의 식별자")


def test_delete_removes_record(client: TestClient) -> None:
    client.post("/api/data", json=payload())

    delete_response = client.delete("/api/data/2010-12-01")
    list_response = client.get("/api/data")

    assert delete_response.status_code == 204
    assert list_response.json() == []


def test_delete_missing_record_returns_404(client: TestClient) -> None:
    response = client.delete("/api/data/없는-날짜")

    assert response.status_code == 404
    assert response.json() == {
        "error": {"code": "HTTP_404", "message": "삭제하려는 매출 데이터를 찾을 수 없습니다."}
    }


def test_invalid_value_returns_422_before_reaching_repository(client: TestClient) -> None:
    response = client.post("/api/data", json=payload(value=-1))

    assert response.status_code == 422


def test_summary_with_no_data_returns_zeroed_response(client: TestClient) -> None:
    response = client.get("/api/data/summary")

    assert response.status_code == 200
    body = response.json()
    assert body["record_count"] == 0
    assert body["trend"] == "insufficient_data"
    assert body["period_start"] is None


def test_summary_reflects_stored_records(client: TestClient) -> None:
    for day in range(1, 15):
        client.post(
            "/api/data",
            json=payload(date=f"2010-12-{day:02d}", value=100.0 if day <= 7 else 200.0),
        )

    response = client.get("/api/data/summary")

    assert response.status_code == 200
    body = response.json()
    assert body["record_count"] == 14
    assert body["period_start"] == "2010-12-01"
    assert body["period_end"] == "2010-12-14"
    assert body["previous_7d_average"] == 100.0
    assert body["recent_7d_average"] == 200.0
    assert body["trend"] == "increase"
    assert body["change_rate"] == 100.0


def test_firestore_failure_hides_internal_details() -> None:
    class BrokenRepository:
        def list_all(self) -> list[dict]:
            raise ConnectionError("firestore.googleapis.com 연결 실패: internal debug info")

    app.dependency_overrides[get_data_repository] = lambda: BrokenRepository()
    try:
        response = TestClient(app, raise_server_exceptions=False).get("/api/data")
    finally:
        app.dependency_overrides.pop(get_data_repository, None)

    assert response.status_code == 500
    body = response.json()
    assert body["error"]["code"] == "INTERNAL_SERVER_ERROR"
    assert "firestore" not in body["error"]["message"].lower()
    assert body["error"]["message"] == "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
