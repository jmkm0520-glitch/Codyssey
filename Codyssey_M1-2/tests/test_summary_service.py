"""8단계 매출 요약 계산(`build_summary`) 검증."""

from datetime import date as Date
from datetime import timedelta

from backend.services.summary_service import build_summary


def make_records(values: list[float], *, start: Date = Date(2010, 12, 1)) -> list[dict]:
    return [
        {"date": (start + timedelta(days=i)).isoformat(), "value": value}
        for i, value in enumerate(values)
    ]


def test_empty_records_return_zeroed_summary_without_crashing() -> None:
    summary = build_summary([])

    assert summary.record_count == 0
    assert summary.period_start is None
    assert summary.period_end is None
    assert summary.total_sales == 0.0
    assert summary.trend == "insufficient_data"
    assert summary.recent_7d_average is None
    assert summary.change_rate is None


def test_totals_average_max_min_match_manual_calculation() -> None:
    values = [100.0, 300.0, 50.0, 200.0]
    summary = build_summary(make_records(values))

    assert summary.record_count == 4
    assert summary.total_sales == sum(values)
    assert summary.average_sales == round(sum(values) / len(values), 2)
    assert summary.max_sales == 300.0
    assert summary.max_sales_date == Date(2010, 12, 2)
    assert summary.min_sales == 50.0
    assert summary.min_sales_date == Date(2010, 12, 3)
    assert summary.period_start == Date(2010, 12, 1)
    assert summary.period_end == Date(2010, 12, 4)


def test_fewer_than_fourteen_records_is_insufficient_data() -> None:
    summary = build_summary(make_records([100.0] * 13))

    assert summary.record_count == 13
    assert summary.trend == "insufficient_data"
    assert summary.recent_7d_average is None
    assert summary.previous_7d_average is None
    assert summary.change_rate is None


def test_fourteen_records_with_higher_recent_week_is_increase() -> None:
    previous_week = [100.0] * 7
    recent_week = [200.0] * 7
    summary = build_summary(make_records(previous_week + recent_week))

    assert summary.previous_7d_average == 100.0
    assert summary.recent_7d_average == 200.0
    assert summary.trend == "increase"
    assert summary.change_rate == 100.0


def test_lower_recent_week_is_decrease() -> None:
    previous_week = [200.0] * 7
    recent_week = [100.0] * 7
    summary = build_summary(make_records(previous_week + recent_week))

    assert summary.trend == "decrease"
    assert summary.change_rate == -50.0


def test_equal_weeks_are_stable() -> None:
    summary = build_summary(make_records([150.0] * 14))

    assert summary.trend == "stable"
    assert summary.change_rate == 0.0


def test_zero_previous_average_does_not_divide_by_zero() -> None:
    previous_week = [0.0] * 7
    recent_week = [100.0] * 7
    summary = build_summary(make_records(previous_week + recent_week))

    assert summary.previous_7d_average == 0.0
    assert summary.change_rate is None
    assert summary.trend == "increase"


def test_both_weeks_zero_is_stable_with_zero_change_rate() -> None:
    summary = build_summary(make_records([0.0] * 14))

    assert summary.change_rate == 0.0
    assert summary.trend == "stable"


def test_monetary_values_are_rounded_to_two_decimals() -> None:
    values = [10.005, 20.001, 30.0, 40.0, 50.0, 60.0, 70.0] * 2
    summary = build_summary(make_records(values))

    assert summary.total_sales == round(sum(values), 2)
    assert summary.average_sales == round(sum(values) / len(values), 2)
