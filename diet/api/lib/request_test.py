"""Tests for bounded JSON request handling."""

from __future__ import annotations

from io import BytesIO

import pytest

from api.lib.request import (
    RequestBodyTooLargeError,
    UnsupportedMediaTypeError,
    read_json_body,
)


class FakeHandler:
    def __init__(self, body: bytes, content_type: str = "application/json") -> None:
        self.headers = {"Content-Type": content_type, "Content-Length": str(len(body))}
        self.rfile = BytesIO(body)


def test_json_body_is_read_only_with_the_expected_content_type() -> None:
    assert read_json_body(FakeHandler(b'{"weight":60}')) == b'{"weight":60}'


def test_non_json_content_type_is_rejected() -> None:
    with pytest.raises(UnsupportedMediaTypeError):
        read_json_body(FakeHandler(b"weight=60", "application/x-www-form-urlencoded"))


def test_oversized_body_is_rejected_before_it_is_read() -> None:
    handler = FakeHandler(b"{}")
    handler.headers["Content-Length"] = "65537"

    with pytest.raises(RequestBodyTooLargeError):
        read_json_body(handler)
