"""기본 API 응답 스키마."""

from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: Literal["ok"] = Field(description="서버 상태")
    message: str = Field(description="상태 안내")


class ApiInfoResponse(BaseModel):
    name: str = Field(description="서비스 이름")
    version: str = Field(description="API 버전")


class ErrorDetail(BaseModel):
    code: str = Field(description="클라이언트가 구분할 오류 코드")
    message: str = Field(description="사용자에게 표시할 한국어 오류 안내")


class ErrorResponse(BaseModel):
    error: ErrorDetail
