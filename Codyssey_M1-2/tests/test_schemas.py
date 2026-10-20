"""5단계 Pydantic 스키마와 HTTP 422 검증."""

from datetime import datetime, timezone

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

from backend.schemas.chat import ChatRequest
from backend.schemas.conversation import ConversationCreate, Message
from backend.schemas.data import DataCreate, DataUpdate


def valid_data() -> dict:
    return {
        "date": "2010-12-01",
        "value": 58635.56,
        "memo": "거래 127건, 판매 수량 2,685개",
    }


def test_data_create_and_update_accept_valid_values() -> None:
    created = DataCreate.model_validate(valid_data())
    updated = DataUpdate.model_validate(valid_data())

    assert created.date.isoformat() == "2010-12-01"
    assert updated.value == 58635.56


@pytest.mark.parametrize("invalid_date", ["2010-02-30", "2010-13-01", "not-a-date"])
def test_invalid_date_is_rejected(invalid_date: str) -> None:
    payload = valid_data() | {"date": invalid_date}

    with pytest.raises(ValidationError):
        DataCreate.model_validate(payload)


def test_negative_or_non_finite_sales_are_rejected() -> None:
    for invalid_value in (-0.01, float("inf"), float("nan")):
        with pytest.raises(ValidationError):
            DataCreate.model_validate(valid_data() | {"value": invalid_value})


def test_memo_max_length_is_enforced() -> None:
    with pytest.raises(ValidationError):
        DataCreate.model_validate(valid_data() | {"memo": "가" * 501})


@pytest.mark.parametrize("invalid_message", ["", "   ", "질문" * 501])
def test_empty_or_long_chat_message_is_rejected(invalid_message: str) -> None:
    with pytest.raises(ValidationError):
        ChatRequest(message=invalid_message)


def test_message_role_is_limited() -> None:
    now = datetime.now(timezone.utc)
    conversation = ConversationCreate(
        messages=[Message(role="user", content="매출을 알려줘.", created_at=now)]
    )

    assert conversation.messages[0].role == "user"
    with pytest.raises(ValidationError):
        Message(role="system", content="허용되지 않음", created_at=now)


validation_app = FastAPI()


@validation_app.post("/data")
def validate_data(payload: DataCreate) -> DataCreate:
    return payload


@validation_app.post("/chat")
def validate_chat(payload: ChatRequest) -> ChatRequest:
    return payload


validation_client = TestClient(validation_app)


@pytest.mark.parametrize(
    ("path", "payload"),
    [
        ("/data", valid_data() | {"date": "2010-02-30"}),
        ("/data", valid_data() | {"value": -1}),
        ("/chat", {"message": "   "}),
    ],
)
def test_invalid_api_input_returns_http_422(path: str, payload: dict) -> None:
    response = validation_client.post(path, json=payload)

    assert response.status_code == 422
