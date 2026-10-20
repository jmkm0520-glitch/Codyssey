"""Tests for the authentication handler's error classification."""

from __future__ import annotations

import pytest

from api.authentication import is_duplicate_signup


class FakeApiError(Exception):
    """Stands in for the PostgREST error object, which carries a ``code``."""

    def __init__(self, message: str, code: str | None = None) -> None:
        super().__init__(message)
        self.code = code


@pytest.mark.parametrize(
    "error",
    [
        FakeApiError("conflict", code="23505"),
        FakeApiError("conflict", code="409"),
        FakeApiError('duplicate key value violates unique constraint "claims_email_key"'),
        FakeApiError("Email already registered"),
        Exception("23505"),
    ],
)
def test_a_taken_email_is_recognised_as_a_conflict(error: Exception) -> None:
    assert is_duplicate_signup(error) is True


@pytest.mark.parametrize(
    "error",
    [
        FakeApiError("connection refused"),
        FakeApiError("permission denied for table members", code="42501"),
        FakeApiError("SIGNUP_CLAIM_NOT_FOUND", code="P0001"),
        Exception("Signup returned no user"),
    ],
)
def test_an_unrelated_failure_is_left_alone(error: Exception) -> None:
    assert is_duplicate_signup(error) is False


def test_an_error_without_a_code_attribute_does_not_raise() -> None:
    assert is_duplicate_signup(Exception("something went wrong")) is False
