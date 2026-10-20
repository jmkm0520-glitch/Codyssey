const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";           // 13.333 x 7.5
pres.author = "Superpowers 발표";
pres.title  = "GitHub Superpowers x Codex";

const F = "Calibri";
const P = {
  ink:"0F1B33", ink2:"1B2942", ink3:"27374F",
  blue:"2F6BFF", blueDk:"1E4FD1", blueSoft:"EEF3FF", blueLine:"D3E0FF",
  amber:"F2994A", amberSoft:"FDF2E6",
  gray:"5B6577", gray2:"8A94A6",
  line:"E5E8EE", card:"F6F7F9", white:"FFFFFF"
};
const MX = 0.7, CW = 13.333 - MX*2;
const TOP = 1.62, FOOT = 6.98;

let pageNo = 0;
function newSlide(dark){
  const s = pres.addSlide();
  s.background = { color: dark ? P.ink : P.white };
  pageNo++;
  return s;
}
function head(s, kicker, title, opt){
  opt = opt || {};
  s.addText(kicker, { isTextBox:true, x:MX, y:0.42, w:CW, h:0.26, margin:0,
    fontFace:F, fontSize:11, bold:true, color:P.blue, charSpacing:1.4 });
  s.addText(title, { isTextBox:true, x:MX, y:0.70, w:opt.tw||CW, h:0.66, margin:0,
    fontFace:F, fontSize:opt.size||24, bold:true, color:P.ink, valign:"top", lineSpacingMultiple:1.1 });
  s.addText(String(pageNo).padStart(2,"0"), { isTextBox:true, x:12.1, y:0.42, w:0.53, h:0.26, margin:0,
    fontFace:F, fontSize:11, color:P.gray2, align:"right" });
}
function foot(s, txt, dark){
  s.addText(txt, { isTextBox:true, x:MX, y:FOOT, w:CW, h:0.26, margin:0,
    fontFace:F, fontSize:9.5, color: dark ? "6E7C96" : P.gray2 });
}
function rrect(s, o){
  s.addShape(pres.ShapeType.roundRect, {
    x:o.x, y:o.y, w:o.w, h:o.h, rectRadius:o.r===undefined?0.07:o.r,
    fill:{ color:o.fill }, line: o.lineColor ? { color:o.lineColor, width:1 } : { type:"none" }
  });
}
function chip(s, x, y, n, opt){
  opt = opt || {};
  const d = opt.d || 0.36;
  s.addShape(pres.ShapeType.roundRect, { x, y, w:d, h:d, rectRadius:0.09,
    fill:{ color:opt.fill || P.blue }, line:{ type:"none" } });
  s.addText(n, { isTextBox:true, x, y, w:d, h:d, margin:0, align:"center", valign:"middle",
    fontFace:F, fontSize:opt.fs || 13, bold:true, color:opt.color || P.white });
}
function bullets(s, items, o){
  s.addText(items.map((t,i)=>({ text:t, options:{ bullet:{ code:"2022" }, breakLine:i<items.length-1,
    paraSpaceAfter: o.gap===undefined?7:o.gap } })), {
    isTextBox:true, x:o.x, y:o.y, w:o.w, h:o.h, margin:0,
    fontFace:F, fontSize:o.fs||12, color:o.color||P.gray, lineSpacingMultiple:1.15 });
}
function callout(s, txt, y, opt){
  opt = opt || {};
  rrect(s, { x:MX, y, w:CW, h:opt.h||0.62, fill: opt.fill || P.blueSoft, r:0.06 });
  s.addText(txt, { isTextBox:true, x:MX+0.3, y, w:CW-0.6, h:opt.h||0.62, margin:0,
    align:"center", valign:"middle", fontFace:F, fontSize:opt.fs||13.5, bold:true, color:opt.color||P.blueDk });
}

/* ───────────────────────── 01 · TITLE ───────────────────────── */
{
  const s = newSlide(true);
  s.addText("AI 코딩 에이전트 입문", { isTextBox:true, x:0.9, y:1.42, w:7.6, h:0.3, margin:0,
    fontFace:F, fontSize:13, bold:true, color:P.amber, charSpacing:1.6 });

  s.addText("GitHub Superpowers", { isTextBox:true, x:0.9, y:1.86, w:7.8, h:0.82, margin:0,
    fontFace:F, fontSize:42, bold:true, color:P.white });
  s.addText("× Codex", { isTextBox:true, x:0.9, y:2.66, w:7.8, h:0.82, margin:0,
    fontFace:F, fontSize:42, bold:true, color:P.blue });

  s.addText("AI에게 “무엇을” 시킬지가 아니라,\n“어떤 순서로” 일할지 알려주는 플러그인",
    { isTextBox:true, x:0.9, y:3.62, w:7.6, h:0.9, margin:0,
      fontFace:F, fontSize:15, color:"C3CFE2", lineSpacingMultiple:1.35 });

  const tags = ["Superpowers란?", "Codex에서 쓰는 법", "모델이 Skill을 고르는 원리"];
  let tx = 0.9;
  tags.forEach(t=>{
    const w = 0.34 + t.length * 0.135;
    s.addShape(pres.ShapeType.roundRect, { x:tx, y:4.72, w, h:0.42, rectRadius:0.2,
      fill:{ color:P.ink }, line:{ color:"33455F", width:1 } });
    s.addText(t, { isTextBox:true, x:tx, y:4.72, w, h:0.42, margin:0, align:"center", valign:"middle",
      fontFace:F, fontSize:11, color:"AFBFD6" });
    tx += w + 0.18;
  });

  s.addText("10분 발표 · 입문자용 · 2026-09-03", { isTextBox:true, x:0.9, y:6.36, w:6, h:0.3, margin:0,
    fontFace:F, fontSize:11, color:"6E7C96" });

  rrect(s, { x:9.35, y:1.86, w:3.1, h:3.28, fill:P.ink2, r:0.12 });
  s.addText("SUPERPOWERS", { isTextBox:true, x:9.35, y:2.28, w:3.1, h:0.3, margin:0, align:"center",
    fontFace:F, fontSize:12.5, bold:true, color:P.amber, charSpacing:1.2 });
  s.addText("14", { isTextBox:true, x:9.35, y:2.72, w:3.1, h:1.0, margin:0, align:"center",
    fontFace:F, fontSize:60, bold:true, color:P.white });
  s.addText("SKILLS", { isTextBox:true, x:9.35, y:3.74, w:3.1, h:0.3, margin:0, align:"center",
    fontFace:F, fontSize:14, bold:true, color:P.white, charSpacing:2 });
  s.addText("Plan · Develop · Debug", { isTextBox:true, x:9.35, y:4.38, w:3.1, h:0.3, margin:0, align:"center",
    fontFace:F, fontSize:11, color:"8FA2BC" });
  s.addNotes("[Sources]\nhttps://github.com/obra/superpowers\nhttps://learn.chatgpt.com/ko-KR/docs/skills-and-plugins");
}

/* ───────────────────────── 02 · AGENDA ───────────────────────── */
{
  const s = newSlide();
  head(s, "AGENDA", "오늘 10분 동안 다룰 것");
  const rows = [
    ["01","왜 필요한가","바로 코딩을 시작할 때 생기는 문제"],
    ["02","무엇인가","Skill · Superpowers · Codex, 세 단어 정리"],
    ["03","어떤 Skill이 있는가","전체 흐름과 14개 Skill의 세 가지 종류"],
    ["04","어떻게 쓰는가","Skill 호출 방법, 설치, 실제 결과·검증까지"],
  ];
  const cw = (CW - 0.4)/2, ch = 1.9;
  rows.forEach((r,i)=>{
    const x = MX + (i%2)*(cw+0.4), y = 2.0 + Math.floor(i/2)*(ch+0.4);
    rrect(s, { x, y, w:cw, h:ch, fill:P.card, lineColor:P.line });
    chip(s, x+0.5, y+0.5, r[0], { d:0.46, fs:12 });
    s.addText(r[1], { isTextBox:true, x:x+1.16, y:y+0.46, w:cw-1.6, h:0.36, margin:0,
      fontFace:F, fontSize:17, bold:true, color:P.ink });
    s.addText(r[2], { isTextBox:true, x:x+1.16, y:y+0.92, w:cw-1.6, h:0.7, margin:0,
      fontFace:F, fontSize:12.5, color:P.gray, lineSpacingMultiple:1.25 });
  });
  foot(s, "출처 · github.com/obra/superpowers · learn.chatgpt.com/ko-KR/docs/skills-and-plugins");
  s.addNotes("[Sources]\nhttps://github.com/obra/superpowers");
}

/* ───────────────────────── 03 · WHY ───────────────────────── */
{
  const s = newSlide();
  head(s, "01 왜 필요한가", "바로 코딩하면 빠르지만, 방향이 어긋날 위험이 있습니다");
  const cw = (CW - 0.4)/2, y = TOP, ch = 4.16;

  // left
  rrect(s, { x:MX, y, w:cw, h:ch, fill:P.card, lineColor:P.line });
  s.addText("절차 없이 바로 시작", { isTextBox:true, x:MX+0.42, y:y+0.36, w:cw-0.84, h:0.32, margin:0,
    fontFace:F, fontSize:15, bold:true, color:P.ink3 });
  rrect(s, { x:MX+0.42, y:y+0.86, w:cw-0.84, h:0.62, fill:P.white, lineColor:P.line, r:0.06 });
  s.addText("“TODO LIST 만들어줘”  →  바로 구현", { isTextBox:true, x:MX+0.42, y:y+0.86, w:cw-0.84, h:0.62,
    margin:0, align:"center", valign:"middle", fontFace:F, fontSize:13, bold:true, color:P.ink });
  bullets(s, ["요구사항을 AI가 임의로 해석합니다","완성한 뒤에 수정이 반복됩니다","테스트·검토가 통째로 빠질 수 있습니다"],
    { x:MX+0.42, y:y+1.78, w:cw-0.84, h:2.0, fs:12.5, gap:19 });

  // right
  rrect(s, { x:MX+cw+0.4, y, w:cw, h:ch, fill:P.ink, r:0.07 });
  const rx = MX+cw+0.4;
  s.addText("Superpowers와 함께 시작", { isTextBox:true, x:rx+0.42, y:y+0.36, w:cw-0.84, h:0.32, margin:0,
    fontFace:F, fontSize:15, bold:true, color:P.amber });
  rrect(s, { x:rx+0.42, y:y+0.86, w:cw-0.84, h:0.62, fill:P.ink2, r:0.06 });
  s.addText("질문 → 설계 → 계획 → 테스트 → 구현 → 검증", { isTextBox:true, x:rx+0.42, y:y+0.86, w:cw-0.84, h:0.62,
    margin:0, align:"center", valign:"middle", fontFace:F, fontSize:13, bold:true, color:P.white });
  bullets(s, ["시작 전에 방향을 먼저 맞춥니다","계획과 테스트가 파일로 남습니다","끝에는 증거로 완료를 확인합니다"],
    { x:rx+0.42, y:y+1.78, w:cw-0.84, h:2.0, fs:12.5, gap:19, color:"C3CFE2" });

  callout(s, "핵심 — AI가 얼마나 똑똑한지보다, 어떤 순서로 일하게 하는지가 결과를 좌우합니다", 6.06);
  s.addNotes("[Sources]\nhttps://github.com/obra/superpowers");
}

/* ───────────────────────── 04 · THREE WORDS ───────────────────────── */
{
  const s = newSlide();
  head(s, "02 무엇인가", "세 단어만 알면 됩니다");
  const cards = [
    ["1","Skill","AI가 따르는 작업 지침서","특정 상황에서 따라야 할 순서와 기준을 적어 둔, 재사용 가능한 문서입니다."],
    ["2","Superpowers","Skill 14개를 모은 오픈소스","Brainstorming·TDD·검증 등 개발 절차를 묶어 GitHub에 공개한 플러그인입니다."],
    ["3","Codex","실제로 작업하는 AI 에이전트","답변만 하는 챗봇과 달리, 파일을 직접 고치고 명령을 실행하고 테스트로 결과까지 확인합니다."],
  ];
  const cw = (CW - 0.8)/3, ch = 3.5;
  cards.forEach((c,i)=>{
    const x = MX + i*(cw+0.4);
    rrect(s, { x, y:TOP, w:cw, h:ch, fill: i===1 ? P.blueSoft : P.card, lineColor: i===1 ? P.blueLine : P.line });
    chip(s, x+0.44, TOP+0.44, c[0], { d:0.42, fs:14, fill: i===1 ? P.blue : P.ink });
    s.addText(c[1], { isTextBox:true, x:x+0.44, y:TOP+1.06, w:cw-0.88, h:0.4, margin:0,
      fontFace:F, fontSize:21, bold:true, color:P.ink });
    s.addText(c[2], { isTextBox:true, x:x+0.44, y:TOP+1.54, w:cw-0.88, h:0.34, margin:0,
      fontFace:F, fontSize:12.5, bold:true, color: i===1 ? P.blueDk : P.gray });
    s.addText(c[3], { isTextBox:true, x:x+0.44, y:TOP+2.02, w:cw-0.88, h:1.2, margin:0,
      fontFace:F, fontSize:12, color:P.gray, lineSpacingMultiple:1.3 });
  });
  rrect(s, { x:MX, y:5.44, w:CW, h:0.78, fill:P.ink, r:0.07 });
  s.addText([
    { text:"Skill", options:{ bold:true, color:P.amber } },
    { text:"  →  ", options:{ color:"6E7C96" } },
    { text:"Superpowers (플러그인)", options:{ bold:true, color:P.white } },
    { text:"  →  ", options:{ color:"6E7C96" } },
    { text:"Codex", options:{ bold:true, color:P.white } },
    { text:"  →  ", options:{ color:"6E7C96" } },
    { text:"검증된 결과물", options:{ bold:true, color:"7FA6FF" } },
  ], { isTextBox:true, x:MX, y:5.44, w:CW, h:0.78, margin:0, align:"center", valign:"middle",
       fontFace:F, fontSize:14.5 });
  foot(s, "플러그인으로 설치하면 Codex가 필요한 Skill을 읽고 그 절차대로 작업·검증합니다. · 앱 · CLI · IDE 등 사용 환경에 따라 쓸 수 있는 기능은 달라질 수 있습니다.");
  s.addNotes("[Sources]\nhttps://learn.chatgpt.com/ko-KR/docs/skills-and-plugins\nhttps://github.com/obra/superpowers\nhttps://developers.openai.com/codex");
}

/* ───────────────────────── 05 · REPO ───────────────────────── */
{
  const s = newSlide();
  head(s, "02 무엇인가", "Superpowers는 GitHub에 공개된 저장소입니다");
  const iw = 6.5, ih = iw/1.478;
  rrect(s, { x:MX-0.06, y:TOP-0.06, w:iw+0.12, h:ih+0.12, fill:P.card, lineColor:P.line, r:0.06 });
  s.addImage({ path:"img/gh.png", x:MX, y:TOP, w:iw, h:ih });

  const px = MX + iw + 0.6, pw = CW - iw - 0.6;
  const pts = [
    ["01","공개 저장소","obra/superpowers — 누구나 열어 볼 수 있습니다."],
    ["02","skills/ 폴더","개발 상황별 지침이 폴더 하나씩으로 정리돼 있습니다."],
    ["03","14개 Skill","brainstorming · executing-plans · systematic-debugging …"],
  ];
  pts.forEach((p,i)=>{
    const y = TOP + i*1.16;
    chip(s, px, y, p[0], { d:0.4, fs:12 });
    s.addText(p[1], { isTextBox:true, x:px+0.58, y:y-0.02, w:pw-0.58, h:0.32, margin:0,
      fontFace:F, fontSize:15, bold:true, color:P.ink });
    s.addText(p[2], { isTextBox:true, x:px+0.58, y:y+0.34, w:pw-0.58, h:0.62, margin:0,
      fontFace:F, fontSize:12, color:P.gray, lineSpacingMultiple:1.25 });
  });
  rrect(s, { x:px, y:TOP+3.62, w:pw, h:1.12, fill:P.blueSoft, r:0.06 });
  s.addText("한 줄 정리", { isTextBox:true, x:px+0.3, y:TOP+3.8, w:pw-0.6, h:0.28, margin:0,
    fontFace:F, fontSize:12, bold:true, color:P.blueDk });
  s.addText("하나의 기능이 아니라, 개발 절차를 담은 Skill 모음입니다.",
    { isTextBox:true, x:px+0.3, y:TOP+4.1, w:pw-0.6, h:0.56, margin:0,
      fontFace:F, fontSize:12.5, color:P.ink3, lineSpacingMultiple:1.25 });
  foot(s, "실제 GitHub 화면 · github.com/obra/superpowers/tree/main/skills");
  s.addNotes("[Sources]\nhttps://github.com/obra/superpowers/tree/main/skills");
}

/* ───────────────────────── 06 · FLOW ───────────────────────── */
{
  const s = newSlide();
  head(s, "03 어떤 Skill이 있는가", "앞 단계에서 나온 것이 다음 단계의 재료가 됩니다");
  const n = 5, gap = 0.24, cw = (CW - gap*(n-1))/n;

  //     [ 우리말 단계 이름 ,  원래 Skill 이름 ,  이 단계에서 나오는 것 ]
  const stg = [
    ["하고 싶은 것 말하기", "",                    "만들고 싶은 것\n한 문장"],
    ["질문으로 조건 좁히기", "Brainstorming",      "확정된 요구사항과\n설계"],
    ["할 일을 잘게 쪼개기",  "Writing Plans",      "구현 계획서\n(파일·테스트·순서)"],
    ["테스트 먼저, 구현 나중","TDD",               "테스트를 통과한\n코드"],
    ["증거로 확인하고 끝내기","검증 · 완료",        "테스트 기록과\n정리된 브랜치"],
  ];
  const fills  = ["F2F4F8","E4EBFB","CBD9FA","5B8BFF","0F1B33"];
  const titles = [P.ink, P.ink, P.ink, P.white, P.white];
  const subs   = [P.gray2, P.gray, P.gray, "DCE7FF", "8FA2BC"];

  // band A — 무엇을 하는 단계인가
  const aY = 1.62, aH = 1.32;
  s.addText("무엇을 하는 단계인가", { isTextBox:true, x:MX, y:aY-0.32, w:6, h:0.26, margin:0,
    fontFace:F, fontSize:10.5, bold:true, color:P.gray2, charSpacing:0.6 });
  stg.forEach((g,i)=>{
    const x = MX + i*(cw+gap);
    rrect(s, { x, y:aY, w:cw, h:aH, fill:fills[i] });
    s.addText(String(i+1).padStart(2,"0"), { isTextBox:true, x:x+0.24, y:aY+0.14, w:cw-0.48, h:0.22, margin:0,
      fontFace:F, fontSize:10, bold:true, color: i>=3 ? "9FB8FF" : P.gray2 });
    s.addText(g[0], { isTextBox:true, x:x+0.24, y:aY+0.40, w:cw-0.48, h:0.58, margin:0,
      fontFace:F, fontSize:13, bold:true, color:titles[i], lineSpacingMultiple:1.15 });
    if (g[1]) s.addText(g[1], { isTextBox:true, x:x+0.24, y:aY+1.00, w:cw-0.48, h:0.24, margin:0,
      fontFace:F, fontSize:9.5, color:subs[i] });
    if (i < n-1){
      s.addText("→", { isTextBox:true, x:x+cw, y:aY+0.48, w:gap, h:0.36, margin:0, align:"center",
        fontFace:F, fontSize:13, bold:true, color:P.gray2 });
    }
  });

  // band B — 그래서 무엇이 나오는가
  const bY = 3.54, bH = 1.30;
  s.addText("그래서 무엇이 나오는가", { isTextBox:true, x:MX, y:bY-0.34, w:6, h:0.26, margin:0,
    fontFace:F, fontSize:10.5, bold:true, color:P.blue, charSpacing:0.6 });
  stg.forEach((g,i)=>{
    const x = MX + i*(cw+gap);
    s.addText("↓", { isTextBox:true, x, y:aY+aH+0.02, w:cw, h:0.24, margin:0, align:"center",
      fontFace:F, fontSize:13, bold:true, color:P.blueLine });
    rrect(s, { x, y:bY, w:cw, h:bH, fill:P.white, lineColor:P.blueLine });
    s.addText(g[2], { isTextBox:true, x:x+0.24, y:bY+0.2, w:cw-0.48, h:bH-0.4, margin:0,
      fontFace:F, fontSize:11.5, color:P.ink3, lineSpacingMultiple:1.3 });
  });

  // 오류가 났을 때의 갈림길
  const dY = 5.18, dH = 1.0;
  rrect(s, { x:MX, y:dY, w:CW, h:dH, fill:P.amberSoft, r:0.06 });
  s.addShape(pres.ShapeType.roundRect, { x:MX+0.34, y:dY+0.31, w:1.24, h:0.38, rectRadius:0.19,
    fill:{ color:P.amber }, line:{ type:"none" } });
  s.addText("오류 발생 시", { isTextBox:true, x:MX+0.34, y:dY+0.31, w:1.24, h:0.38, margin:0,
    align:"center", valign:"middle", fontFace:F, fontSize:10.5, bold:true, color:P.white });
  s.addText([
    { text:"추측하지 않고 ", options:{ color:"7E6242" } },
    { text:"재현 → 증거 → 원인", options:{ bold:true, color:"A9541A" } },
    { text:" 순으로 확인한 뒤, 멈췄던 단계로 돌아갑니다. (Systematic Debugging)", options:{ color:"7E6242" } },
  ], { isTextBox:true, x:MX+1.76, y:dY, w:CW-2.1, h:dH, margin:0, valign:"middle",
       fontFace:F, fontSize:12.5 });

  foot(s, "TDD = 실패하는 테스트를 먼저 쓰고, 그 테스트를 통과시키는 코드를 쓰는 방식 · 각 단계에 쓰이는 Skill은 다음 장부터 살펴봅니다.");
  s.addNotes("[Sources]\nhttps://github.com/obra/superpowers");
}
/* ───────────────────────── 07 · MAP ───────────────────────── */
{
  const s = newSlide();
  head(s, "03 어떤 Skill이 있는가", "14개 Skill은 세 묶음으로 나뉩니다");
  const groups = [
    ["4","계획 · 준비","코드를 쓰기 전에 무엇을 만들지, 어떤 순서로 할지 확정합니다.", P.card, P.ink, P.line],
    ["4","구현 · 협업","계획을 지키면서 작은 결과를 만들고 계속 확인합니다.", P.blueSoft, P.blueDk, P.blueLine],
    ["6","품질 · 완료","“된 것 같다”가 아니라 확인된 결과로 마무리합니다.", P.ink, P.amber, null],
  ];
  const cw = (CW - 0.8)/3, ch = 3.9;
  groups.forEach((g,i)=>{
    const x = MX + i*(cw+0.4), dark = i===2;
    rrect(s, { x, y:TOP, w:cw, h:ch, fill:g[3], lineColor:g[5] });
    s.addText(g[0], { isTextBox:true, x:x+0.44, y:TOP+0.44, w:cw-0.88, h:1.24, margin:0,
      fontFace:F, fontSize:66, bold:true, color:g[4] });
    s.addText("개 Skill", { isTextBox:true, x:x+0.44, y:TOP+1.72, w:cw-0.88, h:0.3, margin:0,
      fontFace:F, fontSize:12, color: dark ? "8FA2BC" : P.gray2 });
    s.addText(g[1], { isTextBox:true, x:x+0.44, y:TOP+2.16, w:cw-0.88, h:0.38, margin:0,
      fontFace:F, fontSize:19, bold:true, color: dark ? P.white : P.ink });
    s.addText(g[2], { isTextBox:true, x:x+0.44, y:TOP+2.66, w:cw-0.88, h:0.9, margin:0,
      fontFace:F, fontSize:12.5, color: dark ? "C3CFE2" : P.gray, lineSpacingMultiple:1.3 });
  });
  callout(s, "14개 = 계획·준비 4개 + 구현·협업 4개 + 품질·완료 6개", 5.86);
  foot(s, "Skill 이름과 개수는 Superpowers 6.3.0 기준입니다. · github.com/obra/superpowers/tree/main/skills");
  s.addNotes("[Sources]\nhttps://github.com/obra/superpowers/tree/main/skills");
}

/* ───────────── 08~10 · SKILL GROUPS ───────────── */
function skillSlide(kicker, title, cols, items, summary, note){
  const s = newSlide();
  head(s, kicker, title);
  const rows = Math.ceil(items.length/cols);
  const gx = 0.34, gy = 0.32;
  const cw = (CW - gx*(cols-1))/cols;
  const ch = rows===2 ? 1.86 : 1.3;
  items.forEach((it,i)=>{
    const x = MX + (i%cols)*(cw+gx), y = TOP + Math.floor(i/cols)*(ch+gy);
    rrect(s, { x, y, w:cw, h:ch, fill:P.card, lineColor:P.line });
    chip(s, x+0.34, y+0.32, String(i+1), { d:0.32, fs:11, fill:P.blue });
    s.addText(it[0], { isTextBox:true, x:x+0.78, y:y+0.3, w:cw-1.1, h:0.36, margin:0,
      fontFace:F, fontSize:13, bold:true, color:P.ink });
    s.addText(it[1], { isTextBox:true, x:x+0.34, y:y+0.82, w:cw-0.68, h:ch-1.06, margin:0,
      fontFace:F, fontSize:12, color:P.gray, lineSpacingMultiple:1.28 });
  });
  callout(s, summary, 5.86);
  foot(s, note);
  s.addNotes("[Sources]\nhttps://github.com/obra/superpowers/tree/main/skills");
}

skillSlide("03 어떤 Skill이 있는가", "① 계획 · 준비 — 코드를 쓰기 전에 범위를 확정합니다", 2, [
  ["using-superpowers","작업을 시작하기 전에 지금 상황에 맞는 Skill이 있는지 먼저 확인하고 사용합니다."],
  ["brainstorming","코딩 전에 질문 → 대안 → 설계를 정리합니다. 승인 전에는 구현하지 않습니다."],
  ["writing-plans","승인된 설계를 파일·테스트·작업 순서로 잘게 나눈 구현 계획서로 만듭니다."],
  ["using-git-worktrees","기존 작업과 분리된 안전한 작업 공간을 미리 준비합니다."],
], "공통 목적 — 코드를 쓰기 전에 “범위”와 “순서”를 확정합니다",
   "Skill 이름은 Superpowers 6.3.0 기준입니다.");

skillSlide("03 어떤 Skill이 있는가", "② 구현 · 협업 — 계획대로 작게 만들고 계속 확인합니다", 2, [
  ["test-driven-development","실패하는 테스트를 먼저 만들고, 그것을 통과하는 최소한의 코드를 씁니다."],
  ["executing-plans","작성된 계획을 체크포인트별로, 순서대로 실행합니다."],
  ["subagent-driven-development","작업마다 새 에이전트가 구현하고 단계마다 리뷰를 받습니다."],
  ["dispatching-parallel-agents","서로 의존하지 않는 일은 여러 에이전트로 나눠 동시에 처리합니다."],
], "공통 목적 — 계획을 지키면서 작은 결과를 만들고 매번 확인합니다",
   "Subagent 관련 기능은 사용 환경과 설정에 따라 달라질 수 있습니다.");

skillSlide("03 어떤 Skill이 있는가", "③ 품질 · 완료 — 확인된 결과로 마무리합니다", 3, [
  ["systematic-debugging","추측 대신 재현 → 증거 → 원인 순으로 확인합니다."],
  ["requesting-code-review","요구사항과 구현이 맞는지 검토를 요청합니다."],
  ["receiving-code-review","받은 피드백을 그대로 받지 않고 검증한 뒤 반영합니다."],
  ["verification-before-completion","테스트를 돌려 통과한 뒤에야 완료를 선언합니다."],
  ["finishing-a-development-branch","병합 · PR · 브랜치 유지 중 하나를 골라 마무리합니다."],
  ["writing-skills","새 Skill을 직접 만들고 수정 · 검증합니다."],
], "공통 목적 — “된 것 같다”가 아니라 확인된 결과로 끝냅니다",
   "Skill 이름은 Superpowers 6.3.0 기준입니다. · github.com/obra/superpowers/tree/main/skills");

/* ───────────────────────── 11 · HOW MODEL PICKS ───────────────────────── */
{
  const s = newSlide();
  head(s, "04 어떻게 쓰는가", "모델은 요청과 Skill 설명을 비교해 절차를 고릅니다");
  const n = 5, gap = 0.22, cw = (CW - gap*(n-1))/n, ch = 2.02;
  const steps = [
    ["사용자 요청","“오류 원인을 찾아줘”"],
    ["Skill 목록 확인","이름과 설명을 훑습니다"],
    ["용도 비교","요청과 맞는지 판단합니다"],
    ["Skill 호출","전체 지침을 읽습니다"],
    ["절차 실행","진단·검증을 수행합니다"],
  ];
  steps.forEach((st,i)=>{
    const x = MX + i*(cw+gap);
    const hot = (i===1 || i===3);
    rrect(s, { x, y:TOP+0.1, w:cw, h:ch, fill: hot ? P.blueSoft : P.card, lineColor: hot ? P.blueLine : P.line });
    chip(s, x+0.3, TOP+0.4, String(i+1), { d:0.34, fs:12, fill: hot ? P.blue : P.ink });
    s.addText(st[0], { isTextBox:true, x:x+0.26, y:TOP+0.94, w:cw-0.52, h:0.36, margin:0,
      fontFace:F, fontSize:13.5, bold:true, color:P.ink });
    s.addText(st[1], { isTextBox:true, x:x+0.26, y:TOP+1.34, w:cw-0.52, h:0.56, margin:0,
      fontFace:F, fontSize:11, color:P.gray, lineSpacingMultiple:1.2 });
    if (i < n-1){
      s.addText("›", { isTextBox:true, x:x+cw, y:TOP+0.9, w:gap, h:0.4, margin:0, align:"center",
        fontFace:F, fontSize:22, bold:true, color:P.gray2 });
    }
  });
  const bw = (CW - 0.4)/2, by = 4.34, bh = 1.5;
  const boxes = [
    { t:"자동 호출", d:"요청의 의미가 Skill 설명과 맞으면 모델이 알아서 선택합니다.", hot:true },
    { t:"직접 호출", d:"Codex에서 $로 고르거나 “Brainstorming Skill을 써줘”라고 지정합니다.", hot:false },
  ];
  boxes.forEach((b,i)=>{
    const x = MX + i*(bw+0.4);
    rrect(s, { x, y:by, w:bw, h:bh, fill: b.hot ? P.ink : P.card, lineColor: b.hot ? null : P.line });
    s.addText(b.t, { isTextBox:true, x:x+0.42, y:by+0.3, w:bw-0.84, h:0.34, margin:0,
      fontFace:F, fontSize:15, bold:true, color: b.hot ? P.amber : P.ink });
    s.addText(b.d, { isTextBox:true, x:x+0.42, y:by+0.72, w:bw-0.84, h:0.6, margin:0,
      fontFace:F, fontSize:12.5, color: b.hot ? "C3CFE2" : P.gray, lineSpacingMultiple:1.25 });
  });
  foot(s, "출처 · learn.chatgpt.com/ko-KR/docs/skills-and-plugins");
  s.addNotes("[Sources]\nhttps://learn.chatgpt.com/ko-KR/docs/skills-and-plugins");
}

/* ───────────────────────── 12 · INSTALL ───────────────────────── */
{
  const s = newSlide();
  head(s, "04 어떻게 쓰는가", "Codex 앱에서 클릭 몇 번으로 설치합니다");
  const iw = 10.6, ih = iw/3.5, ix = (13.333-iw)/2;
  rrect(s, { x:ix-0.06, y:TOP-0.06, w:iw+0.12, h:ih+0.12, fill:P.card, lineColor:P.line, r:0.06 });
  s.addImage({ path:"img/search.png", x:ix, y:TOP, w:iw, h:ih });

  const steps = [
    ["1","플러그인 메뉴 열기","왼쪽 메뉴에서 “플러그인”을 선택합니다"],
    ["2","superpowers 검색","검색창에 이름을 입력합니다"],
    ["3","설치 클릭","결과 카드의 “설치” 버튼을 누릅니다"],
    ["4","새 채팅에서 사용","새 작업을 열고 필요한 Skill을 요청합니다"],
  ];
  const gx = 0.3, cw = (CW - gx*3)/4, y = TOP + ih + 0.42, ch = 1.5;
  steps.forEach((st,i)=>{
    const x = MX + i*(cw+gx);
    rrect(s, { x, y, w:cw, h:ch, fill: i===3 ? P.blueSoft : P.card, lineColor: i===3 ? P.blueLine : P.line });
    chip(s, x+0.3, y+0.28, st[0], { d:0.32, fs:11 });
    s.addText(st[1], { isTextBox:true, x:x+0.72, y:y+0.26, w:cw-1.0, h:0.36, margin:0,
      fontFace:F, fontSize:12.5, bold:true, color:P.ink });
    s.addText(st[2], { isTextBox:true, x:x+0.3, y:y+0.76, w:cw-0.6, h:0.58, margin:0,
      fontFace:F, fontSize:11, color:P.gray, lineSpacingMultiple:1.2 });
  });
  foot(s, "CLI에서는 /plugins 또는 plugin add 명령으로도 설치할 수 있습니다. · 실제 설치 화면 2026-09-03");
  s.addNotes("[Sources]\nhttps://learn.chatgpt.com/ko-KR/docs/plugins\nUser-provided screenshot captured 2026-09-03");
}

/* ───────────────────────── 13 · AFTER INSTALL ───────────────────────── */
{
  const s = newSlide();
  head(s, "04 어떻게 쓰는가", "설치 후에는 14개 Skill을 켜고 끌 수 있습니다");
  const ih = 4.72, iw = ih*1.097;
  rrect(s, { x:MX-0.06, y:TOP-0.06, w:iw+0.12, h:ih+0.12, fill:P.card, lineColor:P.line, r:0.06 });
  s.addImage({ path:"img/detail.png", x:MX, y:TOP, w:iw, h:ih });

  const px = MX + iw + 0.6, pw = CW - iw - 0.6;
  const pts = [
    ["설치 확인","“설치” 버튼이 사라지고 “지금 사용해 보기”가 나타납니다."],
    ["Skill 14","Brainstorming부터 완료 검증까지 14개 절차가 모두 들어 있습니다."],
    ["개별 제어","각 Skill 오른쪽 스위치로 필요한 절차만 켤 수 있습니다."],
    ["기능 범위","설명에 Interactive · Read · Write 권한이 표시됩니다."],
  ];
  pts.forEach((p,i)=>{
    const y = TOP + i*1.2;
    rrect(s, { x:px, y, w:pw, h:1.0, fill: i===1 ? P.blueSoft : P.card, lineColor: i===1 ? P.blueLine : P.line });
    s.addText(p[0], { isTextBox:true, x:px+0.34, y:y+0.16, w:pw-0.68, h:0.3, margin:0,
      fontFace:F, fontSize:14, bold:true, color:P.ink });
    s.addText(p[1], { isTextBox:true, x:px+0.34, y:y+0.5, w:pw-0.68, h:0.42, margin:0,
      fontFace:F, fontSize:11.5, color:P.gray, lineSpacingMultiple:1.2 });
  });
  foot(s, "실제 사용자 Codex 앱 화면 · 2026-09-03");
  s.addNotes("[Sources]\nUser-provided screenshot captured 2026-09-03\nhttps://learn.chatgpt.com/ko-KR/docs/plugins");
}

/* ───────────────────────── 14 · BRAINSTORMING ───────────────────────── */
{
  const s = newSlide();
  head(s, "04 어떻게 쓰는가", "Brainstorming은 바로 코딩하지 않고 하나씩 묻습니다");
  const iw = 6.7, ih = iw/1.485;
  rrect(s, { x:MX-0.06, y:TOP-0.06, w:iw+0.12, h:ih+0.12, fill:P.card, lineColor:P.line, r:0.06 });
  s.addImage({ path:"img/chat.png", x:MX, y:TOP, w:iw, h:ih });

  const px = MX + iw + 0.6, pw = CW - iw - 0.6;
  const pts = [
    ["1","아이디어 입력","“간단한 할 일 웹앱을 만들고 싶어.”"],
    ["2","Skill 지정","Brainstorming을 쓰고, 승인 전에는 구현하지 말라고 요청합니다."],
    ["3","한 번에 한 질문","먼저 “주 사용자가 누구인지” 하나만 묻습니다."],
    ["4","범위가 좁아짐","개인용 · 핵심 기능 · 저장 방식을 순서대로 결정합니다."],
  ];
  pts.forEach((p,i)=>{
    const y = TOP + i*1.12;
    chip(s, px, y, p[0], { d:0.36, fs:12 });
    s.addText(p[1], { isTextBox:true, x:px+0.54, y:y-0.01, w:pw-0.54, h:0.3, margin:0,
      fontFace:F, fontSize:14, bold:true, color:P.ink });
    s.addText(p[2], { isTextBox:true, x:px+0.54, y:y+0.33, w:pw-0.54, h:0.62, margin:0,
      fontFace:F, fontSize:11.5, color:P.gray, lineSpacingMultiple:1.25 });
  });
  rrect(s, { x:px, y:TOP+4.46, w:pw, h:0.72, fill:P.blueSoft, r:0.06 });
  s.addText("승인 전에는 구현하지 않는다 — 이것이 절차의 핵심입니다.",
    { isTextBox:true, x:px+0.28, y:TOP+4.46, w:pw-0.56, h:0.72, margin:0, valign:"middle",
      fontFace:F, fontSize:12, bold:true, color:P.blueDk });
  foot(s, "Brainstorming 실제 대화 · 2026-09-03 · github.com/obra/superpowers/tree/main/skills/brainstorming");
  s.addNotes("[Sources]\nUser-provided screenshot captured 2026-09-03\nhttps://github.com/obra/superpowers/tree/main/skills/brainstorming");
}

/* ───────────────────────── 15 · OPTIONS ───────────────────────── */
{
  const s = newSlide();
  head(s, "04 어떻게 쓰는가", "질문이 끝나면 대안을 비교하고 하나를 추천합니다");
  const iw = 7.7, ih = iw/1.973;
  rrect(s, { x:MX-0.06, y:TOP-0.06, w:iw+0.12, h:ih+0.12, fill:P.card, lineColor:P.line, r:0.06 });
  s.addImage({ path:"img/options.png", x:MX, y:TOP, w:iw, h:ih });

  const px = MX + iw + 0.6, pw = CW - iw - 0.6;
  const opts = [
    ["A","부드러운 카드형","구조가 바로 이해되고 발표 화면에서 안정적", true],
    ["B","에디토리얼형","개성은 강하지만 버튼·상태가 덜 직관적", false],
    ["C","다크 대시보드형","눈에 띄지만 간단한 실습에는 시각적 무게가 큼", false],
  ];
  opts.forEach((o,i)=>{
    const y = TOP + i*1.28;
    rrect(s, { x:px, y, w:pw, h:1.1, fill: o[3] ? P.ink : P.card, lineColor: o[3] ? null : P.line });
    s.addText(o[0], { isTextBox:true, x:px+0.32, y:y+0.2, w:0.4, h:0.34, margin:0,
      fontFace:F, fontSize:16, bold:true, color: o[3] ? P.amber : P.gray2 });
    s.addText(o[1], { isTextBox:true, x:px+0.76, y:y+0.2, w:pw-1.1, h:0.34, margin:0,
      fontFace:F, fontSize:14, bold:true, color: o[3] ? P.white : P.ink });
    s.addText(o[2], { isTextBox:true, x:px+0.76, y:y+0.58, w:pw-1.1, h:0.42, margin:0,
      fontFace:F, fontSize:11, color: o[3] ? "C3CFE2" : P.gray, lineSpacingMultiple:1.2 });
    if (o[3]) s.addText("추천", { isTextBox:true, x:px+pw-1.0, y:y+0.2, w:0.7, h:0.3, margin:0, align:"right",
      fontFace:F, fontSize:11, bold:true, color:P.amber });
  });
  rrect(s, { x:px, y:TOP+3.94, w:pw, h:1.0, fill:P.blueSoft, r:0.06 });
  s.addText("선택 후", { isTextBox:true, x:px+0.3, y:TOP+4.12, w:pw-0.6, h:0.26, margin:0,
    fontFace:F, fontSize:11.5, bold:true, color:P.blueDk });
  s.addText("최종 설계 → Writing Plans → TDD 구현으로 이어집니다.",
    { isTextBox:true, x:px+0.3, y:TOP+4.42, w:pw-0.6, h:0.44, margin:0,
      fontFace:F, fontSize:12, color:P.ink3 });
  foot(s, "실제 시각 방향 비교 화면 · 2026-09-03");
  s.addNotes("[Sources]\nUser-provided screenshot captured 2026-09-03\nhttps://github.com/obra/superpowers/tree/main/skills/brainstorming");
}

/* ───────────────────────── 16 · RESULT ───────────────────────── */
{
  const s = newSlide();
  head(s, "04 어떻게 쓰는가", "결과보다 중요한 건, 과정이 기록으로 남았다는 점입니다");
  const ih = 4.7, iw = ih*1.107;
  rrect(s, { x:MX-0.06, y:TOP-0.06, w:iw+0.12, h:ih+0.12, fill:P.card, lineColor:P.line, r:0.06 });
  s.addImage({ path:"img/result.png", x:MX, y:TOP, w:iw, h:ih });

  const px = MX + iw + 0.6, pw = CW - iw - 0.6;
  rrect(s, { x:px, y:TOP, w:pw, h:1.28, fill:P.card, lineColor:P.line });
  s.addText("실제 결과", { isTextBox:true, x:px+0.36, y:TOP+0.22, w:pw-0.72, h:0.3, margin:0,
    fontFace:F, fontSize:13.5, bold:true, color:P.ink });
  s.addText("추가 · 완료 · 삭제와 로컬 저장이 동작하는 웹앱 완성",
    { isTextBox:true, x:px+0.36, y:TOP+0.6, w:pw-0.72, h:0.5, margin:0,
      fontFace:F, fontSize:12, color:P.gray, lineSpacingMultiple:1.2 });

  rrect(s, { x:px, y:TOP+1.46, w:pw, h:1.72, fill:P.ink, r:0.07 });
  s.addText("검증 결과", { isTextBox:true, x:px+0.36, y:TOP+1.66, w:pw-0.72, h:0.3, margin:0,
    fontFace:F, fontSize:13.5, bold:true, color:P.amber });
  s.addText("13/13", { isTextBox:true, x:px+0.36, y:TOP+2.0, w:1.9, h:0.62, margin:0,
    fontFace:F, fontSize:34, bold:true, color:P.white });
  s.addText("자동 테스트 통과", { isTextBox:true, x:px+0.36, y:TOP+2.64, w:2.0, h:0.28, margin:0,
    fontFace:F, fontSize:10.5, color:"8FA2BC" });
  s.addText("0건", { isTextBox:true, x:px+2.5, y:TOP+2.0, w:1.9, h:0.62, margin:0,
    fontFace:F, fontSize:34, bold:true, color:P.white });
  s.addText("콘솔 오류 · 브라우저 검증 통과", { isTextBox:true, x:px+2.5, y:TOP+2.64, w:2.6, h:0.28, margin:0,
    fontFace:F, fontSize:10.5, color:"8FA2BC" });

  rrect(s, { x:px, y:TOP+3.36, w:pw, h:1.34, fill:P.blueSoft, lineColor:P.blueLine });
  s.addText("남은 기록", { isTextBox:true, x:px+0.36, y:TOP+3.56, w:pw-0.72, h:0.3, margin:0,
    fontFace:F, fontSize:13.5, bold:true, color:P.blueDk });
  s.addText("설계 문서 · 구현 계획 · 테스트 코드 · 기능 브랜치 — 검증 가능한 개발 과정이 그대로 남습니다.",
    { isTextBox:true, x:px+0.36, y:TOP+3.94, w:pw-0.72, h:0.68, margin:0,
      fontFace:F, fontSize:12, color:P.ink3, lineSpacingMultiple:1.25 });
  foot(s, "실제 구현 결과 · 2026-09-03");
  s.addNotes("[Sources]\nUser-provided screenshot captured 2026-09-03\nhttps://github.com/obra/superpowers");
}

/* ───────────────────────── 17 · CLOSING ───────────────────────── */
{
  const s = newSlide(true);
  s.addText("정리", { isTextBox:true, x:MX+0.2, y:0.9, w:6, h:0.4, margin:0,
    fontFace:F, fontSize:13, bold:true, color:P.amber, charSpacing:1.6 });
  s.addText("오늘의 결론 3줄", { isTextBox:true, x:MX+0.2, y:1.32, w:8, h:0.7, margin:0,
    fontFace:F, fontSize:32, bold:true, color:P.white });

  const items = [
    ["01","Superpowers는 개발 절차를 담은 Skill 14개 묶음입니다","기능이 아니라 “일하는 순서”를 제공합니다."],
    ["02","Codex는 그 절차대로 계획하고, 만들고, 검증합니다","모델이 요청과 Skill 설명을 비교해 알아서 고릅니다."],
    ["03","우리에게는 결과물과 함께 과정이 남습니다","설계 · 계획 · 테스트 · 브랜치가 기록으로 남습니다."],
  ];
  const cw = (CW - 0.8)/3;
  items.forEach((it,i)=>{
    const x = MX + i*(cw+0.4);
    rrect(s, { x, y:2.42, w:cw, h:2.72, fill:P.ink2, r:0.08 });
    s.addText(it[0], { isTextBox:true, x:x+0.42, y:2.72, w:cw-0.84, h:0.32, margin:0,
      fontFace:F, fontSize:12, bold:true, color:P.blue, charSpacing:1.2 });
    s.addText(it[1], { isTextBox:true, x:x+0.42, y:3.16, w:cw-0.84, h:1.06, margin:0,
      fontFace:F, fontSize:15.5, bold:true, color:P.white, lineSpacingMultiple:1.25 });
    s.addText(it[2], { isTextBox:true, x:x+0.42, y:4.3, w:cw-0.84, h:0.66, margin:0,
      fontFace:F, fontSize:11.5, color:"9FB0C8", lineSpacingMultiple:1.25 });
  });
  s.addText("github.com/obra/superpowers   ·   learn.chatgpt.com/ko-KR/docs/skills-and-plugins",
    { isTextBox:true, x:MX, y:5.68, w:CW, h:0.4, margin:0, align:"center",
      fontFace:F, fontSize:12, color:"7B8AA3" });
  s.addText("감사합니다", { isTextBox:true, x:MX, y:6.24, w:CW, h:0.44, margin:0, align:"center",
    fontFace:F, fontSize:17, bold:true, color:P.white });
  s.addNotes("[Sources]\nhttps://github.com/obra/superpowers\nhttps://learn.chatgpt.com/ko-KR/docs/skills-and-plugins");
}

pres.writeFile({ fileName: "Superpowers_Codex_10min.pptx" }).then(()=>console.log("done:", pageNo, "slides"));
