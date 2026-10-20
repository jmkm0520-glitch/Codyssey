"""9단계 대화 CRUD API 검증 — 실제 Firestore 대신 가짜 저장소를 사용한다."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from backend.core.deps import get_conversation_repository
from backend.main import app
from backend.repositories.conversation_repository import ConversationNotFoundError


class FakeConversationRepository:
    def __init__(self) -> None:
        self._docs: dict[str, dict] = {}
        self._next_id = 1

    def create(self, *, title: str, messages: list[dict]) -> dict:
        doc_id = f"conv-{self._next_id}"
        self._next_id += 1
        now = datetime.now(timezone.utc)
        record = {
            "id": doc_id,
            "title": title,
            "messages": messages,
            "created_at": now,
            "updated_at": now,
        }
        self._docs[doc_id] = record
        return record

    def list_summaries(self) -> list[dict]:
        ordered = sorted(
            self._docs.values(), key=lambda record: record["updated_at"], reverse=True
        )
        return [
            {
                "id": record["id"],
                "title": record["title"],
                "created_at": record["created_at"],
                "updated_at": record["updated_at"],
            }
            for record in ordered
        ]

    def get(self, doc_id: str) -> dict:
        if doc_id not in self._docs:
            raise ConversationNotFoundError(doc_id)
        return self._docs[doc_id]

    def delete(self, doc_id: str) -> None:
        if doc_id not in self._docs:
            raise ConversationNotFoundError(doc_id)
        del self._docs[doc_id]


@pytest.fixture
def client() -> TestClient:
    fake_repository = FakeConversationRepository()
    app.dependency_overrides[get_conversation_repository] = lambda: fake_repository
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_conversation_repository, None)


def message(role: str, content: str, *, offset_seconds: int = 0) -> dict:
    created_at = datetime.now(timezone.utc) + timedelta(seconds=offset_seconds)
    return {"role": role, "content": content, "created_at": created_at.isoformat()}


def test_create_conversation_derives_title_from_first_question(client: TestClient) -> None:
    response = client.post(
        "/api/conversations",
        json={
            "messages": [
                message("user", "최근 매출 추세가 어때?", offset_seconds=0),
                message("assistant", "최근 7일 매출이 늘었습니다.", offset_seconds=1),
            ]
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "최근 매출 추세가 어때?"
    assert [m["role"] for m in body["messages"]] == ["user", "assistant"]


def test_create_conversation_respects_explicit_title(client: TestClient) -> None:
    response = client.post("/api/conversations", json={"title": "12월 매출 확인", "messages": []})

    assert response.status_code == 201
    assert response.json()["title"] == "12월 매출 확인"


def test_list_conversations_orders_most_recently_updated_first(client: TestClient) -> None:
    import time

    client.post("/api/conversations", json={"title": "첫 대화", "messages": []})
    time.sleep(0.01)
    client.post("/api/conversations", json={"title": "두 번째 대화", "messages": []})

    response = client.get("/api/conversations")

    assert response.status_code == 200
    titles = [item["title"] for item in response.json()]
    assert titles == ["두 번째 대화", "첫 대화"]


def test_get_conversation_returns_messages_in_original_order(client: TestClient) -> None:
    create_response = client.post(
        "/api/conversations",
        json={
            "title": "순서 확인",
            "messages": [
                message("user", "첫 질문", offset_seconds=0),
                message("assistant", "첫 답변", offset_seconds=1),
                message("user", "두 번째 질문", offset_seconds=2),
            ],
        },
    )
    conversation_id = create_response.json()["id"]

    response = client.get(f"/api/conversations/{conversation_id}")

    assert response.status_code == 200
    contents = [m["content"] for m in response.json()["messages"]]
    assert contents == ["첫 질문", "첫 답변", "두 번째 질문"]


def test_get_missing_conversation_returns_404(client: TestClient) -> None:
    response = client.get("/api/conversations/없는-대화")

    assert response.status_code == 404
    assert response.json() == {
        "error": {"code": "HTTP_404", "message": "요청한 대화를 찾을 수 없습니다."}
    }


def test_delete_conversation_removes_it_from_list(client: TestClient) -> None:
    create_response = client.post("/api/conversations", json={"title": "지울 대화", "messages": []})
    conversation_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/conversations/{conversation_id}")
    list_response = client.get("/api/conversations")

    assert delete_response.status_code == 204
    assert list_response.json() == []


def test_delete_missing_conversation_returns_404(client: TestClient) -> None:
    response = client.delete("/api/conversations/없는-대화")

    assert response.status_code == 404
    assert response.json() == {
        "error": {"code": "HTTP_404", "message": "삭제하려는 대화를 찾을 수 없습니다."}
    }


def test_invalid_role_is_rejected_with_422(client: TestClient) -> None:
    response = client.post(
        "/api/conversations",
        json={"title": "잘못된 역할", "messages": [message("system", "허용되지 않음")]},
    )

    assert response.status_code == 422
