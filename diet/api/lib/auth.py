"""Server-side Supabase Auth session and application-member helpers."""

from __future__ import annotations

from dataclasses import dataclass
from http.cookies import SimpleCookie
from typing import Any

from api.lib.supabase_client import get_supabase_client

ACCESS_COOKIE = "diet_access_token"
REFRESH_COOKIE = "diet_refresh_token"


class AuthenticationRequiredError(RuntimeError):
    pass


@dataclass(frozen=True)
class AuthenticatedMember:
    id: str
    email: str
    display_name: str


def _cookies(handler) -> SimpleCookie:
    cookies = SimpleCookie()
    cookies.load(handler.headers.get("Cookie", ""))
    return cookies


def _cookie_value(handler, name: str) -> str | None:
    morsel = _cookies(handler).get(name)
    return morsel.value if morsel else None


def require_member(handler) -> AuthenticatedMember:
    token = _cookie_value(handler, ACCESS_COOKIE)
    if not token:
        raise AuthenticationRequiredError

    try:
        user_response = get_supabase_client().auth.get_user(token)
        user = user_response.user
        if not user:
            raise AuthenticationRequiredError
        member_result = (
            get_supabase_client()
            .table("members")
            .select("id,email,display_name")
            .eq("id", str(user.id))
            .limit(1)
            .execute()
        )
        row = (member_result.data or [None])[0]
        if not row:
            raise AuthenticationRequiredError
        return AuthenticatedMember(**row)
    except AuthenticationRequiredError:
        raise
    except Exception as exc:
        raise AuthenticationRequiredError from exc


def member_payload(member: AuthenticatedMember) -> dict[str, str]:
    return {"id": member.id, "email": member.email, "displayName": member.display_name}


def member_from_row(row: dict) -> AuthenticatedMember:
    if not row:
        raise AuthenticationRequiredError
    return AuthenticatedMember(
        id=str(row["id"]), email=str(row["email"]), display_name=str(row["display_name"])
    )


def session_from_auth_response(response: Any) -> Any:
    session = getattr(response, "session", None)
    if not session or not session.access_token or not session.refresh_token:
        raise AuthenticationRequiredError
    return session


def set_session_cookies(handler, session: Any) -> None:
    secure = handler.headers.get("X-Forwarded-Proto", "").lower() == "https"
    suffix = "; Path=/; HttpOnly; SameSite=Lax" + ("; Secure" if secure else "")
    handler.send_header(
        "Set-Cookie",
        f"{ACCESS_COOKIE}={session.access_token}; Max-Age={session.expires_in}{suffix}",
    )
    handler.send_header(
        "Set-Cookie", f"{REFRESH_COOKIE}={session.refresh_token}; Max-Age=2592000{suffix}"
    )


def clear_session_cookies(handler) -> None:
    suffix = "; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
    handler.send_header("Set-Cookie", f"{ACCESS_COOKIE}={suffix}")
    handler.send_header("Set-Cookie", f"{REFRESH_COOKIE}={suffix}")
