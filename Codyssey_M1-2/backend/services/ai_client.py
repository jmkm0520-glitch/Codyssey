"""OpenAI 호환 API(코디세이 프록시) 호출을 한곳에 모은다."""

from __future__ import annotations

from typing import Protocol

import openai

from backend.core.config import Settings, SettingsError


class AiServiceError(RuntimeError):
    """AI 응답을 가져오지 못했을 때 사용자에게 보여줄 한국어 오류."""


class ChatClient(Protocol):
    def ask(self, *, system_prompt: str, messages: list[dict[str, str]]) -> str: ...


class OpenAiChatClient:
    """코디세이 API 콘솔이 제공하는 OpenAI 호환 엔드포인트를 호출한다."""

    def __init__(self, settings: Settings) -> None:
        self._model = settings.openai_model
        self._max_output_tokens = settings.openai_max_output_tokens
        self._client = openai.OpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            timeout=settings.openai_timeout_seconds,
        )

    def ask(self, *, system_prompt: str, messages: list[dict[str, str]]) -> str:
        try:
            response = self._client.chat.completions.create(
                model=self._model,
                max_tokens=self._max_output_tokens,
                messages=[{"role": "system", "content": system_prompt}, *messages],
            )
        except openai.AuthenticationError as exc:
            raise AiServiceError(
                "OpenAI API 키가 올바르지 않습니다. 코디세이 콘솔에서 발급받은 키를 다시 확인해 주세요."
            ) from exc
        except openai.RateLimitError as exc:
            raise AiServiceError(
                "AI 사용 한도를 초과했습니다. 잠시 후 다시 시도해 주세요."
            ) from exc
        except openai.APITimeoutError as exc:
            raise AiServiceError(
                "AI 응답 시간이 너무 오래 걸려 중단했습니다. 잠시 후 다시 시도해 주세요."
            ) from exc
        except openai.APIConnectionError as exc:
            raise AiServiceError(
                "AI 서버에 연결하지 못했습니다. 인터넷 연결 상태를 확인해 주세요."
            ) from exc
        except openai.OpenAIError as exc:
            raise AiServiceError(
                "AI 응답을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요."
            ) from exc

        answer = response.choices[0].message.content
        if not answer or not answer.strip():
            raise AiServiceError("AI가 빈 응답을 반환했습니다. 잠시 후 다시 시도해 주세요.")
        return answer.strip()


class MockChatClient:
    """개발·테스트에서 실제 OpenAI 대신 정해진 답을 돌려준다."""

    def __init__(self, canned_answer: str = "[Mock AI] 테스트용 가짜 응답입니다.") -> None:
        self._canned_answer = canned_answer

    def ask(self, *, system_prompt: str, messages: list[dict[str, str]]) -> str:
        return self._canned_answer


def build_chat_client(settings: Settings) -> ChatClient:
    """설정에 따라 실제 AI 또는 가짜 AI 클라이언트를 만든다.

    운영 환경에서는 `Settings.mock_ai_enabled`가 항상 거짓이므로 가짜 AI가 켜지지 않는다.
    """

    if settings.mock_ai_enabled:
        return MockChatClient()

    if not settings.openai_api_key:
        raise SettingsError(
            "OpenAI API 키가 없습니다. 코디세이 콘솔에서 발급받은 virtual key를 "
            "OPENAI_API_KEY에 설정해 주세요."
        )

    return OpenAiChatClient(settings)
