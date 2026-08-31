"""정리된 일별 매출 CSV를 Firestore `data` 컬렉션에 적재한다."""

from __future__ import annotations

import argparse
import csv
from datetime import date as Date
from pathlib import Path

from backend.core.config import SettingsError, load_settings
from backend.core.firebase import FirebaseInitializationError, get_firestore_client
from backend.repositories.data_repository import DataRepository


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = PROJECT_ROOT / "data" / "daily_sales.csv"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="일별 매출 CSV를 Firestore에 적재합니다.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="적재할 CSV 경로")
    return parser.parse_args()


def read_records(csv_path: Path) -> list[tuple[Date, float, str]]:
    if not csv_path.is_file():
        raise FileNotFoundError(f"CSV 파일을 찾을 수 없습니다: {csv_path}")

    with csv_path.open(newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        return [
            (Date.fromisoformat(row["date"]), float(row["value"]), row["memo"])
            for row in reader
        ]


def main() -> int:
    args = parse_args()

    try:
        settings = load_settings(require_firebase=True)
        client = get_firestore_client(settings)
    except (SettingsError, FirebaseInitializationError) as exc:
        print(f"Firebase 연결에 필요한 설정을 확인해 주세요: {exc}")
        return 1

    records = read_records(args.input.resolve())
    print(f"CSV에서 {len(records):,}건을 읽었습니다.")

    repository = DataRepository(client)
    result = repository.upsert_many(records)

    print(f"저장 성공: {result.succeeded:,}건")
    print(f"저장 실패: {result.failed:,}건")

    return 0 if result.failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
