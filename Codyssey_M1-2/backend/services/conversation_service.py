"""대화 제목 생성 등 대화 관련 비즈니스 로직."""

from __future__ import annotations

from backend.schemas.conversation import Message


DEFAULT_TITLE = "새 대화"
_TITLE_MAX_LENGTH = 40


def derive_title_from_text(content: str) -> str:
    """질문 문자열 하나로 대화 목록에 보여줄 제목을 만든다.

    빈 내용이면 기본 제목을 쓰고, 너무 길면 잘라서 말줄임표를 붙인다.
    """

    stripped = content.strip()
    if not stripped:
        return DEFAULT_TITLE
    if len(stripped) <= _TITLE_MAX_LENGTH:
        return stripped
    return stripped[:_TITLE_MAX_LENGTH].rstrip() + "..."


def derive_conversation_title(messages: list[Message]) -> str:
    """첫 사용자 질문으로 대화 목록에 보여줄 제목을 만든다."""

    first_user_message = next((message for message in messages if message.role == "user"), None)
    if first_user_message is None:
        return DEFAULT_TITLE
    return derive_title_from_text(first_user_message.content)
