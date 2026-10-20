"""Tests for authentication cookie and public member helpers."""

from email.message import Message

import pytest

from api.authentication import requested_action
from api.lib.auth import (
    ACCESS_COOKIE,
    AuthenticationRequiredError,
    member_from_row,
    member_payload,
    session_from_auth_response,
)
from api.models.auth import EmailVerificationRequest


def test_member_payload_exposes_only_safe_profile_fields() -> None:
    member = member_from_row(
        {"id": "member-1", "email": "user@example.com", "display_name": "가벼운 하루"}
    )

    assert member_payload(member) == {
        "id": "member-1",
        "email": "user@example.com",
        "displayName": "가벼운 하루",
    }


def test_auth_response_requires_both_session_tokens() -> None:
    response = type("Response", (), {"session": None})()

    with pytest.raises(AuthenticationRequiredError):
        session_from_auth_response(response)


def test_access_cookie_name_is_server_specific() -> None:
    assert ACCESS_COOKIE == "diet_access_token"
    headers = Message()
    headers["Cookie"] = f"{ACCESS_COOKIE}=secret"
    assert (
        "secret"
        not in member_payload(
            member_from_row({"id": "1", "email": "a@example.com", "display_name": "A"})
        ).values()
    )


def test_email_verification_code_requires_exactly_six_digits() -> None:
    request = EmailVerificationRequest(email="user@example.com", token="123456")
    assert request.token == "123456"

    with pytest.raises(ValueError):
        EmailVerificationRequest(email="user@example.com", token="12345a")


def test_authentication_action_requires_exactly_one_value() -> None:
    assert requested_action("/api/authentication?action=login") == "login"
    assert requested_action("/api/authentication") == ""
    assert requested_action("/api/authentication?action=login&action=logout") == ""
