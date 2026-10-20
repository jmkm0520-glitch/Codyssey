"""Bulk-upsert diet data converted from the supported CSV format."""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler

from pydantic import ValidationError

from api.lib.auth import AuthenticationRequiredError, require_member
from api.lib.http import status_for_error_code
from api.lib.logging import log_internal_error
from api.lib.request import RequestBodyTooLargeError, UnsupportedMediaTypeError, read_json_body
from api.lib.response import (
    auth_required_response,
    internal_error_response,
    json_bytes,
    success_response,
    validation_error_response,
)
from api.lib.supabase_client import SupabaseConfigurationError, get_supabase_client
from api.models.import_data import ImportRequest


def _send_json(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json_bytes(payload)
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def import_rows(client, request: ImportRequest, member_id: str | None = None) -> dict[str, int]:
    weights = [
        {
            "date": row.date.isoformat(),
            "weight": row.weight,
            **({"member_id": member_id} if member_id is not None else {}),
        }
        for row in request.rows
        if row.weight is not None
    ]
    meals = [
        {
            "date": row.date.isoformat(),
            **meal.model_dump(mode="json"),
            **({"member_id": member_id} if member_id is not None else {}),
        }
        for row in request.rows
        for meal in row.meals
    ]
    if weights:
        client.table("weights").upsert(
            weights, on_conflict="member_id,date" if member_id is not None else "date"
        ).execute()
    if meals:
        client.table("meals").upsert(
            meals,
            on_conflict="member_id,date,meal" if member_id is not None else "date,meal",
        ).execute()
    return {"days": len(request.rows), "weights": len(weights), "meals": len(meals)}


class handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        try:
            request = ImportRequest.model_validate(
                json.loads(read_json_body(self, max_bytes=512 * 1024))
            )
        except (
            RequestBodyTooLargeError,
            UnsupportedMediaTypeError,
            json.JSONDecodeError,
            ValidationError,
            ValueError,
        ):
            _send_json(self, status_for_error_code("VALIDATION_ERROR"), validation_error_response())
            return
        try:
            member = require_member(self)
            _send_json(
                self,
                200,
                success_response(import_rows(get_supabase_client(), request, member.id)),
            )
        except AuthenticationRequiredError:
            _send_json(self, 401, auth_required_response())
        except SupabaseConfigurationError as error:
            log_internal_error("import_data.post", error)
            _send_json(self, 500, internal_error_response())
        except Exception as error:
            log_internal_error("import_data.post", error)
            _send_json(self, 500, internal_error_response())
