# 프로젝트 작업 설명 (009~024)

### 009

문장: Next.js App Router의 TypeScript 템플릿으로 프로젝트를 생성한다.

개념: Next.js는 웹사이트 제작 도구이고, TypeScript는 오류를 줄여주는 JavaScript 확장 언어입니다.

뜻: 웹사이트를 만들 기본 뼈대를 Next.js와 TypeScript로 준비했다는 뜻입니다.

### 010

문장: `api/` 디렉터리에 Python Vercel Functions 기본 구조를 만든다.

개념: API는 데이터를 주고받는 기능이고, Vercel Functions는 서버 코드를 실행하는 기능입니다.

뜻: 식단과 체중 데이터를 처리할 서버 기능의 기본 위치를 만들어두었다는 뜻입니다.

### 011

문장: `src/app`, `src/components`, `src/services`, `src/types`, `src/hooks` 디렉터리를 만든다.

개념: 폴더를 기능별로 나누면 코드 관리가 쉬워집니다.

뜻: 화면, 부품, 데이터 처리, 자료 형태, 공통 기능을 각각 정리할 폴더를 만든 것입니다.

### 012

문장: `supabase/migrations` 디렉터리를 만든다.

개념: Migration은 데이터베이스 구조를 만들거나 변경하는 기록입니다.

뜻: 식단과 체중 테이블을 만들 SQL 파일을 저장할 폴더를 준비했다는 뜻입니다.

### 013

문장: 실행·빌드·검사 스크립트와 의존성을 `package.json`에 정리한다.

개념: `package.json`은 프로젝트 실행 명령과 필요한 JavaScript 패키지를 관리하는 파일입니다.

뜻: 실행, 배포용 빌드, 코드 검사 명령을 한곳에 정리했다는 뜻입니다.

### 014

문장: Supabase Python Client, Pydantic 및 테스트 도구를 `requirements.txt`에 정의한다.

개념: `requirements.txt`는 Python에 필요한 패키지 목록입니다.

뜻: Python 서버가 Supabase와 연결되고 데이터를 검증·테스트할 수 있도록 필요한 도구를 적었다는 뜻입니다.

### 015

문장: ESLint와 Prettier를 설정한다.

개념: ESLint는 코드 문제를 찾고, Prettier는 코드 모양을 자동으로 정리합니다.

뜻: JavaScript와 TypeScript 코드를 검사하고 일정한 형식으로 맞추도록 설정했다는 뜻입니다.

### 016

문장: Python 린트 및 포맷 도구를 설정한다.

개념: 린트는 문제 있는 코드를 찾고, 포맷은 코드 모양을 정리합니다.

뜻: Python 코드도 검사하고 보기 좋게 자동 정리할 수 있도록 설정했다는 뜻입니다.

### 017

문장: `.gitignore`에 환경 변수, 빌드 결과물 및 Python 캐시를 추가한다.

개념: `.gitignore`는 GitHub에 올리지 않을 파일을 지정하는 파일입니다.

뜻: 비밀번호 파일, 임시 파일, 자동 생성 파일이 GitHub에 올라가지 않도록 설정했다는 뜻입니다.

### 018

문장: `.env.example`에 필요한 변수 이름과 용도를 작성한다.

개념: `.env`는 비밀번호나 서버 주소 같은 환경 설정을 저장하는 파일입니다.

뜻: 실제 비밀번호는 넣지 않고, 어떤 환경 변수가 필요한지만 예시로 적어둔 것입니다.

### 019

문장: `SUPABASE_URL`

개념: Supabase 프로젝트의 인터넷 주소입니다.

뜻: Python 서버가 어느 Supabase 데이터베이스에 연결할지 알려주는 값입니다.

### 020

문장: `SUPABASE_SERVICE_ROLE_KEY`

개념: Supabase 서버 작업을 위한 비밀 인증 키입니다.

뜻: 서버가 데이터베이스에 접근할 때 사용하는 비밀번호이며, 브라우저나 GitHub에 공개하면 안 됩니다.

### 021

문장: MVP 브라우저 번들에 Supabase URL과 anon key를 넣지 않는다.

개념: MVP는 첫 번째로 만드는 최소 기능 버전이고, 브라우저 번들은 사용자의 웹페이지로 전달되는 코드입니다.

뜻: 사용자의 브라우저에 Supabase 연결 정보가 노출되지 않도록 했다는 뜻입니다.

### 022

문장: 향후 Auth 또는 Storage를 브라우저에서 사용할 때만 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 추가한다.

개념: `NEXT_PUBLIC_`으로 시작하는 값은 브라우저에 공개될 수 있습니다.

뜻: 로그인이나 파일 저장 기능 때문에 꼭 필요할 때만 공개용 Supabase 설정을 추가하겠다는 뜻입니다.

### 023

문장: Next.js와 Python API를 함께 배포하도록 `vercel.json`을 작성한다.

개념: `vercel.json`은 Vercel 배포 방식을 설정하는 파일입니다.

뜻: 화면은 Next.js로, 서버 API는 Python으로 함께 배포되도록 설정했다는 뜻입니다.

### 024

문장: `/api/health` 상태 확인 API를 만들고 호출되는지 확인한다.

개념: Health API는 서버가 정상적으로 작동하는지 확인하는 간단한 주소입니다.

뜻: `/api/health`에 접속했을 때 서버가 정상이라는 응답을 보내는지 테스트했다는 뜻입니다.
