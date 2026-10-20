"""Tests for safe public API errors."""

from api.lib.response import internal_error_response, validation_error_response


def test_validation_error_is_understandable_and_does_not_echo_input() -> None:
    response = validation_error_response()

    assert response["error"] == {
        "code": "VALIDATION_ERROR",
        "message": "입력값을 확인한 뒤 다시 시도해 주세요.",
    }


def test_internal_error_does_not_expose_exception_details() -> None:
    assert internal_error_response()["error"] == {
        "code": "INTERNAL_ERROR",
        "message": "서버에서 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    }
