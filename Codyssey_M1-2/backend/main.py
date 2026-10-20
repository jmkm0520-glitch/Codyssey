"""온라인 쇼핑몰 매출 분석 AI FastAPI 애플리케이션."""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.core.config import load_settings
from backend.routers import api_router
from backend.schemas.catalog import add_schema_catalog
from backend.schemas.common import ErrorResponse, HealthResponse


APP_TITLE = "온라인 쇼핑몰 매출 분석 AI API"
APP_DESCRIPTION = "일별 매출 데이터 관리와 데이터 기반 AI 대화를 제공하는 백엔드 API"
APP_VERSION = "0.1.0"


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    payload = ErrorResponse(error={"code": code, "message": message})
    return JSONResponse(status_code=status_code, content=payload.model_dump())


def create_app() -> FastAPI:
    settings = load_settings(require_firebase=False, require_openai=False)
    application = FastAPI(
        title=APP_TITLE,
        description=APP_DESCRIPTION,
        version=APP_VERSION,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        _request: Request,
        _exc: RequestValidationError,
    ) -> JSONResponse:
        return _error_response(422, "VALIDATION_ERROR", "요청값을 확인해 주세요.")

    @application.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        _request: Request,
        exc: StarletteHTTPException,
    ) -> JSONResponse:
        generic_starlette_details = {"Not Found", "Method Not Allowed"}
        default_messages = {
            404: "요청한 주소를 찾을 수 없습니다.",
            405: "허용되지 않은 요청 방식입니다.",
        }
        if isinstance(exc.detail, str) and exc.detail not in generic_starlette_details:
            message = exc.detail
        else:
            message = default_messages.get(exc.status_code, "요청을 처리하지 못했습니다.")
        return _error_response(exc.status_code, f"HTTP_{exc.status_code}", message)

    @application.exception_handler(Exception)
    async def unexpected_exception_handler(
        _request: Request,
        _exc: Exception,
    ) -> JSONResponse:
        return _error_response(
            500,
            "INTERNAL_SERVER_ERROR",
            "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        )

    @application.get(
        "/health",
        response_model=HealthResponse,
        responses={500: {"model": ErrorResponse}},
        summary="서버 상태 확인",
        tags=["상태"],
    )
    def health_check() -> HealthResponse:
        return HealthResponse(status="ok", message="서버가 정상적으로 동작 중입니다.")

    application.include_router(api_router, tags=["API"])

    def custom_openapi() -> dict:
        if application.openapi_schema:
            return application.openapi_schema

        schema = get_openapi(
            title=application.title,
            version=application.version,
            description=application.description,
            routes=application.routes,
        )
        add_schema_catalog(schema)
        application.openapi_schema = schema
        return schema

    application.openapi = custom_openapi
    return application


app = create_app()
