"""저장된 매출 문서로 `SummaryResponse`를 계산한다."""

from __future__ import annotations

from datetime import date as Date
from typing import Any

from backend.schemas.data import SummaryResponse


_RECENT_WINDOW = 7
_COMPARISON_MIN_RECORDS = _RECENT_WINDOW * 2

_EMPTY_SUMMARY = SummaryResponse(
    period_start=None,
    period_end=None,
    record_count=0,
    total_sales=0.0,
    average_sales=0.0,
    max_sales=None,
    max_sales_date=None,
    min_sales=None,
    min_sales_date=None,
    recent_7d_average=None,
    previous_7d_average=None,
    change_rate=None,
    trend="insufficient_data",
)


def _to_date(value: Date | str) -> Date:
    return value if isinstance(value, Date) else Date.fromisoformat(value)


def build_summary(records: list[dict[str, Any]]) -> SummaryResponse:
    """`data` 컬렉션 문서 목록에서 합계·평균·최대·최소·최근 추세를 계산한다."""

    if not records:
        return _EMPTY_SUMMARY

    ordered = sorted(records, key=lambda record: _to_date(record["date"]))
    dates = [_to_date(record["date"]) for record in ordered]
    values = [float(record["value"]) for record in ordered]
    count = len(ordered)

    total = sum(values)
    max_index = max(range(count), key=lambda i: values[i])
    min_index = min(range(count), key=lambda i: values[i])

    recent_7d_average: float | None = None
    previous_7d_average: float | None = None
    change_rate: float | None = None
    trend = "insufficient_data"

    if count >= _COMPARISON_MIN_RECORDS:
        recent_avg = sum(values[-_RECENT_WINDOW:]) / _RECENT_WINDOW
        previous_avg = sum(values[-_RECENT_WINDOW * 2 : -_RECENT_WINDOW]) / _RECENT_WINDOW
        recent_7d_average = round(recent_avg, 2)
        previous_7d_average = round(previous_avg, 2)

        if previous_avg == 0:
            if recent_avg == 0:
                change_rate, trend = 0.0, "stable"
            else:
                change_rate, trend = None, "increase"
        else:
            raw_change_rate = (recent_avg - previous_avg) / previous_avg * 100
            change_rate = round(raw_change_rate, 1)
            if raw_change_rate > 0:
                trend = "increase"
            elif raw_change_rate < 0:
                trend = "decrease"
            else:
                trend = "stable"

    return SummaryResponse(
        period_start=dates[0],
        period_end=dates[-1],
        record_count=count,
        total_sales=round(total, 2),
        average_sales=round(total / count, 2),
        max_sales=round(values[max_index], 2),
        max_sales_date=dates[max_index],
        min_sales=round(values[min_index], 2),
        min_sales_date=dates[min_index],
        recent_7d_average=recent_7d_average,
        previous_7d_average=previous_7d_average,
        change_rate=change_rate,
        trend=trend,
    )
