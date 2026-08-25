"""Gemini와 Kakao Local API로 하루 여행 계획을 만드는 CLI 프로그램."""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv
from google import genai
from google.genai import types

BASE_DIR = Path(__file__).resolve().parent
RESULTS_DIR = BASE_DIR / "results"
GEMINI_MODEL = "gemini-3.6-flash"
KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"
RECOMMENDATION_SCHEMA = {
    "type": "object",
    "properties": {
        "recommended_city": {"type": "string"},
        "weather": {"type": "string"},
        "events": {"type": "array", "items": {"type": "string"}},
        "reason": {"type": "string"},
    },
    "required": ["recommended_city", "weather", "events", "reason"],
}


def parse_date(value: str) -> str:
    """argparse에서 YYYY-MM-DD 형식의 실제 날짜인지 검사합니다."""
    try:
        return datetime.strptime(value, "%Y-%m-%d").strftime("%Y-%m-%d")
    except ValueError as exc:
        raise argparse.ArgumentTypeError("날짜는 YYYY-MM-DD 형식의 실제 날짜여야 합니다.") from exc


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Gemini 기반 하루 여행 계획 생성기")
    parser.add_argument(
    "-date",
    "--date",
    required=True,
    type=parse_date,
    help="여행 날짜 (YYYY-MM-DD)",
)
    return parser


def add_error(errors: list[dict[str, str]], step: str, error_type: str, message: str) -> None:
    """모든 오류를 동일한 JSON 구조로 기록합니다."""
    errors.append({"step": step, "type": error_type, "message": message})


def classify_http_error(status_code: int) -> str:
    if status_code in (401, 403):
        return "AUTH_ERROR"
    if 400 <= status_code < 500:
        return "API_ERROR"
    return "SERVER_ERROR"


def validate_recommendation(data: Any) -> dict[str, Any]:
    """JSON 파싱 뒤 필수 필드와 자료형을 확인합니다."""
    if not isinstance(data, dict):
        raise ValueError("최상위 JSON이 객체가 아닙니다.")
    required = ("recommended_city", "weather", "events", "reason")
    if any(key not in data for key in required):
        raise ValueError("필수 추천 필드가 빠져 있습니다.")
    if not all(isinstance(data[key], str) and data[key].strip() for key in ("recommended_city", "weather", "reason")):
        raise ValueError("문자열 필드가 올바르지 않습니다.")
    if not isinstance(data["events"], list) or not all(isinstance(item, str) for item in data["events"]):
        raise ValueError("events는 문자열 목록이어야 합니다.")
    return data


def generate_recommendation(client: genai.Client, travel_date: str, errors: list[dict[str, str]]) -> dict[str, Any]:
    """Gemini JSON 추천을 받고 파싱 실패 시 한 번 재요청합니다."""
    prompt = f"""
당신은 한국 국내여행 도우미입니다. 여행 날짜는 {travel_date}입니다.
한국의 추천 도시를 하나 고르고, 날씨 요약과 행사/축제 후보를 제안하세요.
확인할 수 없는 실시간 정보는 '예상' 또는 '확인 필요'라고 명시하세요.
반드시 아래 JSON 구조만 반환하세요.
recommended_city(string), weather(string), events(array of string), reason(string)
""".strip()
    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL, contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json", response_schema=RECOMMENDATION_SCHEMA),
            )
            return validate_recommendation(json.loads(response.text))
        except (json.JSONDecodeError, ValueError, TypeError) as exc:
            if attempt == 0:
                continue
            add_error(errors, "recommendation", "JSON_PARSE_ERROR", str(exc))
        except Exception as exc:
            add_error(errors, "recommendation", "GEMINI_API_ERROR", str(exc))
            break
    return {"recommended_city": "서울", "weather": "추천 생성 실패로 날씨 정보 없음", "events": [], "reason": "Gemini 추천 생성에 실패하여 기본 지역으로 진행했습니다."}


def search_restaurants(city: str, kakao_api_key: str, errors: list[dict[str, str]]) -> list[dict[str, str]]:
    """Kakao Local에서 맛집 5곳을 검색하며, 실패 시 빈 목록을 반환합니다."""
    try:
        response = requests.get(KAKAO_KEYWORD_URL, headers={"Authorization": f"KakaoAK {kakao_api_key}"}, params={"query": f"{city} 맛집", "size": 5}, timeout=10)
    except requests.RequestException as exc:
        add_error(errors, "place_search", "NETWORK_ERROR", str(exc))
        return []
    if not response.ok:
        add_error(errors, "place_search", classify_http_error(response.status_code), f"HTTP {response.status_code}")
        return []
    try:
        documents = response.json().get("documents", [])
    except ValueError as exc:
        add_error(errors, "place_search", "RESPONSE_PARSE_ERROR", str(exc))
        return []
    if not documents:
        add_error(errors, "place_search", "SEARCH_EMPTY", "검색 결과가 0건입니다.")
        return []
    return [{"name": item.get("place_name", ""), "address": item.get("road_address_name") or item.get("address_name", ""), "category": item.get("category_name", ""), "url": item.get("place_url", ""), "x": item.get("x", ""), "y": item.get("y", "")} for item in documents[:5]]


def fallback_report(travel_date: str, recommendation: dict[str, Any], restaurants: list[dict[str, str]], errors: list[dict[str, str]]) -> str:
    """최종 LLM 호출 실패 시에도 필수 Markdown 항목을 생성합니다."""
    restaurant_lines = "\n".join(f"- [{r['name']}]({r['url']}) — {r['address']} ({r['category']})" for r in restaurants) if restaurants else "데이터 없음"
    event_lines = "\n".join(f"- {event}" for event in recommendation["events"]) or "데이터 없음"
    error_lines = "\n".join(f"- {e['step']} / {e['type']}: {e['message']}" for e in errors) or "- 없음"
    return f"""# {travel_date} 여행 계획

## 추천 지역
{recommendation['recommended_city']}

## 추천 이유
{recommendation['reason']}

## 날씨 요약
{recommendation['weather']}

## 행사/축제 목록
{event_lines}

## 맛집 추천
{restaurant_lines}

## 1일 일정
### 오전
추천 지역의 대표 명소를 방문하세요.

### 오후
맛집 추천 또는 지역 문화 공간을 방문하세요.

### 저녁
지역의 야경·산책 코스를 즐기며 하루를 마무리하세요.

## 오류 요약
{error_lines}
"""


def generate_final_report(client: genai.Client, raw_data: dict[str, Any], errors: list[dict[str, str]]) -> str:
    """Gemini가 수집 데이터로 최종 Markdown을 작성합니다."""
    prompt = f"""다음 여행 원본 데이터로 한국어 Markdown 여행 리포트를 작성하세요.
반드시 추천 지역, 추천 이유, 날씨 요약, 행사/축제 목록, 맛집 추천, 1일 일정, 오류 요약 제목을 포함하고 1일 일정은 오전/오후/저녁으로 나누세요.
restaurants가 빈 배열이면 맛집 추천에 정확히 '데이터 없음'이라고 쓰세요.
원본 데이터:\n{json.dumps(raw_data, ensure_ascii=False, indent=2)}"""
    try:
        response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        report = (response.text or "").strip()
        required_sections = ("추천 지역", "추천 이유", "날씨 요약", "행사/축제 목록", "맛집 추천", "1일 일정", "오류 요약")
        if not report or any(section not in report for section in required_sections):
            raise ValueError("Gemini 리포트에 필수 항목이 누락되었습니다.")
        if not raw_data["restaurants"] and "데이터 없음" not in report:
            raise ValueError("맛집 0건 표기가 누락되었습니다.")
        return report
    except Exception as exc:
        add_error(errors, "final_report", "GEMINI_API_ERROR", str(exc))
        return fallback_report(raw_data["travel_date"], raw_data["recommendation"], raw_data["restaurants"], errors)


def require_api_keys() -> tuple[str, str]:
    """.env에서 두 API 키를 읽고 없으면 안내 후 종료합니다."""
    load_dotenv(BASE_DIR / ".env")
    gemini_key, kakao_key = os.getenv("GEMINI_API_KEY", "").strip(), os.getenv("KAKAO_REST_API_KEY", "").strip()
    if not gemini_key or not kakao_key:
        print("API 키가 설정되지 않았습니다. .env.example을 복사해 .env를 만들고", file=sys.stderr)
        print("GEMINI_API_KEY와 KAKAO_REST_API_KEY에 각각의 실제 키를 설정하세요.", file=sys.stderr)
        sys.exit(1)
    return gemini_key, kakao_key


def main() -> None:
    args = build_parser().parse_args()
    gemini_key, kakao_key = require_api_keys()
    errors: list[dict[str, str]] = []
    client = genai.Client(api_key=gemini_key)
    print("[1/3] 1차 추천 생성 중(LLM)...")
    recommendation = generate_recommendation(client, args.date, errors)
    print("[2/3] 맛집 검색 중(지도/장소 API)...")
    restaurants = search_restaurants(recommendation["recommended_city"], kakao_key, errors)
    raw_data: dict[str, Any] = {"travel_date": args.date, "recommendation": recommendation, "restaurants": restaurants, "errors": errors}
    print("[3/3] 최종 리포트 생성 중(LLM)...")
    report = generate_final_report(client, raw_data, errors)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    raw_path, report_path = RESULTS_DIR / f"{args.date}_raw_data.json", RESULTS_DIR / f"{args.date}_travel_plan.md"
    raw_path.write_text(json.dumps(raw_data, ensure_ascii=False, indent=2), encoding="utf-8")
    report_path.write_text(report, encoding="utf-8")
    print("완료되었습니다.")
    print(f"원본 JSON: {raw_path}")
    print(f"여행 리포트: {report_path}")


if __name__ == "__main__":
    main()
