"""Return the diet and weight records for one requested calendar date."""

from __future__ import annotations

from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

from api.lib.auth import AuthenticationRequiredError, require_member
from api.lib.http import status_for_error_code
from api.lib.logging import log_internal_error
from api.lib.response import (
    auth_required_response,
    internal_error_response,
    json_bytes,
    success_response,
    validation_error_response,
)
from api.lib.supabase_client import SupabaseConfigurationError, get_supabase_client
from api.lib.validators import validate_date

MEAL_SLOTS = ("breakfast", "lunch", "dinner", "snack")


def build_meal_slots(records: list[dict]) -> dict[str, dict | None]:
    """Return all four meal slots, including slots without a saved record."""

    meals_by_slot: dict[str, dict | None] = {slot: None for slot in MEAL_SLOTS}
    for meal in records:
        slot = meal.get("meal")
        if slot in meals_by_slot:
            meals_by_slot[slot] = meal
    return meals_by_slot


def build_day_data(
    requested_date: str, meal_records: list[dict], weight_records: list[dict]
) -> dict:
    """Build a valid empty-day response when no records exist."""

    return {
        "date": requested_date,
        "weight": (weight_records or [None])[0],
        "meals": build_meal_slots(meal_records),
    }


def _send_json(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json_bytes(payload)
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def _requested_date(path: str) -> str:
    values = parse_qs(urlparse(path).query).get("date", [])
    if len(values) != 1:
        raise ValueError("date query parameter is required")
    return validate_date(values[0])


def delete_day_records(client, requested_date: str, member_id: str | None = None) -> dict:
    """Delete the weight and every meal saved for one calendar date."""

    meal_query = client.table("meals").delete()
    weight_query = client.table("weights").delete()
    if member_id is not None:
        meal_query = meal_query.eq("member_id", member_id)
        weight_query = weight_query.eq("member_id", member_id)
    meals = meal_query.eq("date", requested_date).execute()
    weights = weight_query.eq("date", requested_date).execute()
    return {
        "date": requested_date,
        "deletedMeals": len(meals.data or []),
        "deletedWeights": len(weights.data or []),
    }


class handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        try:
            requested_date = _requested_date(self.path)
        except ValueError:
            _send_json(
                self,
                status_for_error_code("VALIDATION_ERROR"),
                validation_error_response(),
            )
            return

        try:
            member = require_member(self)
            client = get_supabase_client()
            meals = (
                client.table("meals")
                .select("id,date,meal,food,type")
                .eq("member_id", member.id)
                .eq("date", requested_date)
                .execute()
            )
            weights = (
                client.table("weights")
                .select("date,weight")
                .eq("member_id", member.id)
                .eq("date", requested_date)
                .execute()
            )
            data = build_day_data(requested_date, meals.data or [], weights.data or [])
            _send_json(self, 200, success_response(data))
        except AuthenticationRequiredError:
            _send_json(self, 401, auth_required_response())
        except SupabaseConfigurationError as error:
            log_internal_error("day.get", error)
            _send_json(self, 500, internal_error_response())
        except Exception as error:
            log_internal_error("day.get", error)
            _send_json(self, 500, internal_error_response())

    def do_DELETE(self) -> None:
        try:
            requested_date = _requested_date(self.path)
        except ValueError:
            _send_json(
                self,
                status_for_error_code("VALIDATION_ERROR"),
                validation_error_response(),
            )
            return

        try:
            member = require_member(self)
            data = delete_day_records(get_supabase_client(), requested_date, member.id)
            _send_json(self, 200, success_response(data))
        except AuthenticationRequiredError:
            _send_json(self, 401, auth_required_response())
        except SupabaseConfigurationError as error:
            log_internal_error("day.delete", error)
            _send_json(self, 500, internal_error_response())
        except Exception as error:
            log_internal_error("day.delete", error)
            _send_json(self, 500, internal_error_response())
