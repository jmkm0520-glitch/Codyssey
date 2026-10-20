# 개발 작업 방식 익히기

[← 학습 가이드 목차](./README.md) · [이전: 인프라와 배포 집중하기](./07-infrastructure-and-deployment.md)

## 이 문서에서 답할 질문

> 이 프로젝트에서 코드를 바꾸기 전 무엇을 준비하고, 바꾼 뒤 무엇을 확인해야 안전한가?

개발은 코드를 입력하는 순간만을 뜻하지 않는다. 현재 상태를 확인하고, 작은 변경을 만들고, 자동 검사와
직접 review를 거쳐 의도한 변경만 기록하는 전체 반복이 한 번의 작업이다.

## 먼저 기억할 한 문장

> 준비 → 현재 상태 확인 → 작은 변경 → 자동 검사 → diff review → commit 순서를 반복한다.

```text
project 준비
→ working tree와 관련 코드 확인
→ 한 가지 행동만 작게 변경
→ 가까운 test와 전체 검사
→ 변경 내용 직접 읽기
→ 의도한 file만 stage·commit
```

## 필요한 도구와 역할

| 도구 | 이 프로젝트에서 하는 일 | version 확인 |
| --- | --- | --- |
| Node.js | Next.js·TypeScript와 frontend test 실행 | `node --version` |
| pnpm | Node dependency와 package script 관리 | `pnpm --version` |
| Python 3.12 | `api/`와 Python test 실행 | `python3.12 --version` |
| Vercel CLI | Next.js와 Python Function을 Local에서 함께 실행 | `vercel --version` |
| Git | 변경 이력과 commit 관리 | `git --version` |

이 저장소의 package manager 기준은 [`package.json`](../../package.json)에 적힌 **pnpm**이다. 같은
working tree에서 npm과 pnpm으로 dependency install을 번갈아 실행하면 lockfile과 설치 결과를 이해하기
어려워질 수 있으므로 `pnpm install`을 기준으로 한다.

## 처음 한 번 준비하기

### 1. project root 확인

다음 file이 보이는 directory가 project root다.

```text
package.json
requirements.txt
vercel.json
src/
api/
```

terminal에서 현재 위치를 확인한다.

```bash
pwd
```

### 2. Node dependency 설치

```bash
pnpm install
```

pnpm이 [`pnpm-lock.yaml`](../../pnpm-lock.yaml)에 기록된 dependency 관계를 기준으로 package를
준비한다. dependency를 바꾸지 않은 작업에서 lockfile이 예상 밖으로 크게 변했다면 commit 전에
원인을 확인한다.

### 3. Vercel CLI와 Python 확인

```bash
vercel --version
python3.12 --version
```

Vercel CLI가 없다면 다음 명령으로 설치할 수 있다.

```bash
pnpm add --global vercel
```

이 프로젝트의 [`.python-version`](../../.python-version)은 Python `3.12`를 요구한다. 다른 version의
Python만 있다면 전체 앱 script가 중단하고 먼저 3.12 설치를 안내한다.

### 4. 전체 앱 첫 실행

```bash
pnpm dev:vercel
```

이 명령은 [`scripts/vercel-dev.sh`](../../scripts/vercel-dev.sh)를 실행한다.

```text
처음이면 기존 Vercel project에 link
→ Vercel Development 설정과 환경 변수 pull
→ Python 3.12 .venv 생성·version 확인
→ requirements.txt dependency 설치
→ Vercel builder용 uv 준비
→ vercel dev 시작
```

처음 실행하는 사람은 올바른 Vercel team·project를 선택할 권한과 Development 환경 변수 접근 권한이
필요하다. `.vercel/`, `.venv/`, 실제 `.env*` file은 Git에서 제외된다.

## 어떤 개발 server를 실행해야 할까?

### 전체 앱: `pnpm dev:vercel`

Next.js frontend와 `api/` Python Functions를 함께 확인하는 기본 명령이다. 로그인, Supabase 연결,
기록 조회·저장을 확인할 때 사용한다.

기본 주소는 다음과 같다.

```text
http://localhost:3000
```

다른 port가 필요하면 Vercel 옵션을 전달한다.

```bash
pnpm dev:vercel --listen 127.0.0.1:4000
```

### frontend만: `pnpm dev`

```bash
pnpm dev
```

Next.js development server만 실행한다. 화면 layout이나 frontend-only logic을 빠르게 확인할 때는
유용하지만 Python `/api/*`를 제공하지 않는다. 로그인과 실제 Supabase 저장까지 확인하는 full-stack
실행으로 생각하면 안 된다.

### Vercel remote 설정 없이: `pnpm dev:vercel --local`

```bash
pnpm dev:vercel --local
```

Vercel project link와 Development 환경 변수 pull을 건너뛴다. 이 경우 `SUPABASE_URL`과
`SUPABASE_SERVICE_ROLE_KEY` 같은 필요한 값을 Git에서 제외된 Local 환경에 직접 준비해야 한다.
값을 terminal 출력이나 문서에 복사하지 않는다.

## 실행 직후의 짧은 확인

Local server가 켜졌다고 모든 기능이 정상이라는 뜻은 아니다. 변경 범위에 맞는 smoke check를 한다.

1. browser에서 Local page가 열리는가?
2. `/api/health`가 성공하는가?
3. Development용 test account로 로그인 상태를 확인할 수 있는가?
4. 변경한 화면·API의 성공과 실패 상태를 모두 확인했는가?
5. 저장을 시험한다면 Production이 아닌 Development 데이터인가?

실제 개인정보나 Production secret을 test 입력과 screenshot에 사용하지 않는다.

## 매 작업 시작 전에 확인할 것

### 1. 위치와 branch

```bash
pwd
git branch --show-current
```

어느 repository와 branch에서 작업하는지 먼저 확인한다. 팀이 branch·Pull Request workflow를 사용한다면
그 규칙에 맞는 작업 branch인지도 확인한다.

### 2. 이미 존재하는 변경

```bash
git status --short
```

이 명령은 수정·추가·삭제된 file을 짧게 보여 준다. 이미 변경된 file은 다른 작업 중인 내용일 수 있다.
내 작업과 무관한 변경을 reset하거나 덮어쓰지 않고, 겹치는 file이면 내용을 먼저 읽어 scope를
구분한다.

### 3. 최근 작업 맥락

```bash
git log -5 --oneline
```

최근 commit 목적을 보면 현재 code가 왜 그렇게 되어 있는지 찾을 단서가 된다.

### 4. 관련 file과 문자열 찾기

```bash
rg --files
rg -n "WeightUpsertRequest" api src
```

`rg --files`는 project file 지도를 빠르게 보고, `rg`는 function·type·endpoint가 정의되고 사용되는
위치를 찾는다. 이름이 비슷한 새 code를 만들기 전에 이미 있는 공통 code를 확인한다.

### 5. 현재 Next.js guide 확인

이 repository는 설치된 Next.js version의 API와 convention을 우선해야 한다. Next.js code를 바꿀 때는
dependency 설치 후 다음 directory에서 관련 guide와 deprecation을 확인한다.

```text
node_modules/next/dist/docs/
```

directory가 없다면 먼저 `pnpm install`이 정상 완료되었는지 확인한다. 기억하고 있는 다른 Next.js
version의 사용법을 현재 project에 그대로 적용하지 않는다.

## 변경은 작게 반복하기

한 번에 여러 문제를 함께 바꾸면 어떤 변경이 결과를 만들었는지 알기 어렵다.

```text
1. 사용자가 볼 행동 하나를 정한다.
2. 성공 조건과 실패 조건을 적는다.
3. 가장 가까운 test를 먼저 찾거나 추가한다.
4. 조건을 만족하는 최소 변경을 만든다.
5. 가까운 test를 실행한다.
6. 화면이나 API에서 직접 확인한다.
7. 다음 작은 행동으로 이동한다.
```

| 변경 영역 | 먼저 볼 위치 | 가까운 test 예 |
| --- | --- | --- |
| React 화면·상태 | `src/app/`, `src/components/` | `src/components/*.test.ts` |
| API 통신 | `src/services/`, `src/types/` | `src/services/*.test.ts` |
| Python endpoint | `api/*.py` | `api/*_test.py` |
| 공통 backend code | `api/lib/`, `api/models/` | 같은 directory의 `*_test.py` |
| DB schema | `supabase/migrations/` | SQL review와 연결 API test |

test file 이름만 보고 충분하다고 가정하지 않고 실제 assertion이 변경 조건을 검증하는지 읽는다.

## 자동 검사 명령과 서로 다른 목적

`.venv`는 `pnpm dev:vercel` 준비가 끝난 뒤 사용할 수 있다. 빠른 feedback부터 넓은 검증으로 다음
명령을 실행한다.

```bash
pnpm lint
pnpm typecheck
pnpm test
.venv/bin/python -m pytest
.venv/bin/ruff check api scripts
pnpm format:check
pnpm build
pnpm security:check
git diff --check
```

| 검사 | 주로 찾는 문제 | 이것만으로 알 수 없는 것 |
| --- | --- | --- |
| `pnpm lint` | ESLint 규칙, 의심스러운 frontend code | Type 전체 정합성, 실제 동작 |
| `pnpm typecheck` | TypeScript type 오류 | browser에서의 UI·API 동작 |
| `pnpm test` | 지정된 frontend logic regression | Python API, 모든 page의 시각 결과 |
| Python `pytest` | `api/` model·handler·공통 code 동작 | 실제 remote Supabase 전체 연결 |
| Ruff | Python syntax·import·lint 규칙 | 업무 요구사항이 맞는지 |
| `format:check` | Prettier 형식 차이 | code 동작과 사실 정확성 |
| `pnpm build` | Next.js production build 통합 | Production 환경 변수·외부 서비스 상태 |
| `security:check` | 알려진 service-role secret pattern 노출 | 모든 종류의 secret과 모든 보안 문제 |
| `git diff --check` | trailing whitespace와 충돌 marker 등 | 기능 정확성과 빠진 file |

문서만 바꿨더라도 자동 검사가 링크와 설명의 사실을 모두 보장하지 않는다. 상대 link가 실제로 열리는지,
설명이 현재 code·설정과 맞는지를 별도로 review한다.

한 명령이 실패하면 다른 검사를 무작정 반복하기보다 첫 실패의 출력과 관련 file부터 확인한다.

## Git의 세 상태 이해하기

Git 작업에는 세 상태가 있다.

```text
working tree: 지금 file에 만든 변경
→ git add
staging area: 다음 commit에 넣기로 선택한 변경
→ git commit
commit: 이름과 함께 저장된 project history
```

`git add`와 `git commit`은 같은 단계가 아니다. add한 뒤에도 commit 범위를 다시 확인할 수 있다.

## 의도한 변경만 commit하는 순서

```bash
git status --short
git diff -- path/to/file
git diff --check
git add path/to/file
git diff --cached
git commit -m "체중 입력 검증 개선"
git status --short
```

- `git diff`: 아직 stage하지 않은 실제 변경을 읽는다.
- `git add path/to/file`: 다음 commit에 넣을 file을 명시적으로 고른다.
- `git diff --cached`: stage된 최종 commit 내용을 읽는다.
- `git commit`: 검토한 stage 내용을 하나의 history로 기록한다.

초보 단계에서는 `git add .`로 모든 변경을 한꺼번에 담기보다 작업에 속한 file을 명시하는 편이 scope를
확인하기 쉽다. commit message는 “수정”, “작업”만 쓰기보다 무엇이 달라졌는지 한 가지 목적을 담는다.

push, Pull Request, Preview deployment는 remote repository와 외부 상태를 바꾼다. Local commit 이후
팀 workflow, 대상 branch, 권한과 검사 결과를 확인한 뒤 별도 단계로 수행한다.

## 환경 변수와 secret 작업 안전선

### 저장 위치

- [`.env.example`](../../.env.example): 필요한 변수 이름과 설명만 기록
- Local 실제 값: `.gitignore`에 포함되는 환경 설정
- Preview·Production 실제 값: Vercel의 해당 environment
- server code: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 이름으로 읽음

`SUPABASE_SERVICE_ROLE_KEY`에 `NEXT_PUBLIC_` 접두사를 붙이면 browser bundle에 노출될 수 있으므로
절대 사용하지 않는다.

### 출력과 공유

secret을 확인해야 할 때도 값 자체를 terminal output, log, screenshot, issue, chat, document, commit에
복사하지 않는다. “설정됨/설정되지 않음”처럼 존재 여부만 안전하게 확인한다.

### 자동 보안 검사 범위

[`scripts/security_check.py`](../../scripts/security_check.py)를 실행하는 `pnpm security:check`는 다음을
검사한다.

- 선택된 current text file의 Supabase secret/service-role pattern
- `src`, `public`, `.next/static` browser artifact의 server variable 이름
- log file
- Git history의 알려진 service-role pattern

이 검사는 모든 provider와 모든 secret 형식을 아는 범용 보안 review는 아니다. 실패했다면 값을 file에서
지우는 것으로 끝내지 않고, 이미 노출된 credential을 Supabase에서 **rotate**한 뒤 새 값을 안전한
환경에 다시 설정해야 한다.

## DB migration 작업의 추가 안전선

database 구조 변경은 application code보다 복구가 어려울 수 있다.

1. `supabase/migrations/`를 번호 순서로 읽어 current schema를 확인한다.
2. 운영에 이미 적용된 과거 file을 고치지 않고 새 번호의 migration을 만든다.
3. 변경 전 backup과 복구 가능 여부를 확인한다.
4. SQL, 기존 data, constraint와 lock 영향을 review한다.
5. 이전·새 application code가 변경 중 schema와 호환되는지 확인한다.
6. migration과 application deployment 순서를 정한다.
7. 실패했을 때의 rollback 또는 forward-fix 계획을 준비한다.

Preview application이 성공했다고 Production DB에 migration이 자동 적용된 것은 아니다. 현재
`vercel.json`과 package build에는 SQL migration 실행 단계가 없다.

## 자주 만나는 실행 문제

| 증상 | 먼저 확인 | 해결 방향 |
| --- | --- | --- |
| `python3.12`을 찾지 못함 | `python3.12 --version` | 지원 version 설치 후 다시 준비 |
| Vercel CLI 없음 | `vercel --version` | pnpm global install 확인 |
| project link·pull 실패 | Vercel login, team·project 권한 | 올바른 account와 기존 project 선택 |
| Supabase 설정 오류 | Development env에 두 변수 존재 여부 | 값은 출력하지 말고 Vercel 설정 확인 |
| `.venv` version 불일치 | `.venv/bin/python --version` | 원인을 확인하고 팀과 안전한 재생성 절차 결정 |
| port가 이미 사용 중 | 실행 중인 dev server와 port | 기존 process 확인 또는 다른 `--listen` 사용 |
| `pnpm dev`에서 `/api` 404 | 실행한 script | full stack이면 `pnpm dev:vercel` 사용 |
| dependency·lockfile 오류 | `package.json`, pnpm lock, install output | package manager 혼용 여부와 의도한 변경 확인 |
| dev는 되지만 build 실패 | `pnpm build`의 첫 오류 | production-only 규칙·type·server/client 경계 확인 |

오류가 보인다고 `.venv`, lockfile, working tree를 바로 삭제하지 않는다. 먼저 정확한 대상과 현재 변경을
확인하고 복구 가능한 해결 방법을 선택한다.

## 작업 종료 체크리스트

- [ ] 처음 정한 사용자 행동 하나가 실제로 달라졌는가?
- [ ] 작업과 관계없는 기존 변경을 보존했는가?
- [ ] 가까운 test와 변경 범위에 필요한 전체 검사를 실행했는가?
- [ ] 성공·실패·loading 같은 사용자 상태를 직접 확인했는가?
- [ ] secret이나 개인정보를 code·log·문서에 넣지 않았는가?
- [ ] migration이 있다면 backup·호환성·적용 순서를 검토했는가?
- [ ] `git diff`를 처음부터 끝까지 읽었는가?
- [ ] `git diff --check`가 통과했는가?
- [ ] `git diff --cached`가 한 가지 목적만 포함하는가?
- [ ] commit 뒤 `git status --short`로 남은 변경을 확인했는가?

## 자주 생기는 오해

### dev server가 켜지면 production build도 성공한 것인가?

아니다. development와 production build의 규칙이 다를 수 있으므로 `pnpm build`를 별도로 실행한다.

### lint·typecheck·test는 같은 검사인가?

아니다. style·의심 code, type 관계, 실행 결과를 각각 다른 방법으로 검사한다.

### `pnpm dev`가 frontend와 Python API를 모두 실행하는가?

아니다. 전체 앱은 `pnpm dev:vercel`로 확인한다.

### test가 통과하면 사용자 흐름과 secret도 모두 안전한가?

아니다. test가 작성된 조건만 확인한다. manual flow, build, secret scan과 diff review가 별도로 필요하다.

### Git add를 하면 commit이 만들어지는가?

아니다. add는 staging area에 선택하고 commit은 그 선택을 history로 기록한다.

### `.gitignore`에 secret을 추가하면 과거 commit에서도 사라지는가?

아니다. 이미 commit된 값은 history에 남을 수 있으므로 credential rotate와 history 대응을 별도로 한다.

### application deploy가 DB migration도 자동 적용하는가?

현재 구조에서는 아니다. 두 변경은 별도 적용 단계이며 순서와 호환성을 정해야 한다.

## 이해 확인

1. 로그인과 Python API까지 확인하려면 어떤 dev 명령을 사용해야 하는가?
2. lint, typecheck, test, build는 각각 어떤 종류의 문제를 찾는가?
3. Git의 working tree, staging area, commit은 어떻게 이어지는가?
4. `SUPABASE_SERVICE_ROLE_KEY`의 실제 값은 어디에 두고 어디에는 두면 안 되는가?
5. 적용된 DB migration을 직접 수정하는 대신 새 migration을 만드는 이유는 무엇인가?

## 공식 참고 자료

- [Vercel CLI: `vercel dev`](https://vercel.com/docs/cli/dev)
- [Vercel CLI로 project 배포·link·env 준비](https://vercel.com/docs/projects/deploy-from-cli)
- [pnpm: `pnpm install`](https://pnpm.io/cli/install)
- [Git: `git status`](https://git-scm.com/docs/git-status)
- [Git: `git diff`](https://git-scm.com/docs/git-diff)
- [pytest: `python -m pytest`](https://docs.pytest.org/en/stable/how-to/usage.html)

## 다음 문서

다음 [실제 코드로 전체 흐름 다시 연결하기](./09-code-walkthrough.md)에서는 지금까지 배운 지도를
사용해 session 확인, 하루 기록 조회, 체중 저장, 식단 저장, 달력 조회, 회원가입을 실제 file과
function 순서로 다시 연결한다.
