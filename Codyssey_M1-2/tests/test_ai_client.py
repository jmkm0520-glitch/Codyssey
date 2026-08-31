"""10단계 OpenAI 클라이언트(`backend/services/ai_client.py`) 검증."""

from types import SimpleNamespace

import httpx
import openai
import pytest

from backend.core.config import Settings, SettingsError
from backend.services.ai_client import (
    AiServiceError,
    MockChatClient,
    OpenAiChatClient,
    build_chat_client,
)


def make_settings(**overrides: object) -> Settings:
    base = dict(
        firebase_service_account_json=None,
        firebase_service_account_path=None,
        allowed_origins=("http://localhost:3000",),
        openai_api_key="test-virtual-key",
        openai_base_url="https://copa.codyssey.kr/v1",
        openai_model="gpt-5.4-mini",
        openai_max_output_tokens=500,
        openai_timeout_seconds=20.0,
        use_mock_ai=False,
        environment="development",
    )
    base.update(overrides)
    return Settings(**base)


def test_mock_client_returns_canned_answer_without_network() -> None:
    client = MockChatClient("고정 답변")

    answer = client.ask(system_prompt="p", messages=[{"role": "user", "content": "q"}])

    assert answer == "고정 답변"


def test_build_chat_client_returns_mock_when_enabled_in_development() -> None:
    settings = make_settings(use_mock_ai=True, environment="development")

    assert isinstance(build_chat_client(settings), MockChatClient)


def test_build_chat_client_ignores_mock_flag_in_production() -> None:
    settings = make_settings(use_mock_ai=True, environment="production")

    assert isinstance(build_chat_client(settings), OpenAiChatClient)


def test_build_chat_client_without_key_and_without_mock_raises_korean_error() -> None:
    settings = make_settings(use_mock_ai=False, openai_api_key=None)

    with pytest.raises(SettingsError, match="OpenAI API 키"):
        build_chat_client(settings)


def _fake_request() -> httpx.Request:
    return httpx.Request("POST", "https://copa.codyssey.kr/v1/chat/completions")


@pytest.mark.parametrize(
    ("raised_exception", "expected_phrase"),
    [
        (
            openai.AuthenticationError(
                "invalid api key", response=httpx.Response(401, request=_fake_request()), body=None
            ),
            "API 키가 올바르지 않습니다",
        ),
        (
            openai.RateLimitError(
                "rate limited", response=httpx.Response(429, request=_fake_request()), body=None
            ),
            "사용 한도를 초과했습니다",
        ),
        (openai.APITimeoutError(request=_fake_request()), "응답 시간이 너무 오래 걸려"),
        (openai.APIConnectionError(request=_fake_request()), "연결하지 못했습니다"),
    ],
)
def test_openai_errors_are_mapped_to_korean_messages(
    raised_exception: Exception, expected_phrase: str
) -> None:
    client = OpenAiChatClient(make_settings())

    def _raise(*_args: object, **_kwargs: object) -> None:
        raise raised_exception

    client._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=_raise))
    )

    with pytest.raises(AiServiceError, match=expected_phrase):
        client.ask(system_prompt="시스템", messages=[{"role": "user", "content": "질문"}])


def test_empty_answer_raises_ai_service_error() -> None:
    client = OpenAiChatClient(make_settings())

    def _empty_response(*_args: object, **_kwargs: object) -> SimpleNamespace:
        message = SimpleNamespace(content="   ")
        return SimpleNamespace(choices=[SimpleNamespace(message=message)])

    client._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=_empty_response))
    )

    with pytest.raises(AiServiceError, match="빈 응답"):
        client.ask(system_prompt="시스템", messages=[{"role": "user", "content": "질문"}])


def test_successful_call_returns_stripped_answer() -> None:
    client = OpenAiChatClient(make_settings())
    captured: dict = {}

    def _create(*, model: str, max_tokens: int, messages: list[dict]) -> SimpleNamespace:
        captured["model"] = model
        captured["max_tokens"] = max_tokens
        captured["messages"] = messages
        message = SimpleNamespace(content="  실제 매출 요약에 근거한 답변입니다.  ")
        return SimpleNamespace(choices=[SimpleNamespace(message=message)])

    client._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=_create))
    )

    answer = client.ask(
        system_prompt="매출 요약 안내문",
        messages=[{"role": "user", "content": "최근 매출 추세가 어때?"}],
    )

    assert answer == "실제 매출 요약에 근거한 답변입니다."
    assert captured["model"] == "gpt-5.4-mini"
    assert captured["max_tokens"] == 500
    assert captured["messages"][0] == {"role": "system", "content": "매출 요약 안내문"}
    assert captured["messages"][1] == {"role": "user", "content": "최근 매출 추세가 어때?"}
