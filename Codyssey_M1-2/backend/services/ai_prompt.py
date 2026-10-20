"""매출 요약을 AI 시스템 프롬프트로 바꾼다."""

from __future__ import annotations

from backend.schemas.data import SummaryResponse


_TREND_LABELS = {
    "increase": "증가",
    "decrease": "감소",
    "stable": "유지",
    "insufficient_data": "판단하기에 자료 부족",
}

_NO_DATA_PROMPT = """당신은 온라인 쇼핑몰의 매출을 설명하는 비서입니다.
아직 저장된 매출 데이터가 없습니다.
데이터가 없다는 사실을 한국어로 안내하고, 매출에 관한 추측이나 단정을 하지 마세요."""


def build_system_prompt(summary: SummaryResponse) -> str:
    """매출 요약을 근거로만 답하도록 AI에게 전달할 안내문을 만든다."""

    if summary.record_count == 0:
        return _NO_DATA_PROMPT

    trend_label = _TREND_LABELS[summary.trend]
    if summary.change_rate is not None:
        trend_line = f"최근 매출 추세: {trend_label} (최근 7일 대비 이전 7일 {summary.change_rate:+.1f}%)"
    else:
        trend_line = f"최근 매출 추세: {trend_label}"

    return f"""당신은 온라인 쇼핑몰의 매출을 설명하는 비서입니다.
아래는 실제 저장된 매출 데이터를 계산한 요약입니다. 이 요약을 근거로 한국어로 답하세요.
이 요약만으로 알 수 없는 내용은 추측해서 사실처럼 말하지 말고, 모른다고 답하세요.

- 데이터 기간: {summary.period_start} ~ {summary.period_end}
- 데이터 건수: {summary.record_count}건
- 총매출: {summary.total_sales:,.2f} GBP
- 평균 매출: {summary.average_sales:,.2f} GBP
- 최대 매출: {summary.max_sales:,.2f} GBP ({summary.max_sales_date})
- 최소 매출: {summary.min_sales:,.2f} GBP ({summary.min_sales_date})
- {trend_line}"""
