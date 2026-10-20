"""질문을 받아 AI 답변을 가져오고 대화를 자동 저장하는 채팅 API."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from backend.core.deps import get_ai_client, get_conversation_repository, get_data_repository
from backend.repositories.conversation_repository import ConversationRepository
from backend.repositories.data_repository import DataRepository
from backend.schemas.chat import ChatRequest, ChatResponse
from backend.schemas.common import ErrorResponse
from backend.services.ai_client import AiServiceError, ChatClient
from backend.services.chat_service import ChatConversationNotFoundError, handle_chat_request


router = APIRouter(prefix="/chat", tags=["채팅"])


@router.post(
    "",
    response_model=ChatResponse,
    responses={
        404: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    summary="AI에게 매출 관련 질문하기",
)
def create_chat_message(
    payload: ChatRequest,
    data_repository: DataRepository = Depends(get_data_repository),
    conversation_repository: ConversationRepository = Depends(get_conversation_repository),
    ai_client: ChatClient = Depends(get_ai_client),
) -> ChatResponse:
    try:
        return handle_chat_request(
            payload,
            data_repository=data_repository,
            conversation_repository=conversation_repository,
            ai_client=ai_client,
        )
    except ChatConversationNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail="이어가려는 대화를 찾을 수 없습니다.",
        ) from exc
    except AiServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
