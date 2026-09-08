# M1-2 · 온라인 쇼핑몰 매출 분석 AI

**매출 데이터를 저장·요약하고, 그 결과를 근거로 AI가 답하며, 이전 대화를 다시 불러오는 웹 서비스**입니다. M1-2는 이 과정에서 화면·API·데이터베이스·AI를 연결하고 설계 이유를 이해하는 과제입니다. 매출 계산은 Python이, 계산 결과의 자연어 설명은 AI가 담당합니다.

[서비스 접속](https://codyssey-one.vercel.app) · [API 문서·시험(Swagger UI)](https://codyssey-xmy5.onrender.com/docs) · [서버 상태](https://codyssey-xmy5.onrender.com/health)

## 무엇을 만들었나?

- **데이터 관리:** 날짜·매출·설명을 추가·삭제하면 Firestore에 반영되고 목록과 요약이 갱신됩니다. 수정은 API에서만 제공합니다.
- **매출 요약:** 기간·건수·총매출·평균·최대/최소·최근 추세를 보여줍니다.
- **AI 채팅:** “매출이 가장 높은 날은?”처럼 질문하면 저장된 요약을 참고해 답하고, 질문·답변을 저장합니다. 이전 대화를 선택해 이어갈 수 있습니다.
- **모바일 화면:** 좁은 화면은 세로 배치, 640px 이상은 대화 목록과 채팅을 가로 배치합니다.

데이터는 Chen, D. (2015)의 [UCI Online Retail](https://doi.org/10.24432/C5BW33), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)입니다. 2010-12-01~2011-12-09의 영국 소매 거래 541,909행에서 취소·수량/가격 0 이하·필수값 누락을 제외하고, `수량 × 단가`를 날짜별로 합산했습니다. 금액 단위는 **GBP**이며 현재 매출이나 미래 예측을 제공하는 서비스는 아닙니다.

## 구조와 핵심 개념

화면은 HTML/CSS/JavaScript, 서버는 Python·FastAPI·Pydantic, 저장소는 Firebase Firestore입니다. AI는 코디세이의 OpenAI 호환 API를 사용하며 기본 모델은 `gpt-5.4-mini`입니다. 프론트는 Vercel, 백엔드는 Render에 배포합니다.

```text
화면 → FastAPI 요청 검증 → Firestore 조회·저장 → JSON 응답 → 화면 갱신
채팅 → 매출 조회·요약 → 시스템 프롬프트 + 이전 대화 + 질문 → AI
     → 질문·답변 저장 → 답변과 대화 ID 반환
```

| 개념·코드 위치 | 역할과 분리 이유 |
| --- | --- |
| API·`backend/routers/` | 화면과 서버의 통신 창구입니다. GET 조회, POST 생성·채팅, PUT 수정, DELETE 삭제를 처리하고 HTTP 상태 코드를 정합니다. 이 생성·조회·수정·삭제를 CRUD라고 합니다. |
| 서비스·`backend/services/` | 요약 계산과 AI 호출·저장 흐름을 맡습니다. 처리 규칙을 URL이나 DB 코드와 분리해 재사용합니다. |
| 저장소·`backend/repositories/` | Firestore 읽기·쓰기를 모아 저장 방식 변경의 영향을 줄입니다. 단순 CRUD는 라우터에서 저장소를 바로 사용합니다. |
| 스키마·`backend/schemas/` | Pydantic으로 요청·응답의 필드와 제약을 정의합니다. 요청은 입력값, 응답은 ID·시각·계산 결과까지 포함합니다. |
| 의존성 주입·`backend/core/deps.py` | 필요한 저장소·AI를 FastAPI `Depends`로 전달합니다. 테스트에서는 가짜 구현으로 교체해 외부 연결 없이 검증합니다. |

**입력 검증:** 라우터 실행 전에 실제 날짜, 0 이상인 유한한 금액, 설명 1~500자, 질문 1~1,000자를 검사합니다. 공백을 정리하고 미정의 필드를 거절하며, 잘못된 요청은 한국어 오류와 422를 반환합니다. 응답도 모델로 검사해 화면이 일정한 형식을 받도록 합니다.

## 데이터를 어떻게 저장하나?

Firestore의 **컬렉션은 문서 묶음**, **문서는 필드로 구성된 저장 단위**입니다.

| 컬렉션 | 문서 구조 | 설계 이유 |
| --- | --- | --- |
| `data` | ID=`YYYY-MM-DD`, `date`, `value`, `memo`, `created_at`, `updated_at` | 하루 한 건을 식별하기 쉽습니다. 추가 API는 중복 날짜를 409로 거절하고, CSV 재적재는 같은 문서를 덮어씁니다. |
| `conversations` | 자동 ID, `title`, `messages`, `created_at`, `updated_at` | 같은 제목도 별개 대화로 저장합니다. 메시지는 `role`, `content`, `created_at`을 가진 배열로, 순서대로 읽어 복원하기 쉽습니다. |

채팅은 **AI 답변이 성공한 뒤 질문·답변을 함께 저장**합니다. 실패한 질문만 DB에 남는 것을 피하기 위해서입니다. 새 대화는 첫 질문으로 제목을 만들고 ID를 반환하며, 이후에는 같은 ID의 배열에 메시지를 붙입니다. 문서 시각과 채팅 메시지 시각은 백엔드 UTC 기준입니다.

## 요약과 AI는 어떻게 연결되나?

`GET /api/data/summary`와 채팅 서비스는 [같은 `build_summary` 함수](backend/services/summary_service.py)를 사용합니다. 요약 API를 분리해 화면에서도 AI 호출 없이 수치를 보여주고, 계산 기준을 한곳에서 관리합니다. 채팅이 요약 API를 HTTP로 다시 호출하는 것은 아닙니다.

- **합계·평균:** 저장된 매출의 합과 `합계 ÷ 기록 수`. 최대·최소 값과 날짜도 계산합니다.
- **추세:** 최근 7개 기록 평균과 직전 7개 평균을 비교합니다. 증감률은 `(최근 − 이전) ÷ 이전 × 100`이며, 100에서 120이면 20% 증가입니다.
- **예외:** 14개 미만이면 추세는 자료 부족입니다. 이전 평균이 0이면 둘 다 0일 때만 0%, 최근 평균이 양수면 증가·증감률 없음으로 처리합니다.

화면의 “7일”은 실제로 **날짜순 기록 7개**입니다. 누락일을 0으로 채우지 않으므로 달력상 일주일과 다를 수 있습니다.

**컨텍스트 주입**은 AI가 참고할 데이터를 요청에 함께 넣는 방식입니다. [시스템 프롬프트](backend/services/ai_prompt.py)에 요약과 “근거 안에서 한국어로 답하고 모르면 추측하지 말라”는 지침을 넣습니다. 원본 전체보다 입력량을 줄이고 최신 DB 수치를 참고하게 하지만, 요약에 없는 상품별 매출·월별 합계·변화 원인은 답할 근거가 없습니다. 모델을 재학습하는 방식은 아니며 잘못된 답변을 완전히 막지는 못합니다.

## 화면은 어떻게 연결되나?

| 동작 | 상태와 처리 |
| --- | --- |
| 접속·매출 변경 | `/health` 성공 후 화면을 초기화합니다. 추가·삭제 성공 후 목록과 요약을 함께 재조회하므로 새로고침 없이 반영됩니다. |
| 질문 전송 | `isSending`으로 입력·전송을 잠그고 로딩을 표시합니다. 성공하면 `currentConversationId`에 반환된 ID를 저장하고 대화 목록을 갱신합니다. |
| 대화 불러오기·새 대화 | 선택한 ID로 상세 메시지를 읽고 다음 질문에도 그 ID를 보냅니다. 새 대화는 ID를 `null`로 하고 화면만 비우며 기존 기록은 유지합니다. |

주요 API는 `/api/data`(매출), `/api/data/summary`(요약), `/api/chat`(답변·자동 저장), `/api/conversations`(대화 저장·목록), `/api/conversations/{id}`(불러오기·삭제)입니다. **Swagger UI**는 요청·응답 형식을 보고 API를 직접 시험하는 문서 화면입니다. 매출 추가 후 새로고침해 저장 여부를 보고, 요약의 최대 금액·날짜와 AI 답변을 비교하고, 이전 대화를 다시 열어 메시지가 유지되는지 확인할 수 있습니다.

## 배포·보안·확장 시 알아둘 점

| 주제 | 현재 처리와 한계 |
| --- | --- |
| 환경변수 | 키 유출 방지와 환경별 설정 분리를 위해 백엔드는 로컬 환경파일 또는 Render 환경변수를 `config.py`에서 읽습니다. 정적 프론트의 API 주소는 `frontend/js/config.js`가 결정하며 백엔드 환경변수를 자동으로 읽지 않습니다. |
| CORS | 도메인·포트가 다른 화면에서 API 응답을 읽기 위한 브라우저 정책입니다. `ALLOWED_ORIGINS`에 실제 프론트 출처를 넣고 `CORSMiddleware`에 적용합니다. 배포 도메인 변경 시 갱신해야 하며 인증을 대신하지 않습니다. |
| 콜드스타트 | 서버 첫 기동 지연을 안내하고 연결 중 표시·실패 시 재시도 버튼을 제공합니다. 화면 제한은 15초, AI 기본 제한은 20초여서 화면이 먼저 중단될 수 있습니다. |
| 입력 위험 | Pydantic으로 잘못된 값·길이를 제한하고, `textContent`·`escapeHtml`로 사용자 문자가 HTML로 실행되는 XSS를 방지합니다. 허위 매출이나 AI 지시 변경 공격까지 막는 것은 아니며 로그인·권한·요청 횟수 제한은 없습니다. |
| 데이터 증가 | 현재 전체 매출을 읽고 화면에서 20개씩 보여줍니다. 규모가 커지면 저장소에 날짜 범위·페이지 조회를 추가하고 집계·캐시를 검토할 수 있습니다. |
| 최근 30일로 변경 | 오늘 또는 마지막 데이터 날짜 중 기준일을 정하고 실제 날짜로 필터링해야 합니다. `summary_service.py`와 필요 시 저장소 조회, 응답 스키마·프롬프트·화면 문구·테스트를 함께 바꿉니다. 숫자 7만 30으로 바꾸면 30개 기록이 됩니다. |
| 긴 대화·동시 요청 | 배열 누적은 구현이 간단하지만 길어질수록 불리합니다. 스키마의 200개 제한을 누적 저장 전에 검사하지 않아 조회가 실패할 수 있고, 동시 쓰기·재시도 중복도 미해결입니다. 메시지 하위 컬렉션·동시성 제어·요청 ID 도입이 개선 방향입니다. |

## 실행과 확인

작업 디렉터리는 `Codyssey_M1-2`, Python 3.10 이상을 사용합니다. 로컬 환경파일에 `OPENAI_API_KEY`와 `FIREBASE_SERVICE_ACCOUNT_PATH`(프로젝트 밖 서비스 계정 파일 경로)를 설정합니다. 배포에서는 경로 대신 `FIREBASE_SERVICE_ACCOUNT_JSON`을 사용할 수 있으며 두 방식 중 하나만 설정합니다. 비밀값은 Git에 올리지 않습니다.

`ALLOWED_ORIGINS`는 쉼표로 구분한 프론트 출처 목록이며 로컬 기본값은 `http://localhost:3000,http://127.0.0.1:3000`입니다. 운영에는 `https://codyssey-one.vercel.app`을 포함합니다. AI 기본 주소는 `https://copa.codyssey.kr/v1`, 모델은 `gpt-5.4-mini`이며 `OPENAI_BASE_URL`, `OPENAI_MODEL`로 변경할 수 있습니다.

| 용도 | 명령 |
| --- | --- |
| 가상환경·의존성 | `python3 -m venv .venv`, `source .venv/bin/activate`, `pip install -r requirements.txt` |
| 백엔드 실행 | `uvicorn backend.main:app --reload` |
| 프론트 실행(별도 터미널) | `python3 -m http.server 3000 --directory frontend` → `http://localhost:3000` 접속 |
| Firebase 연결 확인 | `python -m scripts.check_firestore_connection` |
| CSV 적재 | `python -m scripts.load_sales_to_firestore` — 기존 날짜 문서를 덮어씀 |
| 원본 재가공(선택) | `python scripts/preprocess_sales.py` — 로컬 원본 XLSX에서 `data/daily_sales.csv` 생성 |
| 자동 테스트 | `pytest -q` — 스키마·CRUD·요약·대화·AI 오류 흐름 검증 |

테스트는 가짜 저장소·AI를 사용하므로 실제 배포 연결은 별도로 확인해야 합니다. 개발용 고정 답변은 `USE_MOCK_AI=true`로 켤 수 있고 `ENVIRONMENT=production`에서는 무시됩니다.

[화면 예시](screenshots/dashboard-and-chat.png) · [대화 불러오기](screenshots/conversation-history.png) · [데이터 추가](screenshots/data-add.png) · [Firebase 학습 노트](docs/learning-note-stage-3-firestore.md)
