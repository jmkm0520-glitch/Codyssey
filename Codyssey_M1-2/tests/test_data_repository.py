"""7단계 배치 적재(`DataRepository.upsert_many`) 검증 — 가짜 Firestore 클라이언트를 사용한다."""

from datetime import date as Date
from datetime import timedelta

import pytest

from backend.repositories.data_repository import DataDateMismatchError, DataRepository


class FakeDocRef:
    def __init__(self, doc_id: str) -> None:
        self.id = doc_id


class FakeBatch:
    def __init__(self, store: dict[str, dict], *, should_fail: bool) -> None:
        self._store = store
        self._pending: dict[str, dict] = {}
        self._should_fail = should_fail

    def set(self, doc_ref: FakeDocRef, payload: dict) -> None:
        self._pending[doc_ref.id] = payload

    def commit(self) -> None:
        if self._should_fail:
            raise RuntimeError("firestore.googleapis.com 배치 저장 실패")
        self._store.update(self._pending)


class FakeCollection:
    def __init__(self, store: dict[str, dict]) -> None:
        self.store = store

    def document(self, doc_id: str) -> FakeDocRef:
        return FakeDocRef(doc_id)


class FakeClient:
    def __init__(self, *, fail_batch_indexes: set[int] | None = None) -> None:
        self.store: dict[str, dict] = {}
        self._fail_batch_indexes = fail_batch_indexes or set()
        self._batch_count = 0

    def collection(self, _name: str) -> FakeCollection:
        return FakeCollection(self.store)

    def batch(self) -> FakeBatch:
        index = self._batch_count
        self._batch_count += 1
        return FakeBatch(self.store, should_fail=index in self._fail_batch_indexes)


def make_records(count: int) -> list[tuple[Date, float, str]]:
    start = Date(2010, 12, 1)
    return [(start + timedelta(days=i), float(i), f"거래 {i}건") for i in range(count)]


def test_upsert_many_stores_records_keyed_by_date() -> None:
    client = FakeClient()
    repository = DataRepository(client)

    result = repository.upsert_many(make_records(3))

    assert result.succeeded == 3
    assert result.failed == 0
    assert set(client.store.keys()) == {"2010-12-01", "2010-12-02", "2010-12-03"}


def test_upsert_many_splits_large_input_into_batches() -> None:
    client = FakeClient()
    repository = DataRepository(client)

    result = repository.upsert_many(make_records(900))

    assert result.succeeded == 900
    assert client._batch_count == 3


def test_rerunning_upsert_many_does_not_duplicate_records() -> None:
    client = FakeClient()
    repository = DataRepository(client)
    records = make_records(5)

    repository.upsert_many(records)
    repository.upsert_many(records)

    assert len(client.store) == 5


def test_upsert_many_reports_failed_batches_without_raising() -> None:
    client = FakeClient(fail_batch_indexes={1})
    repository = DataRepository(client)

    result = repository.upsert_many(make_records(900))

    assert result.succeeded == 500
    assert result.failed == 400
    assert len(client.store) == 500


def test_update_rejects_date_that_differs_from_document_id() -> None:
    repository = DataRepository(FakeClient())

    with pytest.raises(DataDateMismatchError):
        repository.update(
            "2010-12-01",
            date=Date(2010, 12, 2),
            value=1000.0,
            memo="거래 1건",
        )
