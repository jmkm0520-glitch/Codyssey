# 인프라와 배포 집중하기

[← 학습 가이드 목차](./README.md) · [이전: 인증과 인가 집중하기](./06-authentication.md)

## 이 문서에서 답할 질문

> 브라우저에 `https://www.food-broccoli.shop`을 입력하면 가비아·Vercel·Supabase 중 어디를 어떤
> 순서로 거치는가?

앞 문서까지는 화면, API, 데이터베이스와 인증의 내부 동작을 살펴봤다. 이제 이 구성 요소가 인터넷에서
실행되고 서로 연결되도록 받쳐 주는 환경을 확대한다.

## 먼저 기억할 한 문장

> 가비아 DNS는 도메인이 찾아갈 Vercel을 알려 주고, Vercel은 화면과 Python API를 실행하며,
> Supabase는 사용자 인증과 영구 데이터를 담당한다.

세 서비스가 한 기능에 이어서 등장하지만 같은 일을 하는 것은 아니다.

## 인프라는 앱이 실행될 자리와 연결이다

**인프라** (Infrastructure)는 애플리케이션이 사용자의 컴퓨터 밖에서 실행되고 다른 서비스와 통신하도록
받쳐 주는 실행 환경과 연결을 뜻한다.

| 구성 요소 | 이 프로젝트에서 맡은 일 | 맡지 않는 일 |
| --- | --- | --- |
| 브라우저 | 도메인 접속, 화면 실행, HTTPS 요청 | 서버 비밀키 보관·최종 권한 판정 |
| 가비아 | 도메인과 A·CNAME DNS 레코드 관리 | 화면·Python API 실행 |
| Vercel | Next.js 배포, Python Function 실행, custom domain·HTTPS 연결 | 식단·체중 영구 저장 |
| Supabase Auth | 사용자·이메일 확인·session 관리 | Next.js 화면 배포 |
| Supabase PostgreSQL | 회원·식단·체중 영구 저장 | custom domain의 DNS 관리 |

전체 흐름을 먼저 보면 다음과 같다.

```text
사용자 브라우저
→ 가비아에서 관리하는 DNS 레코드로 Vercel 위치 확인
→ HTTPS로 Vercel에 접속
→ Next.js 화면 또는 Python API 실행
→ Python API가 HTTPS로 Supabase Auth·PostgreSQL 호출
→ 결과가 Vercel과 브라우저를 거쳐 사용자에게 돌아옴
```

## 첫 번째 개념: 도메인은 사람이 읽는 주소다

**도메인** (Domain)은 사용자가 사이트를 찾기 위해 입력하는 사람이 읽기 쉬운 이름이다. 이 프로젝트의
대표 Production URL은 다음과 같다.

```text
https://www.food-broccoli.shop
```

| 부분 | 실제 값 | 역할 |
| --- | --- | --- |
| scheme | `https` | 암호화된 HTTP 연결을 사용한다. |
| hostname | `www.food-broccoli.shop` | DNS로 위치를 찾고 인증서가 확인할 전체 이름이다. |
| subdomain | `www` | 기본 도메인 앞에서 웹사이트 주소를 구분한다. |
| apex·root domain | `food-broccoli.shop` | 다른 이름이 앞에 붙지 않은 기본 도메인이다. |
| path | `/` | Vercel에 첫 화면을 요청한다. |

도메인을 구입했다는 사실만으로 사이트 코드가 그곳에서 실행되지는 않는다. 그 이름이 어느 배포를
찾아갈지 DNS로 연결해야 한다.

## 두 번째 개념: DNS는 이름이 찾아갈 대상을 알려 준다

**DNS** (Domain Name System)는 도메인 이름을 네트워크에서 찾아갈 수 있는 주소나 다른 hostname과
연결한다.

### 캐시는 이전 결과를 잠시 기억한다

**캐시** (Cache)는 전에 찾은 결과를 잠시 기억해 두었다가 같은 결과가 다시 필요할 때 재사용하는
저장 공간이다. 매번 처음부터 같은 작업을 반복하지 않아도 되므로 결과를 더 빨리 얻을 수 있다.

DNS에서는 브라우저, 운영체제, DNS resolver 등이 이전에 찾은 도메인의 연결 결과를 캐시에 보관할
수 있다.

```text
처음 접속
→ DNS에 www.food-broccoli.shop의 위치를 물어봄
→ Vercel로 가는 결과를 받음
→ 결과를 캐시에 잠시 저장

다시 접속
→ 아직 사용할 수 있는 결과가 캐시에 있음
→ DNS에 다시 묻지 않고 기억한 결과를 사용
```

**TTL** (Time To Live)은 DNS 결과를 캐시에서 얼마 동안 사용할 수 있는지 나타내는 시간이다. TTL이
지나면 이전 결과를 계속 믿지 않고 DNS에 다시 물어 최신 결과를 받는다.

따라서 가비아에서 DNS record를 바꿔도 TTL이 지나기 전에는 일부 브라우저나 네트워크가 캐시에 남은
이전 Vercel 주소를 사용할 수 있다. 캐시는 가비아의 원본 설정을 바꾸는 곳이 아니라, 이미 받은
결과를 잠시 기억하는 곳이다.

### DNS의 답은 누가 찾아줄까?

**DNS resolver**는 브라우저 대신 도메인의 연결 결과를 찾아주는 역할을 한다. 캐시에 답이 없으면
도메인의 공식 DNS record를 보관한 **authoritative DNS**에 물어본다. 이 프로젝트의 공식 DNS
record는 가비아 DNS 관리툴에서 관리한다.

```text
브라우저: www.food-broccoli.shop은 어디로 가야 하나요?
→ DNS resolver가 캐시 또는 authoritative DNS에 질의
→ Vercel을 가리키는 record 확인
→ 브라우저가 Vercel로 연결
```

현재 이 프로젝트의 DNS record는 가비아 DNS 관리툴에서 관리한다. DNS 확인이 끝난 뒤 실제 페이지와
API 요청을 처리하는 곳은 Vercel이다. 사용자의 모든 웹 요청이 가비아 서버를 통과하는 구조가 아니다.

## 세 번째 개념: A와 CNAME은 연결 방식이 다르다

### A 레코드

**A record**는 hostname을 IPv4 주소에 연결한다. Vercel custom domain에서는 일반적으로 apex/root
domain에 A record를 안내한다.

### CNAME 레코드

**CNAME record**는 한 hostname을 다른 hostname의 별칭으로 연결한다. Vercel에서는 일반적으로
`www` 같은 subdomain에 CNAME record를 안내한다.

| Record | 값이 가리키는 대상 | 일반적인 Vercel 연결 예 |
| --- | --- | --- |
| A | 숫자 형태의 IPv4 주소 | apex/root domain |
| CNAME | 다른 hostname | `www` 같은 subdomain |

## 이 프로젝트의 가비아·Vercel 연결 상태

이 프로젝트에서는 사용자가 **Vercel의 Domains 설정이 안내한 A·CNAME record를 가비아 DNS
관리툴에 입력했다.** 따라서 domain 등록·DNS 설정과 애플리케이션 실행 위치가 다음처럼 나뉜다.

```text
가비아
└─ domain의 A·CNAME record 관리
   └─ Vercel이 안내한 target을 가리킴

Vercel
└─ 해당 custom domain을 프로젝트에 등록·검증
   └─ Production deployment에 연결
```

2026-08-18에 외부 DNS와 HTTPS 응답을 확인한 결과는 다음과 같다.

| 입력 주소·호스트 | 확인된 DNS 연결 | 확인된 HTTPS 동작 |
| --- | --- | --- |
| `www.food-broccoli.shop` | CNAME `dc709597a4ea0e55.vercel-dns-017.com` | `200`, Vercel이 첫 화면 응답 |
| `food-broccoli.shop` | A `216.198.79.1` | `308`, `https://www.food-broccoli.shop/`으로 이동 |

DNS target과 HTTP 응답은 운영 설정에 따라 바뀔 수 있다. 위 표는 확인 시점의 설명 자료이며, 설정을
변경할 때의 최종 근거는 **현재 Vercel Domains 안내와 가비아 DNS 관리 화면**이다.

다음 네 항목은 Vercel Domains 화면과 가비아 설정에서 서로 맞아야 한다.

1. 어떤 domain 또는 subdomain을 연결하는가?
2. record type이 A인가 CNAME인가?
3. host가 apex인지 `www` 같은 subdomain인지?
4. target 값이 Vercel이 현재 안내한 값과 같은가?

정확한 target과 TTL은 저장소 설정으로 고정된 값이 아니며 Vercel 설정 변경에 따라 달라질 수 있다.
따라서 이 문서의 과거 값이나 인터넷 예시를 복사하지 않고 현재 두 관리 화면을 대조해야 한다.

root domain의 `308`은 DNS 기능이 아니라 Vercel이 HTTPS 요청을 받은 뒤 보내는 HTTP redirect다.
A 레코드가 브라우저를 Vercel로 연결한 다음, Vercel이 `Location` 응답 헤더로 `www` 주소를 알려 준다.
CNAME과 redirect는 둘 다 `www`와 관련되어 보이지만 서로 다른 단계다.

## 사이트 접속을 처음부터 끝까지 따라가기

사용자가 대표 Production URL을 입력했을 때의 접속 순서는 다음과 같다.

1. 사용자가 브라우저에 `https://www.food-broccoli.shop`을 입력한다.
2. 브라우저가 `https`, `www.food-broccoli.shop`, `/`를 각각 통신 방식·hostname·path로 구분한다.
3. 브라우저와 운영체제가 이전 DNS 결과를 cache에서 찾는다.
4. cache에 결과가 없으면 설정된 DNS resolver에 hostname의 위치를 묻는다.
5. resolver가 가비아에서 관리하는 authoritative DNS record를 확인한다.
6. `www`의 CNAME이 가리키는 Vercel hostname을 따라가 최종 접속 주소를 얻는다.
7. 브라우저가 그 주소의 Vercel edge와 HTTPS 연결을 만든다.
8. 브라우저가 인증서가 `www.food-broccoli.shop`에 유효한지 확인한다.
9. 브라우저가 hostname과 첫 화면 path가 담긴 `GET /` 요청을 보낸다.
10. Vercel이 custom domain에 연결된 Production deployment를 선택한다.
11. Vercel이 Next.js가 준비한 HTML을 `200` 응답으로 보내고, 브라우저가 CSS·JavaScript도 요청한다.
12. 브라우저가 화면을 그리고 JavaScript·React를 실행한다.
13. `AuthGate`가 session API를 호출하면서 Python API와 Supabase Auth를 사용하는 다음 흐름이 시작된다.

DNS는 **어디로 접속할지** 알려 주는 단계까지 담당한다. 그 뒤 어떤 화면이나 API 코드를 실행할지는
Vercel deployment가 결정한다. Supabase는 DNS 조회나 첫 HTML 전달에 참여하지 않고, Python API가
세션과 데이터를 확인할 때 별도의 HTTPS 요청으로 사용한다.

`https://food-broccoli.shop`을 입력한 경우에는 다음과 같이 한 번 더 이동한다.

```text
food-broccoli.shop의 A 레코드로 Vercel 위치 확인
→ Vercel에 GET / 요청
→ 308 응답의 Location: https://www.food-broccoli.shop/
→ 브라우저가 www 주소로 새 HTTPS 요청
→ 위의 대표 Production URL 접속 순서 진행
```

## HTTPS와 인증서

**HTTPS**는 HTTP 요청과 응답을 암호화된 연결로 전달하고 접속한 서버의 domain을 확인할 수 있게 한다.
로그인 token과 개인 식단·체중 기록이 네트워크를 이동하므로 운영 환경에 필수다.

Vercel은 custom domain을 프로젝트에 추가하면 인증서 발급을 시도한다. A·CNAME 설정이 전파되고
domain 검증에 성공해야 Vercel이 인증서를 정상적으로 발급해 HTTPS를 제공할 수 있다.

```text
Vercel에 custom domain 추가
→ 가비아에 안내된 DNS record 설정
→ DNS 전파와 domain 검증
→ Vercel 인증서 발급
→ HTTPS 접속 가능
```

HTTPS는 앞 문서의 `Secure` cookie가 전송되는 기반이기도 하다. 다만 HTTPS가 입력 검증, 인증, 인가를
대신하는 것은 아니다.

## Vercel은 URL path에 따라 실행할 코드를 찾는다

DNS는 `www.food-broccoli.shop`이라는 **hostname**을 Vercel에 연결할 뿐 `/api/weight` 같은
**path**를 해석해 프론트엔드와 백엔드를 나누지 않는다.

Vercel deployment가 요청 path에 따라 이 프로젝트의 코드를 실행한다.

| 요청 path 예 | 실행 영역 | 저장소 위치 |
| --- | --- | --- |
| `/`, `/calendar`, `/import` | Next.js page | `src/app/` |
| `/_next/*` | Next.js가 만든 JavaScript·CSS asset | build 결과 |
| `/api/authentication` | Python 인증 Function | `api/authentication.py` |
| `/api/day`, `/api/weight`, `/api/meal` | Python 데이터 Function | `api/*.py` |

프론트엔드와 Python API가 같은 custom domain 아래에 있으므로 브라우저는 `/api/*`를 same-origin으로
호출하고 로그인 cookie도 같은 site 요청에 보낼 수 있다.

## 배포 설정 파일은 각각 무엇을 알려 주는가?

- [`vercel.json`](../../vercel.json): framework가 Next.js이며 build command가 `pnpm build`임을
  Vercel에 알려 준다.
- [`package.json`](../../package.json): Next.js build와 개발·검사 명령, Node 의존성을 정의한다.
- [`.python-version`](../../.python-version): Vercel Python runtime과 로컬 환경이 Python 3.12를
  선택하도록 한다.
- [`requirements.txt`](../../requirements.txt): Supabase client와 Pydantic 같은 Python 의존성을
  정의한다.
- `src/`: Next.js·React 프론트엔드 source다.
- `api/`: `handler`를 가진 Python Vercel Function source다.

Vercel은 한 프로젝트를 build하면서 Next.js 결과와 Python Functions를 같은 deployment에 준비한다.
Vercel이 두 영역을 배포한다고 두 코드가 같은 runtime에서 한 process로 계속 실행된다는 뜻은 아니다.

## Vercel과 Supabase는 어떻게 연결되는가?

브라우저는 Supabase table을 직접 호출하지 않는다.

```text
브라우저
  │ same-origin HTTPS /api/*
  ▼
Vercel Python Function
  │ SUPABASE_URL로 HTTPS 요청
  │ SUPABASE_SERVICE_ROLE_KEY는 서버 안에서만 사용
  ▼
Supabase
  ├─ Auth: 사용자·이메일 확인·session
  └─ PostgreSQL: members·weights·meals
```

Vercel은 요청이 있을 때 애플리케이션 코드를 실행한다. Supabase는 Vercel과 별도의 서비스로 영구
데이터와 Auth 상태를 관리한다. 현재 프로젝트 코드에서 Supabase Storage는 사용하지 않는다.

가비아 DNS가 Supabase 연결을 정하는 것도 아니다. Python Function은 환경 변수의 Supabase project
URL을 사용해 Vercel에서 Supabase로 나가는 별도 HTTPS 요청을 만든다.

## Local·Preview·Production 환경 구분하기

같은 코드를 실행해도 누구에게 보여 주고 어떤 설정을 사용하는지에 따라 환경이 나뉜다.

| 환경 | 실행 위치·목적 | URL | Vercel 설정 범위 |
| --- | --- | --- | --- |
| Local/Development | 개발자 컴퓨터에서 수정·확인 | 보통 `localhost` | Development |
| Preview | 운영에 반영하기 전 공유·검토 | deployment별 Preview URL | Preview |
| Production | 실제 사용자가 쓰는 운영 환경 | custom domain | Production |

Vercel과 Git이 연동된 일반적인 흐름에서는 production branch가 아닌 branch나 Pull Request가 Preview
deployment를 만들고, production branch의 변경이 Production deployment를 만든다. 실제 어떤 branch가
production인지와 자동 배포 여부는 Vercel project의 Git 설정에서 확인한다.

세 환경은 source code가 같아도 domain, Supabase project, 사용자 데이터와 secret이 다를 수 있다.
Preview가 실수로 Production DB를 수정하지 않도록 환경별 값과 테스트 범위를 명확히 구분해야 한다.

## 환경 변수는 코드 밖의 실행 설정이다

**환경 변수** (Environment Variable)는 실행 환경이 코드에 전달하는 `이름=값` 설정이다. 같은 source를
다른 환경에서 실행하면서 연결 대상과 secret을 분리할 수 있다.

이 프로젝트의 Python API는 다음 두 값을 사용한다.

| 변수 | 목적 | 공개 가능 여부 |
| --- | --- | --- |
| `SUPABASE_URL` | 연결할 Supabase project URL | 현재 구조에서는 server 설정 |
| `SUPABASE_SERVICE_ROLE_KEY` | RLS를 우회할 수 있는 server 권한 | 절대 browser에 공개하지 않음 |

Vercel에서는 Development·Preview·Production 중 어떤 환경에 변수를 적용할지 각각 선택할 수 있다.
환경 변수 변경은 이미 끝난 deployment에 소급 적용되지 않으므로, 새 값이 필요한 환경을 다시
deploy해야 한다.

### 저장소에 들어가는 것과 들어가지 않는 것

- [`.env.example`](../../.env.example)에는 필요한 **변수 이름과 설명만** 기록한다.
- 실제 `.env*` 파일은 [`.gitignore`](../../.gitignore)로 Git에서 제외한다.
- Vercel project 연결 정보와 내려받은 개발 설정이 있는 `.vercel/`도 Git에서 제외한다.
- Python 가상 환경 `.venv/`도 Git에서 제외한다.
- Production secret은 Vercel project의 해당 environment에 설정한다.

Next.js의 `NEXT_PUBLIC_` 접두사가 붙은 환경 변수는 browser bundle에 포함될 수 있다.
`SUPABASE_SERVICE_ROLE_KEY`에는 이 접두사를 붙이면 안 되며 프론트엔드 source에서도 읽지 않는다.

## 배포가 만들어지는 과정

배포는 source code를 사용자가 접속할 수 있는 실행 결과로 만드는 과정이다.

```text
1. code 변경
2. Git integration 또는 Vercel CLI가 deployment 시작
3. Vercel이 저장소와 설정 읽기
4. pnpm build로 Next.js production 결과 준비
5. Python runtime이 api/*.py, Python 3.12, requirements.txt 준비
6. Preview 또는 Production deployment 생성
7. 성공한 Production deployment를 custom domain에서 제공
```

Production domain을 다른 deployment로 지정하거나 redirect하는 별도 설정도 가능하므로, 최종 연결은
Vercel Domains와 deployment 상태에서 확인한다.

애플리케이션 배포 성공이 Supabase schema 변경 성공을 자동으로 의미하지는 않는다. 현재 build
설정에는 SQL migration을 실행하는 단계가 없다. `supabase/migrations/` 변경은 데이터 보호와 적용
순서를 검토한 뒤 별도로 적용해야 한다.

## 문제가 생겼을 때 계층별로 위치 찾기

증상부터 가장 가까운 계층을 하나씩 확인하면 불필요하게 여러 설정을 동시에 바꾸는 일을 피할 수 있다.

| 증상 | 먼저 확인할 곳 | 확인할 내용 |
| --- | --- | --- |
| domain을 찾지 못함 | 가비아 DNS·Vercel Domains | A/CNAME 일치, domain 등록·검증, DNS 전파 |
| `.vercel.app`은 되지만 custom domain 실패 | 가비아·Vercel domain | host·target, DNS cache, 인증서 상태 |
| 화면은 뜨지만 `/api/health` 실패 | Vercel deployment | Python Function build, Function log |
| API가 `500` 반환 | Vercel env·Supabase | 두 환경 변수 존재, 연결 상태; secret 값은 출력하지 않음 |
| API가 `401` 반환 | cookie·Supabase Auth | session, cookie 전송, `require_member()` |
| 저장은 되지만 잘못된 회원 데이터 | Python API·PostgreSQL | `member_id` filter, query와 제약 |

예를 들어 화면이 정상으로 뜬다면 DNS와 Next.js 응답은 이미 상당 부분 동작한 것이다. 이때 DB 문제를
고치려고 A record를 바꾸면 원인을 더 찾기 어려워질 수 있다.

## 파일을 어디서부터 읽으면 될까?

1. [`vercel.json`](../../vercel.json): framework와 build 시작점
2. [`package.json`](../../package.json): frontend build·개발·검사 명령
3. [`.python-version`](../../.python-version)과 [`requirements.txt`](../../requirements.txt): Python
   runtime과 의존성
4. [`.env.example`](../../.env.example)과 [`.gitignore`](../../.gitignore): 필요한 설정 이름과 비밀
   제외 경계
5. [`scripts/vercel-dev.sh`](../../scripts/vercel-dev.sh): Local에서 Vercel Development 설정과 두
   runtime을 함께 준비하는 순서
6. [`api/lib/supabase_client.py`](../../api/lib/supabase_client.py): 환경 변수를 실제로 읽는 서버 코드

구체적인 로컬 명령과 Git 작업 순서는 다음 개발 작업 방식 문서에서 이어서 살펴본다.

## 자주 생기는 오해

### 도메인을 샀으면 그곳에 웹 서버가 생기는가?

아니다. domain은 이름이다. DNS로 실행 중인 Vercel deployment와 연결해야 한다.

### 가비아가 모든 페이지와 API 요청을 Vercel로 전달하는 proxy인가?

아니다. 가비아에서 관리하는 DNS는 Vercel의 위치를 알려 준다. 위치를 확인한 뒤 browser는 Vercel에
직접 HTTPS 요청을 보낸다.

### DNS가 `/api`와 화면 요청을 분리하는가?

아니다. DNS는 hostname을 찾는다. Vercel deployment가 URL path를 보고 Next.js 또는 Python
Function으로 연결한다.

### Vercel과 Supabase는 같은 hosting 역할인가?

아니다. Vercel은 이 프로젝트의 화면과 Python API를 배포·실행하고, Supabase는 Auth와 PostgreSQL을
제공한다.

### Preview와 Production은 주소만 다른 같은 환경인가?

아니다. 적용되는 환경 변수, 연결 DB와 접근 대상이 다를 수 있다. Preview는 운영 변경 전 검토용이다.

### `.env.example`에 실제 secret을 넣어 두는가?

아니다. 필요한 이름과 설명만 둔다. 실제 secret은 로컬의 Git 제외 파일이나 Vercel environment에
보관한다.

### Vercel 환경 변수를 바꾸면 이미 끝난 배포도 즉시 바뀌는가?

아니다. 새 값은 이후 새 deployment에 적용된다. 필요한 환경을 다시 deploy해야 한다.

### 애플리케이션 배포가 성공하면 DB migration도 적용된 것인가?

아니다. 현재 build와 migration은 별도 과정이다. 둘의 적용 순서와 호환성을 따로 확인해야 한다.

## 이해 확인

1. A record와 CNAME record는 각각 어떤 대상으로 연결하는가?
2. 가비아 DNS에서 Vercel 위치를 확인한 뒤 실제 HTTPS 요청은 어디로 가는가?
3. 같은 domain에서 Next.js 화면과 Python API를 나누는 것은 DNS인가, Vercel의 path 처리인가?
4. Local·Preview·Production은 각각 어떤 목적으로 사용하는가?
5. `SUPABASE_SERVICE_ROLE_KEY`는 어디에 저장해야 하며 왜 browser에 보내면 안 되는가?
6. 가비아, Vercel, Supabase가 각각 맡는 일을 한 문장씩 말할 수 있는가?

답하기 어렵다면 **구성 요소 표 → A·CNAME → 접속 순서 → Vercel·Supabase 연결** 순서로 다시 읽는다.

## 공식 참고 자료

- [가비아 DNS 관리툴과 record](https://customer.gabia.com/faq/detail/227/2521)
- [Vercel: Custom domain 추가와 설정](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
- [Vercel: DNS](https://vercel.com/docs/domains/working-with-dns)
- [Vercel: SSL 인증서](https://vercel.com/docs/domains/working-with-ssl)
- [Vercel: Environments](https://vercel.com/docs/deployments/environments)
- [Vercel: Environment variables](https://vercel.com/docs/environment-variables)
- [Vercel: Python runtime](https://vercel.com/docs/functions/runtimes/python)
- [Supabase Database](https://supabase.com/docs/guides/database/overview)

## 다음 문서

다음 [개발 작업 방식 익히기](./08-development-workflow.md)에서는 새 개발자가 project를 준비하고
Local에서 전체 앱을 실행한 뒤 lint·typecheck·test·build를 확인하고 Git 변경을 검토하는 순서를
다룬다.
