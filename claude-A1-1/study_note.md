# 프롬프트 관리 프로그램 — 복습용 학습노트

> 과제를 끝낸 뒤 다시 훑어볼 때 쓰는 문서입니다. `subject.md`(요구사항), `context.md`(개념 상세), `checklist.md`(진행상황), `main.py`(실제 코드), git 커밋 로그를 종합했습니다.

---

## 1. 프로젝트 파일 구조

| 파일 | 역할 |
|---|---|
| `main.py` | 실제 동작하는 프롬프트 관리 프로그램 (제출물의 핵심) |
| `hello.py` | 개발환경 점검용 `print("Hello")` 테스트 파일 |
| `subject.md` | 과제 요구사항 원문 |
| `checklist.md` | `subject.md` 기준으로 만든 작업 체크리스트 |
| `context.md` | 기능 구현 단계별로 새로 배운 파이썬 개념 정리 (5-1~5-6) |
| `README.md` | 저장소 설명 (현재 제목 한 줄만 있음, 보완 필요) |
| `.gitignore` | Git 추적 제외 파일 설정 |

---

## 2. 요구사항 → 구현 매핑

| 요구사항 (subject.md) | 구현 위치 | 상태 |
|---|---|---|
| 메뉴 출력, 번호 선택, 잘못된 입력 처리, 종료 | `show_menu()`, `main()` | ✅ |
| 기본 프롬프트 3개 이상 등록 | 전역 `prompts` 리스트 | ✅ (3개) |
| 프롬프트 추가 (빈값 재입력, 카테고리 선택/직접입력) | `add_prompt()` | ✅ |
| 프롬프트 목록 (브랜치 작업 요구) | `show_list()` | ✅ (`feature/list-view` → merge) |
| 카테고리별 조회 | `show_by_category()` | ✅ |
| 검색 (제목/내용, 결과 없음 처리) | `search_prompt()` | ✅ |
| 상세 보기 (잘못된 번호 처리) | `show_detail()` | ✅ |
| 즐겨찾기 토글 / 목록 | `toggle_favorite()`, `show_favorites()` | ✅ |
| 기능별 함수 분리 | 함수 9개로 분리됨 | ✅ |
| README 상세 작성 (설명/실행법/기능목록/카테고리) | `README.md` | ❌ 미완료 |
| 커밋 10개 이상, 의미 있는 메시지 | git log 22개 커밋 | ✅ |
| init/add/commit/push/pull/checkout/clone/merge 각 1회 이상 | — | ⚠️ `pull`, `clone` 사용 이력 로그로는 미확인, 직접 확인 필요 |
| 보너스 (JSON 영속화, CRUD, 조회수) | — | ❌ 미착수 (선택) |

---

## 3. 데이터 구조

```python
CATEGORIES = ["텍스트 생성", "이미지 생성", "영상 생성", "페르소나", "자동화", "기타"]

prompts = [
    {"title": str, "content": str, "category": str, "favorite": bool},
    ...
]
```

- **`prompts`는 "리스트 안에 딕셔너리"** 구조. 리스트 = 순서 있는 사물함, 각 칸 안의 딕셔너리 = 이름표 붙은 서랍(title/content/category/favorite).
- `prompts[i]["title"]`처럼 인덱스로 칸을 열고, 키로 서랍을 여는 2단계 접근.

---

## 4. 함수별 워크스루 (목적 · 핵심 로직 · 쓰인 개념)

### `show_menu()` — 메뉴 출력 + 선택 입력
메뉴 텍스트를 출력하고 `input().strip()`으로 받은 문자열을 그대로 반환. 반환값 검증은 호출부(`main`)에서 처리.

### `add_prompt(prompts)` — 프롬프트 추가
1. 제목/내용을 `while not 값:`으로 빈 입력이면 재요청 (`.strip()`, 빈 문자열의 논리값)
2. 카테고리는 번호 선택 또는 "직접 입력" 처리 — `choice.isdigit()`으로 숫자만 통과시켜 `int()` 변환 시 에러 방지
3. `prompts.append({...})`로 새 딕셔너리를 리스트 끝에 추가, `favorite`은 기본 `False`

### `show_list(prompts)` — 전체 목록
```python
if not prompts:          # 조기 반환 (가드 절)
    print("...")
    return
for i, p in enumerate(prompts, start=1):   # 번호 + 항목 동시에
    star = "⭐" if p["favorite"] else ""   # 조건부 표현식
    print(f"{i}. {p['title']} [{p['category']}] {star}")
```
**브랜치 실습 대상 기능** — `feature/list-view`에서 작업 후 `main`으로 병합.

### `show_by_category(prompts)` — 카테고리별 조회
카테고리 선택을 받은 뒤,
```python
filtered = [p for p in prompts if p["category"] == category]   # 리스트 컴프리헨션
```
로 필터링. `show_list`와 동일한 조기 반환·조건부 표현식 패턴 재사용.

### `search_prompt(prompts)` — 검색
```python
result = [p for p in prompts if keyword in p["title"] or keyword in p["content"]]
```
`in` 연산자로 부분 포함 여부 확인, `or`로 제목·내용 중 하나라도 걸리면 검색됨.

### `show_detail(prompts)` — 상세 보기
```python
if not number.isdigit() or not (1 <= int(number) <= len(prompts)):
    print("잘못된 번호입니다.")
    return
```
**단락 평가**가 핵심: `number.isdigit()`이 거짓이면(=숫자 아니면) 왼쪽 `not`이 참이 되어 `or` 전체가 확정되고, 오른쪽의 위험한 `int(number)`는 아예 실행되지 않음 → 에러 없이 안전하게 걸러짐.

### `toggle_favorite(prompts)` — 즐겨찾기 토글
```python
p["favorite"] = not p["favorite"]
```
전등 스위치처럼 현재 값을 읽어 `not`으로 뒤집어 재저장하는 **토글 패턴**.

### `show_favorites(prompts)` — 즐겨찾기 목록
```python
favorites = [p for p in prompts if p["favorite"]]
```
리스트 컴프리헨션으로 `favorite=True`인 항목만 추출.

### `main()` — 실행 루프
`while True`로 `show_menu()`를 반복 호출하고, 반환된 문자열을 `if/elif`로 분기해 각 기능 함수 호출. `"0"`이면 `break`로 루프 종료.

---

## 5. 함수 입력/출력 자료형 요약

| 함수 | 입력 | 출력 |
|---|---|---|
| `show_menu()` | 없음 | `str` |
| `add_prompt(prompts)` | `list[dict]` | `None` (목록 직접 수정) |
| `show_list(prompts)` | `list[dict]` | `None` |
| `show_by_category(prompts)` | `list[dict]` | `None` |
| `search_prompt(prompts)` | `list[dict]` | `None` |
| `show_detail(prompts)` | `list[dict]` | `None` |
| `toggle_favorite(prompts)` | `list[dict]` | `None` (목록 직접 수정) |
| `show_favorites(prompts)` | `list[dict]` | `None` |
| `main()` | 없음 | `None` |

---

## 6. 파이썬 핵심 문법 총정리

| 개념 | 한 줄 설명 | 코드 예시 | 처음 등장 |
|---|---|---|---|
| `list` / `dict` / 중첩 구조 | 순서 있는 묶음 / 키-값 쌍 / 리스트 속 딕셔너리 | `prompts[0]["title"]` | 기초 |
| `.strip()` | 양옆 공백 제거 | `input().strip()` | 5-1 |
| `while` + 빈 문자열의 논리값 | 조건이 참인 동안 반복, `""`는 `False` | `while not title:` | 5-1 |
| `.isdigit()` | 숫자로만 구성됐는지 검사 | `choice.isdigit()` | 5-1 |
| `list.append()` | 리스트 끝에 항목 추가 | `prompts.append({...})` | 5-1 |
| `enumerate(start=1)` | 값 + 순번을 함께 꺼냄 | `for i, p in enumerate(prompts, start=1):` | 5-2 |
| 조건부 표현식 | `if/else`를 한 줄로 | `"⭐" if fav else ""` | 5-2 |
| 빈 리스트의 논리값 | `[]`는 `False` | `if not prompts:` | 5-2 |
| 조기 반환 (가드 절) | 조건 걸리면 함수 즉시 종료 | `if not prompts: return` | 5-2 |
| 리스트 컴프리헨션 | 조건에 맞는 것만 골라 새 리스트 생성 | `[p for p in prompts if ...]` | 5-3 |
| `in` 연산자 | 포함 여부 확인 (부분 일치 OK) | `keyword in p["title"]` | 5-4 |
| 단락 평가 | `or` 왼쪽이 참이면 오른쪽 검사 생략 | `not x.isdigit() or not (...)` | 5-5 |
| 토글 패턴 | `not`으로 현재 값을 반전 | `p["favorite"] = not p["favorite"]` | 5-6 |

**학습 흐름의 특징**: 5-3부터는 매 단계 이전 개념(조기 반환, 조건부 표현식 등)을 재사용하면서 신규 개념 1개씩만 쌓는 구조. 개념이 누적되므로 헷갈리면 `context.md`의 `[[이전 단계]]` 링크를 따라 역추적하면 됨.

---

## 7. Git / GitHub 학습 정리

### 사용한 명령어와 의미

| 명령어 | 의미 | 이 프로젝트에서 |
|---|---|---|
| `init` | 로컬 저장소 시작 | 프로젝트 폴더에서 최초 1회 |
| `add` | 변경사항을 스테이징 | 커밋 전마다 |
| `commit` | 스테이징된 변경을 기록 | 총 22개 커밋 |
| `push` | 원격 저장소로 업로드 | GitHub 연동 후 |
| `pull` | 원격의 변경을 로컬로 가져와 병합 | ⚠️ 사용 이력 확인 필요 |
| `checkout` | 브랜치 전환 (`-b`는 생성+전환) | `feature/list-view` 작업/복귀 |
| `clone` | 원격 저장소를 통째로 복제 | 샘플 저장소 구조 확인용 |
| `merge` | 다른 브랜치의 변경을 현재 브랜치로 합침 | `f8a09c6` 커밋에서 실습 |

### 브랜치란
main에 영향 주지 않고 독립적으로 커밋을 쌓는 작업 공간. 불안정한 코드를 격리했다가 완성되면 `merge`.

### 실제 작업 흐름 (커밋 로그 요약)
```
초기 설정 → 메뉴/루프 구조 → 기본 데이터 3개
→ add_prompt 구현 → [feature/list-view] show_list 구현 → main으로 merge
→ show_by_category → search_prompt → show_detail → 즐겨찾기 기능
→ (학습 목적으로 TODO 롤백 후 재구현) → 개념 문서(context.md) 단계별 추가
```
특이점: `refactor: 학습을 위해 기능 구현부를 TODO로 되돌리고...` 커밋처럼, 완성된 기능을 일부러 되돌려 다시 짜보며 이해를 다진 흔적이 있음 — 단순 완성이 아니라 체화를 목표로 한 작업 방식.

---

## 8. 복습 자가진단 (과제 목표 기준)

과제의 "과제 목표" 항목을 스스로 설명할 수 있는지 체크하는 질문 목록입니다.

1. `init`, `add`, `commit`, `push`, `pull`, `checkout`, `clone`, `merge`를 각각 한 문장으로 설명할 수 있는가?
2. 리스트 컴프리헨션(`[p for p in prompts if ...]`)을 `for` + `append()` 방식으로 풀어 쓸 수 있는가?
3. `show_detail()`의 `or` 조건에서 왜 `number.isdigit()` 검사가 반드시 `int(number)` 변환보다 먼저 와야 하는지 설명할 수 있는가? (단락 평가)
4. 조기 반환(가드 절)을 쓰지 않고 같은 동작을 `if/else`로 다시 짤 수 있는가?
5. `toggle_favorite`의 토글 로직을 즐겨찾기가 아닌 다른 상황(예: 읽음/안읽음)에 적용해 설명할 수 있는가?
6. 브랜치를 왜 만들고, `merge` 시점에 어떤 일이 일어나는지 설명할 수 있는가?
7. `prompts` 같은 "리스트 안 딕셔너리" 구조를 그림 없이 말로 설명할 수 있는가?

---

## 9. 남은 작업 (checklist.md 기준)

- [ ] README.md에 프로그램 설명 / 실행 방법 / 기능 목록 / 카테고리 설명 작성
- [ ] `pull`, `clone` 실제 사용 여부 재확인 (요구사항 충족용)
- [ ] 코드 품질 항목(함수 분리, 함수명 규칙) 체크리스트 표시
- [ ] 제출용 스크린샷 4종 준비 (개발환경, 실행결과, git log 그래프)
- [ ] (선택) 보너스: JSON 영속화, Markdown 내보내기, CRUD, 조회수 정렬
