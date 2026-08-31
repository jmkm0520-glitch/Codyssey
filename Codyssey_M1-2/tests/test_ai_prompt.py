"""10-5~10-7 매출 요약 → 시스템 프롬프트 변환 검증."""

from datetime import date as Date

from backend.schemas.data import SummaryResponse
from backend.services.ai_prompt import build_system_prompt


def make_summary(**overrides: object) -> SummaryResponse:
    base = dict(
        period_start=Date(2010, 12, 1),
        period_end=Date(2011, 12, 9),
        record_count=305,
        total_sales=10666684.54,
        average_sales=34972.74,
        max_sales=200920.6,
        max_sales_date=Date(2011, 12, 9),
        min_sales=3457.11,
        min_sales_date=Date(2011, 2, 6),
        recent_7d_average=83799.35,
        previous_7d_average=52071.11,
        change_rate=60.9,
        trend="increase",
    )
    base.update(overrides)
    return SummaryResponse(**base)


def test_no_data_prompt_tells_ai_not_to_guess() -> None:
    summary = make_summary(
        record_count=0,
        period_start=None,
        period_end=None,
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

    prompt = build_system_prompt(summary)

    assert "데이터가 없" in prompt
    assert "추측" in prompt


def test_prompt_includes_role_and_korean_instructions() -> None:
    prompt = build_system_prompt(make_summary())

    assert "비서" in prompt
    assert "한국어로 답하세요" in prompt
    assert "모른다고 답하세요" in prompt


def test_prompt_includes_key_metrics_matching_summary() -> None:
    summary = make_summary()

    prompt = build_system_prompt(summary)

    assert "2010-12-01" in prompt
    assert "2011-12-09" in prompt
    assert "305건" in prompt
    assert "10,666,684.54" in prompt
    assert "200,920.60" in prompt
    assert "3,457.11" in prompt
    assert "증가" in prompt
    assert "+60.9%" in prompt


def test_prompt_reports_insufficient_history_without_percentage() -> None:
    summary = make_summary(
        recent_7d_average=None,
        previous_7d_average=None,
        change_rate=None,
        trend="insufficient_data",
    )

    prompt = build_system_prompt(summary)

    assert "판단하기에 자료 부족" in prompt
    assert "%" not in prompt.splitlines()[-1]
