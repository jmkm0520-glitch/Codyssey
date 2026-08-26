"""UCI Online Retail 원본을 일별 매출 CSV로 변환한다."""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = PROJECT_ROOT / "data" / "Online Retail.xlsx"
DEFAULT_OUTPUT = PROJECT_ROOT / "data" / "daily_sales.csv"
REQUIRED_COLUMNS = (
    "InvoiceNo",
    "Description",
    "Quantity",
    "InvoiceDate",
    "UnitPrice",
    "Country",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="온라인 소매 거래를 일별 매출로 변환합니다.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="원본 XLSX 경로")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="결과 CSV 경로")
    return parser.parse_args()


def validate_columns(frame: pd.DataFrame) -> None:
    missing = [column for column in REQUIRED_COLUMNS if column not in frame.columns]
    if missing:
        raise ValueError(f"원본 파일에 필수 열이 없습니다: {', '.join(missing)}")


def preprocess(input_path: Path) -> tuple[pd.DataFrame, dict[str, int]]:
    if not input_path.is_file():
        raise FileNotFoundError(f"원본 파일을 찾을 수 없습니다: {input_path}")

    source = pd.read_excel(input_path, engine="openpyxl")
    validate_columns(source)
    source = source.loc[:, list(REQUIRED_COLUMNS)].copy()
    original_count = len(source)

    missing_mask = source.isna().any(axis=1)
    invoice_numbers = source["InvoiceNo"].astype("string")
    cancellation_mask = invoice_numbers.str.upper().str.startswith("C", na=False)
    invalid_quantity_mask = pd.to_numeric(source["Quantity"], errors="coerce").le(0)
    invalid_price_mask = pd.to_numeric(source["UnitPrice"], errors="coerce").le(0)

    valid_mask = ~(
        missing_mask | cancellation_mask | invalid_quantity_mask | invalid_price_mask
    )
    cleaned = source.loc[valid_mask].copy()
    cleaned["InvoiceDate"] = pd.to_datetime(cleaned["InvoiceDate"], errors="coerce")
    cleaned = cleaned.dropna(subset=["InvoiceDate"])
    cleaned["date"] = cleaned["InvoiceDate"].dt.date
    cleaned["sales"] = cleaned["Quantity"] * cleaned["UnitPrice"]

    daily = (
        cleaned.groupby("date", as_index=False)
        .agg(
            value=("sales", "sum"),
            transaction_count=("InvoiceNo", "nunique"),
            quantity=("Quantity", "sum"),
        )
        .sort_values("date", kind="stable")
        .reset_index(drop=True)
    )
    daily["value"] = daily["value"].round(2)
    daily["memo"] = daily.apply(
        lambda row: (
            f"거래 {int(row['transaction_count']):,}건, "
            f"판매 수량 {int(row['quantity']):,}개"
        ),
        axis=1,
    )
    result = daily.loc[:, ["date", "value", "memo"]]

    if len(result) < 100:
        raise ValueError(f"일별 데이터가 100건 미만입니다: {len(result)}건")
    if result["date"].duplicated().any():
        raise ValueError("결과에 중복 날짜가 있습니다.")
    if not result["date"].is_monotonic_increasing:
        raise ValueError("결과 날짜가 오름차순으로 정렬되지 않았습니다.")
    if result.isna().any().any():
        raise ValueError("결과에 결측값이 있습니다.")
    if result["value"].lt(0).any():
        raise ValueError("결과에 음수 매출이 있습니다.")

    stats = {
        "original": original_count,
        "missing": int(missing_mask.sum()),
        "cancellations": int(cancellation_mask.sum()),
        "invalid_quantity": int(invalid_quantity_mask.sum()),
        "invalid_price": int(invalid_price_mask.sum()),
        "cleaned": len(cleaned),
        "daily": len(result),
    }
    return result, stats


def main() -> None:
    args = parse_args()
    result, stats = preprocess(args.input.resolve())
    output_path = args.output.resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(output_path, index=False, encoding="utf-8", lineterminator="\n")

    print(f"원본 거래 행: {stats['original']:,}개")
    print(f"결측 제외 대상: {stats['missing']:,}개")
    print(f"취소 거래 제외 대상: {stats['cancellations']:,}개")
    print(f"수량 0 이하 제외 대상: {stats['invalid_quantity']:,}개")
    print(f"단가 0 이하 제외 대상: {stats['invalid_price']:,}개")
    print(f"정제 후 거래 행: {stats['cleaned']:,}개")
    print(f"일별 데이터: {stats['daily']:,}개")
    print(f"저장 위치: {output_path}")


if __name__ == "__main__":
    main()
