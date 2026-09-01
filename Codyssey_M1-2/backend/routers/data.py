"""매출 데이터 저장·조회·수정·삭제 API."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from backend.core.deps import get_data_repository
from backend.repositories.data_repository import (
    DataAlreadyExistsError,
    DataDateMismatchError,
    DataNotFoundError,
    DataRepository,
)
from backend.schemas.common import ErrorResponse
from backend.schemas.data import DataCreate, DataResponse, DataUpdate, SummaryResponse
from backend.services.summary_service import build_summary


router = APIRouter(prefix="/data", tags=["매출 데이터"])


@router.post(
    "",
    response_model=DataResponse,
    status_code=201,
    responses={
        409: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    summary="새 매출 저장",
)
def create_data(
    payload: DataCreate,
    repository: DataRepository = Depends(get_data_repository),
) -> DataResponse:
    try:
        record = repository.create(date=payload.date, value=payload.value, memo=payload.memo)
    except DataAlreadyExistsError as exc:
        raise HTTPException(
            status_code=409,
            detail="이미 해당 날짜의 매출 데이터가 있습니다.",
        ) from exc
    return DataResponse.model_validate(record)


@router.get(
    "",
    response_model=list[DataResponse],
    responses={500: {"model": ErrorResponse}},
    summary="매출 목록 조회",
)
def list_data(
    repository: DataRepository = Depends(get_data_repository),
) -> list[DataResponse]:
    records = repository.list_all()
    return [DataResponse.model_validate(record) for record in records]


@router.get(
    "/summary",
    response_model=SummaryResponse,
    responses={500: {"model": ErrorResponse}},
    summary="매출 요약 조회",
)
def get_summary(
    repository: DataRepository = Depends(get_data_repository),
) -> SummaryResponse:
    records = repository.list_all()
    return build_summary(records)


@router.get(
    "/{data_id}",
    response_model=DataResponse,
    responses={
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    summary="매출 단건 조회",
)
def get_data(
    data_id: str,
    repository: DataRepository = Depends(get_data_repository),
) -> DataResponse:
    try:
        record = repository.get(data_id)
    except DataNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail="요청한 매출 데이터를 찾을 수 없습니다.",
        ) from exc
    return DataResponse.model_validate(record)


@router.put(
    "/{data_id}",
    response_model=DataResponse,
    responses={
        409: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    summary="매출 수정",
)
def update_data(
    data_id: str,
    payload: DataUpdate,
    repository: DataRepository = Depends(get_data_repository),
) -> DataResponse:
    try:
        record = repository.update(
            data_id,
            date=payload.date,
            value=payload.value,
            memo=payload.memo,
        )
    except DataNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail="수정하려는 매출 데이터를 찾을 수 없습니다.",
        ) from exc
    except DataDateMismatchError as exc:
        raise HTTPException(
            status_code=409,
            detail="날짜는 매출 데이터의 식별자이므로 수정할 수 없습니다. 기존 데이터를 삭제한 뒤 새 날짜로 추가해 주세요.",
        ) from exc
    return DataResponse.model_validate(record)


@router.delete(
    "/{data_id}",
    status_code=204,
    responses={
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    summary="매출 삭제",
)
def delete_data(
    data_id: str,
    repository: DataRepository = Depends(get_data_repository),
) -> None:
    try:
        repository.delete(data_id)
    except DataNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail="삭제하려는 매출 데이터를 찾을 수 없습니다.",
        ) from exc
