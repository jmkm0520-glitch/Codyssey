"""API 공통 진입점."""

from fastapi import APIRouter

from backend.routers.chat import router as chat_router
from backend.routers.conversations import router as conversations_router
from backend.routers.data import router as data_router
from backend.schemas.common import ApiInfoResponse, ErrorResponse


router = APIRouter(prefix="/api")
router.include_router(data_router)
router.include_router(conversations_router)
router.include_router(chat_router)


@router.get(
    "",
    response_model=ApiInfoResponse,
    responses={500: {"model": ErrorResponse}},
    summary="API 정보 확인",
)
def get_api_info() -> ApiInfoResponse:
    return ApiInfoResponse(name="온라인 쇼핑몰 매출 분석 AI API", version="0.1.0")
