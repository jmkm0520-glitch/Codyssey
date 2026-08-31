"""Firestore `data` 컬렉션 CRUD 저장소."""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date as Date
from datetime import datetime, timezone
from typing import Any

from google.cloud.firestore_v1.client import Client


COLLECTION_NAME = "data"

# Firestore 배치 쓰기는 최대 500건까지 허용하므로 여유를 두고 나눈다.
_UPSERT_BATCH_SIZE = 400


@dataclass(frozen=True)
class BulkUpsertResult:
    succeeded: int
    failed: int


class DataNotFoundError(Exception):
    """요청한 매출 문서가 없을 때 발생한다."""


class DataAlreadyExistsError(Exception):
    """이미 같은 날짜의 매출 문서가 있을 때 발생한다."""


class DataDateMismatchError(Exception):
    """문서 ID와 수정 요청의 날짜가 다를 때 발생한다."""


class DataRepository:
    """`data` 컬렉션에 값을 넣고 가져오는 코드를 한곳에 모은다.

    같은 날짜가 중복 저장되지 않도록 문서 ID로 `date`(YYYY-MM-DD)를 사용한다.
    """

    def __init__(self, client: Client) -> None:
        self._client = client
        self._collection = client.collection(COLLECTION_NAME)

    def create(self, *, date: Date, value: float, memo: str) -> dict[str, Any]:
        doc_id = date.isoformat()
        doc_ref = self._collection.document(doc_id)
        if doc_ref.get().exists:
            raise DataAlreadyExistsError(doc_id)

        now = datetime.now(timezone.utc)
        payload = {
            "date": doc_id,
            "value": value,
            "memo": memo,
            "created_at": now,
            "updated_at": now,
        }
        doc_ref.set(payload)
        return {"id": doc_id, **payload}

    def list_all(self) -> list[dict[str, Any]]:
        docs = self._collection.order_by("date").stream()
        return [{"id": doc.id, **doc.to_dict()} for doc in docs]

    def update(self, doc_id: str, *, date: Date, value: float, memo: str) -> dict[str, Any]:
        requested_doc_id = date.isoformat()
        if requested_doc_id != doc_id:
            raise DataDateMismatchError(f"{doc_id} != {requested_doc_id}")

        doc_ref = self._collection.document(doc_id)
        snapshot = doc_ref.get()
        if not snapshot.exists:
            raise DataNotFoundError(doc_id)

        changes = {
            "date": requested_doc_id,
            "value": value,
            "memo": memo,
            "updated_at": datetime.now(timezone.utc),
        }
        doc_ref.update(changes)
        return {"id": doc_id, **(snapshot.to_dict() | changes)}

    def delete(self, doc_id: str) -> None:
        doc_ref = self._collection.document(doc_id)
        if not doc_ref.get().exists:
            raise DataNotFoundError(doc_id)
        doc_ref.delete()

    def upsert_many(self, records: Sequence[tuple[Date, float, str]]) -> BulkUpsertResult:
        """CSV 등에서 읽은 여러 건을 배치로 저장한다.

        문서 ID가 `date`로 고정되어 있으므로 같은 명령을 다시 실행해도
        기존 문서를 덮어쓸 뿐 중복 문서가 생기지 않는다.
        """

        succeeded = 0
        failed = 0
        for start in range(0, len(records), _UPSERT_BATCH_SIZE):
            chunk = records[start : start + _UPSERT_BATCH_SIZE]
            batch = self._client.batch()
            now = datetime.now(timezone.utc)
            for record_date, value, memo in chunk:
                doc_ref = self._collection.document(record_date.isoformat())
                batch.set(
                    doc_ref,
                    {
                        "date": record_date.isoformat(),
                        "value": value,
                        "memo": memo,
                        "created_at": now,
                        "updated_at": now,
                    },
                )
            try:
                batch.commit()
                succeeded += len(chunk)
            except Exception:
                failed += len(chunk)

        return BulkUpsertResult(succeeded=succeeded, failed=failed)
