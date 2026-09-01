# 온라인 쇼핑몰 매출 분석 AI

영국 온라인 소매 거래 데이터를 일별 매출로 분석하고, 저장된 요약 정보를 바탕으로 질문에 답하는 AI 서비스입니다.

## 소개

온라인 쇼핑몰을 운영하다 보면 "요즘 매출이 늘고 있나?", "어느 날이 제일 잘 팔렸지?" 같은 질문에 답하려고 매번 거래 내역 전체를 열어 직접 훑어봐야 하는 불편이 있습니다. 이 서비스는 그 과정을 대신합니다.

- **매출 요약 화면**: 저장된 날짜별 매출의 기간·건수·총매출·평균·최대/최소·최근 추세(증가·감소·유지)를 한 화면에서 바로 보여줍니다.
- **매출 데이터 관리 화면**: 날짜별 매출을 추가·삭제하며 저장된 목록을 확인할 수 있습니다.
- **AI 채팅**: "최근 매출 추세가 어때?"처럼 자연어로 물으면, 실제 저장된 매출 요약을 근거로 한국어 답을 받습니다. 원본 거래 데이터를 직접 뒤지지 않아도 됩니다.

## 학습 노트

- [Firebase 프로젝트와 Firestore 준비 (3-1~3-17)](docs/learning-note-stage-3-firestore.md)

## 데이터 출처

- 데이터셋: [UCI Machine Learning Repository — Online Retail](https://archive.ics.uci.edu/dataset/352/online+retail)
- 인용: Chen, D. (2015). *Online Retail* [Dataset]. UCI Machine Learning Repository.
- DOI: [10.24432/C5BW33](https://doi.org/10.24432/C5BW33)
- 라이선스: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- 거래 기간: 2010-12-01 ~ 2011-12-09
- 규모: 541,909개 거래 행
- 업체 정보: 영국에 등록된 비점포 온라인 소매업체이며, 업체명은 공개되지 않았습니다.
- 고객 정보: 고객은 이름 대신 숫자형 `CustomerID`로 구분됩니다.

원본 파일은 `data/Online Retail.xlsx`에 로컬로 보관하며, 용량과 재배포 관리를 위해 Git 추적 대상에서 제외합니다.

### 확인한 원본 필드

| 필드 | 의미 |
| --- | --- |
| `InvoiceNo` | 거래 송장 번호 |
| `Description` | 상품 설명 |
| `Quantity` | 거래별 상품 수량 |
| `InvoiceDate` | 거래 생성 날짜와 시간 |
| `UnitPrice` | 상품 한 개당 가격(파운드) |
| `Country` | 고객 거주 국가 |

원본에는 위 필드 외에도 `StockCode`, `CustomerID`가 포함되어 있습니다.

## 데이터 전처리

다음 기준으로 원본 거래를 정제합니다.

1. `InvoiceNo`가 `C`로 시작하는 취소 거래를 제외합니다.
2. `Quantity`가 0 이하인 반품·비정상 거래를 제외합니다.
3. `UnitPrice`가 0 이하인 무료·비정상 거래를 제외합니다.
4. `InvoiceNo`, `Description`, `Quantity`, `InvoiceDate`, `UnitPrice`, `Country` 중 하나라도 비어 있는 행을 제외합니다.
5. 거래별 매출을 `Quantity × UnitPrice`로 계산하고 거래 날짜별로 합산합니다.
6. 날짜별 고유 송장 수와 판매 수량 합계를 `memo`에 기록합니다.

원본 파일은 수정하지 않으며 다음 명령으로 `data/daily_sales.csv`를 다시 만들 수 있습니다.

```bash
source .venv/bin/activate
python scripts/preprocess_sales.py
```

결과는 Firestore 적재에 사용할 `date`, `value`, `memo` 세 열로 구성됩니다. `value`는 영국 파운드(GBP) 기준이며 소수점 둘째 자리로 반올림합니다.

## Firestore 데이터 구조

Firebase 프로젝트 `codyssey-m1-2-e3344`의 `(default)` Firestore Database를 사용합니다. 데이터베이스는 Standard 버전, 프로덕션 모드이며 위치는 `asia-northeast3`(Seoul)입니다.

### `data` 컬렉션

하루의 매출 집계를 문서 한 건으로 저장합니다. 같은 날짜를 다시 적재해도 문서가 중복 생성되지 않도록 문서 ID는 `date`와 동일한 `YYYY-MM-DD` 형식을 사용합니다.

| 필드 | Firestore 타입 | 필수 | 의미 및 예시 |
| --- | --- | --- | --- |
| `date` | string | 예 | 집계 날짜, ISO 8601 `YYYY-MM-DD` 형식. 예: `2010-12-01` |
| `value` | number | 예 | 해당 날짜의 총매출(GBP), 0 이상의 숫자. 예: `58635.56` |
| `memo` | string | 예 | 거래 건수와 판매 수량 요약. 예: `거래 127건, 판매 수량 2,685개` |
| `created_at` | timestamp | 예 | 문서를 처음 생성한 서버 시각 |
| `updated_at` | timestamp | 예 | 문서를 마지막으로 수정한 서버 시각 |

```json
{
  "date": "2010-12-01",
  "value": 58635.56,
  "memo": "거래 127건, 판매 수량 2,685개",
  "created_at": "<server timestamp>",
  "updated_at": "<server timestamp>"
}
```

### `conversations` 컬렉션

AI 채팅 한 대화를 문서 한 건으로 저장하며 문서 ID는 Firestore 자동 ID를 사용합니다. `messages` 배열의 순서가 실제 대화 순서입니다.

| 필드 | Firestore 타입 | 필수 | 의미 및 예시 |
| --- | --- | --- | --- |
| `title` | string | 예 | 대화 목록에 표시할 제목. 첫 사용자 질문을 기준으로 생성 |
| `messages` | array&lt;map&gt; | 예 | 사용자와 AI 메시지를 시간순으로 저장한 배열 |
| `created_at` | timestamp | 예 | 대화를 처음 생성한 서버 시각 |
| `updated_at` | timestamp | 예 | 메시지를 마지막으로 추가하거나 대화를 수정한 서버 시각 |

`messages`의 각 원소는 다음 필드를 가집니다.

| 필드 | Firestore 타입 | 의미 |
| --- | --- | --- |
| `role` | string | 메시지 작성자. `user` 또는 `assistant`만 허용 |
| `content` | string | 사용자 질문 또는 AI 답변 |
| `created_at` | timestamp | 메시지를 생성한 서버 시각 |

```json
{
  "title": "최근 매출 추세가 어때?",
  "messages": [
    {
      "role": "user",
      "content": "최근 매출 추세가 어때?",
      "created_at": "<server timestamp>"
    },
    {
      "role": "assistant",
      "content": "최근 7일 평균을 이전 7일과 비교하면…",
      "created_at": "<server timestamp>"
    }
  ],
  "created_at": "<server timestamp>",
  "updated_at": "<server timestamp>"
}
```

타임스탬프는 클라이언트가 전달한 시간을 신뢰하지 않고 백엔드에서 Firestore 서버 시각으로 기록합니다. 실제 컬렉션과 문서는 초기 데이터 적재 및 API 호출 시 생성합니다.

## 일별 매출 CSV Firestore 적재

`data/daily_sales.csv`를 `data` 컬렉션에 배치로 적재합니다. 문서 ID를 `date`로 고정하므로 같은 명령을 다시 실행해도 문서가 중복되지 않고 값만 덮어씁니다.

```bash
source .venv/bin/activate
python -m scripts.load_sales_to_firestore
```

실행하면 읽은 건수와 저장 성공·실패 건수를 출력합니다. 적재 후 `GET /api/data`로 실제 저장 건수를 다시 확인할 수 있습니다.

## 로컬 Firebase 연결

서비스 계정 JSON은 프로젝트 밖에 보관하고 로컬 `.env`에는 파일 경로만 설정합니다. 실제 경로와 JSON 내용은 Git에 포함하지 않습니다.

```dotenv
FIREBASE_SERVICE_ACCOUNT_JSON=
FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/firebase-service-account.json
```

환경을 준비하고 실제 Firestore 연결을 확인합니다.

```bash
source .venv/bin/activate
python -m scripts.check_firestore_connection
```

성공하면 `Firestore 연결에 성공했습니다.`가 출력됩니다. 초기화 코드는 `backend/core/firebase.py`, 환경변수 검증은 `backend/core/config.py`에 있습니다.

## AI 연동(코디세이 API 콘솔)

AI 답변은 OpenAI를 직접 호출하지 않고, 코디세이 API 콘솔이 제공하는 OpenAI 호환 엔드포인트(`https://copa.codyssey.kr/v1`)로 보냅니다. 콘솔에서 발급한 virtual key를 `OPENAI_API_KEY`에 설정하고, 모델은 `gpt-5.4-mini`를 기본값으로 사용합니다.

```dotenv
OPENAI_API_KEY=<코디세이 콘솔에서 발급한 virtual key>
OPENAI_BASE_URL=https://copa.codyssey.kr/v1
OPENAI_MODEL=gpt-5.4-mini
OPENAI_MAX_OUTPUT_TOKENS=500
OPENAI_TIMEOUT_SECONDS=20
```

`OPENAI_BASE_URL`과 `OPENAI_MODEL`을 비워 두면 위 기본값을 그대로 사용합니다. 매출 요약을 시스템 프롬프트로 바꾸는 코드는 `backend/services/ai_prompt.py`, 실제 호출과 오류 처리는 `backend/services/ai_client.py`에 있습니다.

개발·테스트에서는 실제 API를 호출하지 않고 정해진 답을 돌려주는 가짜 AI를 켤 수 있습니다. `ENVIRONMENT=production`이면 이 설정은 무시되고 항상 실제 AI를 호출합니다.

```dotenv
USE_MOCK_AI=true
ENVIRONMENT=development
```

## 백엔드 실행

```bash
source .venv/bin/activate
uvicorn backend.main:app --reload
```

주요 주소는 다음과 같습니다.

- 상태 확인: `http://localhost:8000/health`
- API 진입점: `http://localhost:8000/api`
- Swagger UI: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

`ALLOWED_ORIGINS`는 쉼표로 구분한 프론트엔드 원본 주소 목록입니다. 로컬 주소와 실제 Vercel 배포 주소만 허용하고 경로는 포함하지 않습니다.

```dotenv
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://your-project.vercel.app
```

기본 앱 자동 테스트는 다음 명령으로 실행합니다.

```bash
pytest -q
```
