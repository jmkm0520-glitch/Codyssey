# 실제 코드로 전체 흐름 다시 연결하기

[← 학습 가이드 목차](./README.md) · [이전: 개발 작업 방식 익히기](./08-development-workflow.md)

## 이 문서에서 답할 질문

> 화면에서 한 행동은 어떤 파일과 함수를 지나 Supabase에 도착하고, 그 결과는 어떻게 다시 화면에
> 나타날까?

앞 문서들에서는 프론트엔드, HTTP API, 백엔드, 데이터베이스, 인증을 각각 확대해서 살펴봤다. 이
문서에서는 새로운 개념을 더 배우기보다, 이미 배운 개념을 현재 코드의 실행 순서로 다시 연결한다.

## 먼저 보는 한 줄 설명

코드는 폴더 순서로 읽기보다 **사용자 행동에서 시작해 호출되는 함수와 데이터의 이동 방향을 따라
읽는 것**이 이해하기 쉽다.

```text
사용자 행동
→ React 이벤트 또는 Effect
→ fetchApi()가 HTTP 요청 전송
→ Python API handler가 입력과 사용자 확인
→ Supabase Auth 또는 PostgreSQL 사용
→ { data, error } 응답
→ React State 변경
→ 화면 다시 렌더링
```

TypeScript 함수가 Python 함수를 직접 호출하는 것은 아니다. 둘 사이에는 앞에서 배운
[HTTP 요청과 응답](./03-http-and-api.md)이 있다.

## 여섯 흐름의 지도

세부 코드를 열기 전에 각 흐름의 출발점과 도착점부터 본다.

| 사용자 행동 | 프론트엔드 시작점 | HTTP API | Auth·DB 작업 | 화면의 마지막 변화 |
| --- | --- | --- | --- | --- |
| 사이트 접속 | `AuthGate`의 Effect | `GET /api/authentication?action=session` | Auth 사용자와 `members` 확인 | 로그인 화면 또는 서비스 본문 |
| 날짜 선택 | `Home`의 Effect | `GET /api/day?date=...` | `meals`, `weights` 조회 | 하루 기록 표시 |
| 체중 저장 | `Home.saveWeight()` | `PUT /api/weight` | `weights` upsert | 저장 상태와 입력 잠금 |
| 식단 저장 | `MealCard.saveMeal()` | `PUT /api/meal` | `meals` upsert | 식단 카드와 하루 State 갱신 |
| 달력 열기·날짜 선택 | `CalendarView`의 Effect·`selectDate()` | `GET /api/calendar`, `GET /api/day` | 월 요약과 하루 상세 조회 | 달력 표시와 상세 패널 |
| 회원가입·인증 | `AuthGate.submit()` | `POST /api/authentication?...` | Auth 가입·OTP 확인, `members` 준비 | 로그인된 서비스 본문 |

## 코드 흐름을 찾는 여덟 질문

기능을 처음 읽을 때는 다음 질문을 한 번에 하나씩 확인한다.

1. 사용자가 화면에서 무엇을 했는가?
2. 어떤 컴포넌트의 이벤트 함수 또는 Effect가 시작점인가?
3. 어떤 HTTP 메서드와 API 경로를 호출하는가?
4. 어떤 Python 파일의 `handler`가 요청을 받는가?
5. 입력값과 로그인 사용자를 어디서 검사하는가?
6. 어떤 테이블 또는 인증 서비스를 읽거나 바꾸는가?
7. 응답의 `data`가 프론트엔드의 어떤 State를 바꾸는가?
8. 실패하면 어떤 State와 안내 문구가 보이는가?

파일을 모두 읽기 전에 API 경로를 검색하면 양쪽 연결점을 빠르게 찾을 수 있다.

```bash
rg -n "/api/weight" src api
rg -n "saveWeight|upsert_weight" src api
```

첫 명령은 `/api/weight`를 호출하는 프론트엔드와 요청을 받는 API 후보를 찾는다. 두 번째 명령은
흐름 안에서 실제 일을 하는 함수 이름을 찾는다. 프로젝트 파일을 읽고 변경하는 기본 순서는
[개발 작업 방식](./08-development-workflow.md)에서 확인할 수 있다.

## 모든 흐름이 공유하는 연결부

### 화면의 바깥문: `RootLayout`과 `AuthGate`

[src/app/layout.tsx](../../src/app/layout.tsx)의 `RootLayout`은 모든 페이지의 `children`을
`AuthGate`로 감싼다.

```text
RootLayout
└─ AuthGate
   ├─ 로그인 확인 중 화면
   ├─ 로그인·회원가입 화면
   └─ 로그인된 경우 실제 page
```

따라서 홈이나 달력 페이지를 보기 전에 먼저 로그인 상태 확인을 통과한다. `AuthGate`는
“페이지”가 아니라 여러 페이지 앞에서 공통으로 동작하는 문지기 역할의 React 컴포넌트다.

### 통신의 연결부: `fetchApi()`

[src/services/apiClient.ts](../../src/services/apiClient.ts)의 `fetchApi()`는 모든 프론트엔드 API
호출에 같은 규칙을 적용한다.

1. `Accept: application/json`을 넣는다.
2. 같은 사이트의 쿠키를 요청에 포함하도록 `credentials: "same-origin"`을 사용한다.
3. 응답 본문을 JSON으로 읽는다.
4. `{ data, error }` 형태인지 확인한다.
5. 실패 응답이면 `ApiClientError`를 던지고, 성공 응답이면 `data`만 반환한다.

Python 쪽의 [api/lib/response.py](../../api/lib/response.py)는 같은 응답 형식을 만든다.

```json
{
  "data": { "date": "2026-08-17" },
  "error": null
}
```

이 공통 규칙 덕분에 각 화면은 HTTP 응답 전체가 아니라 필요한 `data`에 집중할 수 있다.

### 데이터 API의 공통 문지기: `require_member()`

[api/lib/auth.py](../../api/lib/auth.py)의 `require_member()`는 다음 순서로 로그인 사용자를 찾는다.

```text
요청의 diet_access_token 쿠키 읽기
→ Supabase Auth에 access token으로 사용자 확인 요청
→ 같은 id의 members 행 조회
→ AuthenticatedMember 반환
```

이후 각 API는 `member.id`를 데이터 조회·저장 조건에 넣는다. 같은 날짜라도 회원마다 다른 기록을
사용하는 이유다. 자세한 쿠키와 토큰 개념은 [인증과 인가](./06-authentication.md)에서 확인한다.

## 흐름 1. 사이트 접속과 세션 확인

### 1단계: 사용자가 사이트에 접속한다

Vercel이 Next.js 화면 파일을 전달한 뒤 브라우저가 React를 실행한다. 도메인부터 화면이 도착하기까지는
[인프라와 배포](./07-infrastructure-and-deployment.md)에서 다뤘다.

### 2단계: `AuthGate`가 로그인 상태를 묻는다

[src/components/AuthGate.tsx](../../src/components/AuthGate.tsx)의 첫 번째 `useEffect()`는 컴포넌트가
처음 화면에 나타날 때 다음 요청을 보낸다.

```text
GET /api/authentication?action=session
```

동시에 `loading`은 `true`이므로 화면에는 “로그인 상태를 확인하고 있어요.”가 보인다.

### 3단계: 인증 API가 세션을 확인한다

[api/authentication.py](../../api/authentication.py)의 `handler.do_GET()`은 `action=session`을 찾아
`_session()`을 호출한다.

`_session()`의 순서는 다음과 같다.

1. `require_member()`로 access cookie, Auth 사용자, `members` 행을 확인한다.
2. 성공하면 `Member`에 필요한 `id`, `email`, `displayName`을 반환한다.
3. access token 확인이 실패하면 refresh cookie가 있는지 확인한다.
4. refresh가 성공하면 새 cookie를 설정하고 사용자를 다시 확인한다.
5. 모두 실패하면 두 cookie를 지우고 `401 AUTH_REQUIRED`를 반환한다.

세션 확인은 이 프로젝트에서 access token 갱신을 시도하는 지점이기도 하다.

### 4단계: `AuthGate`가 보여줄 화면을 결정한다

요청이 성공하면 `setMember(authenticated)`가 회원 State를 저장한다. 마지막에는 성공과 실패 모두
`setLoading(false)`를 실행한다.

```text
member 있음  → AuthGate의 children, 즉 실제 페이지 표시
member 없음  → 로그인·회원가입 화면 표시
```

현재 코드는 세션 확인 실패를 별도 오류 문구로 보여주지 않고 로그인하지 않은 상태로 처리한다. 이는
현재 UI 동작에 대한 설명이지, 모든 애플리케이션이 반드시 따라야 하는 규칙은 아니다.

### 이 흐름에서 열 파일

```text
src/app/layout.tsx
→ src/components/AuthGate.tsx
→ src/services/apiClient.ts
→ api/authentication.py
→ api/lib/auth.py
→ src/types/auth.ts
```

## 흐름 2. 하루 기록 조회

### 1단계: 선택한 날짜 State가 바뀐다

[src/app/page.tsx](../../src/app/page.tsx)의 `Home`은 `selectedDate` State로 현재 보고 있는 날짜를
기억한다. 날짜 입력이나 이전·다음 버튼이 `selectDate()`를 호출하면 날짜를 검사한 뒤 State와 URL의
`date` 값을 함께 바꾼다.

### 2단계: 날짜 변경을 감지한 Effect가 요청한다

`selectedDate`를 의존하는 `useEffect()`가 다음 요청을 보낸다.

```text
GET /api/day?date=2026-08-17
```

### 3단계: 하루 조회 API가 입력과 사용자를 확인한다

[api/day.py](../../api/day.py)의 `handler.do_GET()`은 다음 일을 순서대로 수행한다.

1. `_requested_date()`와 `validate_date()`로 쿼리의 날짜 형식을 검사한다.
2. `require_member()`로 로그인 회원을 확인한다.
3. `meals`에서 `member_id`와 `date`가 모두 같은 행을 조회한다.
4. `weights`에서도 같은 회원·날짜의 행을 조회한다.
5. `build_day_data()`로 하루 응답을 만든다.

저장하지 않은 끼니도 프론트엔드가 항상 같은 구조로 다룰 수 있도록 `breakfast`, `lunch`, `dinner`,
`snack` 네 칸을 만들고 값이 없으면 `null`을 넣는다.

### 4단계: 응답으로 화면 State를 채운다

프론트엔드는 `DayRecord`를 받은 뒤 다음 State를 갱신한다.

| State | 응답에서 가져오는 값 | 화면에 미치는 영향 |
| --- | --- | --- |
| `dayRecord` | 하루 전체 | 네 식단 카드의 기록 |
| `weightInput` | `record.weight.weight` | 체중 입력값 |
| `isWeightLocked` | 체중 기록 존재 여부 | 저장된 체중의 읽기·수정 상태 |
| `isLoadingDay` | 요청 종료 여부 | 로딩 상태 종료 |

응답의 TypeScript 모양은 [src/types/api.ts](../../src/types/api.ts)의 `DayRecord`에서 확인한다.

### API가 없을 때의 별도 경로

홈 화면의 하루 조회는 API가 `404`일 때만
[src/services/localDayStorage.ts](../../src/services/localDayStorage.ts)의 `readLocalDay()`를 사용한다.
이는 `pnpm dev`처럼 Python API 없이 프론트엔드만 확인할 때를 위한 대체 경로다.

`401`, `500`, 네트워크 오류는 로컬 기록으로 바꾸지 않고 현재 코드에서 `dayRecord`를 `null`로 둔다.
따라서 **Supabase의 회원별 데이터와 브라우저 local storage의 데이터는 서로 다른 저장소**임을 기억해야
한다.

### 이 흐름에서 열 파일

```text
src/app/page.tsx
→ src/services/apiClient.ts
→ api/day.py
→ api/lib/auth.py
→ src/types/api.ts
```

## 흐름 3. 체중 저장

### 1단계: 브라우저가 먼저 입력을 돕는다

사용자가 체중을 입력하면 `Home.updateWeightInput()`이 빈 값인지, 숫자인지, `0`보다 큰지 검사한다.
잘못된 값은 API를 호출하기 전에 바로 안내한다. 이는 빠른 피드백을 주는 **1차 검사**다.

### 2단계: 저장 버튼이 `saveWeight()`를 실행한다

입력이 통과하면 다음 JSON 요청을 만든다.

```http
PUT /api/weight
Content-Type: application/json

{
  "date": "2026-08-17",
  "weight": 60.5
}
```

### 3단계: 서버가 신뢰 경계에서 다시 검사한다

[api/weight.py](../../api/weight.py)의 `handler.do_PUT()`은 요청 body를 읽고
[api/models/weight.py](../../api/models/weight.py)의 `WeightUpsertRequest`로 검사한다.

- 정의되지 않은 추가 field는 허용하지 않는다.
- 날짜와 숫자 형식을 검사한다.
- 미래 날짜를 거부한다.
- 체중은 `0`보다 크고 `9999.99` 이하여야 한다.

브라우저 검사는 우회할 수 있으므로 서버 검사는 생략할 수 없다. 같은 값을 두 번 검사하는 것이 아니라,
프론트엔드는 사용성을 맡고 서버는 저장소를 보호한다.

### 4단계: 로그인 회원의 체중을 upsert한다

`require_member()`가 회원을 확인하면 `upsert_weight()`가 payload에 `member_id`를 더해 `weights`에
저장한다.

```text
충돌 기준: (member_id, date)
```

같은 회원·같은 날짜의 체중이 없으면 새 행을 만들고, 있으면 그 행을 갱신한다. 다른 회원의 같은
날짜 체중과는 충돌하지 않는다. 이 구조는 [데이터베이스](./05-database.md)의 `UNIQUE`와 `upsert`
부분에서 자세히 설명했다.

### 5단계: 성공 또는 실패 State를 바꾼다

성공하면 프론트엔드는 서버가 돌려준 행을 다시 저장하지 않고 현재 입력값을 그대로 유지하면서
`isWeightLocked=true`와 “체중이 저장되었습니다.” 상태를 설정한다.

실패 경로는 둘로 나뉜다.

- API `404`: `saveLocalWeight()`로 브라우저 local storage에 저장한다.
- 그 밖의 오류: 입력값은 유지하고 다시 저장하라는 문구를 보여준다.

### 이 흐름에서 열 파일

```text
src/app/page.tsx의 updateWeightInput(), saveWeight()
→ src/services/apiClient.ts
→ api/weight.py의 handler.do_PUT()
→ api/models/weight.py
→ api/lib/auth.py
→ Supabase weights
```

## 흐름 4. 식단 저장

### 1단계: `MealCard`가 한 끼의 입력 State를 관리한다

[src/components/MealCard.tsx](../../src/components/MealCard.tsx)는 아침·점심·저녁·간식 중 한 칸을
담당한다. 음식 입력값 `foodInput`, 식단 종류 `type`, 저장 중 여부, 잠금과 오류 상태를 이 컴포넌트가
기억한다.

사용자가 저장을 누르면 `MealCard.saveMeal()`이 다음 값을 정리한다.

```text
음식이 비어 있음 → "공복" + 클린식으로 자동 저장
식단 종류를 고르지 않음 → 해당 카드의 defaultType
```

저장한 뒤에도 음식 입력칸이나 클린식·자유식 버튼을 건드리면 `수정` 버튼을 누르지 않아도
잠금이 풀리고 다시 저장할 수 있는 상태가 된다.

그 다음 API를 직접 호출하지 않고 부모에게 받은 `onSave(meal, food, type)`을 호출한다.

### 2단계: 부모 `Home`이 HTTP 요청을 맡는다

`Home`이 `MealCard`에 넘긴 `onSave`는 `Home.saveMeal()`이다. 이 함수가 다음 요청을 만든다.

```http
PUT /api/meal
Content-Type: application/json

{
  "date": "2026-08-17",
  "meal": "breakfast",
  "food": "그릭 요거트",
  "type": "clean"
}
```

컴포넌트와 부모의 책임을 나누면 `MealCard`는 “한 끼 입력 경험”에 집중하고 `Home`은 하루 전체
데이터와 API 통신을 관리할 수 있다.

### 3단계: 서버가 식단을 검사하고 저장한다

[api/meal.py](../../api/meal.py)의 `handler.do_PUT()`과
[api/models/meal.py](../../api/models/meal.py)의 `MealUpsertRequest`가 다음을 확인한다.

- 날짜는 올바르고 미래가 아니다.
- 끼니는 `breakfast`, `lunch`, `dinner`, `snack` 중 하나다.
- 음식은 공백 제거 후 1~500자다.
- 종류는 `clean` 또는 `free`다.
- 요청자는 로그인한 회원이다.

저장 충돌 기준은 다음과 같다.

```text
(member_id, date, meal)
```

따라서 한 회원은 한 날짜의 아침 칸에 하나의 최종 기록을 가진다.

### 4단계: 두 층의 State가 성공을 반영한다

서버가 반환한 `MealRecord`는 `Home.saveMeal()`에서 `dayRecord.meals[meal]`에 들어간다. 이로써 하루
전체 State가 최신 기록을 가진다.

그 후 `MealCard.saveMeal()`으로 제어가 돌아오면 카드 내부도 입력값과 종류를 확정하고 잠근 뒤 성공
상태를 알린다. API `404`일 때는 `saveLocalMeal()` 결과를 같은 방식으로 사용하고, 다른 오류는 카드의
오류 문구로 이어진다.

### 이 흐름에서 열 파일

```text
src/components/MealCard.tsx의 saveMeal()
→ src/app/page.tsx의 saveMeal()
→ src/services/apiClient.ts
→ api/meal.py의 handler.do_PUT()
→ api/models/meal.py
→ Supabase meals
→ Home의 dayRecord와 MealCard의 local State
```

## 흐름 5. 달력 기록 조회

달력에는 **한 달 요약**과 **선택한 하루 상세**라는 서로 다른 조회가 있다.

### 1단계: 달력 페이지가 `CalendarView`를 보여준다

[src/app/calendar/page.tsx](../../src/app/calendar/page.tsx)는
[src/components/CalendarView.tsx](../../src/components/CalendarView.tsx)를 렌더링한다.
`CalendarView`는 `viewedMonth` State로 현재 달을 기억한다.

### 2단계: 한 달 요약을 한 번에 요청한다

달이 바뀌면 Effect가 다음 요청을 보낸다.

```text
GET /api/calendar?year=2026&month=8
```

[api/calendar.py](../../api/calendar.py)는 연도와 월을 검사하고 그 달의 시작일과 마지막 날을 계산한다.
로그인 회원의 `weights`와 `meals`만 날짜 범위로 조회한 뒤 매 날짜에 다음 요약을 만든다.

| 값 | 계산 방식 |
| --- | --- |
| `weight` | 그날 저장한 체중 또는 `null` |
| `status: free` | 기록한 식단 중 자유식이 하나라도 있음 |
| `status: clean` | 기록한 식단이 있고 모두 클린식임 |
| `status: null` | 식단 기록이 없음 |

프론트엔드의 `recordsFromMonth()`는 체중과 식단 상태가 모두 없는 날짜를 화면용 map에서 제외하고
`loadedMonth` State에 저장한다.

### 3단계: 날짜를 누르면 하루 상세를 따로 요청한다

날짜 셀의 클릭은 `selectDate()`를 호출한다. 이때 월 응답을 상세 데이터처럼 재사용하지 않고 다음
요청을 새로 보낸다.

```text
GET /api/day?date=2026-08-17
```

월 응답에는 달력 표시에 필요한 체중과 식단 상태만 있고, 각 끼니의 음식 내용은 없기 때문이다.
`DayRecord`가 도착하면 `selectedDay` State가 바뀌고 상세 패널에 체중과 네 끼니가 나타난다.

```text
/api/calendar → 여러 날짜의 가벼운 요약
/api/day      → 한 날짜의 자세한 기록
```

### 달력의 현재 local fallback 범위

현재 `CalendarView`는 월 조회와 선택 날짜 상세 조회에서 발생한 오류를 종류와 관계없이 `catch`하고
브라우저 local storage의 기록을 사용한다. 반면 홈의 하루 조회와 저장은 API `404`만 local fallback으로
처리한다.

이는 현재 두 화면의 구현 차이다. 달력에서 로컬 결과가 보인다고 해서 Supabase 요청이 성공했다고
판단하면 안 된다. 오류를 조사할 때는 브라우저 Network 탭의 실제 상태 코드를 함께 확인한다.

### 이 흐름에서 열 파일

```text
src/app/calendar/page.tsx
→ src/components/CalendarView.tsx의 month Effect
→ api/calendar.py
→ Supabase meals, weights
→ CalendarView의 loadedMonth
→ CalendarView.selectDate()
→ api/day.py
→ CalendarView의 selectedDay와 상세 패널
```

## 흐름 6. 회원가입과 이메일 인증

회원가입은 한 번의 요청으로 끝나지 않는다. **가입 요청**과 **이메일 인증**을 차례로 통과한다.

### 1단계: 가입 정보를 제출한다

`AuthGate`에서 회원가입 모드를 선택하고 이름·이메일·비밀번호를 제출하면 `submit()`이 다음 요청을
보낸다.

```text
POST /api/authentication?action=signup
```

[api/models/auth.py](../../api/models/auth.py)의 `SignupRequest`가 이메일, 8~128자 비밀번호,
1~50자 표시 이름을 검사한다.

### 2단계: Auth 사용자와 가입 대기 정보를 만든다

`api/authentication.py`의 `_signup()`은 다음 순서로 동작한다.

1. Supabase Auth의 `sign_up()`으로 인증 사용자를 만든다.
2. `reserve_member_signup` RPC에 사용자 id, 이메일, 표시 이름을 전달해 가입 대기 정보를 보관한다.
3. `202`와 `verificationRequired: true`를 반환한다.

이 시점에는 이메일 인증을 마치지 않았으므로 로그인 완료가 아니다.

### 3단계: 프론트엔드가 인증번호 입력 단계로 바뀐다

`AuthGate`는 이메일을 `pendingEmail` State와 브라우저 `sessionStorage`의
`pendingSignupEmail`에 저장하고 `verify` 모드로 전환한다. 새로고침해도 같은 탭에서 인증 이메일을
다시 입력하지 않도록 돕는 용도다.

### 4단계: 6자리 인증번호를 확인한다

사용자가 인증번호를 제출하면 같은 `submit()`이 다음 요청을 보낸다.

```text
POST /api/authentication?action=verify_email
```

서버의 `_verify_email()`은 다음 일을 한다.

1. `EmailVerificationRequest`로 이메일과 6자리 숫자를 검사한다.
2. Supabase Auth의 `verify_otp()`로 이메일 인증번호를 확인한다.
3. `complete_verified_member_signup` RPC로 인증된 사용자의 `members` 행을 준비한다.
4. 응답에 access token과 refresh token을 각각 HttpOnly cookie로 설정한다.
5. 화면에 필요한 `Member` 데이터를 반환한다.

### 5단계: 로그인된 화면으로 전환한다

`fetchApi<Member>()`가 회원 데이터를 반환하면 `setMember(authenticated)`가 실행된다.
`pendingSignupEmail`은 `sessionStorage`에서 제거되고, `AuthGate`는 로그인 화면 대신 실제 페이지를
렌더링한다.

두 브라우저 저장값의 역할은 다르다.

| 저장 위치 | 담는 값 | 목적 | 인증 증명인가? |
| --- | --- | --- | --- |
| `sessionStorage` | 가입 중인 이메일 | 인증번호 화면의 입력 편의 | 아니요 |
| HttpOnly cookie | access·refresh token | 서버가 로그인 상태를 확인 | 예 |

JavaScript는 HttpOnly cookie의 token 원문을 읽지 않는다. `fetchApi()`의 같은 사이트 요청에 브라우저가
cookie를 자동으로 포함하고, Python API가 이를 확인한다.

### 이 흐름에서 열 파일

```text
src/components/AuthGate.tsx의 submit()
→ api/authentication.py의 _signup()
→ api/models/auth.py
→ Supabase Auth와 reserve_member_signup
→ AuthGate의 verify mode
→ api/authentication.py의 _verify_email()
→ Supabase Auth와 complete_verified_member_signup
→ HttpOnly cookies와 AuthGate의 member State
```

## 혼자서 다른 기능을 추적하는 체크리스트

다음에는 정답을 먼저 보지 않고 이 틀을 복사해 빈칸을 채워본다.

- [ ] 사용자 행동을 한 문장으로 적었다.
- [ ] 화면에서 `onClick`, `onSubmit`, `onChange` 또는 관련 Effect를 찾았다.
- [ ] `fetchApi()`에 전달한 HTTP 메서드와 경로를 찾았다.
- [ ] 같은 경로를 담당하는 `api/*.py` 파일을 찾았다.
- [ ] Pydantic model 또는 쿼리 문자열 검증 위치를 찾았다.
- [ ] `require_member()` 사용 여부를 확인했다.
- [ ] 접근하는 Auth 기능, table, RPC를 적었다.
- [ ] 성공 응답의 TypeScript type을 찾았다.
- [ ] 응답 뒤 바뀌는 React State를 찾았다.
- [ ] 실패·로딩·빈 데이터 화면을 확인했다.
- [ ] 가장 가까운 test 파일을 검색했다.

예를 들어 식단 삭제를 조사한다면 다음처럼 시작할 수 있다.

```bash
rg -n 'method: "DELETE"' src
rg -n 'do_DELETE|delete_meals_for_date' api
rg -n 'meal.*delete|delete.*meal' --glob '*test*' .
```

## 값이 이상할 때 확인할 순서

문제가 보이면 곧바로 데이터베이스부터 수정하지 말고 데이터가 지나온 순서를 거꾸로 확인한다.

1. 화면 State: 사용자가 입력하거나 선택한 값이 맞는가?
2. Network 요청: 메서드, URL, 상태 코드, JSON 구조가 맞는가?
3. API 공개 오류: `{ data, error }`의 code와 message가 무엇인가?
4. 서버 로그: 어느 handler 단계에서 실패했는가?
5. 데이터 행: 올바른 `member_id`, 날짜, 끼니로 저장되었는가?

비밀번호, `SUPABASE_SERVICE_ROLE_KEY`, access·refresh token 원문을 화면 캡처, 문서, 로그에 복사하지
않는다. 오류를 공유할 때는 민감한 값을 제거하고 상태 코드·공개 error code·재현 행동을 남긴다.

## 자주 생기는 오해

### “페이지 파일 하나만 읽으면 전체 기능을 알 수 있다”

한 기능은 컴포넌트, service, type, Python handler, model, Auth·DB에 나뉜다. 폴더를 전부 읽는 대신
사용자 행동과 API 경로를 따라 필요한 파일만 연결한다.

### “React State를 바꾸면 데이터베이스에도 저장된다”

State는 현재 브라우저 화면의 기억이다. Supabase 저장은 API 요청이 성공해야 일어난다.

### “API가 성공하면 모든 화면이 자동으로 최신 상태가 된다”

응답을 받은 뒤 어떤 State를 바꿀지는 프론트엔드 코드가 결정한다. 체중 저장은 입력 잠금과 상태를
바꾸고, 식단 저장은 서버가 반환한 행을 `dayRecord`에도 넣는 식으로 현재 구현도 서로 다르다.

### “`sessionStorage`의 이메일이 로그인 세션이다”

그 값은 가입 화면의 편의를 위한 이메일 문자열일 뿐이다. 서버가 로그인 사용자를 확인하는 근거는
HttpOnly cookie의 token이다.

### “local fallback과 Supabase는 같은 기록을 공유한다”

아니다. 하나는 현재 브라우저에, 다른 하나는 원격 PostgreSQL에 있다. 자동으로 서로 동기화되지
않는다.

### “달력 요약과 하루 상세는 같은 API 응답이다”

`/api/calendar`는 여러 날짜의 요약을, `/api/day`는 한 날짜의 체중과 네 끼니 상세를 반환한다.

## 이해 확인

1. 사이트에 접속했을 때 홈 페이지보다 먼저 로그인 상태를 확인하는 컴포넌트는 무엇인가?
2. `fetchApi()`와 Python의 `success_response()`는 어떤 응답 형식으로 연결되는가?
3. 하루 기록 조회에서 다른 회원의 데이터가 섞이지 않게 하는 두 쿼리 조건은 무엇인가?
4. 체중 입력을 프론트엔드와 백엔드에서 각각 검사하는 이유는 무엇인가?
5. `MealCard.saveMeal()`과 `Home.saveMeal()`은 각각 어떤 책임을 맡는가?
6. 달력에서 날짜를 눌렀을 때 `/api/day`를 다시 호출하는 이유는 무엇인가?
7. 회원가입 응답을 받은 직후가 아니라 이메일 인증 후에 cookie를 설정하는 이유는 무엇인가?
8. 화면에서 local 기록이 보일 때 Supabase 저장 성공을 바로 단정하면 안 되는 이유는 무엇인가?

## 다음 문서

다음 [웹 개발 핵심 용어집](./10-glossary.md)에서는 지금까지 등장한 핵심 용어를 한국어·영문 표현과
함께 짧게 다시 찾을 수 있도록 정리한다.
