"""2025년 서울 일별 기온 분석 스크립트.

Meteostat에서 내려받은 서울 일별 기온 데이터를 불러와 분석합니다.
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "seoul_47108_2025_daily.csv"
IMAGES_DIR = BASE_DIR / "images"
REQUIRED_COLUMNS = ["date", "temp", "tmin", "tmax"]
TEMPERATURE_COLUMNS = ["temp", "tmin", "tmax"]
MIN_REASONABLE_TEMP = -30
MAX_REASONABLE_TEMP = 45


def load_data() -> pd.DataFrame:
    """CSV 파일을 불러와 DataFrame으로 반환한다."""
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"데이터 파일을 찾을 수 없습니다: {DATA_PATH}")

    data = pd.read_csv(DATA_PATH)
    return data


def create_date_column(data: pd.DataFrame) -> pd.DataFrame:
    """연·월·일 컬럼을 pandas 날짜 자료형인 date 컬럼으로 합친다."""
    data = data.copy()
    data["date"] = pd.to_datetime(data[["year", "month", "day"]])
    return data


def sort_by_date(data: pd.DataFrame) -> pd.DataFrame:
    """데이터를 날짜 오름차순으로 정렬하고 인덱스를 다시 매긴다."""
    return data.sort_values("date").reset_index(drop=True)


def clean_temperature_data(data: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """정한 기준에 따라 분석용 기온 데이터를 정제하고 결과를 반환한다."""
    before_count = len(data)
    required_missing_mask = data[REQUIRED_COLUMNS].isna().any(axis=1)
    duplicate_date_mask = data.duplicated(subset=["date"], keep="first")
    logical_error_mask = (
        (data["tmax"] < data["tmin"])
        | (data["temp"] < data["tmin"])
        | (data["temp"] > data["tmax"])
    )
    range_error_mask = (
        data[TEMPERATURE_COLUMNS].lt(MIN_REASONABLE_TEMP).any(axis=1)
        | data[TEMPERATURE_COLUMNS].gt(MAX_REASONABLE_TEMP).any(axis=1)
    )

    remove_mask = (
        required_missing_mask
        | duplicate_date_mask
        | logical_error_mask
        | range_error_mask
    )
    cleaned = data.loc[~remove_mask].copy().reset_index(drop=True)
    summary = {
        "before_count": before_count,
        "required_missing": int(required_missing_mask.sum()),
        "duplicate_dates": int(duplicate_date_mask.sum()),
        "logical_errors": int(logical_error_mask.sum()),
        "range_errors": int(range_error_mask.sum()),
        "after_count": len(cleaned),
    }
    return cleaned, summary


def calculate_time_series_metrics(
    data: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """이동평균, 월별 평균, 일교차, 전일 대비 변화량을 계산한다."""
    data = data.copy()
    data["temp_ma7"] = data["temp"].rolling(window=7, min_periods=7).mean()
    data["daily_range"] = data["tmax"] - data["tmin"]
    data["temp_change"] = data["temp"].diff()

    monthly_stats = (
        data.groupby("month", as_index=False)
        .agg(
            monthly_avg_temp=("temp", "mean"),
            monthly_avg_range=("daily_range", "mean"),
        )
    )
    return data, monthly_stats


def find_extreme_days(data: pd.DataFrame) -> dict[str, pd.Series]:
    """최고·최저기온과 전일 대비 변화량의 극값 날짜를 찾는다."""
    return {
        "hottest": data.loc[data["tmax"].idxmax()],
        "coldest": data.loc[data["tmin"].idxmin()],
        "largest_rise": data.loc[data["temp_change"].idxmax()],
        "largest_drop": data.loc[data["temp_change"].idxmin()],
    }


def save_visualizations(data: pd.DataFrame, monthly_stats: pd.DataFrame) -> None:
    """분석 결과 그래프 3개를 images 폴더에 PNG로 저장한다."""
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    plt.style.use("seaborn-v0_8-whitegrid")

    # 그래프 1: 일평균기온과 7일 이동평균
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.plot(
        data["date"],
        data["temp"],
        color="#9AA0A6",
        linewidth=1,
        alpha=0.65,
        label="Daily mean temperature",
    )
    ax.plot(
        data["date"],
        data["temp_ma7"],
        color="#D1495B",
        linewidth=2.3,
        label="7-day moving average",
    )
    ax.set_title("Seoul Daily Mean Temperature and 7-Day Moving Average (2025)")
    ax.set_xlabel("Date")
    ax.set_ylabel("Temperature (°C)")
    ax.xaxis.set_major_locator(mdates.MonthLocator())
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b"))
    ax.set_xlim(data["date"].min(), data["date"].max())
    temperature_min = min(data["temp"].min(), data["temp_ma7"].min())
    temperature_max = max(data["temp"].max(), data["temp_ma7"].max())
    temperature_padding = (temperature_max - temperature_min) * 0.08
    ax.set_ylim(
        temperature_min - temperature_padding,
        temperature_max + temperature_padding,
    )
    ax.legend(loc="upper left")
    fig.tight_layout()
    fig.savefig(IMAGES_DIR / "01_daily_temperature_trend.png", dpi=180)
    plt.close(fig)

    # 그래프 2: 월별 평균기온
    month_labels = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ]
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.bar(
        monthly_stats["month"],
        monthly_stats["monthly_avg_temp"],
        color="#2E86AB",
        label="Monthly mean temperature",
    )
    ax.axhline(0, color="#333333", linewidth=0.8)
    ax.set_title("Seoul Monthly Mean Temperature (2025)")
    ax.set_xlabel("Month")
    ax.set_ylabel("Temperature (°C)")
    ax.set_xticks(monthly_stats["month"], month_labels)
    monthly_temp_min = monthly_stats["monthly_avg_temp"].min()
    monthly_temp_max = monthly_stats["monthly_avg_temp"].max()
    monthly_temp_padding = (monthly_temp_max - monthly_temp_min) * 0.1
    ax.set_ylim(
        min(0, monthly_temp_min - monthly_temp_padding),
        monthly_temp_max + monthly_temp_padding,
    )
    ax.legend(loc="upper left")
    fig.tight_layout()
    fig.savefig(IMAGES_DIR / "02_monthly_average_temperature.png", dpi=180)
    plt.close(fig)

    # 그래프 3: 월별 평균 일교차
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.plot(
        monthly_stats["month"],
        monthly_stats["monthly_avg_range"],
        color="#F18F01",
        marker="o",
        linewidth=2.2,
        label="Monthly mean daily range",
    )
    ax.set_title("Seoul Monthly Mean Daily Temperature Range (2025)")
    ax.set_xlabel("Month")
    ax.set_ylabel("Daily temperature range (°C)")
    ax.set_xticks(monthly_stats["month"], month_labels)
    range_max = monthly_stats["monthly_avg_range"].max()
    ax.set_ylim(0, range_max * 1.1)
    ax.legend(loc="upper right")
    fig.tight_layout()
    fig.savefig(IMAGES_DIR / "03_temperature_change.png", dpi=180)
    plt.close(fig)


def main():
    print("서울 일별 기온 분석 프로젝트")
    data = load_data()
    data = create_date_column(data)
    data = sort_by_date(data)
    data, cleaning_summary = clean_temperature_data(data)
    data, monthly_stats = calculate_time_series_metrics(data)
    extreme_days = find_extreme_days(data)
    save_visualizations(data, monthly_stats)
    print(f"데이터 파일: {DATA_PATH.name}")
    print(f"불러온 데이터: {len(data)}행, {len(data.columns)}열")
    print(f"날짜 자료형: {data['date'].dtype}")
    print(f"첫 날짜: {data['date'].min().date()}")
    print(f"마지막 날짜: {data['date'].max().date()}")
    print(f"날짜 오름차순 정렬: {data['date'].is_monotonic_increasing}")
    print("\n컬럼별 자료형:")
    print(data.dtypes.to_string())
    print("\n컬럼별 결측치 수:")
    print(data.isna().sum().to_string())
    print("\n중복 데이터 확인:")
    print(f"중복 날짜 수: {data.duplicated(subset=['date']).sum()}")
    print(f"완전히 동일한 중복 행 수: {data.duplicated().sum()}")
    print("\n기온 논리 이상치 확인:")
    print(f"최고기온 < 최저기온: {(data['tmax'] < data['tmin']).sum()}개")
    print(f"평균기온 < 최저기온: {(data['temp'] < data['tmin']).sum()}개")
    print(f"평균기온 > 최고기온: {(data['temp'] > data['tmax']).sum()}개")
    print("\n현실 범위 이상치 확인:")
    print(f"판별 기준: {MIN_REASONABLE_TEMP}°C 미만 또는 {MAX_REASONABLE_TEMP}°C 초과")
    print(f"평균기온 범위: {data['temp'].min():.1f} ~ {data['temp'].max():.1f}°C")
    print(f"최저기온 범위: {data['tmin'].min():.1f} ~ {data['tmin'].max():.1f}°C")
    print(f"최고기온 범위: {data['tmax'].min():.1f} ~ {data['tmax'].max():.1f}°C")
    print(f"현실 범위 이상 행: {cleaning_summary['range_errors']}개")
    print("\n정제 결과:")
    print(f"처리 전: {cleaning_summary['before_count']}행")
    print(f"필수 컬럼 결측 행: {cleaning_summary['required_missing']}개")
    print(f"중복 날짜 행: {cleaning_summary['duplicate_dates']}개")
    print(f"논리 이상 행: {cleaning_summary['logical_errors']}개")
    print(f"처리 후: {cleaning_summary['after_count']}행")
    print("\n시계열 분석 결과:")
    print(f"7일 이동평균 계산값: {data['temp_ma7'].notna().sum()}개")
    print(f"일교차 계산값: {data['daily_range'].notna().sum()}개")
    print(f"전일 대비 변화량 계산값: {data['temp_change'].notna().sum()}개")
    print("\n월별 평균기온 및 평균 일교차(°C):")
    print(monthly_stats.round(2).to_string(index=False))
    print("\n극값 날짜:")
    print(
        f"가장 더운 날: {extreme_days['hottest']['date'].date()} "
        f"(최고기온 {extreme_days['hottest']['tmax']:.1f}°C)"
    )
    print(
        f"가장 추운 날: {extreme_days['coldest']['date'].date()} "
        f"(최저기온 {extreme_days['coldest']['tmin']:.1f}°C)"
    )
    print(
        f"가장 크게 상승한 날: {extreme_days['largest_rise']['date'].date()} "
        f"(전일 대비 {extreme_days['largest_rise']['temp_change']:+.1f}°C)"
    )
    print(
        f"가장 크게 하락한 날: {extreme_days['largest_drop']['date'].date()} "
        f"(전일 대비 {extreme_days['largest_drop']['temp_change']:+.1f}°C)"
    )
    print("\n저장한 시각화:")
    print(f"- {IMAGES_DIR / '01_daily_temperature_trend.png'}")
    print(f"- {IMAGES_DIR / '02_monthly_average_temperature.png'}")
    print(f"- {IMAGES_DIR / '03_temperature_change.png'}")


if __name__ == "__main__":
    main()
