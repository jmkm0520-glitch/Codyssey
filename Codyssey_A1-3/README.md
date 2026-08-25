# 오늘 뭐 먹지? 냉털 AI

## 서비스 소개

'오늘 뭐 먹지? 냉털 AI'는 냉장고에 남아 있는 식재료를 활용하여 AI가 다양한 레시피를 추천해 주는 웹 서비스입니다.

요리 초보, 자취생, 1~2인 가구 등 메뉴를 빠르게 결정하고 음식물 쓰레기를 줄이고 싶은 사용자를 대상으로 제작했습니다.

## 배포 URL

https://codyssey-a1-3-egmw.vercel.app

## 서비스 목표

- 남은 식재료 활용 지원
- 메뉴 선택 시간 단축
- 음식물 낭비 감소에 도움
- 개발 경험이 없는 사용자도 쉽게 쓸 수 있는 직관적인 입력 UX 제공

## 주요 기능

- 재료 태그 입력 및 개별 삭제
- 중복 재료 자동 방지
- 최대 30개 재료 입력
- 조건 빠른 입력 버튼과 직접 입력
- Gemini 기반 레시피 5개 추천
- 조리 시간, 난이도, 재료, 조리 순서, 냉털 팁 제공
- 브라우저 localStorage 기반 즐겨찾기
- 로딩·성공·오류 상태 안내
- 모바일·태블릿·PC 반응형 화면
- Vercel Python Serverless Function 배포

## 사용 기술

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- localStorage

### Backend / AI
- Python
- Vercel Serverless Functions
- Gemini API

### Deployment
- GitHub
- Vercel

## 프로젝트 구조

```text
today-fridge-ai-final-complete/
├─ api/
│  └─ recommend.py
├─ css/
│  └─ style.css
├─ js/
│  └─ app.js
├─ .env.example
├─ .gitignore
├─ .python-version
├─ index.html
├─ README.md
├─ requirements.txt
└─ vercel.json
```

## 로컬 실행

1. 프로젝트 폴더를 VSCode로 엽니다.
2. Live Server 확장 프로그램으로 `index.html`을 실행합니다.
3. 화면과 재료 태그 입력 기능을 확인합니다.

> Live Server에서는 Python API가 자동 실행되지 않으므로 실제 AI 추천은 배포된 Vercel 주소에서 확인하는 것이 가장 간단합니다.

## Vercel 배포

1. 프로젝트를 GitHub 저장소에 업로드합니다.
2. Vercel에서 해당 저장소를 Import합니다.
3. Vercel 프로젝트의 `Settings → Environment Variables`에 아래 값을 등록합니다.

```text
Name: GEMINI_API_KEY
Value: 본인의 새 Gemini API 키
```

4. 환경 변수를 저장합니다.
5. `Deployments`에서 최신 배포를 Redeploy합니다.
6. 배포 URL에서 재료 입력 → AI 추천 → 즐겨찾기까지 확인합니다.

## 보안 주의

- 실제 API 키가 포함된 `.env` 파일은 GitHub에 올리지 않습니다.
- 실제 키는 프론트엔드 JavaScript에 작성하지 않습니다.
- API 키는 Python Serverless Function에서 환경 변수로만 읽습니다.
- 화면, 저장소, 압축파일 등에 노출된 키는 즉시 폐기하고 새 키를 발급합니다.

## 핵심 동작 흐름

```text
사용자 재료 입력
→ JavaScript에서 중복 및 개수 확인
→ /api/recommend로 JSON 요청
→ Python에서 입력값 재검증
→ Gemini API 호출
→ JSON 레시피 5개 반환
→ JavaScript가 카드로 렌더링
→ 사용자가 즐겨찾기 저장
```

## 평가 및 면접 설명 포인트

- HTML, CSS, JavaScript를 파일별로 분리하여 유지보수성을 높였습니다.
- 프론트엔드와 백엔드 양쪽에서 입력값을 검증합니다.
- API 키를 서버 환경 변수로 관리하여 브라우저에 노출되지 않도록 했습니다.
- AI 응답을 JSON 형식으로 제한해 화면에 안정적으로 렌더링합니다.
- localStorage를 활용해 별도 데이터베이스 없이 즐겨찾기를 유지합니다.
- 모바일 환경에서도 사용할 수 있도록 반응형 레이아웃을 적용했습니다.

## requirements.txt 안내

현재 Python API는 표준 라이브러리만 사용하므로 설치할 외부 패키지가 없습니다.
