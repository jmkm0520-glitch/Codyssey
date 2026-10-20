# 포트폴리오 캡처 계획

이 문서는 개선 전(`before-*`)과 개선 후 화면을 같은 기준으로 촬영하기 위한 목록이다.
After 파일은 실제 Production에서 촬영한 뒤에만 완료 증거로 사용한다.

## 공통 촬영 규칙

- 대상: Production [www.food-broccoli.shop](https://www.food-broccoli.shop)
- 데스크톱은 1440px, 모바일은 390px 너비로 촬영한다.
- 기록이 필요한 화면은 기존 Before 기준과 맞추기 위해 가능한 한 같은 날짜·같은 데이터 구성을 사용한다.
- 로그인 정보, 이메일 주소, 토큰, 브라우저 확장 프로그램은 화면에 노출하지 않는다.
- 원본 PNG는 `docs/images/after-*.png`로 저장하고, 촬영 날짜·환경·테스트 계정 여부를 이 문서에 기록한다.

## 필수 After 캡처

| 파일명 | 화면·데이터 조건 | 증명할 내용 | 연결할 문서 |
| --- | --- | --- | --- |
| `after-01-stats.png` | 데스크톱 통계 탭, 최근 7일 기록 존재 | 상단부터 보이는 도넛·막대·날짜/기준선/영역이 보이는 체중 차트 | README Before/After 1, `portfolio.md` 8장 |
| `after-02-calendar.png` | Before 캘린더와 같은 월 | 월별 기록·날짜별 상태 확인 | `portfolio.md` Flow 3 |
| `after-03-calendar-detail.png` | 기록 있는 날짜 상세 | 4끼 음식명·클린/자유 라벨·Empty State | `portfolio.md` Flow 3 |
| `after-04-signup.png` | 회원가입 화면 | `첫 회원 만들기` 대신 `회원가입` 문구 | README Before/After 4 |
| `after-05-mobile.png` | 390px 통계 탭 | 모바일 차트·탭·가로 스크롤 없음 | 반응형 테스트 증거 |
| `after-06-meal-actions.png` | 저장된 식사 1건 | `수정 | 삭제` 두 버튼과 상태 라벨 | `portfolio.md` 문제 5 |
| `after-07-goal-weight.png` | 현재 55kg, 목표 50.2kg | 목표 설정·`수정` 버튼·남은 감량 `4.8kg` | `RECENT_FEATURES.md` |
| `after-08-meal-assist.png` | `연어 포케`, `햄버거`, `공복` 각각 | 키워드 기반 제안과 사용자의 최종 선택 | `RECENT_FEATURES.md` |
| `after-09-mobile-today.png` | 390px 오늘 기록, 저장된 식사 | 목표 카드·입력창·수정/삭제 버튼이 잘리지 않음 | `manual-test-checklist.md` Test 12 |
| `after-10-weight-error.png` | 체중 값이 유효하지 않은 오늘 기록 | 오류 문구가 보여도 체중 입력 행·저장 버튼의 위치가 유지됨 | `manual-test-checklist.md` Test 12 |

## Before / After 짝

| 개선 항목 | Before | After | 설명 문장 |
| --- | --- | --- | --- |
| 식단 패턴 파악 | `before-02-calendar.png` | `after-01-stats.png` | 달력의 상태를 눈으로 세던 흐름을 최근 7일 통계로 보완했다. |
| 하루 상태·기록량 확인 | `before-08-today-filled.png`, `before-03-calendar-detail.png` | `after-01-stats.png`, `after-03-calendar-detail.png` | 날짜별 막대와 상세 화면으로 기록 수와 상태를 함께 확인한다. |
| 신규 가입 첫인상 | `before-10-signup.png` | `after-04-signup.png` | 멀티 사용자 서비스에 맞는 회원가입 문구로 변경했다. |
| 기록 실수 복구 | 없음(기존에는 하루 초기화만 가능) | `after-06-meal-actions.png` | 한 끼만 수정·삭제할 수 있게 해 전체 기록을 지우는 부담을 줄였다. |

## 촬영 후 기록

촬영을 마치면 아래를 채운다.

| 촬영일 | 배포 커밋 | Production 확인 | 촬영자 | 비고 |
| --- | --- | --- | --- | --- |
| 2026-08-23 | 배포 리비전 미기록 | `www.food-broccoli.shop`에서 확인 | 사용자 제공 캡처 | `after-01`~`after-10` 저장 완료. 데스크톱은 통계 전체 화면, 모바일은 실제 iPhone 화면으로 촬영했다. |

## 캡처 보완 메모

- `after-08-meal-assist.png`는 `햄버거` 입력에 대한 자유식 제안과 사용자의 최종 선택을 보여 준다.
- `after-10-weight-error.png`는 목표 체중에 `0`을 입력했을 때의 유효성 검사 안내를 보여 준다. 다음 Production 회귀 점검 때는 오늘 체중 입력 행에서도 같은 오류 상태를 추가로 확인한다.
