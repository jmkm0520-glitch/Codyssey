"""Create the server-only Supabase client from environment variables."""

from __future__ import annotations

import os
from functools import lru_cache
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from supabase import Client


class SupabaseConfigurationError(RuntimeError):
    """Raised when the server cannot find the required Supabase settings."""


def _required_setting(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise SupabaseConfigurationError(f"Missing required server setting: {name}")
    return value


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Return one lazily initialized client without exposing secret values."""

    url = _required_setting("SUPABASE_URL")
    service_role_key = _required_setting("SUPABASE_SERVICE_ROLE_KEY")
    from supabase import create_client

    return create_client(url, service_role_key)


def create_supabase_auth_client() -> Client:
    """Create an isolated client for auth operations that mutate session state."""

    from supabase import create_client

    return create_client(
        _required_setting("SUPABASE_URL"),
        _required_setting("SUPABASE_SERVICE_ROLE_KEY"),
    )
