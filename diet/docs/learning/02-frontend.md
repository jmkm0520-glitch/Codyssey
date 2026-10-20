# 프론트엔드 집중하기

[← 학습 가이드 목차](./README.md) · [이전: 사용자 행동으로 보는 전체 흐름](./01-end-to-end-flow.md)

## 이 문서에서 답할 질문

> 전체 흐름에서 사용자가 직접 보고 조작하는 프론트엔드는 어떤 일을 하며, 이 프로젝트는 왜
> React와 Next.js를 사용하는가?

앞 문서에서는 사용자의 행동이 프론트엔드에서 시작해 백엔드와 Supabase를 거친 뒤 다시 화면으로
돌아오는 전체 흐름을 살펴봤다. 이제 그 흐름의 시작과 끝을 담당하는 프론트엔드를 확대한다.

## 먼저 기억할 한 문장

> 프론트엔드는 사용자가 브라우저에서 보고 조작하는 영역이며, React와 Next.js는 이 프로젝트가
> 프론트엔드를 구현하기 위해 선택한 도구다.

프론트엔드는 React와 같은 뜻이 아니다. 같은 프론트엔드를 다른 도구로 만들 수도 있다. 이
프로젝트는 복잡해지는 화면과 페이지를 관리하기 위해 React와 Next.js를 선택했다.

## 프론트엔드가 하는 일

이 프로젝트의 프론트엔드는 다음 일을 담당한다.

1. 날짜, 체중 입력창, 식단 카드, 달력 같은 화면을 표시한다.
2. 클릭, 입력, 파일 선택 같은 사용자 행동을 받는다.
3. 빈 값이나 잘못된 숫자 등을 먼저 확인한다.
4. 필요한 데이터를 Python 백엔드 API에 요청한다.
5. 요청 중, 성공, 오류 결과를 화면에 표시한다.

프론트엔드는 단순히 예쁜 화면을 만드는 영역이 아니다. 사용자의 행동을 프로그램의 동작으로
바꾸고, 서버에서 받은 결과를 이해할 수 있는 화면으로 표현하는 역할도 맡는다.

## 프론트엔드의 기본 재료

체중 입력 화면을 만든다고 생각하면 각 기술의 역할을 구분하기 쉽다.

| 기술 | 담당하는 일 | 체중 입력 화면의 예 |
| --- | --- | --- |
| HTML | 화면의 구조와 의미 | 제목, 체중 입력창, 저장 버튼 |
| CSS | 모양과 배치 | 색, 크기, 간격, 모바일 화면 배치 |
| JavaScript | 동작 | 입력 확인, 클릭 처리, API 요청, 화면 변경 |
| TypeScript | JavaScript의 타입 검사 | 날짜는 문자열, 체중은 숫자라는 데이터 모양 확인 |

### HTML

HTML은 브라우저 화면의 구조와 각 요소의 의미를 표현한다. 제목, 입력창, 버튼처럼 화면에 무엇이
있는지를 정하는 역할이다. React에서 이 구조를 작성하는 방법은 React를 먼저 이해한 뒤에 살펴본다.

### CSS

CSS는 구조에 색과 크기, 간격, 배치를 적용한다. 전체 공통 스타일은
[`src/app/globals.css`](../../src/app/globals.css)에 있고, 기록 화면 전용 스타일은
[`src/app/page.module.css`](../../src/app/page.module.css)에 있다. 이름에 `module`이 붙은 CSS
파일은 해당 화면과 컴포넌트에서 충돌을 줄이며 사용할 수 있다.

### JavaScript와 TypeScript

JavaScript는 입력이나 클릭에 반응하고 API를 호출하는 동작을 만든다. TypeScript는 JavaScript에
타입 검사를 더해 잘못된 데이터 사용을 개발 중에 찾도록 돕는다. 예를 들어
[`src/types/api.ts`](../../src/types/api.ts)는 체중과 식단, API 응답이 어떤 값을 가져야 하는지
정의한다.

TypeScript가 별도의 화면을 만드는 것은 아니다. Next.js가 TypeScript 코드를 브라우저가 실행할 수
있는 JavaScript로 준비한다.

## React는 왜 사용하는가

작은 화면은 HTML과 JavaScript만으로도 만들 수 있다. 하지만 화면이 커지면 같은 값을 읽거나
바꾸는 화면 요소가 많아진다. 이 프로젝트의 기록 화면만 해도 다음 값을 여러 곳에서 사용한다.

- 선택한 날짜
- 사용자가 입력한 체중과 식단
- 저장 중인지 여부
- 저장 성공 또는 오류 메시지
- 로그인 여부
- 달력에서 선택한 날짜의 상세 정보

예를 들어 날짜를 바꾸면 체중 입력창, 식단 카드, 저장 상태와 오류 메시지도 새 날짜에 맞춰 바뀌어야
한다. React 없이 JavaScript로 각 화면 요소를 직접 관리하면 값을 바꿀 때마다 관련된 요소를 각각
찾아서 수정해야 한다. 한 곳이라도 빠뜨리면 프로그램이 기억하는 값과 사용자가 보는 화면이 서로
달라질 수 있다.

React는 화면을 역할별 단위로 나누고, 데이터가 바뀌면 그 데이터에 맞는 화면을 다시 계산하도록
도와준다.

### React에서 화면 구조 작성하기: JSX

React 컴포넌트 안에서는 HTML과 비슷하게 생긴 **JSX** 문법으로 화면 구조를 작성한다. JSX는 HTML
자체가 아니라 JavaScript 또는 TypeScript 코드 안에서 화면 구조를 표현하는 방법이다. 예를 들어
[`src/app/page.tsx`](../../src/app/page.tsx)의 입력창과 버튼은 JSX로 작성되어 브라우저 화면에
나타난다.

### 1. 컴포넌트: 화면을 역할별로 나눈 단위

React 컴포넌트는 화면의 한 부분을 담당하는 JavaScript 또는 TypeScript 함수다.

- [`MealCard`](../../src/components/MealCard.tsx): 아침·점심·저녁·간식 중 한 끼 입력
- [`CalendarView`](../../src/components/CalendarView.tsx): 월간 달력과 날짜 상세
- [`AuthGate`](../../src/components/AuthGate.tsx): 로그인 상태에 따라 로그인 또는 기록 화면 선택

컴포넌트로 나누면 각 파일이 맡은 역할을 찾기 쉽고, 같은 화면 구조를 여러 데이터에 반복해서 사용할
수 있다.

### 2. Props: 부모가 자식에게 전달하는 값

**Props**는 부모 컴포넌트가 자식 컴포넌트에 전달하는 값이나 함수다. 기록 화면의 `Home`은 각
`MealCard`에 어떤 끼니인지, 저장된 기록은 무엇인지, 저장할 때 실행할 함수는 무엇인지 전달한다.

```text
Home
  ↓ meal, title, record, onSave 전달
MealCard
```

자식은 Props를 입력처럼 받아 사용한다. 전달받은 Props를 자식이 직접 바꾸기보다, 필요한 일이
생기면 부모가 전달한 함수를 호출한다.

### 3. State: 화면이 기억하는 값

**State**는 컴포넌트가 화면을 표시하는 동안 기억하는 변경 가능한 값이다.

[`src/app/page.tsx`](../../src/app/page.tsx)에는 다음과 같은 State가 있다.

- `selectedDate`: 현재 선택한 날짜
- `weightInput`: 사용자가 입력한 체중
- `isSavingWeight`: 체중 저장 요청을 처리 중인지 여부
- `weightSaveError`: 저장 중 발생한 오류 메시지

State가 바뀌면 React는 현재 값에 맞는 화면을 다시 계산한다. 예를 들어 `isSavingWeight`가 `true`가
되면 저장 버튼의 글자가 “저장 중...”으로 바뀐다.

### 4. 이벤트: 사용자 행동에 반응하는 함수

**이벤트**는 사용자의 클릭이나 입력처럼 브라우저에서 일어난 행동이다.

- `onChange`: 입력창의 값이 바뀔 때 실행
- `onClick`: 버튼을 클릭할 때 실행
- `onSubmit`: 폼을 제출할 때 실행

체중 입력창의 `onChange`는 입력값을 `weightInput` State에 반영하고, 저장 버튼의 `onClick`은
`saveWeight()`를 실행한다.

### 5. 렌더링과 재렌더링: 현재 값에 맞는 화면 계산

- **렌더링** (Rendering): 컴포넌트가 현재 Props와 State를 사용해 어떤 화면을 보여줄지 계산하는
  과정
- **재렌더링** (Re-rendering): Props나 State가 바뀐 뒤 화면을 다시 계산하는 과정

재렌더링은 페이지 전체를 새로 내려받는 것과 다르다. React는 변경된 값에 맞춰 필요한 화면을
갱신한다.

### 6. Effect: 화면을 보여준 뒤 필요한 일 실행하기

**Effect**는 화면을 먼저 보여준 뒤에 필요한 일을 실행하는 React 기능이다. 이 프로젝트에서는 다음
순서로 선택한 날짜의 기록을 불러온다.

```text
사용자가 날짜를 바꾼다
→ selectedDate State가 바뀐다
→ Effect가 새 날짜의 기록을 API에 요청한다
→ 받은 기록으로 체중 입력창과 식단 카드를 바꾼다
```

실제 코드의 핵심만 줄이면 다음과 같다.

```tsx
useEffect(() => {
  fetchApi<DayRecord>(`/api/day?date=${selectedDate}`).then((record) => {
    setDayRecord(record);
  });
}, [selectedDate]);
```

처음에는 문법을 외우기보다 다음 세 부분의 흐름만 이해한다.

- `[selectedDate]`: 이 값이 바뀌면 Effect를 다시 실행한다.
- `fetchApi(...)`: 선택한 날짜의 기록을 API에 요청한다.
- `setDayRecord(record)`: 받은 기록을 State에 저장해 화면을 갱신한다.

실제 [`src/app/page.tsx`](../../src/app/page.tsx)에는 오류를 처리하고 이전 요청의 결과가 뒤늦게
반영되지 않도록 막는 코드도 있다. 위 예시는 Effect의 핵심 흐름에 집중하기 위해 그 부분을 생략했다.

저장 버튼을 누르는 것처럼 특정 행동 때문에 실행하는 코드는 이벤트에서 처리한다. 날짜가 바뀔
때마다 기록을 불러오는 것처럼 화면의 값 변화에 따라 필요한 일은 Effect에서 처리한다.

## Next.js는 왜 사용하는가

React는 UI를 컴포넌트로 만드는 라이브러리다. Next.js는 React를 기반으로 페이지 주소, 공통
레이아웃, 서버·브라우저 렌더링 경계, 개발 서버와 프로덕션 빌드 같은 애플리케이션 구조를 제공하는
프레임워크다.

관계를 정리하면 다음과 같다.

```text
프론트엔드: 사용자와 상호작용하는 영역
└─ Next.js: 프로젝트와 페이지 구조를 제공하는 React 프레임워크
   └─ React: 화면을 컴포넌트로 구성하는 UI 라이브러리
      └─ HTML·CSS·JavaScript·TypeScript 사용
```

Next.js가 React를 대체하는 것이 아니다. 이 프로젝트의 React 컴포넌트가 Next.js가 제공하는 구조
안에서 동작한다.

## App Router: 파일과 주소 연결하기

이 프로젝트는 Next.js의 **App Router**를 사용한다. `src/app` 아래의 폴더와 특별한 파일 이름이
브라우저 주소와 화면을 연결한다.

| 파일 | 브라우저 주소 | 역할 |
| --- | --- | --- |
| [`src/app/page.tsx`](../../src/app/page.tsx) | `/` | 날짜별 식단·체중 기록 |
| [`src/app/calendar/page.tsx`](../../src/app/calendar/page.tsx) | `/calendar` | 달력 기록 조회 |
| [`src/app/import/page.tsx`](../../src/app/import/page.tsx) | `/import` | 스프레드시트 기록 가져오기 |
| [`src/app/layout.tsx`](../../src/app/layout.tsx) | 모든 경로 | 공통 HTML 구조와 `AuthGate` |

폴더는 주소의 구간을 만들고, 폴더 안의 `page.tsx`가 해당 주소에서 보여줄 화면을 만든다.
`layout.tsx`는 하위 페이지를 감싸는 공통 구조다. 이 프로젝트의 루트 레이아웃은 모든 페이지를
`AuthGate`로 감싸 로그인 상태를 먼저 확인한다.

## Server Component와 Client Component

두 용어는 **React 컴포넌트가 어느 환경의 기능을 사용할지 나누는 방식**이다.

- **Server Component**: Next.js 서버에서 실행되어 화면의 결과를 준비하는 컴포넌트다. 컴포넌트
  코드 자체는 브라우저용 JavaScript에 포함되지 않는다.
- **Client Component**: 브라우저에서도 실행할 수 있도록 JavaScript가 전달되는 컴포넌트다. State,
  클릭 이벤트처럼 사용자 행동에 반응하는 기능을 사용할 수 있다.

차이를 먼저 비교하면 다음과 같다.

| 구분 | Server Component | Client Component |
| --- | --- | --- |
| 주 역할 | 화면 구조와 데이터를 서버에서 준비 | 사용자 행동에 반응하는 기능 처리 |
| State·Effect | 사용할 수 없음 | 사용할 수 있음 |
| 클릭·입력 이벤트 | 직접 처리할 수 없음 | 처리할 수 있음 |
| `window`·`localStorage` | 사용할 수 없음 | 사용할 수 있음 |
| 브라우저로 보내는 컴포넌트 JavaScript | 포함되지 않음 | 포함됨 |
| 구분 방법 | App Router의 기본값 | 경계 파일 맨 위에 `"use client"` 작성 |

여기서 **서버**는 Next.js가 프론트엔드 화면을 준비하는 실행 환경을 뜻한다. 별도의 Python 백엔드
API가 Server Component라는 뜻은 아니다. 둘은 서로 요청을 주고받을 수 있지만 역할이 다른 코드다.

> **주의:** Client Component라고 해서 첫 화면을 브라우저에서만 만드는 것은 아니다. 처음 접속할
> 때는 Next.js가 Client Component를 포함한 HTML도 미리 준비할 수 있다. 그 후 브라우저가
> JavaScript를 받아 클릭과 입력 같은 상호작용을 연결한다. 이 과정을 **하이드레이션** (Hydration)이라고
> 한다.

### 기본은 Server Component

App Router의 page와 layout은 기본적으로 **Server Component**다. Server Component는 서버에서
화면 구조와 데이터를 준비할 수 있고, 브라우저에 보내는 JavaScript를 줄이는 데 유리하다. 서버
전용 코드는 브라우저에 보내지 않으므로 환경 변수나 데이터베이스 접근 같은 작업도 서버 쪽에 둘 수
있다. 단, 그 결과에 비밀 정보를 담아 Client Component에 전달해서는 안 된다.

### 상호작용이 필요하면 Client Component

다음 기능이 필요하면 **Client Component**를 사용한다.

- State
- 클릭과 입력 이벤트
- Effect
- `window`, `localStorage` 같은 브라우저 전용 기능

파일 맨 위의 `"use client"`는 이 파일부터 브라우저 상호작용이 필요한 영역이라는 경계를 표시한다.
이 파일이 직접 가져오는 컴포넌트와 모듈도 Client Component 영역에 포함되므로 모든 파일에 지시문을
반복할 필요는 없다.

### 이 프로젝트의 예

- [`src/app/layout.tsx`](../../src/app/layout.tsx): 지시문이 없는 기본 Server Component이며
  Client Component인 `AuthGate`를 렌더링한다.
- [`src/components/AuthGate.tsx`](../../src/components/AuthGate.tsx): State, Effect, 이벤트를
  사용하므로 `"use client"`가 있다.
- [`src/app/page.tsx`](../../src/app/page.tsx): 날짜·입력·API 상태와 이벤트를 처리하므로
  Client Component다.
- [`src/app/calendar/page.tsx`](../../src/app/calendar/page.tsx): 기본 Server Component이며
  상호작용을 담당하는 `CalendarView`를 렌더링한다.
- [`src/components/MealCard.tsx`](../../src/components/MealCard.tsx): 자체 지시문은 없지만 Client
  Component인 기록 화면 안에서 가져와 State와 이벤트를 사용한다.

## 체중 저장으로 다시 연결하기

지금까지 배운 개념이 체중 저장 한 번에 어떻게 사용되는지 살펴본다.

```text
1. JSX가 체중 입력창과 저장 버튼의 구조를 표현한다.
2. CSS Module이 입력 영역의 모양과 배치를 정한다.
3. weightInput State가 사용자가 입력한 값을 기억한다.
4. onChange 이벤트가 입력값을 State에 반영하고 1차 검사한다.
5. onClick 이벤트가 saveWeight()를 실행한다.
6. saveWeight()가 fetchApi()로 Python API에 요청한다.
7. 요청 중에는 isSavingWeight State로 버튼 상태를 바꾼다.
8. 성공하면 완료 상태, 실패하면 오류 상태를 바꿔 화면을 다시 렌더링한다.
```

프론트엔드의 책임은 여덟 번째 단계까지다. 요청을 다시 검사하고 데이터베이스에 저장하는 일은
Python 백엔드가 담당한다.

## `src/` 폴더 지도

- [`src/app/`](../../src/app/): URL과 연결되는 페이지, 레이아웃, 전체 스타일
- [`src/components/`](../../src/components/): 재사용하거나 역할별로 나눈 UI
- [`src/services/`](../../src/services/): API 통신, 날짜, 로컬 저장 같은 화면 밖 로직
- [`src/types/`](../../src/types/): 프론트엔드가 사용하는 데이터 모양
- [`public/`](../../public/): 브라우저에 제공하는 이미지 같은 정적 파일

## 자주 생기는 오해

### 프론트엔드는 디자인만 담당하는가?

아니다. 화면 디자인뿐 아니라 입력 처리, 1차 검증, API 요청, 로딩·성공·오류 표시도 담당한다.

### 프론트엔드와 React는 같은 뜻인가?

아니다. 프론트엔드는 역할이고 React는 그 역할을 구현하기 위해 선택할 수 있는 도구 중 하나다.

### Next.js가 React를 대체하는가?

아니다. Next.js는 React를 기반으로 프로젝트와 페이지 구조를 제공한다.

### TypeScript는 새로운 화면 기술인가?

아니다. TypeScript는 JavaScript 코드에 타입 검사를 더해 실수를 줄이는 개발 언어다.

### 모든 React 컴포넌트가 Client Component인가?

아니다. App Router에서는 React 컴포넌트를 Server Component와 Client Component로 구성할 수 있다.
State나 브라우저 이벤트가 필요한 경계부터 Client Component를 사용한다.

### Next.js Server Component가 Python 백엔드인가?

아니다. Server Component는 Next.js가 React 화면을 준비하는 방식이고, `api/`의 Python 코드는
요청 검증과 데이터 처리를 담당하는 별도의 백엔드 API다.

## 이해 확인

다음 질문에 자신의 말로 답해 본다.

1. 프론트엔드와 React의 차이는 무엇인가?
2. HTML, CSS, JavaScript, TypeScript는 각각 어떤 역할을 하는가?
3. Props와 State는 어떻게 다른가?
4. `/calendar` 화면과 연결되는 파일은 무엇인가?
5. 어떤 기능이 필요할 때 Client Component를 사용해야 하는가?
6. 체중 저장 버튼을 누른 뒤 어떤 State가 어떻게 바뀌는가?
7. Next.js Server Component와 Python 백엔드는 어떻게 다른가?

## 공식 참고 자료

- [React: Your First Component](https://react.dev/learn/your-first-component)
- [React: Adding Interactivity](https://react.dev/learn/adding-interactivity)
- [Next.js: Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages)
- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)

## 다음 문서

다음 [HTTP와 API 집중하기](./03-http-and-api.md)에서는 프론트엔드가 Python 백엔드에 요청하고 결과를
받는 통신 과정을 집중해서 살펴본다.
