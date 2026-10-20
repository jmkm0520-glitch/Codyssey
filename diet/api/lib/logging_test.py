"""Tests for redacted server error logs."""

from __future__ import annotations

import logging

from api.lib.logging import log_internal_error


def test_internal_error_log_omits_exception_message_and_user_input(caplog) -> None:
    sensitive_text = "SUPABASE_SERVICE_ROLE_KEY=do-not-log 음식내용"

    with caplog.at_level(logging.ERROR, logger="diet.api"):
        log_internal_error("meal.put", RuntimeError(sensitive_text))

    assert "context=meal.put" in caplog.text
    assert "error_type=RuntimeError" in caplog.text
    assert sensitive_text not in caplog.text
    assert "음식내용" not in caplog.text


def test_untrusted_log_context_is_replaced(caplog) -> None:
    with caplog.at_level(logging.ERROR, logger="diet.api"):
        log_internal_error("meal.put food=private", ValueError("private"))

    assert "context=unknown" in caplog.text
    assert "food=private" not in caplog.text
