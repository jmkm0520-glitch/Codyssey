"""AI 대화 저장·조회·삭제 API."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from backend.core.deps import get_conversation_repository
from backend.repositories.conversation_repository import (
    ConversationNotFoundError,
    ConversationRepository,
)
from backend.schemas.common import ErrorResponse
from backend.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    ConversationSummary,
)
from backend.services.conversation_service import DEFAULT_TITLE, derive_conversation_title


router = APIRouter(prefix="/conversations", tags=["대화"])


@router.post(
    "",
    response_model=ConversationResponse,
    status_code=201,
    responses={422: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="새 대화 저장",
)
def create_conversation(
    payload: ConversationCreate,
    repository: ConversationRepository = Depends(get_conversation_repository),
) -> ConversationResponse:
    title = payload.title
    if title == DEFAULT_TITLE:
        title = derive_conversation_title(payload.messages)

    messages = [
        {"role": message.role, "content": message.content, "created_at": message.created_at}
        for message in payload.messages
    ]
    record = repository.create(title=title, messages=messages)
    return ConversationResponse.model_validate(record)


@router.get(
    "",
    response_model=list[ConversationSummary],
    responses={500: {"model": ErrorResponse}},
    summary="대화 목록 조회",
)
def list_conversations(
    repository: ConversationRepository = Depends(get_conversation_repository),
) -> list[ConversationSummary]:
    records = repository.list_summaries()
    return [ConversationSummary.model_validate(record) for record in records]


@router.get(
    "/{conversation_id}",
    response_model=ConversationResponse,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="대화 상세 조회",
)
def get_conversation(
    conversation_id: str,
    repository: ConversationRepository = Depends(get_conversation_repository),
) -> ConversationResponse:
    try:
        record = repository.get(conversation_id)
    except ConversationNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail="요청한 대화를 찾을 수 없습니다.",
        ) from exc
    return ConversationResponse.model_validate(record)


@router.delete(
    "/{conversation_id}",
    status_code=204,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="대화 삭제",
)
def delete_conversation(
    conversation_id: str,
    repository: ConversationRepository = Depends(get_conversation_repository),
) -> None:
    try:
        repository.delete(conversation_id)
    except ConversationNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail="삭제하려는 대화를 찾을 수 없습니다.",
        ) from exc
