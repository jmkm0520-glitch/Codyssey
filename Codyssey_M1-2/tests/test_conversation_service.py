"""9-8 대화 제목 생성 규칙(`derive_conversation_title`) 검증."""

from datetime import datetime, timezone

from backend.schemas.conversation import Message
from backend.services.conversation_service import DEFAULT_TITLE, derive_conversation_title


def make_message(role: str, content: str) -> Message:
    return Message(role=role, content=content, created_at=datetime.now(timezone.utc))


def test_no_messages_returns_default_title() -> None:
    assert derive_conversation_title([]) == DEFAULT_TITLE


def test_no_user_message_returns_default_title() -> None:
    messages = [make_message("assistant", "무엇을 도와드릴까요?")]

    assert derive_conversation_title(messages) == DEFAULT_TITLE


def test_short_first_user_question_becomes_title_as_is() -> None:
    messages = [make_message("user", "최근 매출 추세가 어때?")]

    assert derive_conversation_title(messages) == "최근 매출 추세가 어때?"


def test_long_first_user_question_is_truncated_with_ellipsis() -> None:
    long_question = "가" * 60
    messages = [make_message("user", long_question)]

    title = derive_conversation_title(messages)

    assert title == "가" * 40 + "..."
    assert len(title) == 43


def test_uses_first_user_message_even_if_assistant_replied_first() -> None:
    messages = [
        make_message("assistant", "안녕하세요."),
        make_message("user", "이번 달 매출은?"),
        make_message("assistant", "이번 달 매출은 100만원입니다."),
    ]

    assert derive_conversation_title(messages) == "이번 달 매출은?"
