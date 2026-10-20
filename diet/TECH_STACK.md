# 기술 스택 문서

## 1. 개요

본 프로젝트는 Vercel을 중심으로 프론트엔드와 백엔드를 배포하고, Supabase를 데이터 저장소 및 인증 서비스로 사용하는 웹 애플리케이션이다.

주요 구성은 다음과 같다.

- 프론트엔드: Next.js App Router, React, TypeScript
- 프론트엔드 배포: Vercel
- 백엔드: Python 기반 Vercel Serverless Functions
- 데이터베이스 및 저장소: Supabase

## 2. 시스템 구성

```text
사용자 브라우저
      │
      ▼
Next.js App Router 애플리케이션
      │  HTTPS / JSON API
      ▼
Vercel Serverless Functions (Python)
      │
      ▼
Supabase
 ├─ PostgreSQL Database
 ├─ Authentication
 └─ Storage
```

프론트엔드는 사용자 인터페이스와 클라이언트 상태를 담당한다. 데이터 검증, 비즈니스 로직, 권한이 필요한 작업은 Python 서버리스 함수에서 처리하며, 영구 데이터는 Supabase에 저장한다.

## 3. 프론트엔드

| 구분          | 기술               | 역할                                      |
| ------------- | ------------------ | ----------------------------------------- |
| 웹 프레임워크 | Next.js App Router | 라우팅, 렌더링 및 프로덕션 빌드           |
| UI 라이브러리 | React              | 컴포넌트 기반 사용자 인터페이스 구현      |
| 개발 언어     | TypeScript         | 정적 타입을 통한 안정성과 유지보수성 확보 |
| 배포 플랫폼   | Vercel             | 정적 자산 배포, CDN 제공, 미리보기 배포   |
| API 통신      | Fetch API          | Python 백엔드 API 호출                    |
| 코드 품질     | ESLint, Prettier   | 코드 검사 및 일관된 포맷 유지             |

### 프론트엔드 책임

- 화면 렌더링 및 사용자 입력 처리
- 클라이언트 측 입력값 사전 검증
- 로그인 상태 및 화면 상태 관리
- 백엔드 API 호출과 로딩·오류 상태 표시
- MVP에서는 Supabase를 직접 호출하지 않고 Python API만 사용

민감한 비즈니스 로직이나 관리자 권한이 필요한 데이터 처리는 프론트엔드에 구현하지 않는다.

## 4. 백엔드

| 구분        | 기술                        | 역할                                   |
| ----------- | --------------------------- | -------------------------------------- |
| 실행 환경   | Vercel Serverless Functions | 요청 단위로 실행되는 서버리스 API 제공 |
| 개발 언어   | Python                      | API 및 비즈니스 로직 구현              |
| 데이터 형식 | JSON                        | 프론트엔드와 API 간 데이터 교환        |
| 데이터 검증 | Pydantic 권장               | 요청 및 응답 스키마 검증               |
| 데이터 연동 | Supabase Python Client      | 데이터베이스, 인증 및 저장소 접근      |

### 백엔드 책임

- API 요청 검증 및 표준화된 응답 반환
- 핵심 비즈니스 규칙 실행
- 사용자 인증 정보와 권한 검증
- Supabase 데이터 조회 및 변경
- 외부 서비스 연동과 비밀 키 보호
- 오류 기록 및 예외 처리

서버리스 환경은 실행 시간이 제한되고 인스턴스가 지속되지 않을 수 있으므로, 로컬 메모리에 세션이나 영구 상태를 저장하지 않는다. 장시간 실행 작업은 별도의 비동기 작업 환경 도입을 검토한다.

## 5. 데이터 및 인증

| 구분          | Supabase 기능       | 역할                                |
| ------------- | ------------------- | ----------------------------------- |
| 관계형 데이터 | PostgreSQL Database | 사용자 및 서비스 데이터 저장        |
| 인증          | Supabase Auth       | 회원가입, 로그인, 세션 및 토큰 관리 |
| 파일          | Supabase Storage    | 이미지와 첨부 파일 저장             |
| 접근 제어     | Row Level Security  | 사용자별 데이터 접근 제한           |

### 데이터 접근 원칙

- 모든 주요 테이블에 Row Level Security(RLS)를 활성화한다.
- 사용자는 본인에게 허용된 데이터만 조회하거나 변경할 수 있도록 정책을 작성한다.
- MVP 브라우저 번들에는 Supabase URL이나 키를 포함하지 않는다.
- Supabase service role key는 백엔드 환경 변수에만 저장하며 프론트엔드 번들에 포함하지 않는다.
- 스키마 변경은 SQL 마이그레이션으로 관리한다.

## 6. API 설계 원칙

- API 경로는 `/api` 아래에 구성한다.
- 요청과 응답은 기본적으로 JSON을 사용한다.
- HTTP 메서드와 상태 코드를 일관되게 사용한다.
- 사용자에게 노출되는 오류 메시지와 내부 오류 정보를 분리한다.
- 인증이 필요한 요청은 Supabase access token을 전달하고 백엔드에서 검증한다.
- 서버 내부의 비밀 키와 상세 예외 정보는 응답에 포함하지 않는다.

응답 형식 예시는 다음과 같다.

```json
{
  "data": {},
  "error": null
}
```

오류 응답 예시는 다음과 같다.

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값을 확인해 주세요."
  }
}
```

## 7. 환경 변수

| 변수                        | 사용 위치 | 공개 여부   | 설명                            |
| --------------------------- | --------- | ----------- | ------------------------------- |
| `SUPABASE_URL`              | 백엔드    | 비공개      | Supabase 프로젝트 URL           |
| `SUPABASE_SERVICE_ROLE_KEY` | 백엔드    | 절대 비공개 | 관리자 권한이 있는 서버 전용 키 |

MVP 프론트엔드는 Python API만 호출하므로 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 사용하지 않는다. 향후 Supabase Auth 또는 Storage를 브라우저에서 직접 사용할 때만 공개용 URL과 anon key 추가를 검토한다.

로컬 환경 변수 파일은 Git에 커밋하지 않는다. 개발·미리보기·운영 환경의 값은 Vercel에서 각각 분리하여 관리한다.

## 8. 권장 디렉터리 구조

```text
project-root/
├─ api/                     # Python Vercel Serverless Functions
│  ├─ health.py
│  └─ ...
├─ src/                     # Next.js + TypeScript 소스
│  ├─ app/                  # App Router 페이지 및 레이아웃
│  ├─ components/
│  ├─ services/             # API 및 Supabase 클라이언트
│  ├─ types/
│  └─ hooks/
├─ supabase/
│  └─ migrations/           # 데이터베이스 마이그레이션
├─ public/
├─ .env.example
├─ package.json
├─ requirements.txt
├─ vercel.json
└─ TECH_STACK.md
```

## 9. 배포 및 개발 흐름

1. 개발자는 기능 브랜치에서 React 화면과 Python API를 개발한다.
2. Pull Request 생성 시 Vercel Preview 배포로 변경 사항을 확인한다.
3. 데이터베이스 변경은 Supabase 마이그레이션으로 검토한다.
4. 코드 검토와 자동 검사를 통과한 변경 사항을 운영 브랜치에 병합한다.
5. Vercel이 프론트엔드와 서버리스 함수를 운영 환경에 배포한다.

권장 자동 검사 항목은 TypeScript 타입 검사, ESLint, 프론트엔드 테스트, Python 린트 및 백엔드 테스트다.

## 10. 보안 및 운영 원칙

- 모든 통신은 HTTPS를 사용한다.
- 인증 및 권한 검사는 프론트엔드 표시 여부와 별개로 서버와 RLS에서 수행한다.
- 비밀 키는 Vercel 환경 변수로만 관리한다.
- 로그에 access token, 비밀번호, service role key 또는 개인정보를 남기지 않는다.
- API 요청 크기와 입력값을 제한하고 검증한다.
- 운영 오류를 추적할 수 있도록 구조화된 로그와 모니터링 도구 도입을 검토한다.
- 데이터베이스 백업 및 복구 정책을 운영 전에 확인한다.

## 11. 기술 선택 요약

이 구성은 Next.js App Router와 TypeScript로 안정적인 사용자 인터페이스를 개발하고, Python 서버리스 함수로 보안이 필요한 비즈니스 로직을 분리한다. Vercel은 Next.js 배포와 서버리스 함수 실행을 단순화하며, Supabase는 PostgreSQL 기반 데이터베이스, 인증, 파일 저장소를 하나의 서비스로 제공한다.

초기에는 단일 저장소에서 프론트엔드와 백엔드를 함께 관리한다. 서비스 규모가 커지거나 장시간 작업, 복잡한 배치 처리, 지속적인 연결이 필요해질 경우 별도 백엔드 런타임과 작업 큐 도입을 검토한다.
