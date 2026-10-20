# 고민일기

## 프로젝트 개요

고민일기는 AI 친구 ‘모리’와 대화하며 고민을 정리하고, 한 장의 그림일기로 남기는 반응형 웹 서비스입니다. 대화 → 요약 확인·확정 → 그림일기 생성 → 컬렉션 저장·조회로 이어집니다.

- [배포 서비스](https://www.gomin.today)
- [프로젝트 소개](docs/final-project/references/overview.md): 서비스 가치와 이용 흐름
- [프로젝트 기획서](docs/final-project/proposal.md): 문제 정의, 타겟 사용자, AI 활용과 일정
- [기능 요구 명세서](docs/final-project/requirements/README.md): 기능·비기능 요구사항과 시스템 설계

## 팀원 역할

팀 **Happy Ending**의 팀원별 담당 기능과 협업 과정은 [팀 역할과 협업 문서](docs/final-project/references/collaboration.md)에 정리했습니다.

## 기술 스택

화면은 Next.js·React·TypeScript, 서버는 Python·FastAPI·Uvicorn을 사용합니다. 텍스트 AI는 네이토, 이미지 AI는 Gemini를 활용하며 데이터와 파일은 Supabase PostgreSQL·Storage에 저장합니다. 배포 플랫폼은 Vercel과 Render입니다.

- [시스템 아키텍처](docs/final-project/requirements/architecture.md): 구성 요소와 처리 흐름
- [기술 스택 선정 이유](docs/final-project/technology-selection.md): 기술·플랫폼별 선택 배경

## 실행 방법

### 설치

[설치 안내](docs/local-development/setup/README.md)의 준비 사항을 확인한 뒤, 저장소 루트에서 실행합니다. **Windows PowerShell, macOS/Linux 터미널 모두 같은 명령을 사용합니다.**

```sh
./scripts/setup.cmd
```

nvm·Node.js와 프로젝트 의존성을 설치합니다. 설치가 끝나면 새 터미널을 열고 저장소 루트로 이동하세요.

### 실행

```sh
npm run dev
```

- 웹: http://127.0.0.1:3000
- API 문서: http://127.0.0.1:8000/docs
- 종료: 실행 중인 터미널에서 `Ctrl+C`

대상별 시작·재시작은 다른 터미널에서 실행합니다.

```sh
npm run dev:frontend
npm run dev:backend
npm run dev:all
```

Supabase까지 중지하려면 `npm run supabase:stop`을 실행합니다.

상세 안내: [실행·재시작·종료](docs/local-development/runtime.md) · [서버 개별 실행](docs/local-development/manual-run.md)

## 결과

- [발표자료 PPTX](docs/final-project/gomin-presentation.pptx)
- [발표자료 Google Slides](https://docs.google.com/presentation/d/1Kepse_Rnh3sg62i3V0yE0dS6p29cXhsR/edit)
- [시연영상](docs/final-project/demo/gomin-service-demo.mp4): 52초 · 홈부터 대화·그림일기 생성·컬렉션 저장과 조회까지
- [서비스 흐름 캡처](docs/final-project/demo/README.md): 단계별 화면 11장
- [검증·배포 결과](docs/final-project/references/verification.md): 배포 환경의 이용 흐름 확인과 기존 자동·격리 검증 기록
- [사용자 피드백과 개선 결과](docs/final-project/references/user-testing.md): 실사용자 5명의 피드백 7건과 반영한 개선 5건

전체 자료는 [프로젝트 문서](docs/final-project/README.md)와 [전체 문서 목차](docs/README.md)에서 확인할 수 있습니다.
