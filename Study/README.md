# Superpowers × Codex — 10분 발표 자료

GitHub Superpowers 플러그인을 처음 접하는 사람에게 설명하기 위한 발표 자료입니다.

## 결과물

- `presentation/Superpowers_Codex_10min.pptx` — 발표용 슬라이드 17장

## 구성

| 섹션 | 슬라이드 | 내용 |
|---|---|---|
| — | 1–2 | 표지, 목차 |
| 01 왜 필요한가 | 3 | 절차 없이 바로 코딩할 때 생기는 문제 |
| 02 무엇인가 | 4–5 | Skill · Superpowers · Codex 정의, GitHub 저장소 |
| 03 어떤 Skill이 있는가 | 6–10 | 전체 흐름, 14개 Skill의 세 가지 종류 |
| 04 어떻게 쓰는가 | 11–16 | Skill 호출 방법, 설치, Brainstorming 실전, 대안 비교, 결과·검증 |
| — | 17 | 결론 3줄 |

## 다시 만들기

슬라이드는 `presentation/build.js`(pptxgenjs)로 생성합니다.
`presentation/img/`의 스크린샷을 상대 경로로 참조하므로 해당 디렉터리에서 실행해야 합니다.

```bash
cd presentation
npm install pptxgenjs
node build.js
```

## 참고

- https://github.com/obra/superpowers
- https://learn.chatgpt.com/ko-KR/docs/skills-and-plugins
