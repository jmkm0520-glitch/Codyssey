"""10단계 OpenAI 관련 환경설정(`backend/core/config.py`) 검증."""

from pathlib import Path

import pytest

from backend.core.config import SettingsError, load_settings


_NONEXISTENT_ENV_FILE = Path("/nonexistent/.env")
_OPENAI_ENV_KEYS = (
    "OPENAI_API_KEY",
    "OPENAI_BASE_URL",
    "OPENAI_MODEL",
    "OPENAI_MAX_OUTPUT_TOKENS",
    "OPENAI_TIMEOUT_SECONDS",
    "USE_MOCK_AI",
    "ENVIRONMENT",
)


@pytest.fixture(autouse=True)
def clean_openai_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in _OPENAI_ENV_KEYS:
        monkeypatch.delenv(key, raising=False)


def test_missing_openai_key_raises_korean_error_when_required() -> None:
    with pytest.raises(SettingsError, match="OpenAI API 키"):
        load_settings(_NONEXISTENT_ENV_FILE, require_firebase=False, require_openai=True)


def test_missing_openai_key_is_allowed_when_not_required() -> None:
    settings = load_settings(_NONEXISTENT_ENV_FILE, require_firebase=False, require_openai=False)

    assert settings.openai_api_key is None


def test_defaults_match_codyssey_console(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test-virtual-key")

    settings = load_settings(_NONEXISTENT_ENV_FILE, require_firebase=False, require_openai=True)

    assert settings.openai_base_url == "https://copa.codyssey.kr/v1"
    assert settings.openai_model == "gpt-5.4-mini"
    assert settings.openai_max_output_tokens == 500
    assert settings.openai_timeout_seconds == 20.0


def test_openai_settings_can_be_overridden(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test-virtual-key")
    monkeypatch.setenv("OPENAI_BASE_URL", "https://example.com/v1")
    monkeypatch.setenv("OPENAI_MODEL", "gpt-test")
    monkeypatch.setenv("OPENAI_MAX_OUTPUT_TOKENS", "100")
    monkeypatch.setenv("OPENAI_TIMEOUT_SECONDS", "5")

    settings = load_settings(_NONEXISTENT_ENV_FILE, require_firebase=False, require_openai=True)

    assert settings.openai_base_url == "https://example.com/v1"
    assert settings.openai_model == "gpt-test"
    assert settings.openai_max_output_tokens == 100
    assert settings.openai_timeout_seconds == 5.0


def test_invalid_max_output_tokens_raises_settings_error(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test-virtual-key")
    monkeypatch.setenv("OPENAI_MAX_OUTPUT_TOKENS", "not-a-number")

    with pytest.raises(SettingsError, match="OPENAI_MAX_OUTPUT_TOKENS"):
        load_settings(_NONEXISTENT_ENV_FILE, require_firebase=False, require_openai=True)


def test_zero_or_negative_timeout_raises_settings_error(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test-virtual-key")
    monkeypatch.setenv("OPENAI_TIMEOUT_SECONDS", "0")

    with pytest.raises(SettingsError, match="OPENAI_TIMEOUT_SECONDS"):
        load_settings(_NONEXISTENT_ENV_FILE, require_firebase=False, require_openai=True)


def test_mock_ai_enabled_in_development(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test-virtual-key")
    monkeypatch.setenv("USE_MOCK_AI", "true")
    monkeypatch.setenv("ENVIRONMENT", "development")

    settings = load_settings(_NONEXISTENT_ENV_FILE, require_firebase=False, require_openai=True)

    assert settings.mock_ai_enabled is True


def test_mock_ai_flag_is_ignored_in_production(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test-virtual-key")
    monkeypatch.setenv("USE_MOCK_AI", "true")
    monkeypatch.setenv("ENVIRONMENT", "production")

    settings = load_settings(_NONEXISTENT_ENV_FILE, require_firebase=False, require_openai=True)

    assert settings.mock_ai_enabled is False
