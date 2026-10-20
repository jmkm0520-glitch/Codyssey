"""대화와 메시지 요청·응답 스키마."""

from datetime import datetime
from typing import Literal

from pydantic import Field

from backend.schemas.base import ApiModel


MessageRole = Literal["user", "assistant"]


class Message(ApiModel):
    role: MessageRole = Field(description="메시지 작성자")
    content: str = Field(
        min_length=1,
        max_length=4000,
        description="사용자 질문 또는 AI 답변",
    )
    created_at: datetime = Field(description="서버 기준 메시지 생성 시각")


class ConversationCreate(ApiModel):
    title: str = Field(
        default="새 대화",
        min_length=1,
        max_length=100,
        description="대화 목록에 표시할 제목",
    )
    messages: list[Message] = Field(
        default_factory=list,
        max_length=200,
        description="시간순 사용자·AI 메시지",
    )


class ConversationSummary(ApiModel):
    id: str = Field(min_length=1, description="Firestore 대화 문서 ID")
    title: str = Field(min_length=1, max_length=100, description="대화 제목")
    created_at: datetime = Field(description="서버 기준 대화 생성 시각")
    updated_at: datetime = Field(description="서버 기준 마지막 수정 시각")


class ConversationResponse(ConversationSummary):
    messages: list[Message] = Field(
        max_length=200,
        description="시간순 사용자·AI 메시지",
    )
