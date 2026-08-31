"""Firestore `conversations` 컬렉션 CRUD 저장소."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from google.cloud import firestore
from google.cloud.firestore_v1.client import Client


COLLECTION_NAME = "conversations"


class ConversationNotFoundError(Exception):
    """요청한 대화 문서가 없을 때 발생한다."""


class ConversationRepository:
    """`conversations` 컬렉션에 대화를 넣고 가져오는 코드를 한곳에 모은다."""

    def __init__(self, client: Client) -> None:
        self._collection = client.collection(COLLECTION_NAME)

    def create(self, *, title: str, messages: list[dict[str, Any]]) -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        doc_ref = self._collection.document()
        payload = {
            "title": title,
            "messages": messages,
            "created_at": now,
            "updated_at": now,
        }
        doc_ref.set(payload)
        return {"id": doc_ref.id, **payload}

    def list_summaries(self) -> list[dict[str, Any]]:
        docs = self._collection.order_by(
            "updated_at", direction=firestore.Query.DESCENDING
        ).stream()
        return [
            {
                "id": doc.id,
                "title": data.get("title"),
                "created_at": data.get("created_at"),
                "updated_at": data.get("updated_at"),
            }
            for doc in docs
            for data in [doc.to_dict()]
        ]

    def get(self, doc_id: str) -> dict[str, Any]:
        snapshot = self._collection.document(doc_id).get()
        if not snapshot.exists:
            raise ConversationNotFoundError(doc_id)
        return {"id": snapshot.id, **snapshot.to_dict()}

    def delete(self, doc_id: str) -> None:
        doc_ref = self._collection.document(doc_id)
        if not doc_ref.get().exists:
            raise ConversationNotFoundError(doc_id)
        doc_ref.delete()

    def append_messages(
        self, doc_id: str, *, new_messages: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """이어지는 대화 뒤에 새 질문·답변을 순서대로 붙인다."""

        doc_ref = self._collection.document(doc_id)
        snapshot = doc_ref.get()
        if not snapshot.exists:
            raise ConversationNotFoundError(doc_id)

        existing = snapshot.to_dict()
        changes = {
            "messages": existing.get("messages", []) + new_messages,
            "updated_at": datetime.now(timezone.utc),
        }
        doc_ref.update(changes)
        return {"id": doc_id, **(existing | changes)}
