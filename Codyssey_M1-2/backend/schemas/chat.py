"""AI 채팅 요청·응답 스키마."""

from pydantic import Field

from backend.schemas.base import ApiModel


class ChatRequest(ApiModel):
    message: str = Field(
        min_length=1,
        max_length=1000,
        description="매출 데이터에 관해 사용자에게 받은 질문",
        examples=["최근 7일 매출 추세를 알려줘."],
    )
    conversation_id: str | None = Field(
        default=None,
        min_length=1,
        max_length=128,
        description="기존 대화를 이어갈 때 사용하는 문서 ID",
    )


class ChatResponse(ApiModel):
    answer: str = Field(
        min_length=1,
        max_length=4000,
        description="매출 요약을 근거로 생성한 AI 답변",
    )
    conversation_id: str = Field(
        min_length=1,
        max_length=128,
        description="저장된 대화 문서 ID",
    )
