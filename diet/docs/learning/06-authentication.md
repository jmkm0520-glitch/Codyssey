# 로그인과 회원별 데이터 보호 이해하기

[← 학습 가이드 목차](./README.md) · [이전: 데이터베이스 집중하기](./05-database.md)

## 이 문서에서 답할 질문

> 여러 사람이 같은 앱을 사용할 때, 서버는 요청을 보낸 사용자를 어떻게 확인하고 그 사람의 기록만
> 안전하게 보여 줄까?

앞 문서에서는 `members`, `weights`, `meals` 테이블이 `member_id`로 연결되는 구조를 확인했다. 이
문서에서는 서버가 요청마다 올바른 회원 ID를 결정하고, 다른 회원의 기록에 접근하지 못하게 막는
과정을 설명한다.

## 핵심 요약

> 로그인은 단순히 앱 화면에 들어가기 위한 절차가 아니다. 서버가 요청자를 확인하고, 그 사용자가
> 자신의 식단과 체중 기록에만 접근하도록 제한하는 출발점이다.

## 1. 왜 로그인이 필요한가?

한 사람이 혼자 쓰는 앱이라면 모든 기록을 같은 사용자 데이터로 취급해도 문제가 드러나지 않을 수
있다. 하지만 여러 사람이 함께 쓰는 앱에서는 상황이 달라진다. 서버가 요청자를 구분하지 못하면 한
회원의 체중이나 식단을 다른 회원에게 보여 주거나, 다른 회원의 기록을 수정하는 문제가 생길 수 있다.

따라서 서버는 식단 조회나 체중 저장처럼 로그인이 필요한 요청을 처리할 때마다 다음 두 가지를
판단해야 한다.

1. 이 요청을 보낸 사용자는 누구인가?
2. 확인된 사용자는 어떤 데이터에 접근할 수 있는가?

첫 번째 질문에 답하는 과정이 **인증** (Authentication)이고, 두 번째 질문에 답하는 과정이
**인가** (Authorization)다. 로그인할 때 사용자를 한 번 확인하는 것만으로는 부족하다. 식단 조회,
체중 저장, 달력 이동처럼 로그인 뒤에 이어지는 요청에서도 같은 사용자인지 확인하고 접근 범위를
제한해야 한다.

프론트엔드에서 로그인 화면을 보여 주거나 서비스 화면을 숨기는 것은 사용자 경험을 위한 처리다.
실제 데이터 보호는 서버가 요청마다 인증과 인가를 수행할 때 이루어진다.

## 2. 로그인 흐름

이 프로젝트에서 사용자가 로그인한 뒤 자신의 기록을 받아 보기까지의 전체 흐름은 다음과 같다.

1. 사용자가 이메일과 비밀번호를 입력한다.
2. [`AuthGate`](../../src/components/AuthGate.tsx)가 입력값을 Python 인증 API로 보낸다.
3. Python API가 입력 형식을 검사하고 Supabase Auth에 로그인을 요청한다.
4. Supabase Auth가 계정을 확인하고 로그인 상태를 이어 가는 데 필요한 토큰을 발급한다.
5. Python API가 같은 사용자 ID를 가진 `public.members` 회원을 확인한다.
6. Python API가 토큰을 HttpOnly 쿠키에 저장하도록 응답하고, 브라우저가 쿠키를 보관한다.
7. 이후 브라우저는 식단이나 체중 API를 호출할 때 쿠키를 자동으로 함께 보낸다.
8. Python API가 토큰과 회원을 다시 확인한 뒤, 검증된 `member_id`로 데이터를 조회한다.
9. 서버는 해당 회원의 기록만 브라우저에 반환한다.

3~5단계는 요청자가 누구인지 확인하는 인증 과정이다. 8~9단계는 확인된 회원이 자신의 데이터에만
접근하도록 제한하는 인가 과정이다. 다음 절부터 각 개념을 이 순서대로 살펴본다.

## 3. 인증: 요청을 보낸 사용자를 확인한다

**인증** (Authentication)은 요청을 보낸 사람이 자신이 주장하는 계정의 실제 사용자인지 확인하는
과정이다.

로그인할 때는 Supabase Auth가 이메일과 비밀번호를 확인한다. 로그인 이후에는 비밀번호를 요청마다
다시 보내지 않는다. 대신 로그인 성공 시 발급받은 토큰을 보내고, Supabase Auth가 그 토큰이 유효한
사용자를 가리키는지 확인한다.

```text
로그인할 때: 이메일 + 비밀번호 → Supabase Auth → 계정 사용자 확인
로그인한 뒤: 발급받은 토큰 → Supabase Auth → 같은 사용자 확인
```

인증에 성공하면 서버는 요청자의 사용자 ID를 알 수 있다. 하지만 사용자 ID를 확인했다고 해서 모든
데이터에 접근할 수 있는 것은 아니다. 접근 범위는 인가 과정에서 따로 결정한다.

## 4. 인가: 접근할 수 있는 데이터를 결정한다

**인가** (Authorization)는 인증된 사용자가 어떤 기능이나 데이터에 접근할 수 있는지 판단하는
과정이다.

이 프로젝트의 서버는 다음 순서로 회원별 접근 범위를 제한한다.

1. Supabase Auth가 확인한 사용자와 같은 ID의 `public.members` 행이 있는지 찾는다.
2. 확인된 회원의 ID를 체중·식단 쿼리의 `member_id` 조건으로 사용한다.
3. 조회하거나 저장한 결과가 해당 회원의 기록으로 제한되도록 한다.

브라우저가 요청 본문이나 URL로 보낸 회원 ID는 신뢰하지 않는다. 사용자가 그 값을 다른 회원의 ID로
바꿀 수 있기 때문이다. Python API가 인증 결과와 `members` 행을 바탕으로 `member_id`를 직접
결정한다.

[`AuthGate`](../../src/components/AuthGate.tsx)가 로그인 여부에 따라 화면을 나누는 것은 프론트엔드의
화면 제어일 뿐이다. 실제 인증과 인가는 백엔드(Python API)에서 처리한다. 백엔드는 식단 조회나 체중
저장처럼 로그인이 필요한 요청을 받을 때마다 사용자를 확인하고, 그 사용자의 데이터만 조회하거나
변경하도록 제한한다.

## 5. 로그인 상태는 왜 이어져야 하는가?

로그인 버튼을 누른 순간에만 사용자를 확인해서는 앱을 계속 사용할 수 없다. 사용자가 달력으로
이동하거나 식단과 체중을 저장할 때마다 이메일과 비밀번호를 다시 입력하게 할 수는 없기 때문이다.

앱은 여러 요청 사이에서도 `앞에서 로그인한 같은 사용자`라는 상태를 유지해야 한다. 이 상태를
**로그인 상태**라고 한다. 로그인 상태가 어떻게 이어지는지 이해하려면 세션과 토큰을 차례로 구분해야
한다.

## 6. 세션: 로그인 상태가 이어지는 관계

**세션** (Session)은 로그인한 뒤 로그아웃하거나 세션이 만료·폐기될 때까지 로그인 상태가 이어지는
기간과 관계를 뜻한다. 세션은 쿠키나 토큰 같은 값 하나를 가리키는 말이 아니다.

이 프로젝트는 애플리케이션 전용 `sessions` 테이블이나 Python 메모리에 로그인 상태를 따로 저장하지
않는다. 대신 Supabase Auth가 관리하는 세션을 사용한다. Supabase Auth는 `auth.sessions`를 관리하고,
브라우저가 로그인 상태를 이어 갈 수 있도록 필요한 토큰을 발급한다.

```text
로그인 성공
→ Supabase Auth 세션 생성
→ 브라우저가 로그인 유지에 필요한 토큰 보관
→ 이후 요청에서 같은 사용자 확인
→ 로그아웃·만료·폐기까지 로그인 상태 유지
```

## 7. 토큰: 이후 요청에서 사용하는 자격 증명

**토큰** (Token)은 로그인한 사용자임을 이후 요청에서 증명할 수 있도록 서버가 발급하는 값이다.
사용자는 로그인할 때 이메일과 비밀번호로 본인임을 증명하고 토큰을 받는다. 이후 요청에서는 비밀번호
대신 토큰을 사용한다.

```text
이메일과 비밀번호로 로그인
→ 제한된 수명과 목적을 가진 토큰 발급
→ 이후 요청에서 토큰으로 사용자 확인
```

토큰을 가진 사람은 그 토큰에 허용된 작업을 할 수 있다. 따라서 토큰도 비밀번호처럼 외부에 노출되지
않도록 보호해야 한다. 이름에 `token`이 들어 있다고 해서 무조건 유효한 것도 아니다. 서버는 토큰의
발급자, 유효 기간, 현재 세션 상태 등을 확인해야 한다.

토큰은 자격 증명 역할을 하는 여러 값을 묶어 부르는 말이다. 모든 토큰의 목적이나 내부 형식이 같은
것은 아니다. 이 프로젝트의 Supabase 세션은 두 종류의 토큰을 사용한다.

## 8. 세션에서 사용하는 두 토큰

Supabase Auth는 로그인에 성공하면 **Access token**과 **Refresh token**을 함께 발급한다. 두 토큰은
같은 세션을 유지하는 데 쓰이지만 사용하는 시점과 목적이 다르다.

### 8.1 Access token이란?

**Access token**은 식단 조회나 체중 저장처럼 로그인이 필요한 API 요청에서 현재 사용자를 확인하는
자격 증명이다. 이러한 요청을 보낼 때마다 서버로 전달된다. 비교적 수명이 짧아서 유출되었을 때
악용할 수 있는 기간을 제한한다.

### 8.2 Refresh token이란?

**Refresh token**은 Access token이 만료되었을 때 새 Access token과 Refresh token을 발급받는 데
사용한다. Access token보다 오래 유지되며, 일반 데이터 요청마다 보내는 대신 세션을 갱신할 때만
사용한다.

| 구분 | Access token | Refresh token |
| --- | --- | --- |
| 사용하는 때 | 로그인이 필요한 데이터 API를 요청할 때 | Access token을 갱신할 때 |
| 하는 일 | 현재 사용자 확인 | 새로운 토큰 쌍 발급 요청 |
| 수명 | 비교적 짧음 | 비교적 긺 |

### 8.3 두 토큰을 사용하는 흐름

```text
평소 데이터 요청
→ Access token으로 사용자 확인

Access token 만료
→ Refresh token으로 새 토큰 쌍 발급
→ 새 Access token으로 사용자 확인
```

토큰이 브라우저에 남아 있다는 사실만으로 세션이 유효하다고 단정할 수는 없다. 이미 사용되었거나
폐기된 Refresh token일 수 있고, Supabase Auth의 세션 자체가 끝났을 수도 있다. 서버는 토큰을 사용할
때마다 실제 유효성을 확인해야 한다.

## 9. 쿠키: 토큰을 저장하고 전송하는 수단

**쿠키** (Cookie)는 서버가 HTTP 응답의 `Set-Cookie` 헤더를 통해 브라우저에 저장하는 작은 값이다.
브라우저는 이후 조건에 맞는 요청을 보낼 때 쿠키를 자동으로 포함한다.

```http
Set-Cookie: 이름=값; Path=/; HttpOnly; SameSite=Lax
```

쿠키는 값을 저장하고 전송하는 수단일 뿐, 쿠키 자체가 사용자의 신원을 증명하지는 않는다. 이
프로젝트는 Access token과 Refresh token을 각각 쿠키에 담는다.

현재 [`set_session_cookies()`](../../api/lib/auth.py)는 다음 두 쿠키를 만든다.

| 쿠키 이름 | 저장하는 값 | 현재 수명 |
| --- | --- | --- |
| `diet_access_token` | Access token | Supabase 세션의 `expires_in`과 동일 |
| `diet_refresh_token` | Refresh token | 최대 2,592,000초, 즉 30일 |

두 쿠키에는 다음 속성이 공통으로 적용된다.

- `Path=/`: 앱의 모든 경로로 보내는 요청에 사용할 수 있다.
- `HttpOnly`: 브라우저 JavaScript가 `document.cookie`로 값을 읽지 못하게 한다.
- `SameSite=Lax`: 외부 사이트에서 시작된 대부분의 상태 변경 요청에는 쿠키 전송을 제한한다.
- `Secure`: `X-Forwarded-Proto`가 HTTPS일 때 적용하며, HTTPS 연결에서만 쿠키를 전송한다.

Vercel 운영 환경은 HTTPS를 사용하므로 `Secure` 속성이 붙는다. 로컬 HTTP 개발 환경에서는 이 속성을
붙이지 않는다. 코드에 `Domain` 속성을 지정하지 않았으므로 쿠키는 기본적으로 쿠키를 설정한 호스트에
한정된다.

`HttpOnly`는 JavaScript가 토큰 문자열을 직접 읽지 못하게 할 뿐, 브라우저의 쿠키 전송까지 막지는
않는다. [`fetchApi()`](../../src/services/apiClient.ts)는 `credentials: "same-origin"`을 사용하므로
브라우저가 같은 출처의 API 요청에 쿠키를 자동으로 포함한다.

## 10. JWT: Access token의 표현 형식

토큰은 역할을 나타내는 넓은 개념이고, JWT는 토큰을 표현하는 형식 중 하나다. 이 프로젝트에서
Supabase Auth가 발급하는 Access token은 JWT 형식이다.

### 10.1 JWT를 사용하는 이유

아무 정보도 담지 않은 임의의 문자열 토큰은 누구의 토큰인지, 언제 만료되는지 서버 저장소에서 따로
조회해야 한다. JWT는 사용자, 발급자, 만료 시각 같은 정보를 토큰 안에 담고 서명을 붙인다. 토큰을
받은 서버는 발급자의 서명을 검증해 내용이 발급 뒤에 바뀌지 않았는지 확인할 수 있다.

JWT 안에 사용자 정보가 있다고 해서 인증과 인가가 모두 끝나는 것은 아니다. 이 프로젝트도 Supabase
Auth의 토큰 확인과 `members` 조회를 추가로 수행한다.

### 10.2 JWT라는 이름의 의미

**JWT** (JSON Web Token)는 정보를 담고, 그 정보가 바뀌지 않았음을 검증할 수 있도록 서명한 토큰
형식이다.

- **JSON**: 이름과 값을 짝지어 정보를 표현하는 형식이다.
- **Web**: URL이나 HTTP 헤더로 전달하기 쉽도록 간결한 문자열로 표현한다.
- **Token**: 이후 요청에서 자격을 증명하는 값이다.

JWT는 내용을 감춘 비밀 상자와 다르다. 사용자와 유효 기간 같은 정보는 읽을 수 있고, 서명은 그
정보가 발급 뒤에 바뀌지 않았는지 확인하는 위조 방지 표시 역할을 한다.

### 10.3 JWT의 세 부분

이 프로젝트의 Supabase Access token처럼 서명된 JWT는 점(`.`) 두 개로 나뉜 긴 문자열이다. 실제
값은 훨씬 길지만 구조를 단순하게 표현하면 다음과 같다.

```text
aaaaa.bbbbb.ccccc
  ↑     ↑     ↑
header payload signature
```

- `header`: JWT 종류와 서명 방식 같은 정보를 담는다.
- `payload`: 사용자 ID, 발급자, 만료 시각 같은 Claim을 담는다.
- `signature`: 신뢰하는 발급자가 만든 토큰인지, header와 payload가 바뀌지 않았는지 확인하는 데
  사용한다.

점 사이의 문자열은 원래 JSON을 웹에서 전달하기 쉬운 문자로 바꾼 값이다. 이 과정을
**인코딩** (Encoding)이라고 한다. 인코딩은 표현 방법을 바꾸는 것이며 내용을 숨기는 암호화가 아니다.
인코딩한 값을 원래 표현으로 되돌리는 과정은 **디코딩** (Decoding)이라고 한다.

### 10.4 Claim이란?

**Claim**은 토큰 발급자가 사용자나 토큰에 관해 전달하는 정보 항목이다. 다음은 개념을 설명하기 위해
단순화한 payload 예시다. 실제 값은 로그인 사용자와 발급 시각에 따라 달라진다.

```json
{
  "sub": "사용자 UUID",
  "iss": "토큰을 발급한 Supabase Auth 주소",
  "exp": 1800000000
}
```

| Claim | 의미 | 확인할 내용 |
| --- | --- | --- |
| `sub` | Subject, 토큰이 가리키는 대상 | 어느 사용자의 토큰인가? |
| `iss` | Issuer, 토큰을 발급한 곳 | 신뢰하는 Supabase Auth가 발급했는가? |
| `exp` | Expiration Time, 만료 시각 | 아직 사용할 수 있는가? |

Claim 이름과 숫자를 외울 필요는 없다. payload에는 `누구의 토큰인지`, `누가 발급했는지`, `언제
만료되는지` 같은 정보가 들어갈 수 있다는 점을 이해하면 된다.

### 10.5 JWT의 내용을 읽는 것과 신뢰하는 것은 다르다

JWT 문자열을 가진 사람은 header와 payload를 디코딩해 읽을 수 있다. 따라서 비밀번호나
`SUPABASE_SERVICE_ROLE_KEY` 같은 비밀값을 payload에 넣으면 안 된다.

payload를 읽었다고 해서 그 내용을 곧바로 믿을 수도 없다. 누군가 사용자 ID나 만료 시각을 바꿔
가짜 JWT 모양의 문자열을 만들 수 있기 때문이다. 서버는 적어도 다음 내용을 확인해야 한다.

1. 신뢰하는 발급자의 키로 만든 올바른 signature인가?
2. `iss`가 신뢰하는 발급자를 가리키는가?
3. `exp`가 지나지 않았는가?

payload가 바뀌면 원래 signature와 맞지 않는다. signature 검증은 내용을 읽는 과정이 아니라, 발급
뒤에 내용이 변조되지 않았는지 확인하는 과정이다.

실제 Access token은 로그인 자격 증명이다. 임의의 온라인 디코더, 문서, 채팅, 로그에 실제 토큰을
붙여 넣지 않는다.

### 10.6 이 프로젝트에서 JWT를 확인하는 방법

이 프로젝트는 JWT를 직접 만들지 않으며, 브라우저에서 payload만 읽어 권한을 결정하지도 않는다.

1. 로그인에 성공하면 Supabase Auth가 JWT 형식의 Access token을 발급한다.
2. Python API가 전체 토큰 문자열을 `diet_access_token` HttpOnly 쿠키에 넣는다.
3. 브라우저가 이후 API 요청에 쿠키를 자동으로 포함한다.
4. [`require_member()`](../../api/lib/auth.py)가 쿠키에서 Access token을 읽는다.
5. `require_member()`가 전체 토큰을 Supabase Auth의 `get_user(token)`에 전달한다.
6. Supabase Auth가 토큰을 확인하고 유효한 사용자 정보를 반환한다.
7. Python API가 같은 사용자 ID의 `members` 행을 확인한다.

Python API는 JWT를 점으로 나누어 payload만 읽은 뒤 사용자를 믿지 않는다. JWT가 유효하더라도 같은
ID의 `members` 행이 없으면 이 앱의 회원으로 허용하지 않는다.

## 11. 개념 관계 정리

지금까지 설명한 개념은 다음처럼 연결된다.

```text
로그인
→ 인증: 요청자가 누구인지 확인
→ 인가: 확인된 사용자의 접근 범위 결정

세션: 로그인 상태가 여러 요청 사이에서 이어지는 관계
├─ Access token: 식단·체중 API에서 사용자를 확인하는 자격 증명
└─ Refresh token: 만료된 Access token을 갱신하는 자격 증명

쿠키: 두 토큰을 브라우저에 저장하고 요청에 자동으로 포함하는 수단
JWT: Access token을 표현하는 형식
```

따라서 “쿠키 기반인가, JWT 기반인가?”를 반드시 둘 중 하나로만 나눌 필요는 없다. 이 프로젝트는
Supabase Auth 세션을 사용하고, JWT 형식의 Access token을 HttpOnly 쿠키에 저장해 전송한다.

## 12. 회원가입과 이메일 확인 흐름

회원가입은 사용자가 입력한 이메일을 실제로 사용할 수 있는지 확인한 뒤 앱 회원을 만드는 과정이다.

1. 사용자가 [`AuthGate`](../../src/components/AuthGate.tsx)에 이름, 이메일, 비밀번호를 입력한다.
2. `AuthGate`가 `POST /api/authentication?action=signup`을 호출한다.
3. Python API가 Pydantic으로 이름, 이메일, 비밀번호를 검사한다.
4. Supabase Auth의 `sign_up()`이 미확인 `auth.users` 사용자를 만들고 확인 메일을 보낸다.
5. `reserve_member_signup` DB 함수가 표시 이름과 이메일을 `member_signup_claims`에 임시로 보관한다.
6. 사용자가 이메일로 받은 6자리 인증번호를 입력한다.
7. `AuthGate`가 `POST /api/authentication?action=verify_email`을 호출한다.
8. Supabase Auth의 `verify_otp()`가 인증번호를 확인하고 세션과 토큰 쌍을 발급한다.
9. `complete_verified_member_signup` DB 함수가 이메일 확인 상태를 다시 검사하고
   `public.members` 행을 만든다.
10. Python API가 두 토큰을 HttpOnly 쿠키로 설정하고, 공개해도 안전한 회원 프로필만 JSON으로
    반환한다.

`AuthGate`는 인증번호 입력 화면을 새로고침 뒤에도 유지하기 위해 가입 중인 이메일만
`sessionStorage`에 저장한다. Access token과 Refresh token은 `sessionStorage`나 `localStorage`에
저장하지 않는다.

## 13. 이메일과 비밀번호로 로그인하는 흐름

이미 가입을 마친 회원의 로그인은 다음 순서로 진행된다.

1. `AuthGate`가 이메일과 비밀번호를 `POST /api/authentication?action=login`으로 보낸다.
2. [`CredentialsRequest`](../../api/models/auth.py)가 이메일 형식과 8~128자 비밀번호 길이를 검사한다.
3. Python API가 Supabase Auth의 `sign_in_with_password()`를 호출한다.
4. Supabase Auth가 계정을 확인하고 세션의 Access token과 Refresh token을 반환한다.
5. Python API가 같은 사용자 ID의 `members` 행을 확인한다.
6. 이메일 확인을 마쳤지만 가입 완료 처리가 남은 회원이라면 필요한 회원 완료 DB 함수를 실행한다.
7. Python API가 두 토큰을 HttpOnly 쿠키로 설정한다.
8. 응답 JSON에는 `id`, `email`, `displayName`만 담고 토큰은 포함하지 않는다.
9. `AuthGate`가 회원 프로필을 React 상태에 저장하고 서비스 화면을 보여 준다.

잘못된 이메일과 잘못된 비밀번호에는 모두 `INVALID_CREDENTIALS` 오류를 사용한다. 두 경우를 구분해
알려 주지 않으므로 해당 이메일의 계정이 실제로 존재하는지 자세히 노출하지 않는다.

## 14. 앱 진입 시 세션을 확인하고 갱신하는 흐름

앱을 열면 `AuthGate`가 `GET /api/authentication?action=session`을 호출해 현재 로그인 상태를 확인한다.

1. Access token 쿠키가 있으면 `require_member()`로 Supabase Auth 사용자와 `members` 회원을 확인한다.
2. 확인에 성공하면 현재 회원 프로필을 반환한다.
3. Access token 확인에 실패하면 Refresh token 쿠키가 있는지 찾는다.
4. Refresh token도 없으면 두 쿠키를 만료시키고 HTTP `401`을 반환한다.
5. Refresh token이 있으면 Supabase Auth의 `refresh_session()`으로 새 토큰 쌍을 요청한다.
6. 갱신에 성공하면 새 Access token으로 회원을 다시 확인하고 두 쿠키를 교체한다.
7. 갱신이나 회원 확인에 실패하면 두 쿠키를 만료시키고 HTTP `401`을 반환한다.

현재 자동 갱신은 이 세션 엔드포인트를 호출할 때만 수행한다. `/api/day`, `/api/weight` 같은 일반
데이터 API가 `401`을 반환했을 때, 프론트엔드가 세션을 갱신하고 원래 요청을 자동으로 다시 보내는
기능은 없다.

## 15. 인증된 사용자가 데이터를 요청하는 흐름

로그인한 회원이 체중을 저장할 때는 다음 경계를 다시 통과한다.

1. `fetchApi("/api/weight", { credentials: "same-origin" })`가 API 요청을 보낸다.
2. 브라우저가 `diet_access_token` 쿠키를 자동으로 포함한다.
3. Python API의 `require_member()`가 쿠키에서 Access token을 읽는다.
4. Supabase Auth의 `get_user(access_token)`이 사용자를 확인한다.
5. Python API가 `public.members`에서 같은 ID의 회원을 확인한다.
6. 검증된 `member.id`를 체중 데이터의 `member_id`에 넣는다.
7. Supabase PostgreSQL이 해당 회원의 기록으로 저장한다.

브라우저는 `member_id`를 선택해서 보내지 않는다. Python API가 확인된 사용자와 회원 정보를 바탕으로
ID를 결정한다. 쿠키가 없거나 토큰·회원 확인에 실패하면 로그인이 필요한 데이터 API는 HTTP `401`과
`AUTH_REQUIRED`를 반환한다.

## 16. 이 프로젝트의 실제 인가 경계

개인 데이터 테이블에는 RLS가 켜져 있지만, Python API는 RLS를 우회할 수 있는 `service role`로
Supabase에 접근한다. 브라우저의 사용자 JWT를 테이블 쿼리에 직접 적용해 RLS 정책이 회원 행을
선택하는 구조가 아니다.

따라서 다음 두 조건이 함께 지켜져야 회원별 데이터가 분리된다.

1. 모든 보호된 엔드포인트가 `require_member()`로 Supabase Auth 사용자와 앱 회원을 확인한다.
2. 모든 개인 데이터 쿼리와 저장 데이터가 검증된 `member.id`를 조건으로 사용한다.

`service role` key는 Python 서버의 환경 변수에만 보관하며 브라우저로 보내지 않는다.

## 17. 로그아웃 흐름과 현재 범위

현재 로그아웃은 다음 순서로 동작한다.

1. `AuthGate`가 `POST /api/authentication?action=logout`을 호출한다.
2. Python API가 두 인증 쿠키에 `Max-Age=0`을 설정한다.
3. 브라우저가 `diet_access_token`과 `diet_refresh_token` 쿠키를 제거한다.
4. `AuthGate`가 React 상태의 회원을 `null`로 바꾸고 로그인 화면을 보여 준다.

현재 로그아웃 엔드포인트는 Supabase Auth의 서버 측 `sign_out()`을 호출하거나 모든 기기의 세션을
폐기하지 않는다. 즉, 현재 기기의 브라우저가 보관한 토큰을 제거하는 범위의 로그아웃이다. 토큰이
별도로 유출되었을 때 그 토큰까지 즉시 폐기하는 전역 로그아웃과는 다르다.

## 18. 쿠키 보안 속성과 남아 있는 위험

쿠키의 보안 속성은 특정 공격의 위험을 줄이지만, 한 가지 속성이 모든 문제를 해결하지는 않는다.

### 18.1 HttpOnly

`HttpOnly`는 JavaScript가 쿠키의 토큰 문자열을 직접 읽지 못하게 한다. XSS가 발생했을 때 토큰 문자열
자체를 훔치는 위험을 줄일 수 있다. 그러나 악성 JavaScript가 사용자의 브라우저에서 요청을 보내는
행위까지 막지는 못하므로 XSS 취약점 자체도 예방해야 한다.

### 18.2 SameSite=Lax

`SameSite=Lax`는 외부 사이트에서 시작된 대부분의 `POST`, `PUT`, `DELETE` 요청에 쿠키가 포함되는
것을 제한해 CSRF 위험을 줄인다. 하지만 모든 브라우저와 요청 상황의 CSRF를 단독으로 막는 설정은
아니다. 현재 별도의 CSRF token이나 `Origin` 검증은 구현되어 있지 않다.

### 18.3 Secure와 HTTPS

`Secure` 쿠키는 HTTPS 연결에서만 전송된다. HTTPS는 브라우저와 Vercel 사이를 오가는 토큰이
네트워크에서 그대로 노출될 위험을 줄인다. `Secure` 속성만으로 토큰 탈취 가능성이 모두 사라지는
것은 아니다.

## 19. 자주 하는 오해

### 19.1 로그인, 세션, 쿠키, 토큰, JWT는 같은 말인가?

아니다. 로그인은 사용자를 인증하는 동작이고, 세션은 로그인 상태가 이어지는 관계다. 토큰은 이후
요청에서 사용하는 자격 증명이고, 쿠키는 값을 저장하고 전송하는 수단이다. JWT는 토큰을 표현하는
형식 중 하나다.

### 19.2 JWT를 사용하면 쿠키를 사용하지 않는가?

아니다. JWT를 어디에 저장하고 어떻게 보낼지는 별도의 선택이다. 이 프로젝트는 JWT 형식의 Access
token을 HttpOnly 쿠키에 저장한다.

### 19.3 JWT payload는 암호화된 비밀 공간인가?

아니다. payload는 디코딩해 읽을 수 있다. signature는 변조 여부를 확인하지만 내용을 숨기지는
않는다.

### 19.4 Refresh token도 JWT인가?

Supabase Auth에서는 아니다. Access token은 JWT이고, Refresh token은 세션 갱신에 사용하는 고유
문자열이다.

### 19.5 HttpOnly면 모든 XSS와 CSRF 문제가 해결되는가?

아니다. `HttpOnly`는 JavaScript가 토큰 문자열을 직접 읽지 못하게 하는 한 가지 보호 장치다. XSS
예방과 CSRF 방어에는 다른 보호도 함께 필요하다.

### 19.6 React 상태에 회원 정보가 있으면 서버 권한도 생기는가?

아니다. 프론트엔드 상태는 사용자가 바꿀 수 있다. 서버는 요청마다 토큰과 `members` 회원을 확인하고,
검증된 `member_id`에 해당하는 데이터만 다루도록 제한한다.

### 19.7 로그아웃하면 모든 기기의 Supabase 세션이 즉시 폐기되는가?

현재 구현에서는 아니다. 현재 브라우저의 쿠키를 만료할 뿐, Supabase Auth의 서버 측 전역 로그아웃은
호출하지 않는다.

## 20. 이해 확인

1. 여러 회원이 사용하는 앱에서 로그인이 필요한 이유는 무엇인가?
2. 인증과 인가는 각각 어떤 질문에 답하는가?
3. 로그인 상태와 세션은 어떤 관계인가?
4. 세션과 토큰은 무엇이 다른가?
5. Access token과 Refresh token은 각각 언제 사용하는가?
6. 쿠키는 토큰과 무엇이 다른가?
7. 토큰과 JWT는 어떤 관계인가?
8. JWT의 header, payload, signature는 각각 어떤 역할을 하는가?
9. JWT payload를 읽는 것만으로 사용자를 신뢰할 수 없는 이유는 무엇인가?
10. `require_member()`는 쿠키의 존재 여부 외에 무엇을 확인하는가?
11. 현재 로그아웃이 처리하는 범위와 처리하지 않는 범위는 무엇인가?

답하기 어렵다면 **로그인이 필요한 이유 → 인증 → 인가 → 로그인 상태 → 세션 → 토큰 → Access
token과 Refresh token → 쿠키 → JWT** 순서로 다시 읽어 본다.

## 21. 관련 코드를 읽는 순서

1. [`src/components/AuthGate.tsx`](../../src/components/AuthGate.tsx): 인증 화면과 앱 진입 시 세션 확인
2. [`api/authentication.py`](../../api/authentication.py): 회원가입, 로그인, 이메일 확인, 세션 갱신,
   로그아웃 처리
3. [`api/models/auth.py`](../../api/models/auth.py): 인증 요청 입력 규칙
4. [`api/lib/auth.py`](../../api/lib/auth.py): 쿠키 발급·삭제와 `require_member()`
5. [`api/lib/supabase_client.py`](../../api/lib/supabase_client.py): 서버 전용 Supabase 클라이언트
6. [`202608130003_enable_multi_member_signup.sql`](../../supabase/migrations/202608130003_enable_multi_member_signup.sql):
   현재 다중 회원 가입 DB 함수

## 공식 참고 자료

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase User Sessions](https://supabase.com/docs/guides/auth/sessions)
- [Supabase JSON Web Token](https://supabase.com/docs/guides/auth/jwts)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [RFC 7519: JSON Web Token](https://www.rfc-editor.org/rfc/rfc7519)

## 다음 문서

다음 [인프라와 배포 집중하기](./07-infrastructure-and-deployment.md)에서는 가비아에서 관리하는 도메인과
DNS 레코드가 Vercel로 연결되는 과정, Vercel과 Supabase의 역할, HTTPS와 환경 변수를 설명한다.
