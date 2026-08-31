"""라우터 구현 전에도 Swagger UI에 데이터 계약을 노출한다."""

from typing import Any

from pydantic import BaseModel

from backend.schemas.chat import ChatRequest, ChatResponse
from backend.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    ConversationSummary,
    Message,
)
from backend.schemas.data import DataCreate, DataResponse, DataUpdate, SummaryResponse


SCHEMA_MODELS: tuple[type[BaseModel], ...] = (
    DataCreate,
    DataUpdate,
    DataResponse,
    SummaryResponse,
    Message,
    ConversationCreate,
    ConversationSummary,
    ConversationResponse,
    ChatRequest,
    ChatResponse,
)


def add_schema_catalog(openapi_schema: dict[str, Any]) -> None:
    """아직 라우터에 연결되지 않은 5단계 스키마를 OpenAPI components에 추가한다."""

    schemas = openapi_schema.setdefault("components", {}).setdefault("schemas", {})
    for model in SCHEMA_MODELS:
        schema = model.model_json_schema(ref_template="#/components/schemas/{model}")
        schemas.update(schema.pop("$defs", {}))
        schemas[model.__name__] = schema
