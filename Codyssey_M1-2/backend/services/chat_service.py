"""질문 → 매출 요약 조회 → AI 호출 → 대화 자동 저장을 하나로 묶는다."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from backend.repositories.conversation_repository import (
    ConversationNotFoundError,
    ConversationRepository,
)
from backend.repositories.data_repository import DataRepository
from backend.schemas.chat import ChatRequest, ChatResponse
from backend.services.ai_client import ChatClient
from backend.services.ai_prompt import build_system_prompt
from backend.services.conversation_service import derive_title_from_text
from backend.services.summary_service import build_summary


class ChatConversationNotFoundError(Exception):
    """채팅 요청이 존재하지 않는 `conversation_id`를 가리킬 때 발생한다."""


def _history_as_ai_messages(conversation: dict[str, Any]) -> list[dict[str, str]]:
    return [
        {"role": message["role"], "content": message["content"]}
        for message in conversation.get("messages", [])
    ]


def handle_chat_request(
    payload: ChatRequest,
    *,
    data_repository: DataRepository,
    conversation_repository: ConversationRepository,
    ai_client: ChatClient,
) -> ChatResponse:
    summary = build_summary(data_repository.list_all())
    system_prompt = build_system_prompt(summary)

    history_messages: list[dict[str, str]] = []
    if payload.conversation_id is not None:
        try:
            conversation = conversation_repository.get(payload.conversation_id)
        except ConversationNotFoundError as exc:
            raise ChatConversationNotFoundError(payload.conversation_id) from exc
        history_messages = _history_as_ai_messages(conversation)

    # AI 호출이 실패하면 예외가 그대로 올라가 아무것도 저장하지 않는다.
    # 답변 없는 질문만 남겨두면 재시도 시 중복 저장과 혼란스러운 대화 기록을 만들기 때문이다.
    answer = ai_client.ask(
        system_prompt=system_prompt,
        messages=[*history_messages, {"role": "user", "content": payload.message}],
    )

    question_time = datetime.now(timezone.utc)
    answer_time = datetime.now(timezone.utc)
    new_messages = [
        {"role": "user", "content": payload.message, "created_at": question_time},
        {"role": "assistant", "content": answer, "created_at": answer_time},
    ]

    if payload.conversation_id is not None:
        conversation_repository.append_messages(payload.conversation_id, new_messages=new_messages)
        conversation_id = payload.conversation_id
    else:
        title = derive_title_from_text(payload.message)
        record = conversation_repository.create(title=title, messages=new_messages)
        conversation_id = record["id"]

    return ChatResponse(answer=answer, conversation_id=conversation_id)
