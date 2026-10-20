# 로그인 흐름과 인증 개념

이 문서는 **현재 프로젝트에 구현된 인증 방식**을 설명한다. 일반적인 인증 방식을 나열하는 문서가
아니며, `Supabase Auth + Python API + HttpOnly 쿠키`로 구성된 실제 코드 흐름을 기준으로 한다.

## 1. 한 줄 요약

Supabase Auth가 이메일과 비밀번호를 검증하고 JWT 형식의 access token과 refresh token을
발급한다. Python API는 이 토큰을 HttpOnly 쿠키에 넣어 브라우저에 전달하며, 이후 요청마다 access
token을 검증하고 `members` 테이블에서 애플리케이션 회원인지 확인한다.

따라서 현재 방식은 다음 두 표현을 모두 만족한다.

- **토큰 형식:** JWT 기반 인증
- **브라우저의 토큰 보관·전송 방식:** HttpOnly 쿠키 기반 세션

서버 메모리나 별도 `sessions` 테이블에 세션 ID를 저장하는 전통적인 서버 세션 방식은 아니다.

## 2. 구성 요소와 책임

| 구성 요소 | 책임 |
| --- | --- |
| 브라우저 | 로그인 폼 제출, 쿠키 자동 전송, 로그인된 화면 표시 |
| `AuthGate` | 세션 확인, 회원가입·이메일 인증·로그인·로그아웃 UI 전환 |
| Python 인증 API | 입력 검증, Supabase Auth 호출, 쿠키 발급·삭제 |
| Supabase Auth | 비밀번호 검증, Auth 사용자 관리, JWT 발급·갱신·검증 |
| `public.members` | Auth 사용자와 연결된 애플리케이션 회원 프로필 저장 |
| 데이터 API | 인증 회원 확인 후 해당 `member_id`의 데이터만 처리 |
| `meals`, `weights` | 회원별 식단과 체중 기록 저장 |

## 3. 주요 개념

### 인증(Authentication)

사용자가 주장하는 계정의 실제 소유자인지 확인하는 과정이다. 이 프로젝트에서는 이메일과
비밀번호를 Supabase Auth가 검증한다.

### 인가(Authorization)

인증된 사용자가 어떤 데이터에 접근할 수 있는지 판단하는 과정이다. 로그인 성공만으로 식단 데이터에
접근시키지 않고, access token의 사용자 ID와 동일한 `members.id`가 존재하는지 확인한다. 이후 모든
데이터 쿼리에 `member_id` 조건을 추가한다.

### JWT

JWT(JSON Web Token)는 발급자, 사용자 ID, 만료 시각 같은 정보를 서명된 형태로 담는 토큰 형식이다.
현재 access token과 refresh token은 Supabase Auth가 발급한다. 애플리케이션이 직접 JWT를 만들거나
서명하지 않는다.

JWT는 암호화된 비밀 저장소가 아니다. 토큰 본문은 해독이 아니라 디코딩만으로 읽힐 수 있으므로,
비밀번호나 service role key 같은 비밀값을 JWT 내용에 넣어서는 안 된다.

### Access token

짧은 기간 동안 API 요청의 사용자를 증명하는 JWT다. 현재 `diet_access_token` 쿠키에 저장된다.
데이터 API는 이 토큰을 Supabase에 전달해 사용자 정보를 확인한다. 만료되거나 유효하지 않으면 인증에
실패한다.

### Refresh token

access token이 만료됐을 때 새 세션 토큰을 발급받기 위한 장기 토큰이다. 현재
`diet_refresh_token` 쿠키에 저장되며 최대 30일의 쿠키 수명을 갖는다. 실제 유효성은 쿠키 수명뿐
아니라 Supabase Auth의 세션 상태에도 좌우된다.

### HttpOnly 쿠키

HTTP 응답의 `Set-Cookie` 헤더로 저장되고 이후 같은 사이트 요청에 브라우저가 자동으로 첨부하는
쿠키다. `HttpOnly`이므로 클라이언트 JavaScript에서 `document.cookie`로 읽을 수 없다. XSS가
발생했을 때 JavaScript가 토큰 문자열을 직접 훔치는 위험을 줄인다.

현재 쿠키 속성은 다음과 같다.

| 속성 | 현재 값 | 의미 |
| --- | --- | --- |
| `HttpOnly` | 사용 | 브라우저 JavaScript의 쿠키 접근 차단 |
| `SameSite` | `Lax` | 대부분의 외부 사이트발 교차 요청에서 쿠키 전송 제한 |
| `Secure` | HTTPS 요청에서 사용 | HTTPS 연결에서만 쿠키 전송 |
| `Path` | `/` | 앱의 모든 경로에서 쿠키 전송 |
| access token 수명 | Supabase의 `expires_in` | access token 만료와 쿠키 만료를 맞춤 |
| refresh token 쿠키 수명 | 30일 | 갱신 가능한 브라우저 로그인 유지 기간의 상한 |

### 쿠키 기반 세션과 서버 저장 세션의 차이

이 프로젝트에서 “세션”은 Supabase가 발급한 토큰 쌍을 의미한다. 브라우저에는 무작위 세션 ID만
두고 서버 DB에서 세션 내용을 조회하는 방식이 아니다. Python 인스턴스가 재시작되어도 세션 상태를
로컬 메모리에서 잃지 않는다는 장점이 있지만, 토큰 폐기·갱신 정책은 Supabase Auth에 의존한다.

### `auth.users`와 `public.members`

- `auth.users`: Supabase가 관리하는 인증 계정이다. 비밀번호와 인증 상태를 담당한다.
- `public.members`: 앱이 관리하는 프로필이다. 표시 이름과 식단·체중 소유권을 담당한다.

두 테이블은 같은 UUID를 사용하며 `members.id`가 `auth.users.id`를 참조한다. Auth 사용자는 있지만
`members` 행이 없다면 이 앱의 정상 회원으로 인정하지 않는다.

### Service role key

Python API가 Supabase의 관리자 작업과 DB 작업을 수행할 때 사용하는 서버 전용 비밀키다. RLS를
우회할 수 있으므로 브라우저에 절대 전달하지 않는다. 서버가 RLS를 우회하는 만큼 데이터 API 코드가
모든 쿼리에 `member_id`를 명시하는 것이 중요하다.

## 4. 이메일 인증 회원가입 흐름

사용자는 각각 이메일과 비밀번호로 가입하며, 이메일 인증이 끝난 뒤 회원 프로필이 생성된다.

```text
브라우저
  │ POST /api/authentication?action=signup
  │ 이름 + 이메일 + 비밀번호
  ▼
Python API
  │ 입력 형식 검증
  │ 기존 members 존재 여부 확인
  ▼
Supabase Auth sign_up
  │ 미확인 auth.users 생성
  │ 6자리 인증번호 이메일 발송
  ▼
reserve_member_signup DB 함수
  │ 사용자별 가입 대기 정보 저장
  ▼
브라우저
  │ POST /api/authentication?action=verify_email
  │ 이메일 + 인증번호
  ▼
Supabase Auth verify_otp
  │ access token + refresh token 발급
  ▼
complete_verified_member_signup DB 함수
  │ 이메일 확인 상태 재검증
  │ members 1행 생성
  ▼
Python API
  │ 두 토큰을 HttpOnly 쿠키로 설정
  ▼
브라우저
  └ 로그인된 화면 표시
```

이메일이 확인되기 전에는 `members`가 생성되지 않는다. 가입 대기와 회원 데이터는 Auth 사용자 ID와
이메일 유일 제약으로 분리되며, 서로 다른 사용자는 동시에 가입할 수 있다.

## 5. 일반 로그인 흐름

1. `AuthGate`가 이메일과 비밀번호를 `POST /api/authentication?action=login`으로 전송한다.
2. Python API의 Pydantic 모델이 이메일 형식과 비밀번호 길이를 검증한다.
3. Python API가 Supabase Auth의 `sign_in_with_password`를 호출한다.
4. Supabase Auth가 자격 증명을 확인하고 access token과 refresh token을 발급한다.
5. Python API가 토큰의 사용자 ID로 `public.members`를 조회한다.
6. 회원 프로필이 존재할 때만 로그인 성공 응답을 만든다.
7. 응답의 `Set-Cookie` 헤더로 두 토큰을 HttpOnly 쿠키에 저장한다.
8. `AuthGate`가 반환된 안전한 회원 정보만 상태에 저장하고 본문을 표시한다.

잘못된 이메일과 잘못된 비밀번호는 모두 같은 `INVALID_CREDENTIALS` 응답을 사용한다. 계정 존재
여부를 공격자에게 알려주지 않기 위해서다.

## 6. 앱 진입과 세션 확인

`AuthGate`는 앱이 시작되면 `GET /api/authentication?action=session`으로 현재 세션을 확인한다. 세션이 유효하면 회원
화면을 표시하고, 그렇지 않으면 로그인 화면을 표시한다. 모든 미인증 사용자는 회원가입 화면으로
전환할 수 있다. 이메일 인증 진행 상태는 브라우저 `sessionStorage`에 이메일만 임시 보관하여 같은
탭을 새로고침해도 인증번호 화면을 유지한다.

## 7. 인증된 데이터 요청 흐름

```text
브라우저
  │ GET /api/day?date=...
  │ Cookie: diet_access_token=...
  ▼
Python API의 require_member
  │ access token 추출
  │ Supabase Auth get_user(token) 호출
  │ members.id 조회
  ▼
데이터 API
  │ WHERE member_id = 인증된 회원 ID
  ▼
Supabase Database
  └ 해당 회원의 데이터만 반환
```

브라우저의 `fetch`는 `credentials: "same-origin"`으로 구성되어 같은 출처의 API 요청에 쿠키를
보낸다. 데이터 API는 요청 본문이나 쿼리 문자열에서 `member_id`를 받지 않는다. 서버가 검증된
토큰에서 회원 ID를 결정하므로 다른 회원 ID를 조작해 보낼 수 없다.

인증 쿠키가 없거나 토큰·회원 검증에 실패하면 API는 HTTP `401`과 `AUTH_REQUIRED` 오류를
반환한다.

## 8. 토큰 만료와 갱신 흐름

`GET /api/authentication?action=session`은 먼저 access token으로 회원을 확인한다.

1. access token이 유효하면 현재 회원 정보를 바로 반환한다.
2. 검증이 실패하면 refresh token 쿠키를 찾는다.
3. refresh token이 있으면 Supabase Auth에 새 세션 발급을 요청한다.
4. 새 access token으로 회원을 다시 확인한다.
5. 성공하면 두 쿠키를 새 토큰으로 교체한다.
6. 갱신도 실패하면 두 쿠키를 만료시키고 HTTP `401`을 반환한다.

현재 자동 갱신은 `action=session` 호출 시 수행된다. 일반 데이터 API가 401을 반환했을 때 요청을
자동 갱신·재시도하는 인터셉터는 구현되어 있지 않다.

## 9. 로그아웃 흐름

1. 브라우저가 `POST /api/authentication?action=logout`을 호출한다.
2. Python API가 access token과 refresh token 쿠키에 `Max-Age=0`을 설정한다.
3. 브라우저가 두 쿠키를 삭제한다.
4. `AuthGate`가 메모리의 회원 상태를 제거하고 로그인 화면을 표시한다.

현재 로그아웃은 브라우저 쿠키를 삭제하는 방식이다. Supabase 서버에서 refresh token을 명시적으로
폐기하는 전역 로그아웃은 구현되어 있지 않다.

## 10. API 요약

| 메서드와 경로 | 인증 필요 | 역할 | 주요 상태 코드 |
| --- | --- | --- | --- |
| `POST ...?action=signup` | 아니요 | 인증 이메일 발송과 가입 대기 예약 | `202`, `400`, `500` |
| `POST ...?action=verify_email` | 아니요 | 인증번호 검증과 회원 생성 완료 | `201`, `400`, `500` |
| `POST ...?action=resend_verification` | 아니요 | 인증 이메일 재전송 | `202`, `429`, `500` |
| `POST ...?action=login` | 아니요 | 이메일·비밀번호 로그인 | `200`, `400`, `401`, `500` |
| `GET ...?action=session` | 쿠키 사용 | 세션 확인과 토큰 갱신 | `200`, `401` |
| `POST ...?action=logout` | 아니요 | 브라우저 세션 쿠키 삭제 | `200` |
| `/api/day`, `/api/calendar`, `/api/meal`, `/api/weight` | 예 | 회원별 기록 처리 | 성공 코드, `401` |

## 11. 보안 경계와 주의점

- 비밀번호는 앱 DB에 저장하지 않고 Supabase Auth에만 전달한다.
- service role key는 Python 서버 환경 변수에만 둔다.
- access/refresh token을 응답 JSON이나 브라우저 로컬 스토리지에 저장하지 않는다.
- 인증 오류 응답과 로그에 토큰, 비밀번호, 요청 본문을 포함하지 않는다.
- `SameSite=Lax`는 CSRF 위험을 줄이지만 모든 상황을 해결하지는 않는다. 상태 변경 API의 출처
  검증이나 CSRF 토큰은 현재 별도로 구현되어 있지 않다.
- service role은 RLS를 우회하므로 새 데이터 API를 만들 때도 반드시 `require_member`와
  `member_id` 필터를 함께 적용해야 한다.
- 공개 회원가입에는 봇 방지, 요청 속도 제한, 이용약관과 개인정보 처리 절차를 추가로 검토한다.
- Supabase의 Confirm email을 활성화하고 Confirm signup 메일 템플릿에 `{{ .Token }}`을 넣어야
  6자리 인증번호가 전달된다.

## 12. 관련 코드

- 프론트엔드 인증 화면과 상태: `src/components/AuthGate.tsx`
- 브라우저 API 설정: `src/services/apiClient.ts`
- 쿠키와 회원 검증: `api/lib/auth.py`
- 통합 인증 엔드포인트: `api/authentication.py`
- DB 구조와 다중 회원 전환: `supabase/migrations/202608130003_enable_multi_member_signup.sql`
- 데이터 모델·배포 설계: `docs/MEMBER_AUTH_DESIGN.md`
