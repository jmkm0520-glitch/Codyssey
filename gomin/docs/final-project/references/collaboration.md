# 고민일기 팀 역할과 협업 과정

## 팀 구성

팀명은 Happy Ending이다. 고민을 정리하며 오늘 하루를 해피엔딩으로 마무리하자는 뜻을 담았다. 김영규·김효원·김지민·선우진이 공동으로 기획하고 기능별 개발·QA를 나눴다.

| 팀원 | 담당 범위|
| --- | --- | --- |
| 김영규 | 회원·인증 기능 |
| 김효원 | 대화·마무리·요약·확정 요약 전달 |
| 김지민 | 이미지 생성·재생성·완성 결과·컬렉션 저장·조회|
| 선우진 | 요구사항 기반 QA와 전체 흐름 검증 |

## 기능 간 연결

대화 담당은 사용자가 확인한 요약을 확정하고 요약 ID를 후속 기능에 전달한다. 그림일기 담당은 서버에서 같은 요약의 소유권과 확정 여부를 확인한 뒤 그림을 만든다. 컬렉션은 생성 결과 ID를 저장하고 그 결과의 원본 요약을 조회한다.

요약 확정, 이미지 생성, 컬렉션 저장을 단계로 구분해 담당 기능 사이의 성공·실패 상태를 맞췄다.

## GitHub 작업 기록

| 작업 | 확인한 결과 | 기록 |
| --- | --- | --- |
| 대화·요약 연동 | REST 대화, 요약·확정과 후속 전달 | [PR #45](https://github.com/gomin-diary/gomin/pull/45) |
| 텍스트·이미지 생성 분리 | 네이토 텍스트 구성과 Gemini 이미지 생성 연결 | [PR #46](https://github.com/gomin-diary/gomin/pull/46) |
| 전체 화면 연결 | 요약 확정과 그림 생성 화면 연결 | [PR #47](https://github.com/gomin-diary/gomin/pull/47) |
| 입력 UX | 자동 초점, 즉시 메시지 표시, 미저장 대화 탐색 | [PR #49](https://github.com/gomin-diary/gomin/pull/49) |
| 컬렉션 상세 | 그림·요약 통합 모달 | [PR #50](https://github.com/gomin-diary/gomin/pull/50) |
| AI 결과 개선 | 이미지 장면·표정과 대화 방식 수정 | [PR #51](https://github.com/gomin-diary/gomin/pull/51), [PR #52](https://github.com/gomin-diary/gomin/pull/52) |
| 대기 상태 개선 | 응답 대기 표시와 스켈레톤·스피너 | [PR #53](https://github.com/gomin-diary/gomin/pull/53), [PR #54](https://github.com/gomin-diary/gomin/pull/54) |

## 협업 규칙

Jira에서 기능과 작업을 나누고 PR 제목에 관련 작업 번호와 변경 결과를 적는다. 커밋은 변경 목적에 따라 나누며 한국어로 작성한다. 구현 설명과 API·DB 계약은 프로젝트 문서에 정리한다.

QA 결과는 별도의 문서가 아닌 담당자에게 요청하여 빠르게 해결 될 수 있도록 수행한다.

- [QA 기록](../../engineering/talk-mvp-qa.md)

[프로젝트 구조](../README.md)
