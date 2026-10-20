"""7-1 CSV 읽기 로직 검증."""

from datetime import date as Date
from pathlib import Path

from scripts.load_sales_to_firestore import read_records


def test_read_records_parses_real_daily_sales_csv() -> None:
    csv_path = Path(__file__).resolve().parents[1] / "data" / "daily_sales.csv"

    records = read_records(csv_path)

    assert len(records) >= 100
    first_date, first_value, first_memo = records[0]
    assert isinstance(first_date, Date)
    assert first_value >= 0
    assert first_memo
