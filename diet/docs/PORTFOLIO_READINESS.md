# 포트폴리오 제출 준비 현황

최종 점검일: 2026-08-21  
대상 Production: [www.food-broccoli.shop](https://www.food-broccoli.shop)

이 문서는 과제 요구사항과 현재 저장소의 구현·증거를 대조한 결과다. 구현되어 있어도 캡처나 실제 배포
확인이 없으면 **제출 증거 미완료**로 분리한다.

## 구현 및 문서화 완료

| 요구 범주 | 현재 근거 |
| --- | --- |
| 서비스 분석·타깃·페이지·기능·데이터·기술·배포 | [`portfolio service-review.md`](<./portfolio service-review.md>), [README](../README.md) |
| 사용자 흐름 3개 이상 | [portfolio.md](../portfolio.md)의 로그인·식단 기록·캘린더 흐름 |
| UX 문제 3개와 우선순위 | [portfolio.md](../portfolio.md)의 개선 과정 표 |
| 디자인 시스템과 3개 이상 화면/상태 명세 | [UI/UX 개선 시안 명세](./UI_UX_DESIGN_SPEC.md) |
| 식단 기록·클린/자유 선택·캘린더 상세 | 화면 구현 및 [수동 테스트](./manual-test-checklist.md) Test 3~6 |
| 로그인·사용자별 데이터 분리 | [서비스 분석](<./portfolio service-review.md>)과 Test 1·2·7 |
| Supabase 영속 DB·환경 변수 예시 | [`.env.example`](../.env.example), [보안·복구 문서](./SECURITY_AND_RECOVERY.md) |
| 반응형 기준(1440px·390px) | [수동 테스트](./manual-test-checklist.md) Test 10·데스크톱 확인 |
| 로딩·빈 상태·오류 상태 | [UI/UX 명세](./UI_UX_DESIGN_SPEC.md), Test 9·12 |
| Before 기준선·Trouble Shooting·Git 이력 | `docs/images/before-*.png`, [서비스 분석 2부](<./portfolio service-review.md>) |

## 제출 전 남은 작업

다음은 코드 누락보다 **제출 증거 또는 최종 확인이 필요한 항목**이다.

1. **After 스크린샷 촬영** — 로그인한 Production에서
   [`PORTFOLIO_CAPTURE_PLAN.md`](./PORTFOLIO_CAPTURE_PLAN.md)의 `after-01`~`after-10`을 촬영해
   `docs/images/`에 저장한다. 현재 Before 10장은 있으나 After 파일은 아직 없다.
2. **최신 Production 수동 회귀 확인** — 1440px와 390px에서
   [`manual-test-checklist.md`](./manual-test-checklist.md) Test 8, 10~12를 다시 실행하고, 결과·날짜를
   기록한다. 특히 체중 오류 문구의 레이아웃 고정과 통계 차트의 날짜 표기를 확인한다.
3. **디자인 원본 증거 선택** — 현재는 구현 기준 명세로 설계를 남겼다. 과제 심사에서 Figma 링크/파일을
   명시적으로 요구하면, 이 명세를 바탕으로 최소 3개 화면 상태를 Figma에 옮기고 공유 링크 또는 PDF를
   추가한다.
4. **Before/After 본문 편집** — After 캡처가 생기면 README와 `portfolio.md`의 각 개선 항목에 실제
   이미지를 연결하고, 캡처 날짜·배포 커밋을 캡처 계획 표에 적는다.

## 범위상 의도적으로 하지 않은 것

- 음식 분류 제안은 외부 AI가 아니라 키워드 기반 보조이며, 자동 선택·자동 저장하지 않는다.
- 목표 체중은 기기별 설정이며 감량 예측·치료·의료 조언을 제공하지 않는다.

두 선택 모두 현재 서비스 범위와 안전한 기록 보조 원칙을 지키기 위한 것이다.
