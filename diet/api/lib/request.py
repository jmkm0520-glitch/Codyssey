"""Shared request safeguards for Python API handlers."""

from __future__ import annotations

from http.server import BaseHTTPRequestHandler

MAX_BODY_BYTES = 64 * 1024


class RequestBodyTooLargeError(ValueError):
    """Raised when a request body exceeds the API limit."""


class UnsupportedMediaTypeError(ValueError):
    """Raised when a JSON endpoint receives another content type."""


def read_json_body(handler: BaseHTTPRequestHandler, max_bytes: int = MAX_BODY_BYTES) -> bytes:
    """Read a bounded request body without allocating untrusted amounts of memory."""

    content_type = handler.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
    if content_type != "application/json":
        raise UnsupportedMediaTypeError("Content-Type must be application/json")

    raw_length = handler.headers.get("Content-Length", "0")
    try:
        content_length = int(raw_length)
    except ValueError as exc:
        raise RequestBodyTooLargeError("Content-Length must be a valid number") from exc

    if content_length < 0 or content_length > max_bytes:
        raise RequestBodyTooLargeError(f"Request body must be {max_bytes} bytes or smaller")

    body = handler.rfile.read(content_length)
    if len(body) != content_length:
        raise RequestBodyTooLargeError("Request body could not be read completely")
    return body
