# 웹 개발 핵심 용어집

[← 학습 가이드 목차](./README.md) · [이전: 실제 코드로 전체 흐름 다시 연결하기](./09-code-walkthrough.md)

## 이 문서는 어떻게 사용할까?

이 용어집은 처음부터 끝까지 외우는 교재가 아니다. 학습 문서나 코드를 읽다가 모르는 단어를 만나면
`Command+F` 또는 `Ctrl+F`로 한국어와 영문 표현을 검색한다.

각 용어는 다음 네 가지에만 집중한다.

| 항목 | 확인할 내용 |
| --- | --- |
| 용어 | 코드와 공식 문서에서 검색할 한국어·영문 표현 |
| 짧은 뜻 | 지금 프로젝트를 이해하는 데 필요한 최소 설명 |
| 이 프로젝트의 예 | 추상적인 개념이 실제로 나타나는 위치 |
| 자세히 읽기 | 개념을 순서대로 설명한 앞 문서 |

모르는 용어가 또 등장하면 그 정의까지 한꺼번에 외우지 말고, 먼저 현재 흐름에서 맡은 역할만
확인한다.

## 1. 프로젝트 전체 구조

| 용어 | 짧은 뜻 | 이 프로젝트의 예 | 자세히 읽기 |
| --- | --- | --- | --- |
| 브라우저 (Browser) | 사용자가 웹사이트를 열고 HTML·CSS·JavaScript를 실행하는 프로그램 | 사용자의 컴퓨터에서 화면을 그리고 `/api/*`를 호출한다. | [5분 소개](./00-project-in-5-minutes.md) |
| 프론트엔드 (Frontend) | 사용자가 보고 조작하는 화면과 그 상호작용을 담당하는 영역 | `src/`의 React·Next.js 코드 | [프론트엔드](./02-frontend.md) |
| 백엔드 (Backend) | 화면의 요청을 받아 입력·사용자·업무 규칙을 확인하고 저장소 사용을 지시하는 영역 | `api/`의 Python 코드 | [백엔드](./04-backend.md) |
| 데이터베이스 (Database) | 데이터를 오래 보관하고 관계와 제약을 관리하는 시스템 | Supabase가 제공하는 PostgreSQL에 회원·체중·식단을 저장한다. | [데이터베이스](./05-database.md) |
| 인프라 (Infrastructure) | 앱이 인터넷에서 실행되고 서로 통신하게 하는 실행 환경과 연결 | 가비아 DNS, Vercel, Supabase 사이의 연결 | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| 호스팅 (Hosting) | 사용자가 접속할 수 있도록 애플리케이션이나 데이터를 실행·제공하는 일 | Vercel은 화면과 API를, Supabase는 Auth와 DB를 제공한다. | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| 배포 (Deployment) | 소스 코드를 특정 환경에서 접속 가능한 실행 결과로 만드는 과정 또는 그 결과 | Vercel의 Preview·Production deployment | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| 가비아 (Gabia) | 이 프로젝트의 도메인과 DNS 레코드를 관리하는 서비스 | Vercel이 안내한 A·CNAME 레코드를 가비아에 입력한다. | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| Vercel | 이 프로젝트의 Next.js 화면과 Python Function을 빌드·배포·실행하는 서비스 | `/`, `/calendar`, `/api/day` 등을 같은 배포에서 제공한다. | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| Supabase | PostgreSQL, Auth, API와 관리 기능을 제공하는 플랫폼 | Auth가 사용자를 관리하고 PostgreSQL이 앱 데이터를 보관한다. | [데이터베이스](./05-database.md) |

## 2. 프론트엔드

| 용어 | 짧은 뜻 | 이 프로젝트의 예 | 자세히 읽기 |
| --- | --- | --- | --- |
| HTML (HyperText Markup Language) | 제목·입력·버튼처럼 화면 내용의 의미와 구조를 표현하는 언어 | React 컴포넌트가 최종적으로 브라우저용 HTML 구조를 만든다. | [프론트엔드](./02-frontend.md) |
| JSX | JavaScript·TypeScript 파일 안에서 HTML과 비슷한 모양으로 UI 구조를 적는 문법 | `return (<main>...</main>)` 형태의 컴포넌트 코드 | [프론트엔드](./02-frontend.md) |
| CSS (Cascading Style Sheets) | 화면의 색, 간격, 배치, 반응형 모양을 정하는 언어 | `page.module.css`, `AuthGate.module.css` | [프론트엔드](./02-frontend.md) |
| JavaScript | 브라우저에서 사용자 행동과 데이터 처리를 실행하는 언어 | 클릭, 날짜 변경, API 호출을 처리한다. | [프론트엔드](./02-frontend.md) |
| TypeScript | JavaScript에 값의 형태를 검사할 type을 더한 언어 | `DayRecord`, `Member`, `MealType` | [프론트엔드](./02-frontend.md) |
| React | UI를 컴포넌트와 State 중심으로 만들기 위한 라이브러리 | `Home`, `MealCard`, `AuthGate`를 구현한다. | [프론트엔드](./02-frontend.md) |
| Next.js | React를 바탕으로 페이지 구조, 빌드와 실행 방식을 제공하는 프레임워크 | `src/app/page.tsx`, `layout.tsx`, `calendar/page.tsx` | [프론트엔드](./02-frontend.md) |
| 컴포넌트 (Component) | 화면을 역할별로 나눈 재사용 가능한 UI 단위 | 한 끼를 담당하는 `MealCard` | [프론트엔드](./02-frontend.md) |
| Props | 부모 컴포넌트가 자식 컴포넌트에 전달하는 값과 함수 | `Home`이 `MealCard`에 `record`와 `onSave`를 전달한다. | [프론트엔드](./02-frontend.md) |
| State | 현재 화면이 기억하고 변화에 따라 다시 그릴 값 | `selectedDate`, `dayRecord`, `member` | [프론트엔드](./02-frontend.md) |
| 이벤트 (Event) | 클릭·입력·제출처럼 브라우저에서 일어난 사용자 행동 | 저장 버튼의 `onClick` | [프론트엔드](./02-frontend.md) |
| 이벤트 핸들러 (Event handler) | 이벤트가 일어났을 때 실행할 함수 | `saveWeight()`, `submit()`, `selectDate()` | [코드 흐름](./09-code-walkthrough.md) |
| 렌더링 (Rendering) | 현재 Props와 State를 바탕으로 보여줄 화면을 계산하는 과정 | `member` 유무에 따라 로그인 화면이나 본문을 고른다. | [프론트엔드](./02-frontend.md) |
| 재렌더링 (Re-rendering) | Props나 State가 바뀐 뒤 화면을 다시 계산하는 과정 | `setDayRecord()` 뒤 식단 카드 내용이 바뀐다. | [프론트엔드](./02-frontend.md) |
| Effect | React 화면을 API·URL 같은 외부 시스템과 맞추기 위해 렌더링 뒤 실행하는 작업 | `selectedDate`가 바뀌면 `/api/day`를 조회한다. | [프론트엔드](./02-frontend.md) |
| App Router | Next.js에서 `src/app`의 폴더·파일 구조로 URL과 레이아웃을 구성하는 방식 | `src/app/calendar/page.tsx`가 `/calendar` 화면이 된다. | [프론트엔드](./02-frontend.md) |
| Server Component | Next.js가 기본적으로 서버에서 처리하는 React 컴포넌트 | `RootLayout`은 브라우저 이벤트 없이 공통 구조를 만든다. | [프론트엔드](./02-frontend.md) |
| Client Component | 브라우저 State·Effect·이벤트를 쓸 수 있도록 `"use client"`를 선언한 컴포넌트 | `Home`, `AuthGate`, `CalendarView` | [프론트엔드](./02-frontend.md) |
| localStorage | 브라우저에 값을 비교적 오래 보관하는 Web Storage | Python API가 없는 프론트엔드 확인용 기록 대체 경로 | [코드 흐름](./09-code-walkthrough.md) |
| sessionStorage | 현재 브라우저 탭의 세션 동안 값을 보관하는 Web Storage | 인증 대기 중인 이메일 `pendingSignupEmail` | [인증과 인가](./06-authentication.md) |

## 3. HTTP와 API

| 용어 | 짧은 뜻 | 이 프로젝트의 예 | 자세히 읽기 |
| --- | --- | --- | --- |
| HTTP (Hypertext Transfer Protocol) | 브라우저와 서버가 요청과 응답을 주고받는 규칙 | 프론트엔드가 Python API를 호출한다. | [HTTP와 API](./03-http-and-api.md) |
| HTTPS (Hypertext Transfer Protocol Secure) | HTTP 내용을 암호화된 연결로 전송하고 접속한 서버의 도메인을 확인하는 방식 | 운영 도메인과 Vercel·Supabase 통신 | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| 요청 (Request) | 클라이언트가 서버에 보내는 작업 지시와 데이터 | `PUT /api/weight`와 체중 JSON | [HTTP와 API](./03-http-and-api.md) |
| 응답 (Response) | 서버가 요청 처리 결과로 돌려주는 상태와 데이터 | `200`과 `{ "data": ..., "error": null }` | [HTTP와 API](./03-http-and-api.md) |
| URL (Uniform Resource Locator) | 인터넷에서 요청할 자원의 전체 주소 | `https://example.com/api/day?date=2026-08-17` | [HTTP와 API](./03-http-and-api.md) |
| 경로 (Path) | URL에서 서버 안의 기능·자원을 가리키는 부분 | `/api/day`, `/calendar` | [HTTP와 API](./03-http-and-api.md) |
| 쿼리 문자열 (Query string) | URL의 `?` 뒤에서 조회 조건이나 action을 전달하는 부분 | `?date=2026-08-17`, `?action=session` | [HTTP와 API](./03-http-and-api.md) |
| API (Application Programming Interface) | 프로그램끼리 정해진 방식으로 기능과 데이터를 요청하는 접점 | 프론트엔드가 사용하는 Python `/api/*` | [HTTP와 API](./03-http-and-api.md) |
| 엔드포인트 (Endpoint) | API 안에서 한 기능을 제공하는 구체적인 메서드와 경로 | `GET /api/day`, `PUT /api/weight` | [HTTP와 API](./03-http-and-api.md) |
| HTTP 메서드 (HTTP method) | 요청하려는 작업의 성격을 나타내는 말 | 조회는 `GET`, 저장은 `PUT`, 삭제는 `DELETE`를 주로 쓴다. | [HTTP와 API](./03-http-and-api.md) |
| GET | 데이터를 조회할 때 주로 사용하는 HTTP 메서드 | 하루 기록과 달력 조회 | [HTTP와 API](./03-http-and-api.md) |
| POST | 새 처리나 명령을 제출할 때 주로 사용하는 HTTP 메서드 | 가입·로그인·이메일 인증 | [HTTP와 API](./03-http-and-api.md) |
| PUT | 지정한 자원을 만들거나 최종 값으로 갱신할 때 사용하는 HTTP 메서드 | 체중·식단 upsert | [HTTP와 API](./03-http-and-api.md) |
| DELETE | 지정한 자원을 삭제할 때 사용하는 HTTP 메서드 | 한 날짜의 식단 또는 전체 기록 초기화 | [HTTP와 API](./03-http-and-api.md) |
| 헤더 (Header) | 요청·응답의 본문을 해석하거나 처리하는 데 필요한 부가 정보 | `Content-Type`, `Accept`, `Set-Cookie` | [HTTP와 API](./03-http-and-api.md) |
| 본문 (Body) | 요청이나 응답이 전달하는 실제 데이터 부분 | 체중·날짜가 담긴 JSON | [HTTP와 API](./03-http-and-api.md) |
| JSON (JavaScript Object Notation) | key와 value 구조로 데이터를 표현하는 텍스트 형식 | `{ "date": "2026-08-17", "weight": 60.5 }` | [HTTP와 API](./03-http-and-api.md) |
| 상태 코드 (Status code) | 요청 처리 결과의 큰 분류를 나타내는 세 자리 숫자 | `200 OK`, `400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error` | [HTTP와 API](./03-http-and-api.md) |
| 응답 봉투 (Response envelope) | 성공과 실패 응답을 같은 바깥 구조로 감싼 형식 | 모든 Python API의 `{ data, error }` | [HTTP와 API](./03-http-and-api.md) |
| Same-origin | scheme·hostname·port가 같은 출처 | 브라우저가 Vercel의 같은 도메인 아래 `/api/*`를 호출한다. | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| 신뢰 경계 (Trust boundary) | 외부에서 들어온 값을 믿기 전에 다시 검사해야 하는 경계 | Python API가 브라우저 입력과 cookie를 검증한다. | [HTTP와 API](./03-http-and-api.md) |

## 4. 백엔드

| 용어 | 짧은 뜻 | 이 프로젝트의 예 | 자세히 읽기 |
| --- | --- | --- | --- |
| 핸들러 (Handler) | 특정 요청을 받아 처리하는 진입점 | Python `handler.do_GET()`, `handler.do_PUT()` | [백엔드](./04-backend.md) |
| 함수 (Function) | 입력을 받아 정해진 작업을 수행하고 결과를 돌려줄 수 있는 코드 단위 | `upsert_weight()`, `require_member()` | [코드 흐름](./09-code-walkthrough.md) |
| 서버리스 함수 (Serverless Function) | 요청이 올 때 플랫폼이 실행 환경을 준비해 호출하는 서버 코드 단위 | Vercel이 `api/weight.py`의 `handler`를 실행한다. | [백엔드](./04-backend.md) |
| 무상태 (Stateless) | 다음 요청이 같은 메모리·프로세스에서 이어진다고 가정하지 않는 성질 | 로그인 상태는 Python 메모리가 아니라 cookie와 Supabase에서 확인한다. | [백엔드](./04-backend.md) |
| Pydantic | Python 데이터의 type과 제약을 선언하고 입력을 검증하는 라이브러리 | `WeightUpsertRequest`, `MealUpsertRequest` | [백엔드](./04-backend.md) |
| 검증 (Validation) | 값이 예상한 형식과 허용 범위를 지키는지 확인하는 과정 | 체중 양수, 미래 날짜 금지, 식단 종류 제한 | [백엔드](./04-backend.md) |
| 비즈니스 규칙 (Business rule) | 이 서비스가 허용하거나 결정해야 하는 업무상 규칙 | 한 회원은 날짜별 체중 한 칸을 사용한다. | [백엔드](./04-backend.md) |
| 로그 (Log) | 실행 상태와 오류를 운영자가 조사할 수 있게 남긴 기록 | 내부 예외는 server log에 남기고 공개 응답에는 숨긴다. | [백엔드](./04-backend.md) |
| Supabase client | Python 코드에서 Supabase Auth·Data API 작업을 요청하는 라이브러리 객체 | `get_supabase_client()` | [백엔드](./04-backend.md) |
| service role | Supabase 서버 작업용의 강한 권한 역할과 그 비밀키 | Python API만 `SUPABASE_SERVICE_ROLE_KEY`를 사용한다. | [데이터베이스](./05-database.md) |

## 5. 데이터베이스

| 용어 | 짧은 뜻 | 이 프로젝트의 예 | 자세히 읽기 |
| --- | --- | --- | --- |
| PostgreSQL | 표와 관계를 중심으로 데이터를 관리하고 SQL로 다루는 관계형 데이터베이스 시스템 | Supabase 프로젝트 안의 앱 데이터베이스 | [데이터베이스](./05-database.md) |
| 스키마 (Schema) | 테이블을 용도별로 묶는 데이터베이스의 이름 공간 | `public.weights`, `auth.users`의 `public`, `auth` | [데이터베이스](./05-database.md) |
| 테이블 (Table) | 같은 종류의 데이터를 행과 열로 모은 구조 | `members`, `weights`, `meals` | [데이터베이스](./05-database.md) |
| 행 (Row) | 테이블에 저장된 기록 한 건 | 한 회원의 특정 날짜 체중 한 건 | [데이터베이스](./05-database.md) |
| 열 (Column) | 모든 행이 공통으로 가지는 이름 붙은 항목 | `member_id`, `date`, `weight` | [데이터베이스](./05-database.md) |
| 데이터 타입 (Data type) | 열에 저장할 수 있는 값의 종류 | 날짜 `date`, 체중 `numeric(6, 2)`, 회원 id `uuid` | [데이터베이스](./05-database.md) |
| NULL | 값이 없거나 알려지지 않았음을 나타내는 별도 상태 | 저장된 체중이 없으면 API의 `weight`가 `null`이다. | [데이터베이스](./05-database.md) |
| 쿼리 (Query) | 데이터베이스에 조회나 변경을 지시하는 요청 | `weights`에서 회원·날짜가 같은 행 조회 | [데이터베이스](./05-database.md) |
| CRUD | 데이터의 생성(Create), 조회(Read), 수정(Update), 삭제(Delete)를 묶은 표현 | 기록 저장·하루 조회·다시 저장·초기화 | [데이터베이스](./05-database.md) |
| 제약 조건 (Constraint) | 데이터베이스가 잘못된 값이나 관계를 거부하도록 정한 규칙 | `UNIQUE`, `FOREIGN KEY`, `CHECK` | [데이터베이스](./05-database.md) |
| 기본 키 (Primary Key, PK) | 테이블 안에서 행 하나를 대표하는 중복 불가 식별자 | `members.id`, `meals.id` | [데이터베이스](./05-database.md) |
| 외래 키 (Foreign Key, FK) | 값이 다른 테이블의 실제 행을 가리키도록 보장하는 제약 | `meals.member_id`가 `members.id`를 가리킨다. | [데이터베이스](./05-database.md) |
| UNIQUE | 한 열이나 열 조합의 중복을 금지하는 제약 | `weights`의 `(member_id, date)` | [데이터베이스](./05-database.md) |
| NOT NULL | 해당 열에 `NULL`을 허용하지 않는 제약 | `weights.weight`, `meals.food` | [데이터베이스](./05-database.md) |
| CHECK | 값이 지정한 조건을 만족하도록 하는 제약 | `weight > 0`, 식단 종류 제한 | [데이터베이스](./05-database.md) |
| DEFAULT | 값을 생략했을 때 데이터베이스가 사용할 기본값 | 생성 시각의 `now()`, 식단 id의 새 UUID | [데이터베이스](./05-database.md) |
| 인덱스 (Index) | 조건에 맞는 행을 더 효율적으로 찾도록 돕는 별도 자료 구조 | `(member_id, date)` 조회용 인덱스 | [데이터베이스](./05-database.md) |
| upsert | 충돌 기준에 맞는 행이 없으면 추가하고 있으면 갱신하는 작업 | 날짜별 체중, 날짜·끼니별 식단 저장 | [데이터베이스](./05-database.md) |
| 마이그레이션 (Migration) | 데이터베이스 구조와 규칙의 변경을 순서 있는 파일로 기록·적용하는 방식 | `supabase/migrations/*.sql` | [데이터베이스](./05-database.md) |
| 트랜잭션 (Transaction) | 여러 데이터베이스 변경을 모두 성공하거나 모두 취소할 한 작업으로 묶는 경계 | 마이그레이션의 `BEGIN`부터 `COMMIT` | [데이터베이스](./05-database.md) |
| RPC (Remote Procedure Call) | 서버에 준비된 데이터베이스 함수를 이름과 인자로 호출하는 방식 | `reserve_member_signup`, `complete_verified_member_signup` | [인증과 인가](./06-authentication.md) |
| RLS (Row Level Security) | 요청 역할과 정책에 따라 접근 가능한 행을 제한하는 PostgreSQL 보안 기능 | 앱 테이블에는 RLS가 켜져 있지만 서버 service role은 우회하므로 API가 `member_id`를 제한한다. | [데이터베이스](./05-database.md) |

## 6. 인증과 인가

이 표는 앞 행의 개념을 이해한 뒤 다음 행으로 내려가도록 순서를 고정했다.

| 용어 | 짧은 뜻 | 이 프로젝트의 예 | 자세히 읽기 |
| --- | --- | --- | --- |
| 식별 (Identification) | 사용자를 구분할 이름이나 id를 정하는 것 | 이메일과 Supabase 사용자 UUID | [인증과 인가](./06-authentication.md) |
| 인증 (Authentication) | 사용자가 주장하는 그 사람인지 증명하는 과정 | 이메일·비밀번호 로그인, 이메일 OTP 확인 | [인증과 인가](./06-authentication.md) |
| 인가 (Authorization) | 인증된 사용자가 어떤 데이터나 기능을 사용할 수 있는지 판단하는 과정 | API가 자신의 `member_id` 기록만 조회·저장하게 한다. | [인증과 인가](./06-authentication.md) |
| 로그인 상태 (Login state) | 인증을 마친 사용자로 서비스를 이용하고 있는 현재 상태 | `AuthGate`의 `member` State가 화면을 선택한다. | [인증과 인가](./06-authentication.md) |
| 세션 (Session) | 여러 요청 사이에서 로그인 상태를 이어 가는 서버·클라이언트의 관계 | Supabase Auth session을 access·refresh token으로 이어 간다. | [인증과 인가](./06-authentication.md) |
| 쿠키 (Cookie) | 브라우저가 사이트별 값을 저장하고 해당 사이트 요청에 실어 보내는 수단 | `diet_access_token`, `diet_refresh_token` | [인증과 인가](./06-authentication.md) |
| 토큰 (Token) | 서버가 발급하고 이후 요청에서 자격을 증명하는 문자열 | Supabase Auth가 발급한 access·refresh token | [인증과 인가](./06-authentication.md) |
| JWT (JSON Web Token) | header·payload·signature 구조를 가진 token 표현 형식 | 이 프로젝트의 access token은 JWT다. | [인증과 인가](./06-authentication.md) |
| Access token | API가 현재 사용자의 자격을 확인할 때 쓰는 비교적 짧은 수명의 token | `require_member()`가 Supabase Auth에 확인한다. | [인증과 인가](./06-authentication.md) |
| Refresh token | access token이 만료되었을 때 새 session token을 받는 데 쓰는 값 | session endpoint가 갱신을 시도한다. 현재 Supabase refresh token은 JWT가 아닌 고유 문자열이다. | [인증과 인가](./06-authentication.md) |
| OTP (One-Time Password) | 한 번의 확인 과정에 쓰는 일회용 인증번호 | 회원가입 이메일로 보내는 6자리 code | [인증과 인가](./06-authentication.md) |
| HttpOnly | JavaScript가 cookie 값을 읽지 못하게 하는 속성 | 두 인증 cookie에 적용한다. | [인증과 인가](./06-authentication.md) |
| SameSite | 다른 site에서 시작된 요청에 cookie를 보낼 범위를 제한하는 속성 | 인증 cookie에 `SameSite=Lax`를 사용한다. | [인증과 인가](./06-authentication.md) |
| Secure | HTTPS 연결에서만 cookie를 전송하도록 하는 속성 | Vercel이 전달한 protocol이 HTTPS이면 인증 cookie에 붙인다. | [인증과 인가](./06-authentication.md) |
| `auth.users` | Supabase Auth가 관리하는 인증 사용자 테이블 | 가입한 사용자의 UUID와 인증 상태 원본 | [데이터베이스](./05-database.md) |
| `members` | 앱이 화면과 데이터 관계에 사용하는 회원 프로필 테이블 | `id`, `email`, `display_name` | [인증과 인가](./06-authentication.md) |
| `member_id` | 체중·식단 행을 소유 회원과 연결하는 외래 키 열 | 모든 개인 데이터 쿼리의 회원 조건 | [데이터베이스](./05-database.md) |

## 7. 도메인·DNS·배포 환경

| 용어 | 짧은 뜻 | 이 프로젝트의 예 | 자세히 읽기 |
| --- | --- | --- | --- |
| 도메인 (Domain) | 사용자가 사이트를 찾기 위해 입력하는 사람이 읽기 쉬운 이름 | 가비아에서 관리하고 Vercel 프로젝트에 연결한 custom domain | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| 호스트명 (Hostname) | 네트워크에서 대상을 가리키는 전체 이름 | `example.com`, `www.example.com` | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| 서브도메인 (Subdomain) | 기본 도메인 앞에 붙여 구분한 이름 | `www.example.com`의 `www` | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| DNS (Domain Name System) | 도메인 이름을 IP 주소나 다른 호스트명과 연결하는 체계 | 가비아 DNS 레코드가 Vercel의 target을 가리킨다. | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| DNS 레코드 (DNS record) | DNS에 저장하는 이름과 대상의 연결 규칙 | A·CNAME 레코드 | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| A 레코드 (A record) | 호스트명을 IPv4 주소에 연결하는 DNS 레코드 | Vercel이 apex domain에 안내한 값을 가비아에 입력한다. | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| CNAME 레코드 (CNAME record) | 한 호스트명을 다른 호스트명의 별칭으로 연결하는 DNS 레코드 | Vercel이 `www` 같은 subdomain에 안내한 target | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| IP 주소 (IP address) | 네트워크에서 장치나 서비스 위치를 식별하는 숫자 주소 | A 레코드의 target은 IPv4 주소다. | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| 캐시 (Cache) | 전에 찾은 결과를 잠시 기억했다가 같은 결과가 필요할 때 다시 사용하는 저장 공간 | 이전에 찾은 Vercel 연결 결과를 재사용한다. | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| TTL (Time To Live) | DNS 결과를 캐시에서 얼마 동안 사용할 수 있는지 나타내는 시간 | TTL이 지나면 DNS에 다시 물어 최신 연결 결과를 받는다. | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| DNS 전파 (DNS propagation) | 변경된 DNS 답이 여러 resolver와 캐시에 반영되어 가는 과정 | 레코드를 바꾼 직후 일부 환경에서 이전 값이 보일 수 있다. | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| SSL/TLS 인증서 (Certificate) | HTTPS 연결에서 서버의 도메인을 확인하고 암호화 연결을 만드는 데 쓰는 인증서 | Vercel이 custom domain 검증 뒤 발급한다. | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| Local·Development | 개발자 컴퓨터에서 수정 중인 코드를 실행·확인하는 환경 | `pnpm dev:vercel`의 localhost | [개발 작업 방식](./08-development-workflow.md) |
| Preview | Production 반영 전에 공유하고 검토하는 배포 환경 | Vercel의 deployment별 Preview URL | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| Production | 실제 사용자가 이용하는 운영 환경 | custom domain에 연결된 Vercel deployment | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| 환경 변수 (Environment variable) | 실행 환경이 코드 밖에서 전달하는 이름과 값의 설정 | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | [인프라와 배포](./07-infrastructure-and-deployment.md) |
| 비밀값 (Secret) | 공개 저장소·브라우저·로그에 노출하면 안 되는 인증 정보 | Supabase service role key | [개발 작업 방식](./08-development-workflow.md) |

## 8. 개발 작업과 Git

| 용어 | 짧은 뜻 | 이 프로젝트의 예 | 자세히 읽기 |
| --- | --- | --- | --- |
| 저장소 (Repository) | 소스와 변경 이력을 함께 관리하는 프로젝트 공간 | 현재 Git 프로젝트 폴더 | [개발 작업 방식](./08-development-workflow.md) |
| 의존성 (Dependency) | 프로젝트가 직접 만들지 않고 가져와 사용하는 라이브러리·도구 | Next.js, React, Pydantic, Supabase client | [개발 작업 방식](./08-development-workflow.md) |
| 패키지 매니저 (Package manager) | 의존성 설치와 project script 실행을 관리하는 도구 | 이 프로젝트는 `pnpm`을 기준으로 한다. | [개발 작업 방식](./08-development-workflow.md) |
| 개발 서버 (Dev server) | 코드를 수정하며 빠르게 확인하도록 로컬에서 실행하는 서버 | 전체 앱은 `pnpm dev:vercel`, frontend만은 `pnpm dev` | [개발 작업 방식](./08-development-workflow.md) |
| lint | 코드의 규칙 위반과 일부 의심스러운 패턴을 찾는 정적 검사 | `pnpm lint` | [개발 작업 방식](./08-development-workflow.md) |
| typecheck | TypeScript type이 서로 맞는지 검사하는 작업 | `pnpm typecheck` | [개발 작업 방식](./08-development-workflow.md) |
| 테스트 (Test) | 정해 둔 입력과 상황에서 코드가 기대한 결과를 내는지 확인하는 코드·작업 | `pnpm test`, Python `pytest` | [개발 작업 방식](./08-development-workflow.md) |
| 빌드 (Build) | 소스를 배포 가능한 production 결과로 변환하고 필요한 오류를 검사하는 과정 | `pnpm build` | [개발 작업 방식](./08-development-workflow.md) |
| 작업 트리 (Working tree) | 현재 폴더에서 수정하고 있는 실제 파일 상태 | `git status --short`로 변경을 확인한다. | [개발 작업 방식](./08-development-workflow.md) |
| 스테이징 영역 (Staging area) | 다음 commit에 포함하기로 선택한 변경을 모아 둔 영역 | `git add` 뒤 `git diff --cached`로 검토한다. | [개발 작업 방식](./08-development-workflow.md) |
| 커밋 (Commit) | 선택한 변경과 설명을 Git 이력에 한 단위로 기록한 것 | `git commit -m "체중 입력 검증 개선"` | [개발 작업 방식](./08-development-workflow.md) |
| 브랜치 (Branch) | 서로 다른 작업 흐름을 분리해 이어 가는 Git 이력의 이름 | 작업 전 `git branch --show-current`로 확인한다. | [개발 작업 방식](./08-development-workflow.md) |

## 9. 이 프로젝트 코드에서 자주 찾는 이름

아래 항목은 일반 웹 개발 용어가 아니라 현재 프로젝트가 붙인 이름이다.

| 이름 | 이 프로젝트에서 맡은 역할 | 실제 파일 |
| --- | --- | --- |
| `AuthGate` | 세션을 확인하고 로그인 화면과 실제 페이지 중 무엇을 보여줄지 정한다. | [src/components/AuthGate.tsx](../../src/components/AuthGate.tsx) |
| `fetchApi()` | 같은 응답 형식과 오류 규칙으로 Python API를 호출한다. | [src/services/apiClient.ts](../../src/services/apiClient.ts) |
| `ApiClientError` | API 실패의 공개 code, message, HTTP status를 담는 프론트엔드 오류다. | [src/services/apiClient.ts](../../src/services/apiClient.ts) |
| `require_member()` | access cookie로 Auth 사용자와 `members` 행을 확인한다. | [api/lib/auth.py](../../api/lib/auth.py) |
| `DayRecord` | 한 날짜의 체중 한 칸과 식단 네 칸을 나타내는 TypeScript type이다. | [src/types/api.ts](../../src/types/api.ts) |
| `MealCard` | 한 끼의 음식·종류·저장 상태를 관리하는 React 컴포넌트다. | [src/components/MealCard.tsx](../../src/components/MealCard.tsx) |
| `CalendarView` | 월 요약과 선택 날짜 상세를 조회·표시하는 React 컴포넌트다. | [src/components/CalendarView.tsx](../../src/components/CalendarView.tsx) |
| `localDayStorage` | Python API가 없는 frontend-only 확인에서 브라우저 기록을 다루는 대체 저장 코드다. | [src/services/localDayStorage.ts](../../src/services/localDayStorage.ts) |
| `/api/authentication` | 가입·인증·로그인·세션·로그아웃 action을 처리하는 endpoint다. | [api/authentication.py](../../api/authentication.py) |
| `/api/day` | 한 날짜의 체중·식단 조회 또는 전체 초기화를 처리한다. | [api/day.py](../../api/day.py) |
| `/api/weight` | 로그인 회원의 날짜별 체중 upsert를 처리한다. | [api/weight.py](../../api/weight.py) |
| `/api/meal` | 로그인 회원의 끼니별 식단 upsert 또는 날짜별 식단 초기화를 처리한다. | [api/meal.py](../../api/meal.py) |
| `/api/calendar` | 로그인 회원의 월별 체중·식단 상태 요약을 반환한다. | [api/calendar.py](../../api/calendar.py) |

## 10. 혼동하기 쉬운 용어 다시 구분하기

| 함께 헷갈리는 말 | 구분 |
| --- | --- |
| 프론트엔드 / React / Next.js | 프론트엔드는 역할 영역, React는 UI 라이브러리, Next.js는 React 기반 프레임워크다. |
| 백엔드 / Python | 백엔드는 역할 영역이고 Python은 이 프로젝트가 그 영역을 구현한 언어다. |
| Supabase / PostgreSQL | Supabase는 플랫폼이고 PostgreSQL은 그 안에서 앱 데이터를 보관하는 데이터베이스 시스템이다. |
| 인증 / 인가 | 인증은 “누구인가”, 인가는 “무엇을 할 수 있는가”를 판단한다. |
| 세션 / 쿠키 / 토큰 / JWT | 세션은 로그인 관계, 쿠키는 브라우저 저장·전송 수단, token은 자격 문자열, JWT는 token 형식 중 하나다. |
| Access token / Refresh token | access token은 API 자격 확인, refresh token은 access token 갱신에 쓴다. 현재 둘의 형식도 다르다. |
| 도메인 / DNS / A·CNAME | 도메인은 이름, DNS는 연결 체계, A·CNAME은 그 체계에 저장하는 record 종류다. |
| 가비아 / Vercel / Supabase | 가비아는 도메인·DNS, Vercel은 화면·Python API 실행, Supabase는 Auth·DB를 담당한다. |
| React State / 세션 / DB 행 | State는 현재 화면의 기억, session은 로그인 관계, DB row는 영구 저장된 기록이다. |
| localStorage / Supabase 데이터 | localStorage는 한 브라우저의 저장소, Supabase 데이터는 원격 PostgreSQL의 회원별 기록이다. 자동 동기화되지 않는다. |
| Local / Preview / Production | Local은 개발자 컴퓨터, Preview는 운영 전 공유 검토, Production은 실제 사용자 환경이다. |
| lint / typecheck / test / build | 각각 코드 규칙, type 관계, 기대 동작, 배포 결과 생성을 확인하며 서로 대신하지 않는다. |
| working tree / staging area / commit | 실제 수정 파일, 다음 기록으로 선택한 변경, 이력에 저장된 변경 단위다. |

## 용어집에서 상세 문서로 돌아가는 예

### 코드에서 `upsert`를 만났다면

이 표에서 “upsert”의 한 줄 뜻을 확인한 뒤 [데이터베이스](./05-database.md)의 체중 upsert 부분으로
이동한다. 그곳에서 `(member_id, date)` UNIQUE와 함께 동작하는 이유를 배운다.

### 컴포넌트에서 `Effect`를 만났다면

먼저 [프론트엔드](./02-frontend.md)에서 Effect가 화면 밖의 시스템과 값을 맞추는 작업임을 확인한다.
그 다음 [코드 흐름](./09-code-walkthrough.md)에서 날짜 State 변경이 `/api/day` 요청으로 이어지는 실제
순서를 본다.

### API에서 `member_id`를 만났다면

먼저 [인증과 인가](./06-authentication.md)에서 로그인 사용자가 어떻게 정해지는지 확인한다. 그 다음
[데이터베이스](./05-database.md)에서 `member_id`가 `members`와 체중·식단을 연결하고 다른 회원의
기록을 나누는 방식을 본다.

## 학습 가이드를 마치며

이 용어를 모두 암기할 필요는 없다. 사용자가 체중을 저장하는 흐름에서 각 요소의 역할을 다음처럼
설명할 수 있으면 충분하다.

```text
React 화면이 입력을 받는다
→ fetchApi()가 HTTP 요청을 보낸다
→ Python API가 입력과 로그인 회원을 확인한다
→ Supabase PostgreSQL이 회원별 기록을 저장한다
→ 응답 data가 React State와 화면에 반영된다
```

세부 단어가 기억나지 않을 때는 이 용어집으로 돌아오고, 흐름이 연결되지 않을 때는
[프로젝트 5분 소개](./00-project-in-5-minutes.md)와 [전체 흐름](./01-end-to-end-flow.md)을 다시 읽는다.
