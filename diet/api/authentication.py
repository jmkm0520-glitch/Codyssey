"""Serve every authentication action from one Vercel Function."""

import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

from pydantic import ValidationError

from api.lib.auth import (
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    _cookie_value,
    clear_session_cookies,
    member_from_row,
    member_payload,
    require_member,
    session_from_auth_response,
    set_session_cookies,
)
from api.lib.http import status_for_error_code
from api.lib.logging import log_internal_error
from api.lib.request import RequestBodyTooLargeError, UnsupportedMediaTypeError, read_json_body
from api.lib.response import (
    auth_required_response,
    error_response,
    internal_error_response,
    json_bytes,
    success_response,
    validation_error_response,
)
from api.lib.supabase_client import create_supabase_auth_client, get_supabase_client
from api.models.auth import (
    CredentialsRequest,
    EmailVerificationRequest,
    ResendVerificationRequest,
    SignupRequest,
)


def requested_action(path: str) -> str:
    values = parse_qs(urlparse(path).query).get("action", [])
    return values[0] if len(values) == 1 else ""


def _send(handler, status: int, payload: dict, session=None, clear=False) -> None:
    body = json_bytes(payload)
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    if session:
        set_session_cookies(handler, session)
    if clear:
        clear_session_cookies(handler)
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def _validated_body(handler, model):
    try:
        return model.model_validate(json.loads(read_json_body(handler)))
    except (
        RequestBodyTooLargeError,
        UnsupportedMediaTypeError,
        json.JSONDecodeError,
        ValidationError,
    ):
        _send(handler, 400, validation_error_response())
        return None


def _session(handler) -> None:
    try:
        _send(handler, 200, success_response(member_payload(require_member(handler))))
        return
    except Exception:
        refresh_token = _cookie_value(handler, REFRESH_COOKIE)
    if refresh_token:
        try:
            session = session_from_auth_response(
                create_supabase_auth_client().auth.refresh_session(refresh_token)
            )
            handler.headers["Cookie"] = f"{ACCESS_COOKIE}={session.access_token}"
            _send(
                handler,
                200,
                success_response(member_payload(require_member(handler))),
                session=session,
            )
            return
        except Exception:
            pass
    _send(handler, 401, auth_required_response(), clear=True)


def _login(handler) -> None:
    request = _validated_body(handler, CredentialsRequest)
    if request is None:
        return
    try:
        response = create_supabase_auth_client().auth.sign_in_with_password(
            request.model_dump(mode="json")
        )
        session = session_from_auth_response(response)
        result = (
            get_supabase_client()
            .table("members")
            .select("id,email,display_name")
            .eq("id", str(response.user.id))
            .limit(1)
            .execute()
        )
        row = (result.data or [None])[0]
        if not row:
            completed = (
                get_supabase_client()
                .rpc(
                    "complete_verified_member_signup",
                    {
                        "requested_user_id": str(response.user.id),
                        "requested_email": str(response.user.email),
                    },
                )
                .execute()
            )
            row = completed.data
            if isinstance(row, list):
                row = (row or [None])[0]
        _send(
            handler,
            200,
            success_response(member_payload(member_from_row(row))),
            session=session,
        )
    except Exception as error:
        if "invalid" in str(error).lower() or "credential" in str(error).lower():
            _send(
                handler,
                401,
                error_response("INVALID_CREDENTIALS", "이메일 또는 비밀번호를 확인해 주세요."),
            )
            return
        log_internal_error("auth.login", error)
        _send(handler, 500, internal_error_response())


def is_duplicate_signup(error: Exception) -> bool:
    """Detect the unique-constraint conflict raised when the email is taken.

    Supabase answers a repeat sign-up on a known address with a success, so the
    clash only surfaces when the signup claim is written. Without this branch it
    reaches the caller as a bare 500, which tells the person nothing.
    """

    code = str(getattr(error, "code", "") or "")
    if code in {"23505", "409"}:
        return True
    text = str(error).lower()
    return any(
        marker in text
        for marker in ("23505", "duplicate key", "already registered", "email_already_registered")
    )


def _signup(handler) -> None:
    request = _validated_body(handler, SignupRequest)
    if request is None:
        return
    try:
        created = create_supabase_auth_client().auth.sign_up(
            {"email": str(request.email), "password": request.password}
        )
        if not created.user:
            raise RuntimeError("Signup returned no user")
        get_supabase_client().rpc(
            "reserve_member_signup",
            {
                "requested_user_id": str(created.user.id),
                "requested_email": str(request.email),
                "requested_display_name": request.display_name,
            },
        ).execute()
        _send(
            handler,
            202,
            success_response({"email": str(request.email), "verificationRequired": True}),
        )
    except Exception as error:
        if is_duplicate_signup(error):
            _send(
                handler,
                status_for_error_code("MEMBER_EXISTS"),
                error_response(
                    "MEMBER_EXISTS",
                    "이미 가입에 사용된 이메일입니다. 로그인하거나, 인증이 끝나지 않았다면 "
                    "인증 메일을 다시 받아 주세요.",
                ),
            )
            return
        log_internal_error("auth.signup", error)
        _send(handler, 500, internal_error_response())


def _verify_email(handler) -> None:
    request = _validated_body(handler, EmailVerificationRequest)
    if request is None:
        return
    try:
        verified = create_supabase_auth_client().auth.verify_otp(
            {"email": str(request.email), "token": request.token, "type": "email"}
        )
        session = session_from_auth_response(verified)
        if not verified.user:
            raise RuntimeError("Email verification returned no user")
        result = (
            get_supabase_client()
            .rpc(
                "complete_verified_member_signup",
                {
                    "requested_user_id": str(verified.user.id),
                    "requested_email": str(request.email),
                },
            )
            .execute()
        )
        row = result.data
        if isinstance(row, list):
            row = (row or [None])[0]
        _send(
            handler,
            201,
            success_response(member_payload(member_from_row(row))),
            session=session,
        )
    except Exception as error:
        message = str(error)
        if "expired" in message.lower() or "invalid" in message.lower():
            _send(
                handler,
                400,
                error_response(
                    "INVALID_VERIFICATION_CODE",
                    "인증번호가 올바르지 않거나 만료되었습니다.",
                ),
            )
            return
        if "SIGNUP_CLAIM_NOT_FOUND" in message or "EMAIL_NOT_VERIFIED" in message:
            _send(
                handler,
                400,
                error_response(
                    "VERIFICATION_FAILED", "가입 대기 정보와 이메일 인증 상태를 확인해 주세요."
                ),
            )
            return
        log_internal_error("auth.verify_email", error)
        _send(handler, 500, internal_error_response())


def _resend_verification(handler) -> None:
    request = _validated_body(handler, ResendVerificationRequest)
    if request is None:
        return
    try:
        claim = (
            get_supabase_client()
            .table("member_signup_claims")
            .select("email")
            .eq("email", str(request.email).lower())
            .limit(1)
            .execute()
        )
        if claim.data:
            create_supabase_auth_client().auth.resend(
                {"type": "signup", "email": str(request.email)}
            )
        _send(handler, 202, success_response({"sent": True}))
    except Exception as error:
        if "rate" in str(error).lower():
            _send(
                handler,
                429,
                error_response("RATE_LIMITED", "잠시 후 인증 메일을 다시 요청해 주세요."),
            )
            return
        log_internal_error("auth.resend_verification", error)
        _send(handler, 500, internal_error_response())


class handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if requested_action(self.path) == "session":
            _session(self)
            return
        _send(self, 404, error_response("NOT_FOUND", "요청한 인증 기능을 찾을 수 없습니다."))

    def do_POST(self) -> None:
        action = requested_action(self.path)
        actions = {
            "login": _login,
            "signup": _signup,
            "verify_email": _verify_email,
            "resend_verification": _resend_verification,
        }
        if action == "logout":
            _send(self, 200, success_response({"loggedOut": True}), clear=True)
            return
        action_handler = actions.get(action)
        if action_handler:
            action_handler(self)
            return
        _send(self, 404, error_response("NOT_FOUND", "요청한 인증 기능을 찾을 수 없습니다."))
