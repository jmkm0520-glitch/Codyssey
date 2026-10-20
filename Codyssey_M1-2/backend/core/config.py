"""환경변수 기반 애플리케이션 설정."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit

from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[2]

# 코디세이 API 콘솔 문서 기준 기본값. OPENAI_BASE_URL/OPENAI_MODEL로 덮어쓸 수 있다.
_DEFAULT_OPENAI_BASE_URL = "https://copa.codyssey.kr/v1"
_DEFAULT_OPENAI_MODEL = "gpt-5.4-mini"
_DEFAULT_OPENAI_MAX_OUTPUT_TOKENS = 500
_DEFAULT_OPENAI_TIMEOUT_SECONDS = 20.0


class SettingsError(RuntimeError):
    """필수 환경 설정이 잘못되었을 때 발생한다."""


@dataclass(frozen=True)
class Settings:
    firebase_service_account_json: str | None
    firebase_service_account_path: Path | None
    allowed_origins: tuple[str, ...]
    openai_api_key: str | None
    openai_base_url: str
    openai_model: str
    openai_max_output_tokens: int
    openai_timeout_seconds: float
    use_mock_ai: bool
    environment: str

    @property
    def mock_ai_enabled(self) -> bool:
        """운영 환경에서는 가짜 AI 설정이 있어도 항상 무시한다."""

        return self.use_mock_ai and self.environment != "production"


def _parse_allowed_origins(value: str) -> tuple[str, ...]:
    origins = tuple(origin.strip().rstrip("/") for origin in value.split(",") if origin.strip())
    if not origins:
        raise SettingsError("ALLOWED_ORIGINS에 하나 이상의 프론트엔드 주소를 설정해 주세요.")

    for origin in origins:
        parsed = urlsplit(origin)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.path:
            raise SettingsError(
                "ALLOWED_ORIGINS에는 경로가 없는 http 또는 https 주소만 입력해 주세요."
            )

    return tuple(dict.fromkeys(origins))


def _parse_positive_int(value: str, name: str) -> int:
    try:
        parsed = int(value)
    except ValueError as exc:
        raise SettingsError(f"{name}에는 양의 정수를 입력해 주세요.") from exc
    if parsed <= 0:
        raise SettingsError(f"{name}에는 양의 정수를 입력해 주세요.")
    return parsed


def _parse_positive_float(value: str, name: str) -> float:
    try:
        parsed = float(value)
    except ValueError as exc:
        raise SettingsError(f"{name}에는 양수를 입력해 주세요.") from exc
    if parsed <= 0:
        raise SettingsError(f"{name}에는 양수를 입력해 주세요.")
    return parsed


def load_settings(
    env_file: Path | None = None,
    *,
    require_firebase: bool = True,
    require_openai: bool = True,
) -> Settings:
    """`.env`와 프로세스 환경변수에서 애플리케이션 설정을 읽고 검증한다."""

    load_dotenv(env_file or PROJECT_ROOT / ".env", override=False)

    account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip() or None
    account_path_value = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "").strip()
    account_path = Path(account_path_value).expanduser() if account_path_value else None

    if account_json and account_path:
        raise SettingsError(
            "Firebase 서비스 계정은 JSON 문자열과 파일 경로 중 한 방식만 설정해 주세요."
        )

    if require_firebase and not account_json and not account_path:
        raise SettingsError(
            "Firebase 서비스 계정 설정이 없습니다. "
            "FIREBASE_SERVICE_ACCOUNT_PATH 또는 FIREBASE_SERVICE_ACCOUNT_JSON을 설정해 주세요."
        )

    if account_path and not account_path.is_file():
        raise SettingsError(
            "Firebase 서비스 계정 파일을 찾을 수 없습니다. "
            "FIREBASE_SERVICE_ACCOUNT_PATH를 확인해 주세요."
        )

    allowed_origins = _parse_allowed_origins(
        os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        )
    )

    openai_api_key = os.getenv("OPENAI_API_KEY", "").strip() or None
    if require_openai and not openai_api_key:
        raise SettingsError(
            "OpenAI API 키가 없습니다. 코디세이 콘솔에서 발급받은 virtual key를 "
            "OPENAI_API_KEY에 설정해 주세요."
        )

    openai_base_url = os.getenv("OPENAI_BASE_URL", "").strip() or _DEFAULT_OPENAI_BASE_URL
    openai_model = os.getenv("OPENAI_MODEL", "").strip() or _DEFAULT_OPENAI_MODEL
    openai_max_output_tokens = _parse_positive_int(
        os.getenv("OPENAI_MAX_OUTPUT_TOKENS", str(_DEFAULT_OPENAI_MAX_OUTPUT_TOKENS)),
        "OPENAI_MAX_OUTPUT_TOKENS",
    )
    openai_timeout_seconds = _parse_positive_float(
        os.getenv("OPENAI_TIMEOUT_SECONDS", str(_DEFAULT_OPENAI_TIMEOUT_SECONDS)),
        "OPENAI_TIMEOUT_SECONDS",
    )
    use_mock_ai = os.getenv("USE_MOCK_AI", "false").strip().lower() == "true"
    environment = os.getenv("ENVIRONMENT", "development").strip().lower() or "development"

    return Settings(
        firebase_service_account_json=account_json,
        firebase_service_account_path=account_path,
        allowed_origins=allowed_origins,
        openai_api_key=openai_api_key,
        openai_base_url=openai_base_url,
        openai_model=openai_model,
        openai_max_output_tokens=openai_max_output_tokens,
        openai_timeout_seconds=openai_timeout_seconds,
        use_mock_ai=use_mock_ai,
        environment=environment,
    )
