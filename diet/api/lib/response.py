"""Common response envelopes for the Python API."""

from __future__ import annotations

import json
from typing import Any


def success_response(data: Any) -> dict[str, Any]:
    """Build the standard successful API response envelope."""

    return {"data": data, "error": None}


def error_response(code: str, message: str) -> dict[str, Any]:
    """Build the standard failed API response without exposing internals."""

    return {"data": None, "error": {"code": code, "message": message}}


def validation_error_response() -> dict[str, Any]:
    """Return one understandable validation message without echoing submitted values."""

    return error_response("VALIDATION_ERROR", "입력값을 확인한 뒤 다시 시도해 주세요.")


def internal_error_response() -> dict[str, Any]:
    """Return a safe public error without exposing exception details or secrets."""

    return error_response(
        "INTERNAL_ERROR", "서버에서 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
    )


def auth_required_response() -> dict[str, Any]:
    return error_response("AUTH_REQUIRED", "로그인이 필요합니다.")


def json_bytes(payload: dict[str, Any]) -> bytes:
    """Serialize an API response consistently and without unnecessary whitespace."""

    return json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
