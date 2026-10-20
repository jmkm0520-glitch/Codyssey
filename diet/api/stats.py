"""Aggregate the signed-in member's recent meals into simple diet statistics.

The window is small by design — seven days hold at most 28 meal rows — so the
rows are fetched once and counted in Python instead of pushing a GROUP BY into
PostgREST. That keeps the rule visible in one readable function and makes it
directly testable without a database.
"""

from __future__ import annotations

from datetime import date as date_type
from datetime import timedelta
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
from api.lib.validators import app_today
from api.models.stats import StatsResponse

DEFAULT_DAYS = 7
MAX_DAYS = 90
MEAL_SLOTS = ("breakfast", "lunch", "dinner", "snack")


def _send_json(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json_bytes(payload)
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def requested_days(path: str) -> int:
    """Read the optional window size, defaulting to the last seven days."""

    values = parse_qs(urlparse(path).query).get("days", [])
    if not values:
        return DEFAULT_DAYS
    if len(values) != 1:
        raise ValueError("days query parameter must be given once")
    try:
        days = int(values[0])
    except ValueError as error:
        raise ValueError("days query parameter must be a whole number") from error
    if not 1 <= days <= MAX_DAYS:
        raise ValueError(f"days query parameter must be between 1 and {MAX_DAYS}")
    return days


def window_bounds(days: int) -> tuple[str, str]:
    """Return the inclusive ISO start and end of a window ending today."""

    end = app_today()
    start = end - timedelta(days=days - 1)
    return start.isoformat(), end.isoformat()


def previous_window_bounds(start: str, days: int) -> tuple[str, str]:
    """Return the window of the same length ending the day before ``start``."""

    end = date_type.fromisoformat(start) - timedelta(days=1)
    return (end - timedelta(days=days - 1)).isoformat(), end.isoformat()


def top_meal(meal_rows: list[dict]) -> str | None:
    """Return the most recorded meal slot, or None when nothing is recorded.

    Ties resolve by the order meals happen in a day, so the answer never
    depends on the order rows came back from the database.
    """

    counts = {slot: 0 for slot in MEAL_SLOTS}
    for row in meal_rows:
        slot = row.get("meal")
        if slot in counts and row.get("type") in ("clean", "free"):
            counts[slot] += 1
    best = max(counts.values())
    if best == 0:
        return None
    return next(slot for slot in MEAL_SLOTS if counts[slot] == best)


def count_meals(meal_rows: list[dict]) -> tuple[int, int]:
    """Return the clean and free totals, ignoring rows with an unknown type."""

    clean = sum(1 for row in meal_rows if row.get("type") == "clean")
    free = sum(1 for row in meal_rows if row.get("type") == "free")
    return clean, free


def clean_ratio(clean: int, total: int) -> int:
    """Return the clean share as a whole percent, and 0 when nothing is recorded."""

    if total <= 0:
        return 0
    return round(clean * 100 / total)


def window_dates(start: str, days: int) -> list[str]:
    """Return every ISO date in the window, so empty days still get a bar."""

    first = date_type.fromisoformat(start)
    return [(first + timedelta(days=offset)).isoformat() for offset in range(days)]


def build_stats(
    days: int,
    start: str,
    end: str,
    meal_rows: list[dict],
    previous_rows: list[dict] | None = None,
    weight_rows: list[dict] | None = None,
) -> dict:
    """Count the meals in one window, both in total and day by day.

    Rows carrying an unexpected ``type`` are left out of the counts rather than
    raising, so one malformed record cannot take the whole statistics screen
    down. Days without any record stay in ``daily`` with zeroes so a chart can
    show the gaps instead of hiding them.
    """

    per_day = {day: {"clean": 0, "free": 0} for day in window_dates(start, days)}
    clean = 0
    free = 0
    for row in meal_rows:
        meal_type = row.get("type")
        if meal_type not in ("clean", "free"):
            continue
        if meal_type == "clean":
            clean += 1
        else:
            free += 1
        counts = per_day.get(str(row.get("date")))
        if counts is not None:
            counts[meal_type] += 1

    weights = {str(row.get("date")): row.get("weight") for row in weight_rows or []}
    total = clean + free
    daily = [{"date": day, **counts, "weight": weights.get(day)} for day, counts in per_day.items()]
    previous_clean, previous_free = count_meals(previous_rows or [])
    previous_total = previous_clean + previous_free
    previous_ratio = clean_ratio(previous_clean, previous_total)
    current_ratio = clean_ratio(clean, total)
    payload = {
        "range": {"start": start, "end": end, "days": days},
        "total": total,
        "clean": clean,
        "free": free,
        "cleanRatio": current_ratio,
        "recordedDays": sum(1 for entry in daily if entry["clean"] or entry["free"]),
        "daily": daily,
        "topMeal": top_meal(meal_rows),
        "previous": {
            "total": previous_total,
            "clean": previous_clean,
            "free": previous_free,
            "cleanRatio": previous_ratio,
        },
        "cleanRatioDelta": current_ratio - previous_ratio if previous_total else 0,
    }
    return StatsResponse.model_validate(payload).model_dump(mode="json")


def empty_stats(days: int, start: str, end: str) -> dict:
    """Return a zeroed response so a failed aggregation still renders a screen."""

    return build_stats(days, start, end, [])


class handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        try:
            days = requested_days(self.path)
        except ValueError:
            _send_json(
                self,
                status_for_error_code("VALIDATION_ERROR"),
                validation_error_response(),
            )
            return

        try:
            member = require_member(self)
            start, end = window_bounds(days)
            previous_start, previous_end = previous_window_bounds(start, days)
            rows = (
                get_supabase_client()
                .table("meals")
                .select("date,meal,type")
                .eq("member_id", member.id)
                .gte("date", previous_start)
                .lte("date", end)
                .execute()
            ).data or []
            current = [row for row in rows if start <= str(row.get("date")) <= end]
            previous = [
                row for row in rows if previous_start <= str(row.get("date")) <= previous_end
            ]
            weights = (
                get_supabase_client()
                .table("weights")
                .select("date,weight")
                .eq("member_id", member.id)
                .gte("date", start)
                .lte("date", end)
                .execute()
            ).data or []
            _send_json(
                self,
                200,
                success_response(build_stats(days, start, end, current, previous, weights)),
            )
        except AuthenticationRequiredError:
            _send_json(self, 401, auth_required_response())
        except (SupabaseConfigurationError, ValidationError) as error:
            log_internal_error("stats.get", error)
            _send_json(self, 500, internal_error_response())
        except Exception as error:
            log_internal_error("stats.get", error)
            _send_json(self, 500, internal_error_response())
