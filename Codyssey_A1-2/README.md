# Gemini · Kakao Local 여행 계획 생성기

## 프로그램 개요

지정한 날짜를 받아 Gemini가 국내 추천 여행지·날씨·행사를 제안하고 Kakao Local API로 맛집 최대 5곳을 찾은 뒤, Markdown 여행 리포트를 만듭니다. 장소 API 오류나 검색 실패도 오류 목록에 기록하고 결과 파일 생성을 계속합니다.

## 폴더 구조

```text
.
├── travel_planner.py
├── .env.example
├── .gitignore
├── requirements.txt
├── README.md
└── results/
```

## 설치 방법

Python 3.10 이상에서 다음을 실행합니다.

```bash
python -m venv .venv
pip install -r requirements.txt
```

## API 키 설정 방법

`.env.example`을 복사해 프로젝트 최상위에 `.env`를 만들고 `GEMINI_API_KEY`, `KAKAO_REST_API_KEY`를 설정합니다. 실제 API 키는 코드·README·Git에 절대 작성하지 마세요.

## 실행 방법

```bash
python travel_planner.py --date "2026-08-15"
```

`--date`는 필수이며 실제 `YYYY-MM-DD` 날짜여야 합니다.

## 결과물 확인 방법

`results` 폴더가 자동 생성되며 `YYYY-MM-DD_raw_data.json`과 `YYYY-MM-DD_travel_plan.md`가 저장됩니다. 맛집 검색이 0건이면 리포트에는 `데이터 없음`이라고 표시됩니다.

## 대표 오류와 해결 방법

- API 키 없음: `.env` 위치와 두 변수명을 확인합니다.
- Kakao HTTP 401/403: REST API 키가 유효한지 확인합니다.
- 네트워크 오류: 인터넷 및 방화벽 설정을 확인합니다.
- 맛집 0건: 프로그램은 중단하지 않고 빈 목록과 오류 요약을 저장합니다.

## API 키 보안 주의사항

`.env`는 `.gitignore`에 포함됩니다. 키가 노출되면 즉시 폐기하고 재발급하세요.

## REST API와 데이터 흐름

REST API는 HTTP 요청으로 서버 기능을 사용하는 방식입니다. Kakao Local에는 인증 헤더와 검색어를 담은 GET 요청을 보내 JSON 응답을 받고, Gemini SDK는 내부적으로 POST 요청을 사용합니다. Gemini 구조화 JSON의 `recommended_city`를 Kakao 검색어로 사용하고, 장소 JSON을 정리해 다시 Gemini에 전달하여 Markdown 리포트를 만듭니다.
