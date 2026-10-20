"""Save one breakfast, lunch, dinner, or snack record for a calendar date."""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler
from typing import cast
from urllib.parse import parse_qs, urlparse

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
from api.lib.validators import validate_date
from api.models.meal import Meal, MealUpsertRequest


def _send_json(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json_bytes(payload)
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def upsert_meal(client, request: MealUpsertRequest, member_id: str | None = None):
    """Save the requested meal, replacing its date-and-meal slot when it exists."""

    payload = request.model_dump(mode="json")
    if member_id is not None:
        payload["member_id"] = member_id
    return (
        client.table("meals")
        .upsert(
            payload,
            on_conflict="member_id,date,meal" if member_id is not None else "date,meal",
        )
        .execute()
    )


def final_meal_record(result) -> dict:
    """Extract the saved meal record for the standard API response."""

    saved = (result.data or [None])[0]
    if not saved:
        raise RuntimeError("Meal upsert returned no saved record")
    return saved


def requested_date(path: str) -> str:
    """Read one valid date from a meal deletion request URL."""

    values = parse_qs(urlparse(path).query).get("date", [])
    if len(values) != 1:
        raise ValueError("date query parameter is required")
    return validate_date(values[0])


def requested_meal(path: str) -> Meal | None:
    """Read an optional single meal slot; omit it to delete every slot for the date."""

    values = parse_qs(urlparse(path).query).get("meal", [])
    if not values:
        return None
    if len(values) != 1 or values[0] not in {"breakfast", "lunch", "dinner", "snack"}:
        raise ValueError("meal query parameter must be a valid meal slot")
    return cast(Meal, values[0])


def delete_meals_for_date(
    client, date: str, meal: Meal | None = None, member_id: str | None = None
):
    """Delete all meal slots for a date, or one requested meal slot."""

    query = client.table("meals").delete()
    if member_id is not None:
        query = query.eq("member_id", member_id)
    query = query.eq("date", date)
    if meal is not None:
        query = query.eq("meal", meal)
    return query.execute()


class handler(BaseHTTPRequestHandler):
    def do_PUT(self) -> None:
        try:
            payload = json.loads(read_json_body(self))
            request = MealUpsertRequest.model_validate(payload)
        except (
            RequestBodyTooLargeError,
            UnsupportedMediaTypeError,
            json.JSONDecodeError,
            ValidationError,
            ValueError,
        ):
            _send_json(
                self,
                status_for_error_code("VALIDATION_ERROR"),
                validation_error_response(),
            )
            return

        try:
            member = require_member(self)
            result = upsert_meal(get_supabase_client(), request, member.id)
            _send_json(self, 200, success_response(final_meal_record(result)))
        except AuthenticationRequiredError:
            _send_json(self, 401, auth_required_response())
        except SupabaseConfigurationError as error:
            log_internal_error("meal.put", error)
            _send_json(self, 500, internal_error_response())
        except Exception as error:
            log_internal_error("meal.put", error)
            _send_json(self, 500, internal_error_response())

    def do_DELETE(self) -> None:
        try:
            date = requested_date(self.path)
            meal = requested_meal(self.path)
        except ValueError:
            _send_json(
                self,
                status_for_error_code("VALIDATION_ERROR"),
                validation_error_response(),
            )
            return

        try:
            member = require_member(self)
            result = delete_meals_for_date(get_supabase_client(), date, meal, member.id)
            _send_json(
                self,
                200,
                success_response({"date": date, "deleted": len(result.data or [])}),
            )
        except AuthenticationRequiredError:
            _send_json(self, 401, auth_required_response())
        except SupabaseConfigurationError as error:
            log_internal_error("meal.delete", error)
            _send_json(self, 500, internal_error_response())
        except Exception as error:
            log_internal_error("meal.delete", error)
            _send_json(self, 500, internal_error_response())
