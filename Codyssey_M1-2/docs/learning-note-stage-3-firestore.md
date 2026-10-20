# 학습 노트: Firebase 프로젝트와 Firestore 준비

## 학습 범위

- 작업 체크리스트: 3-1 ~ 3-17
- 프로젝트: `Codyssey M1-2`
- Firebase 프로젝트 ID: `codyssey-m1-2-e3344`
- 결과 문서: `README.md`의 **Firestore 데이터 구조**

이 단계의 목적은 전처리한 일별 매출과 AI 대화 기록을 저장할 클라우드 데이터베이스의 기반과 데이터 계약을 만드는 것이다. 앞 단계에서 생성한 `data/daily_sales.csv`가 이후 Firestore에 적재되고, 다음 단계의 FastAPI 서비스가 정의된 구조를 사용해 데이터를 생성·조회·수정·삭제한다.

## 전체 흐름에서의 위치

```text
UCI 원본 거래
    ↓ 전처리
data/daily_sales.csv
    ↓ 초기 적재 및 CRUD API
Firestore data 컬렉션
    ↓ 집계
OpenAI에 제공할 매출 요약
    ↓ 질문과 답변 저장
Firestore conversations 컬렉션
```

Firestore를 먼저 준비하는 이유는 백엔드 코드를 작성하기 전에 저장 위치와 데이터 형식을 확정해야 API 스키마, 서비스 계층, 테스트가 같은 계약을 바라볼 수 있기 때문이다.

## 1. Firebase 프로젝트 준비 — 3-1 ~ 3-3

### 수행 내용

1. Firebase Console에 로그인했다.
2. `Codyssey M1-2` 프로젝트를 생성했다.
3. 고유 프로젝트 ID `codyssey-m1-2-e3344`를 확인하고 `worklist.md`에 기록했다.
4. 과제에 필요하지 않은 Firebase의 Gemini와 Google Analytics는 활성화하지 않았다.

### 핵심 용어

- **Firebase 프로젝트**: Firestore와 같은 Firebase 서비스를 한데 묶는 최상위 작업 공간이다. 이 프로젝트에서는 `Codyssey M1-2`가 표시 이름이다.
- **프로젝트 ID**: Firebase와 Google Cloud에서 프로젝트를 고유하게 식별하는 변경 불가능한 값이다. 표시 이름과 달리 API·설정에서 `codyssey-m1-2-e3344`를 사용한다.
- **표시 이름**: 콘솔에서 사람이 알아보기 쉽게 보여주는 이름이다. 고유 식별자로 사용하면 안 된다.

### 학습 포인트

프로젝트 이름과 프로젝트 ID는 다르다. 이름은 사람이 읽기 위한 값이고, 프로젝트 ID는 시스템 연결에 사용하는 값이다. 따라서 README와 환경 설정에는 프로젝트 ID를 정확히 기록해야 한다.

### 완료 근거

- Firebase Console에서 `Codyssey M1-2` 프로젝트 개요 진입을 확인했다.
- 프로젝트 URL과 콘솔 화면에서 `codyssey-m1-2-e3344`를 확인했다.
- `worklist.md`의 3-1~3-3이 완료 상태다.

## 2. Firestore Database 생성 — 3-4 ~ 3-5

### 수행 내용

다음 설정으로 `(default)` Firestore Database를 생성했다.

| 설정 | 선택값 | 선택 이유 |
| --- | --- | --- |
| 버전 | Standard | 일반적인 문서 CRUD와 자동 색인이 과제 요구사항을 충족함 |
| 보안 초기화 | 프로덕션 모드 | 외부 클라이언트 읽기·쓰기를 기본 차단하기 위함 |
| 리전 | `asia-northeast3` (Seoul) | 한국 기반 개발·운영에 가까운 데이터 위치를 사용하기 위함 |
| 데이터베이스 ID | `(default)` | 하나의 기본 데이터베이스만 필요한 프로젝트이기 때문 |

### 핵심 용어

- **Cloud Firestore**: 데이터를 컬렉션과 문서 형태로 저장하는 NoSQL 문서형 데이터베이스다.
- **Standard 버전**: 자동 색인과 일반적인 Firestore 쿼리를 제공한다. 이 프로젝트의 CRUD와 정렬 요구사항에 적합하다.
- **프로덕션 모드**: 보안 규칙이 기본적으로 모든 제3자 읽기·쓰기를 거부하는 초기 설정이다.
- **Firebase Admin SDK**: 신뢰할 수 있는 FastAPI 서버가 서비스 계정으로 Firestore에 접근할 때 사용하는 SDK다. 서버에서는 클라이언트 보안 규칙과 다른 관리자 권한 흐름을 사용한다.
- **리전**: 데이터가 물리적으로 저장되는 위치다. 생성 후 바꿀 수 없으므로 지연 시간과 운영 위치를 고려해야 한다.
- **색인**: 쿼리와 정렬을 빠르게 수행하기 위한 데이터 구조다. 이후 날짜순 조회와 최근 수정 순 조회에 사용된다.

### 보안 선택 이해하기

테스트 모드는 빠르게 시작할 수 있지만 일정 기간 외부 접근을 허용하므로 공개 데이터 노출 위험이 있다. 이 프로젝트의 브라우저는 Firestore에 직접 접근하지 않고 FastAPI API만 호출한다. 따라서 Firestore는 프로덕션 모드로 잠그고, 백엔드만 Admin SDK로 접근하도록 하는 구조가 맞다.

```text
브라우저 → FastAPI → Firebase Admin SDK → Firestore
```

API 키나 서비스 계정 키가 브라우저 코드로 전달되어서는 안 된다.

### 문제 해결 경험

프로젝트 생성 직후 Firebase Console에 `완료 중…` 상태와 일시적인 알 수 없는 오류가 나타났고, Firestore 위치 목록도 처음에는 로드되지 않았다. 생성 요청을 반복하기 전에 실제 프로젝트와 데이터베이스 존재 여부를 확인했고, 콘솔을 새로고침한 뒤 다시 시도했다. 이후 위치 목록에서 Seoul을 선택하고 정상적으로 생성했다.

여기서 중요한 원칙은 오류 메시지만 보고 성공으로 간주하지 않고, 최종 데이터 화면과 설정값을 직접 확인하는 것이다.

### 완료 근거

- Firestore의 **데이터** 탭 진입을 확인했다.
- 콘솔에 `(default)` 데이터베이스가 표시됐다.
- 콘솔에 `데이터베이스 위치: asia-northeast3`가 표시됐다.
- `worklist.md`의 3-4~3-5가 완료 상태다.

## 3. `data` 컬렉션 설계 — 3-6 ~ 3-11

### 목적

전처리된 CSV의 일별 집계 한 행을 Firestore 문서 한 건으로 저장한다. 실제 컬렉션은 초기 데이터 적재나 API의 첫 쓰기 시 생성된다.

### 구조

문서 ID는 `date` 값과 같은 `YYYY-MM-DD`를 사용한다.

| 필드 | 타입 | 역할 |
| --- | --- | --- |
| `date` | string | ISO 8601 형식의 집계 날짜 |
| `value` | number | GBP 기준 일별 총매출 |
| `memo` | string | 거래 건수와 판매 수량 요약 |
| `created_at` | timestamp | 문서를 처음 생성한 서버 시각 |
| `updated_at` | timestamp | 문서를 마지막으로 수정한 서버 시각 |

### 설계 판단

- **날짜를 문서 ID로 사용**: 같은 날짜를 다시 적재하면 새 문서가 생기는 대신 기존 문서를 같은 ID로 갱신할 수 있다. 이는 체크리스트 7-4의 중복 방지 요구사항과 연결된다.
- **`date`를 ISO 문자열로 저장**: `YYYY-MM-DD` 문자열은 사람이 읽기 쉽고 같은 형식끼리 사전순 정렬해도 날짜순이 유지된다.
- **`value`를 number로 저장**: 합계·평균·최대·최소 계산이 필요하므로 문자열로 저장하면 안 된다.
- **서버 타임스탬프 사용**: 사용자의 잘못된 시스템 시간이나 임의 조작을 피하고 생성·수정 시각을 일관되게 관리한다.

### 예시

```json
{
  "date": "2010-12-01",
  "value": 58635.56,
  "memo": "거래 127건, 판매 수량 2,685개",
  "created_at": "<server timestamp>",
  "updated_at": "<server timestamp>"
}
```

## 4. `conversations` 컬렉션 설계 — 3-12 ~ 3-16

### 목적

사용자의 매출 질문과 AI 답변을 대화 단위로 저장한다. 이후 이전 대화 목록, 상세 불러오기, 이어서 질문하기 기능이 이 구조를 사용한다.

### 구조

대화 문서 ID는 Firestore 자동 ID를 사용한다.

| 필드 | 타입 | 역할 |
| --- | --- | --- |
| `title` | string | 대화 목록에 표시할 제목 |
| `messages` | array&lt;map&gt; | 사용자와 AI 메시지를 시간순으로 저장 |
| `created_at` | timestamp | 대화를 처음 생성한 서버 시각 |
| `updated_at` | timestamp | 대화를 마지막으로 변경한 서버 시각 |

각 `messages` 원소는 다음 구조를 가진다.

| 필드 | 타입 | 역할 |
| --- | --- | --- |
| `role` | string | `user` 또는 `assistant` |
| `content` | string | 질문 또는 AI 답변 본문 |
| `created_at` | timestamp | 메시지를 생성한 서버 시각 |

### 설계 판단

- **메시지를 배열로 저장**: 과제 규모에서는 한 대화의 전체 메시지를 한 번에 읽고 순서를 보존하기 쉽다.
- **역할 제한**: `role` 값을 `user`와 `assistant`로 제한하면 화면 표시와 OpenAI 문맥 구성이 예측 가능해진다.
- **`updated_at` 사용**: 대화 목록을 최근 활동 순으로 정렬하는 체크리스트 9-3의 근거가 된다.
- **자동 문서 ID 사용**: 날짜처럼 자연스럽게 고유한 키가 없는 대화는 Firestore가 충돌 없는 ID를 생성하도록 한다.

## 컬렉션과 문서의 관계

```text
data                                conversations
├── 2010-12-01                      ├── <자동 ID A>
│   ├── date                        │   ├── title
│   ├── value                       │   ├── messages[]
│   ├── memo                        │   │   ├── role
│   ├── created_at                  │   │   ├── content
│   └── updated_at                  │   │   └── created_at
└── 2010-12-02                      │   ├── created_at
    └── ...                         │   └── updated_at
                                    └── <자동 ID B>
                                        └── ...
```

## 5. Firebase Admin SDK 서비스 계정 확인 — 3-17

Firebase Console의 **프로젝트 설정 → 서비스 계정 → Firebase Admin SDK**에서 다음 서버용 서비스 계정을 확인했다.

```text
firebase-adminsdk-fbsvc@codyssey-m1-2-e3344.iam.gserviceaccount.com
```

Firebase가 프로젝트용 Admin SDK 계정을 자동으로 생성한 상태이므로 같은 목적의 계정을 중복 생성하지 않고 이 계정을 백엔드 인증에 사용한다. 비공개 키는 아직 생성하거나 내려받지 않았으며, 해당 작업은 체크리스트 3-18에서 진행한다.

### 핵심 용어

- **서비스 계정**: 사람이 로그인할 때 쓰는 계정이 아니라 FastAPI 같은 서버 프로그램이 Google Cloud 서비스에 접근할 때 사용하는 전용 신원이다.
- **IAM(Identity and Access Management)**: 누가 어떤 Google Cloud 리소스에서 무엇을 할 수 있는지 관리하는 권한 체계다.
- **역할(Role)**: Firestore 읽기·쓰기처럼 허용된 작업을 묶은 권한 집합이다.
- **Firebase Admin SDK**: 신뢰할 수 있는 백엔드가 서비스 계정으로 Firebase 기능을 사용하는 서버용 SDK다.

### 완료 근거

- 대상 프로젝트가 `codyssey-m1-2-e3344`인지 확인했다.
- Firebase Admin SDK 화면에 서비스 계정 이메일이 표시되는 것을 확인했다.
- 새 비공개 키 생성은 수행하지 않았다.

## 구현 시 주의할 점

1. `date`는 Pydantic에서 실제 날짜인지 검증한 후 `YYYY-MM-DD`로 직렬화한다.
2. `value`는 0 이상인 숫자만 허용한다.
3. `created_at`은 수정 요청에서 덮어쓰지 않는다.
4. 문서를 수정할 때는 `updated_at`만 새 서버 시각으로 변경한다.
5. 메시지는 저장된 배열 순서를 유지한다.
6. 서비스 계정 JSON과 OpenAI API 키는 문서, 소스 코드, Git 기록에 넣지 않는다.
7. 배열이 매우 커지는 서비스라면 메시지를 하위 컬렉션으로 분리해야 하지만, 현재 과제 범위에서는 배열 구조를 사용한다.

## 검증 결과

- Firebase 프로젝트 접근: 확인됨
- Firestore `(default)` Database 생성: 확인됨
- Firestore 리전 `asia-northeast3`: 확인됨
- 프로덕션 모드 선택: 확인됨
- `data` 컬렉션 구조 README 문서화: 확인됨
- `conversations` 컬렉션 구조 README 문서화: 확인됨
- Firebase Admin SDK 서비스 계정 존재: 확인됨
- `worklist.md` 3-1~3-17 완료 표시: 확인됨
- 실제 컬렉션 문서 적재: 아직 수행하지 않음 — 체크리스트 7단계에서 진행
- 서비스 계정 키 및 백엔드 연결: 아직 수행하지 않음 — 다음 항목 3-18~3-24에서 진행

## 다음 단계와의 연결

다음 작업은 3-18의 서비스 계정 키 JSON 다운로드다. 키를 안전한 위치에 보관하고 환경변수로 전달한 뒤 Firebase Admin SDK를 초기화해야 FastAPI가 이번에 설계한 `data`와 `conversations` 구조를 실제 Firestore에서 읽고 쓸 수 있다.
