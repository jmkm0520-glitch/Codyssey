"""매출 데이터 요청·응답 스키마."""

from datetime import date as Date
from datetime import datetime
from typing import Literal

from pydantic import Field

from backend.schemas.base import ApiModel


class DataCreate(ApiModel):
    date: Date = Field(description="매출 집계 날짜", examples=["2010-12-01"])
    value: float = Field(
        ge=0,
        allow_inf_nan=False,
        description="GBP 기준 일별 총매출",
        examples=[58635.56],
    )
    memo: str = Field(
        min_length=1,
        max_length=500,
        description="거래 건수와 판매 수량 요약",
        examples=["거래 127건, 판매 수량 2,685개"],
    )


class DataUpdate(DataCreate):
    """PUT 요청에서 사용하는 전체 수정 스키마."""


class DataResponse(DataCreate):
    id: str = Field(min_length=1, description="Firestore 문서 ID")
    created_at: datetime = Field(description="서버 기준 생성 시각")
    updated_at: datetime = Field(description="서버 기준 마지막 수정 시각")


class SummaryResponse(ApiModel):
    period_start: Date | None = Field(description="전체 데이터 시작일")
    period_end: Date | None = Field(description="전체 데이터 종료일")
    record_count: int = Field(ge=0, description="전체 데이터 건수")
    total_sales: float = Field(ge=0, allow_inf_nan=False, description="총매출")
    average_sales: float = Field(ge=0, allow_inf_nan=False, description="일평균 매출")
    max_sales: float | None = Field(ge=0, allow_inf_nan=False, description="최대 일매출")
    max_sales_date: Date | None = Field(description="최대 일매출 날짜")
    min_sales: float | None = Field(ge=0, allow_inf_nan=False, description="최소 일매출")
    min_sales_date: Date | None = Field(description="최소 일매출 날짜")
    recent_7d_average: float | None = Field(
        ge=0,
        allow_inf_nan=False,
        description="최근 7일 평균",
    )
    previous_7d_average: float | None = Field(
        ge=0,
        allow_inf_nan=False,
        description="이전 7일 평균",
    )
    change_rate: float | None = Field(
        allow_inf_nan=False,
        description="최근 7일과 이전 7일의 증감률(%)",
    )
    trend: Literal["increase", "decrease", "stable", "insufficient_data"] = Field(
        description="최근 매출 추세"
    )
