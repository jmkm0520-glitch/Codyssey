"""Safe logging helpers for serverless handlers."""

from __future__ import annotations

import logging
import re

logger = logging.getLogger("diet.api")
SAFE_CONTEXT = re.compile(r"^[a-z0-9_.-]{1,64}$")


def log_internal_error(context: str, error: BaseException) -> None:
    """Log only an allowlisted context and exception type, never values or messages."""

    safe_context = context if SAFE_CONTEXT.fullmatch(context) else "unknown"
    logger.error(
        "API internal error: context=%s error_type=%s",
        safe_context,
        type(error).__name__,
    )
