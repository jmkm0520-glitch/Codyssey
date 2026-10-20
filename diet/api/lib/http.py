"""HTTP status conventions shared by API handlers."""

from __future__ import annotations

ERROR_STATUS_CODES = {
    "VALIDATION_ERROR": 400,
    "BAD_REQUEST": 400,
    "NOT_FOUND": 404,
    "AUTH_REQUIRED": 401,
    "INVALID_CREDENTIALS": 401,
    "MEMBER_EXISTS": 409,
    "SIGNUP_RESERVED": 409,
    "INTERNAL_ERROR": 500,
}


def status_for_error_code(code: str) -> int:
    """Return the public HTTP status for an API error code."""

    return ERROR_STATUS_CODES.get(code, 500)
