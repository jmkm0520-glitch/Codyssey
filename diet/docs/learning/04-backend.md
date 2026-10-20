# 백엔드 집중하기

[← 학습 가이드 목차](./README.md) · [이전: HTTP와 API 집중하기](./03-http-and-api.md)

## 이 문서에서 답할 질문

> HTTP 요청을 받은 백엔드는 응답을 보내기 전까지 무엇을 확인하고 처리하는가?

앞 문서에서는 프론트엔드와 백엔드가 HTTP와 JSON이라는 약속으로 대화하는 방법을 살펴봤다.
이제 `PUT /api/weight` 요청 하나가 Python 백엔드 안에서 처리되는 과정을 확대한다.

## 먼저 기억할 한 문장

> 백엔드는 요청을 그대로 데이터베이스에 전달하지 않는다. 입력값과 로그인 회원을 다시 확인하고,
> 이 앱의 규칙에 따라 데이터를 처리한 뒤 안전한 응답을 만든다.

**백엔드**는 사용자의 브라우저가 아니라 서버에서 실행되는 역할을 가리킨다. **Python**은 이
프로젝트가 그 역할을 구현하기 위해 선택한 프로그래밍 언어다. 백엔드와 Python은 같은 뜻이 아니다.

## 전체 흐름에서 백엔드의 위치

```text
사용자
  ↓ 버튼 클릭
프론트엔드
  ↓ HTTP 요청
[ 백엔드: 요청·회원·규칙 확인, 저장 지시, 응답 생성 ]
  ↓ 데이터 작업
Supabase Auth·PostgreSQL
  ↓ 결과
백엔드 → 프론트엔드 → 사용자 화면
```

프로젝트 전체를 역할별로 다시 나누면 다음과 같다.

| 영역 | 맡은 일 | 맡지 않는 일 | 이 프로젝트의 선택 |
| --- | --- | --- | --- |
| 프론트엔드 | 화면 표시, 입력 받기, 빠른 1차 안내 | 최종 권한 판정 | React·Next.js, `src/` |
| 백엔드 | 요청·회원·규칙 확인, 데이터 작업 지시, 응답 생성 | 데이터를 영구 보관하는 일 | Python, Vercel Functions, `api/` |
| 데이터베이스·인증 | 회원 식별, 식단·체중의 영구 저장과 제약 | 화면 표시 | Supabase Auth·PostgreSQL |
| 배포 환경 | 인터넷에서 프론트엔드와 백엔드 실행 | 앱의 업무 규칙 결정 | Vercel |
| 도메인·DNS | 사용자가 입력한 주소를 Vercel로 안내 | 화면이나 API 실행 | 가비아의 A·CNAME 레코드 |

이 구분은 서로 완전히 고립되어 있다는 뜻이 아니다. 한 기능을 완성하려면 각 영역이 정해진 약속에
따라 이어져야 한다.

## 백엔드가 맡는 일

백엔드의 주요 책임은 다음 순서로 생각할 수 있다.

1. **요청 읽기**: 어떤 주소와 HTTP 메서드로 어떤 데이터가 왔는지 읽는다.
2. **입력 검증**: 데이터의 형식, 타입, 길이와 허용 범위를 확인한다.
3. **인증·인가**: 누구인지 확인하고 그 작업을 할 수 있는지 판단한다.
4. **비즈니스 규칙 적용**: 이 앱에서 허용하는 행동인지 확인한다.
5. **데이터 접근**: 데이터베이스를 조회하거나 추가·수정·삭제한다.
6. **응답 생성**: 프론트엔드와 약속한 상태 코드와 JSON을 돌려준다.
7. **안전한 기록**: 운영 중 문제를 찾을 단서는 남기되 개인정보와 비밀은 로그에 남기지 않는다.

프론트엔드에서도 입력값을 검사하지만 사용자는 브라우저의 코드를 바꾸거나 API를 직접 호출할 수
있다. 따라서 백엔드는 브라우저에서 온 값을 신뢰하지 않고 다시 검사해야 한다.

## 이 프로젝트가 선택한 백엔드 구조

이 프로젝트의 백엔드는 `api/` 아래의 Python 파일로 구성되며, Vercel의 **서버리스 함수**
(Serverless Function)로 실행된다. 서버리스는 서버가 없다는 뜻이 아니다. 개발팀이 서버를 직접
준비하고 계속 운영하는 대신, 요청이 들어오면 Vercel이 필요한 실행 환경을 마련해 코드를 실행하는
방식이다.

예를 들어 `/api/weight` 요청이 들어오면 Vercel은 대응하는 Python 코드를 실행한다. 지금은
`요청이 들어오면 Vercel이 해당 Python 코드를 실행한다`는 흐름만 이해하면 된다. 서버리스 함수가
계속 켜져 있는 한 대의 서버와 어떻게 다른지는 뒤의 서버리스 설명에서 자세히 살펴본다.

```text
api/
├─ authentication.py  로그인·회원가입·세션 관련 endpoint
├─ day.py             하루 기록 조회·삭제 endpoint
├─ calendar.py        달력 기록 조회 endpoint
├─ weight.py          체중 저장 endpoint
├─ meal.py            식단 저장·삭제 endpoint
├─ import_data.py     여러 기록 가져오기 endpoint
├─ lib/               요청·인증·응답·로그·DB 연결 공통 코드
├─ models/            요청과 응답의 데이터 모양·검증 규칙
└─ *_test.py          각 동작을 자동으로 확인하는 테스트
```

각 endpoint에는 `handler(BaseHTTPRequestHandler)` 클래스가 있다. 그 안의 `do_GET()`, `do_POST()`,
`do_PUT()`, `do_DELETE()`가 해당 HTTP 메서드 요청을 처음 받는 진입점이다.

- endpoint 파일은 해당 기능의 **처리 순서**를 조립한다.
- [`api/lib/`](../../api/lib)는 여러 endpoint가 함께 쓰는 **공통 기능**을 제공한다.
- [`api/models/`](../../api/models)는 들어오고 나가는 데이터의 **모양과 규칙**을 정의한다.

Next.js의 Server Component도 서버에서 실행될 수 있지만, 이 문서에서 말하는 Python API와 같은
코드는 아니다. 이 프로젝트의 API 요청 처리는 `api/*.py`가 담당한다.

## 체중 저장 요청 한 건 따라가기

사용자가 날짜와 체중을 입력하고 저장하면 프론트엔드는 다음 요청을 보낸다.

```http
PUT /api/weight
Content-Type: application/json
Cookie: diet_access_token=...

{
  "date": "2026-08-17",
  "weight": 65.4
}
```

[`api/weight.py`](../../api/weight.py)의 실제 처리 순서는 다음과 같다.

### 1. Vercel이 Python Function을 실행한다

Vercel이 `/api/weight` 요청을 해당 Python 코드로 연결한다. `PUT` 요청이므로
`handler.do_PUT()`이 실행된다.

### 2. 요청 본문을 제한해서 읽는다

[`read_json_body()`](../../api/lib/request.py)은 다음 조건을 먼저 확인한다.

- `Content-Type`이 `application/json`인가?
- `Content-Length`가 올바른 숫자인가?
- 본문이 이 앱에서 정한 최대 **64 KiB** 이내인가?
- 적혀 있는 길이만큼 본문을 완전히 읽었는가?

이 제한은 비정상적으로 큰 입력이 서버 자원을 불필요하게 사용하는 것을 막는 첫 번째 경계다.

### 3. JSON을 Python 값으로 바꾼다

`json.loads()`가 JSON 텍스트를 Python에서 다룰 수 있는 값으로 바꾼다. JSON 문법이 잘못되어 있으면
여기에서 검증 오류 응답으로 이동한다.

### 4. Pydantic이 입력값을 검증한다

[`WeightUpsertRequest`](../../api/models/weight.py)의 `model_validate()`가 요청의 모양과 규칙을
검사한다.

| 항목 | 실제 규칙 |
| --- | --- |
| 추가 필드 | `date`, `weight` 외에는 허용하지 않음 |
| `date` | 실제 날짜여야 하고 한국 시간 기준 미래 날짜가 아니어야 함 |
| `weight` | 유한한 숫자이며 0보다 크고 9999.99 이하여야 함 |

식단 저장 모델에도 별도의 규칙이 있다.

- 끼니는 `breakfast`, `lunch`, `dinner`, `snack` 중 하나다.
- 분류는 `clean`, `free` 중 하나다.
- 음식 내용은 공백만으로 구성할 수 없고 최대 500자다.
- 식단도 미래 날짜에는 기록할 수 없다.

Pydantic은 타입·형식·범위 검사를 한곳에 모아 준다. 그러나 로그인 확인, 작업 권한, 데이터베이스의
`UNIQUE`·외래 키 같은 제약까지 대신하지는 않는다.

### 5. 로그인한 회원을 확인한다

[`require_member()`](../../api/lib/auth.py)는 쿠키가 있다는 사실만 확인하지 않는다.

```text
로그인 쿠키에서 access token 읽기
→ Supabase Auth에 token의 사용자 확인
→ members 테이블에서 앱 회원 확인
→ 검증된 AuthenticatedMember 반환
```

요청 본문에 `member_id`를 넣어 보내게 하고 그 값을 믿으면 다른 회원의 ID로 바꾸어 요청할 수 있다.
그래서 서버가 확인한 회원 ID를 이후의 저장 데이터와 조회 조건에 직접 넣는다.

### 6. 앱의 규칙에 따라 데이터베이스에 저장한다

`upsert_weight()`는 검증된 날짜·체중에 서버가 확인한 `member_id`를 더해 Supabase의 `weights`
테이블에 저장한다. 같은 회원과 같은 날짜의 기록이 있으면 새 행을 무조건 늘리지 않고 해당 기록을
갱신한다.

미래 날짜에 기록할 수 없고, 회원별 기록을 분리하며, 하루에 한 회원의 체중 기록은 하나라는 조건은
모두 이 앱의 **비즈니스 규칙**이다. 비즈니스 규칙은 “이 서비스에서 어떤 행동을 허용할 것인가”에
관한 규칙이다. 식단은 회원·날짜·끼니별 한 기록으로 다룬다.

### 7. 표준 JSON 응답을 보낸다

저장이 성공하면 최종 저장 행을 `data`에 담고 HTTP `200`으로 응답한다.

```json
{
  "data": {
    "date": "2026-08-17",
    "weight": 65.4
  },
  "error": null
}
```

전체를 한 줄 흐름으로 다시 연결하면 다음과 같다.

```text
Vercel Function
→ handler.do_PUT()
→ read_json_body()
→ json.loads()
→ WeightUpsertRequest.model_validate()
→ require_member()
→ upsert_weight()
→ HTTP 200 + 표준 JSON
```

## Supabase 연결과 서버 비밀키

[`get_supabase_client()`](../../api/lib/supabase_client.py)는 서버 환경 변수에서 두 설정을 읽는다.

- `SUPABASE_URL`: 연결할 Supabase 프로젝트 주소
- `SUPABASE_SERVICE_ROLE_KEY`: 서버가 데이터에 접근할 때 사용하는 강한 권한의 비밀키

환경 변수는 로컬·Preview·Production 같은 실행 환경마다 다르게 넣을 수 있는 설정이다. 실제 키
값은 Git에 기록하거나 프론트엔드 코드에 넣지 않는다. 특히 `SUPABASE_SERVICE_ROLE_KEY`는
브라우저로 보내면 안 된다.

service role은 RLS 제한을 우회할 수 있는 강한 권한이다. 따라서 “RLS가 알아서 다른 회원의 데이터를
막아 주겠지”라고 가정할 수 없다. 이 프로젝트의 Python 백엔드는 검증된 `member_id`를 모든 개인
데이터 query에 명시하는 책임을 진다. 이 권한과 RLS는 데이터베이스·인증 문서에서 다시 구분한다.

## 실패 응답과 내부 로그는 다르다

체중 저장 API의 대표적인 실패는 다음 세 범주로 나뉜다.

| 실패 종류 | HTTP 상태 | 앱 오류 코드 | 예 |
| --- | --- | --- | --- |
| 요청 검증 실패 | `400` | `VALIDATION_ERROR` | JSON 오류, 잘못된 날짜·체중 |
| 인증 실패 | `401` | `AUTH_REQUIRED` | 로그인 쿠키 없음, 유효한 회원 아님 |
| 예상하지 못한 서버 실패 | `500` | `INTERNAL_ERROR` | 서버 설정 또는 데이터 연동 오류 |

사용자에게 보내는 오류에는 다시 시도할 방법을 알 수 있는 안전한 메시지만 담는다. Python 예외의
상세 메시지나 환경 변수 값은 응답에 넣지 않는다.

[`log_internal_error()`](../../api/lib/logging.py)는 운영자가 문제의 종류를 찾도록 허용된 context와
예외 **타입**만 기록한다. 토큰, 비밀번호, 식단, 체중, 요청값과 예외 메시지는 로그에 남기지 않는 것이
현재 정책이다. 공개 응답과 내부 로그를 분리하면 문제를 조사할 단서는 유지하면서 개인정보와 비밀이
노출될 가능성을 줄일 수 있다.

## Serverless는 서버가 없다는 뜻이 아니다

이 프로젝트의 Python API는 Vercel Functions에서 실행된다. **Serverless**는 물리적인 서버가 전혀
없다는 뜻이 아니다. 개발팀이 서버 머신을 직접 준비하고 계속 켜 두는 대신, Vercel이 요청에 맞춰
함수 실행 환경을 준비하고 확장·종료하는 방식을 뜻한다.

요청을 처리한 함수 인스턴스는 잠시 재사용될 수도 있다. 그래서 이 프로젝트는 Supabase client 생성
결과를 인스턴스 안에서 캐시한다. 하지만 그 인스턴스가 언제까지 유지될지는 보장되지 않는다.

따라서 다음 정보의 원본을 Python 전역 변수나 함수의 로컬 파일에 저장하면 안 된다.

- 로그인 세션
- 사용자의 체중과 식단 기록
- 여러 요청이 계속 공유해야 하는 업무 상태

이런 영구 데이터는 Supabase처럼 별도의 저장소에 둔다. 함수에는 실행 시간·메모리·요청 크기 제한이
있고 여러 요청이 동시에 처리될 수 있으므로, 긴 작업과 공유 상태도 이런 실행 특성을 고려해
설계해야 한다. 요금제나 플랫폼에 따라 달라지는 제한 수치는 Vercel의 최신 문서에서 확인한다.

## 파일을 어디서부터 읽으면 될까?

체중 저장 기능을 확인할 때는 다음 순서로 읽으면 처리 흐름을 잃지 않는다.

1. [`api/weight.py`](../../api/weight.py): 요청 처리 순서
2. [`api/models/weight.py`](../../api/models/weight.py): 체중 입력 규칙
3. [`api/lib/request.py`](../../api/lib/request.py): 요청 본문 제한
4. [`api/lib/auth.py`](../../api/lib/auth.py): 로그인 회원 확인
5. [`api/lib/supabase_client.py`](../../api/lib/supabase_client.py): 서버의 Supabase 연결
6. [`api/lib/response.py`](../../api/lib/response.py): 공통 성공·오류 JSON
7. [`api/lib/logging.py`](../../api/lib/logging.py): 안전한 내부 오류 기록
8. [`api/weight_test.py`](../../api/weight_test.py): 위 규칙을 자동으로 확인하는 예시

코드를 처음부터 한 줄씩 모두 읽기보다 endpoint에서 전체 순서를 본 다음, 궁금한 단계의 공통 코드와
모델로 들어가면 이해하기 쉽다.

## 자주 생기는 오해

### 백엔드와 Python은 같은 말인가?

아니다. 백엔드는 서버 측의 역할이고 Python은 그 역할을 구현할 수 있는 여러 언어 중 하나다. 이
프로젝트가 Python을 선택했을 뿐, 다른 프로젝트는 JavaScript·Java·Go 등을 사용할 수 있다.

### Serverless에는 서버가 없는가?

아니다. 실행할 서버는 존재하지만 Vercel이 준비·확장·운영한다. 개발자는 계속 유지되는 한 대의
서버라고 가정하지 않아야 한다.

### Pydantic 검증을 통과하면 인증과 보안도 끝나는가?

아니다. Pydantic은 입력 데이터의 모양과 범위를 확인한다. 로그인 회원 확인, 권한 판정, 데이터베이스
제약과 비밀키 관리는 별도의 경계다.

### 프론트엔드에서 검사했으니 백엔드는 다시 검사하지 않아도 되는가?

아니다. 브라우저 요청은 사용자가 바꿀 수 있다. 프론트엔드 검사는 빠른 사용 안내를 위해, 백엔드
검사는 시스템과 데이터를 지키기 위해 모두 필요하다.

### service role을 쓰면 회원별 데이터 분리는 자동인가?

아니다. service role은 RLS를 우회할 수 있으므로 오히려 백엔드가 검증된 `member_id`를 query에
정확히 넣을 책임이 크다.

### Next.js Server Component와 Python API는 같은 백엔드 코드인가?

아니다. 둘 다 서버에서 실행될 수 있지만 실행 환경과 책임이 다르다. 이 프로젝트의 `/api/*` 계약과
데이터 처리는 `api/`의 Python 코드가 담당한다.

## 이해 확인

다음 질문에 자신의 말로 답해 본다.

1. `PUT /api/weight`가 들어온 뒤 성공 응답까지의 단계를 순서대로 말할 수 있는가?
2. `WeightUpsertRequest`가 확인하는 것과 확인하지 않는 것을 각각 말할 수 있는가?
3. 저장할 `member_id`를 프론트엔드가 아니라 백엔드가 결정해야 하는 이유는 무엇인가?
4. `SUPABASE_SERVICE_ROLE_KEY`를 어느 환경에 보관해야 하며, 브라우저로 보내면 왜 안 되는가?
5. Serverless Function의 전역 변수나 로컬 파일을 영구 저장소로 사용하면 왜 안 되는가?

답하기 어렵다면 **체중 저장 요청 한 건 따라가기**부터 다시 읽고 실제 파일 링크를 순서대로
열어 본다.

## 공식 참고 자료

- [Vercel Functions](https://vercel.com/docs/functions)
- [Vercel Functions 제한](https://vercel.com/docs/functions/limitations)
- [Pydantic Models](https://docs.pydantic.dev/latest/concepts/models/)

## 다음 문서

다음 [데이터베이스 집중하기](./05-database.md)에서는 백엔드가 저장을 지시한 뒤 Supabase PostgreSQL
내부에서 테이블·행·관계와 제약이 데이터를 어떻게 보관하는지 확대한다.
