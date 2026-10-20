"""11단계 채팅 API(`POST /api/chat`) 검증 — 실제 Firestore/OpenAI 대신 가짜 구현을 사용한다."""

from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from backend.core.deps import get_ai_client, get_conversation_repository, get_data_repository
from backend.main import app
from backend.repositories.conversation_repository import ConversationNotFoundError
from backend.services.ai_client import AiServiceError


class FakeDataRepository:
    def __init__(self, records: list[dict] | None = None) -> None:
        self._records = records or []

    def list_all(self) -> list[dict]:
        return self._records


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

    def get(self, doc_id: str) -> dict:
        if doc_id not in self._docs:
            raise ConversationNotFoundError(doc_id)
        return self._docs[doc_id]

    def append_messages(self, doc_id: str, *, new_messages: list[dict]) -> dict:
        if doc_id not in self._docs:
            raise ConversationNotFoundError(doc_id)
        record = self._docs[doc_id]
        record = record | {
            "messages": record["messages"] + new_messages,
            "updated_at": datetime.now(timezone.utc),
        }
        self._docs[doc_id] = record
        return record


class FakeAiClient:
    def __init__(
        self, answer: str = "가짜 AI 답변입니다.", *, raise_error: Exception | None = None
    ) -> None:
        self._answer = answer
        self._raise_error = raise_error
        self.received_calls: list[dict] = []

    def ask(self, *, system_prompt: str, messages: list[dict]) -> str:
        self.received_calls.append({"system_prompt": system_prompt, "messages": messages})
        if self._raise_error is not None:
            raise self._raise_error
        return self._answer


def make_data_record(day: int, value: float) -> dict:
    return {"date": f"2010-12-{day:02d}", "value": value, "memo": f"거래 {day}건"}


@pytest.fixture
def deps():
    data_repo = FakeDataRepository([make_data_record(d, 100.0 * d) for d in range(1, 15)])
    conversation_repo = FakeConversationRepository()
    ai_client = FakeAiClient()

    app.dependency_overrides[get_data_repository] = lambda: data_repo
    app.dependency_overrides[get_conversation_repository] = lambda: conversation_repo
    app.dependency_overrides[get_ai_client] = lambda: ai_client
    try:
        yield SimpleNamespace(
            data_repo=data_repo,
            conversation_repo=conversation_repo,
            ai_client=ai_client,
            client=TestClient(app),
        )
    finally:
        for dependency in (get_data_repository, get_conversation_repository, get_ai_client):
            app.dependency_overrides.pop(dependency, None)


def test_new_chat_creates_conversation_and_returns_answer(deps) -> None:
    response = deps.client.post("/api/chat", json={"message": "최근 매출 추세가 어때?"})

    assert response.status_code == 200
    body = response.json()
    assert body["answer"] == "가짜 AI 답변입니다."
    assert body["conversation_id"] in deps.conversation_repo._docs

    stored = deps.conversation_repo._docs[body["conversation_id"]]
    assert stored["title"] == "최근 매출 추세가 어때?"
    assert [m["role"] for m in stored["messages"]] == ["user", "assistant"]
    assert stored["messages"][0]["content"] == "최근 매출 추세가 어때?"
    assert stored["messages"][1]["content"] == "가짜 AI 답변입니다."


def test_chat_sends_summary_in_system_prompt(deps) -> None:
    deps.client.post("/api/chat", json={"message": "요약 좀 알려줘"})

    system_prompt = deps.ai_client.received_calls[0]["system_prompt"]
    assert "비서" in system_prompt
    assert "한국어로 답하세요" in system_prompt


def test_chat_with_no_sales_data_uses_no_data_prompt() -> None:
    data_repo = FakeDataRepository([])
    conversation_repo = FakeConversationRepository()
    ai_client = FakeAiClient()
    app.dependency_overrides[get_data_repository] = lambda: data_repo
    app.dependency_overrides[get_conversation_repository] = lambda: conversation_repo
    app.dependency_overrides[get_ai_client] = lambda: ai_client
    try:
        client = TestClient(app)
        client.post("/api/chat", json={"message": "매출이 어때?"})
    finally:
        for dependency in (get_data_repository, get_conversation_repository, get_ai_client):
            app.dependency_overrides.pop(dependency, None)

    system_prompt = ai_client.received_calls[0]["system_prompt"]
    assert "데이터가 없" in system_prompt


def test_continuing_chat_appends_to_existing_conversation_in_order(deps) -> None:
    existing = deps.conversation_repo.create(
        title="이전 대화",
        messages=[
            {"role": "user", "content": "첫 질문", "created_at": datetime.now(timezone.utc)},
            {"role": "assistant", "content": "첫 답변", "created_at": datetime.now(timezone.utc)},
        ],
    )

    response = deps.client.post(
        "/api/chat",
        json={"message": "두 번째 질문", "conversation_id": existing["id"]},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["conversation_id"] == existing["id"]

    stored = deps.conversation_repo._docs[existing["id"]]
    contents = [m["content"] for m in stored["messages"]]
    assert contents == ["첫 질문", "첫 답변", "두 번째 질문", "가짜 AI 답변입니다."]

    ai_messages = deps.ai_client.received_calls[0]["messages"]
    assert [m["content"] for m in ai_messages] == ["첫 질문", "첫 답변", "두 번째 질문"]


def test_chat_with_missing_conversation_id_returns_404(deps) -> None:
    response = deps.client.post(
        "/api/chat",
        json={"message": "질문", "conversation_id": "없는-대화"},
    )

    assert response.status_code == 404
    assert response.json() == {
        "error": {"code": "HTTP_404", "message": "이어가려는 대화를 찾을 수 없습니다."}
    }
    assert deps.conversation_repo._docs == {}


def test_empty_message_is_rejected_with_422(deps) -> None:
    response = deps.client.post("/api/chat", json={"message": "   "})

    assert response.status_code == 422


def test_ai_failure_returns_502_and_saves_nothing(deps) -> None:
    deps.ai_client._raise_error = AiServiceError("AI 사용 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.")

    response = deps.client.post("/api/chat", json={"message": "실패해야 하는 질문"})

    assert response.status_code == 502
    assert response.json() == {
        "error": {
            "code": "HTTP_502",
            "message": "AI 사용 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
        }
    }
    assert deps.conversation_repo._docs == {}


def test_ai_failure_on_existing_conversation_does_not_modify_it(deps) -> None:
    existing = deps.conversation_repo.create(
        title="이전 대화",
        messages=[
            {"role": "user", "content": "첫 질문", "created_at": datetime.now(timezone.utc)},
        ],
    )
    deps.ai_client._raise_error = AiServiceError("AI 서버에 연결하지 못했습니다.")

    response = deps.client.post(
        "/api/chat",
        json={"message": "실패할 질문", "conversation_id": existing["id"]},
    )

    assert response.status_code == 502
    stored = deps.conversation_repo._docs[existing["id"]]
    assert len(stored["messages"]) == 1
