"""Return calendar cells for one requested month."""

from __future__ import annotations

from calendar import monthrange
from datetime import date
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

from pydantic import ValidationError

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
from api.models.calendar import CalendarMonthResponse


def _send_json(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json_bytes(payload)
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def requested_month(path: str) -> tuple[int, int]:
    """Read one valid year and month from the calendar URL query string."""

    query = parse_qs(urlparse(path).query)
    year_values = query.get("year", [])
    month_values = query.get("month", [])
    if len(year_values) != 1 or len(month_values) != 1:
        raise ValueError("year and month query parameters are required")
    try:
        year, month = int(year_values[0]), int(month_values[0])
    except ValueError as exc:
        raise ValueError("year and month must be numbers") from exc
    if not 1 <= year <= 9999 or not 1 <= month <= 12:
        raise ValueError("year or month is outside the supported range")
    return year, month


def month_date_strings(year: int, month: int) -> list[str]:
    """Return every ISO calendar date in the selected month."""

    days_in_month = monthrange(year, month)[1]
    return [date(year, month, day).isoformat() for day in range(1, days_in_month + 1)]


def month_bounds(year: int, month: int) -> tuple[str, str]:
    """Return inclusive ISO start and end dates for a selected calendar month."""

    days = month_date_strings(year, month)
    return days[0], days[-1]


def meal_status(types: list[str]) -> str | None:
    """Return free first, otherwise clean only when all recorded meals are clean."""

    if "free" in types:
        return "free"
    if types and all(type == "clean" for type in types):
        return "clean"
    return None


def build_calendar_month(
    year: int, month: int, weight_rows: list[dict], meal_rows: list[dict]
) -> dict:
    """Build all calendar cells from the month's weight and meal records in one response."""

    weights_by_date = {str(row["date"]): row["weight"] for row in weight_rows}
    meals_by_date: dict[str, list[str]] = {}
    for meal in meal_rows:
        meals_by_date.setdefault(str(meal["date"]), []).append(str(meal["type"]))
    payload = {
        "year": year,
        "month": month,
        "days": [
            {
                "date": day,
                "weight": weights_by_date.get(day),
                "status": meal_status(meals_by_date.get(day, [])),
            }
            for day in month_date_strings(year, month)
        ],
    }
    return CalendarMonthResponse.model_validate(payload).model_dump(mode="json")


class handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        try:
            year, month = requested_month(self.path)
        except ValueError:
            _send_json(
                self,
                status_for_error_code("VALIDATION_ERROR"),
                validation_error_response(),
            )
            return

        try:
            start_date, end_date = month_bounds(year, month)
            member = require_member(self)
            client = get_supabase_client()
            weights = (
                client.table("weights")
                .select("date,weight")
                .eq("member_id", member.id)
                .gte("date", start_date)
                .lte("date", end_date)
                .execute()
            )
            meals = (
                client.table("meals")
                .select("date,type")
                .eq("member_id", member.id)
                .gte("date", start_date)
                .lte("date", end_date)
                .execute()
            )
            _send_json(
                self,
                200,
                success_response(
                    build_calendar_month(year, month, weights.data or [], meals.data or [])
                ),
            )
        except AuthenticationRequiredError:
            _send_json(self, 401, auth_required_response())
        except (SupabaseConfigurationError, ValidationError) as error:
            log_internal_error("calendar.get", error)
            _send_json(self, 500, internal_error_response())
        except Exception as error:
            log_internal_error("calendar.get", error)
            _send_json(self, 500, internal_error_response())
