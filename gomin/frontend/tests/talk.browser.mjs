// Browser QA with intercepted API fixtures only; never uses real environment
// files, credentials, AI, Supabase, or production user data.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? '@playwright/test');
const base = process.env.TALK_QA_URL ?? 'http://127.0.0.1:3011';
const artifacts = new URL('../../.dev/talk-qa/', import.meta.url);
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];

async function fixture(page) {
  const conversation = { id: randomUUID(), phase: 'chatting', messages: [], summaries: [], jobs: [] };
  let sends = 0, summaries = 0, loggedIn = true, confirmations = 0, imageRequests = 0;
  let finishRegeneration;
  const savedResults = [];
  let acceptSend, listError = false;
  let holdSend = false;
  let historyItems = null;
  const job = kind => {
    const value = { id: randomUUID(), kind, status: 'running', source_until_seq_no: conversation.messages.length, error_code: null };
    conversation.jobs.push(value); return value;
  };
  const member = { id: randomUUID(), name: '검증 회원', email: 'qa@example.test' };
  const headers = { 'access-control-allow-origin': base, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'Content-Type', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
  await page.route('**/api/v1/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname;
    if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
    const success = (data, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify({ success: true, data, error: null }) });
    const failure = (code, status) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify({ success: false, data: null, error: { code, message: '검증용 실패', details: [] } }) });
    if (path === '/api/v1/auth/me') { await (loggedIn ? success(member) : failure('UNAUTHORIZED', 401)); return; }
    if (!loggedIn) { await failure('UNAUTHORIZED', 401); return; }
    if (path === '/api/v1/diary-images') {
      imageRequests++;
      assert.equal(request.postDataJSON().summary_id, conversation.summaries.at(-1).id);
      if (imageRequests === 1) { await failure('IMAGE_GENERATION_FAILED', 502); return; }
      if (imageRequests >= 3) {
        const ok = await new Promise(resolve => { finishRegeneration = resolve; });
        if (!ok) { await failure('IMAGE_GENERATION_FAILED', 502); return; }
      }
      await success({ id: imageRequests >= 3 ? 'result-b' : 'result-a', title: imageRequests >= 3 ? '새롭게 쉬어가는 하루' : '마음을 쉬어가는 하루', encouragement_text: '마음이 복잡했겠어요. 잠시 쉬어가도 괜찮아요.', diary_date: '2026-10-11', image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=' }, 201); return;
    }
    if (/^\/api\/v1\/diary-results\/result-[ab]\/collection-entry$/.test(path)) {
      const id = path.split('/').at(-2); savedResults.push(id);
      await success({ id: id === 'result-a' ? 'entry-a' : 'entry-b' }); return;
    }
    if (path.startsWith('/api/v1/summaries/')) {
      const summary = conversation.summaries.find(s => s.id === path.split('/').at(-1) && s.confirmed_at);
      await (summary ? success(summary) : failure('NOT_FOUND', 404)); return;
    }
    if (path === '/api/v1/conversations') { if (request.method() === 'GET' && listError) { await failure('SERVICE_UNAVAILABLE', 503); return; } await success(request.method() === 'GET' ? (historyItems ?? (conversation.messages.length ? [{ id: conversation.id, title: conversation.messages[0].content, updated_at: '2026-10-13T05:00:00Z' }] : [])) : conversation, request.method() === 'GET' ? 200 : 201); return; }
    if (path === `/api/v1/conversations/${conversation.id}`) { await success(conversation); return; }
    if (path.endsWith('/messages')) {
      sends++;
      if (holdSend) { const ok = await new Promise(resolve => { acceptSend = resolve; }); if (!ok) { await failure('SERVICE_UNAVAILABLE', 503); return; } }
      const { content } = request.postDataJSON();
      const message = { id: randomUUID(), conversation_id: conversation.id, seq_no: conversation.messages.length+1, role: 'user', content, created_at: '2026-10-08T05:00:00Z' };
      conversation.messages.push(message); await success({ message, job: job('reply') }, 202); return;
    }
    if (path.endsWith('/summaries')) { summaries++; conversation.phase = 'summarizing'; await success(job('summary'), 202); return; }
    if (path.endsWith('/resume')) { conversation.phase = 'chatting'; await success(conversation); return; }
    if (path.endsWith('/confirm') || path.endsWith('/handoff')) {
      const summaryId = path.split('/').at(-2), summary = conversation.summaries.find(s => s.id === summaryId);
      if (!summary) { await failure('NOT_FOUND', 404); return; }
      if (path.endsWith('/confirm')) { confirmations++; summary.confirmed_at = '2026-10-08T05:03:00Z'; }
      if (!summary.confirmed_at) { await failure('SUMMARY_NOT_CONFIRMED', 409); return; }
      await success({ conversation_id: conversation.id, summary_id: summary.id, version: summary.version, confirmed: true, summary, next_stage: 'image_generation', next_stage_status: 'not_started' }); return;
    }
    await failure('NOT_FOUND', 404);
  });
  function reply(error = null) {
    const j = conversation.jobs.filter(j => j.kind === 'reply').at(-1); j.status = error ? 'failed' : 'succeeded'; j.error_code = error;
    if (!error) conversation.messages.push({ id: randomUUID(), conversation_id: conversation.id, seq_no: conversation.messages.length+1, role: 'assistant', content: '시험과 진로에 대한 이전 이야기를 기억하고 있어. 어떤 마음이 가장 크게 느껴져?', created_at: '2026-10-08T05:01:00Z' });
  }
  function summary(error = null) {
    const j = conversation.jobs.filter(j => j.kind === 'summary').at(-1); j.status = error ? 'failed' : 'succeeded'; j.error_code = error;
    if (!error) {
      conversation.phase = 'reviewing'; conversation.summaries.push({ id: randomUUID(), conversation_id: conversation.id, version: conversation.summaries.length+1, source_until_seq_no: j.source_until_seq_no, current_feeling: '시험을 앞두고 불안하지만, 내 마음을 차분하게 들여다보고 싶어요.', main_concerns: conversation.messages.filter(m => m.role === 'user').map(m => m.content), emotion_tags: ['불안', '긴장', '막막함'], confirmed_at: null, created_at: '2026-10-08T05:02:00Z' });
    }
  }
  return { conversation, reply, summary, savedResults, holdNextSend() { holdSend = true; }, acceptSend(ok) { holdSend = false; acceptSend(ok); }, setHistory(items) { historyItems = items; }, failHistory(value) { listError = value; }, finishRegeneration(ok) { finishRegeneration(ok); }, calls: () => ({ sends, summaries, confirmations, imageRequests }), logout() { loggedIn = false; } };
}
async function visibleInViewport(locator, page) {
  await locator.scrollIntoViewIfNeeded(); const box = await locator.boundingBox(); const size = page.viewportSize();
  assert.ok(box && box.x >= 0 && box.y >= 0 && box.x+box.width <= size.width+1 && box.y+box.height <= size.height+1, `Control clipped: ${JSON.stringify(box)}`);
}
async function waitFor(predicate, page) { for (let i=0; i<60; i++) { if (predicate()) return; await page.waitForTimeout(100); } throw Error('Fixture request timeout'); }

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 667, height: 375 }]) {
    const page = await browser.newPage({ viewport }); const f = await fixture(page);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/talk`); const input = page.getByLabel('메시지', { exact: true });
    await input.waitFor(); const send = page.getByRole('button', { name: '메시지 전송' }), finish = page.getByRole('button', { name: /대화 마무리하기/ });
    await page.waitForFunction(() => [...document.images].filter(image => image.getClientRects().length > 0).every(image => image.complete && image.naturalWidth > 0));
    assert.equal(await finish.count(), 0);
    assert.equal(await input.evaluate(element => document.activeElement === element), true);
    assert.equal(await input.evaluate(element => getComputedStyle(element.closest('form')).boxShadow), 'none');
    assert.equal(await page.getByText('털어놓기', { exact: true }).count(), 0);
    assert.equal(await page.getByRole('link', { name: '홈으로 돌아가기', exact: true }).count(), 0);
    const toggleBox = await page.getByRole('button', { name: '미저장 대화 목록 펼치기' }).boundingBox();
    const brandBox = await page.getByRole('link', { name: '고민일기 홈', exact: true }).boundingBox();
    assert.ok(toggleBox.x + toggleBox.width <= brandBox.x);

    assert.equal(await page.locator('#talk-input-hint').count(), 0);
    const headingBox = await page.getByRole('heading', { name: /무엇이든 이야기해줘/ }).boundingBox();
    const initialBox = await input.boundingBox();
    assert.ok(initialBox.y > headingBox.y + headingBox.height && initialBox.y - headingBox.y - headingBox.height < 80);
    if (viewport.width >= 768) assert.equal(await page.getByRole('link', { name: '홈으로 돌아가기', exact: true }).count(), 0);
    await page.getByRole('button', { name: '미저장 대화 목록 펼치기' }).click();
    await page.getByRole('status', { name: '이전 대화 불러오는 중' }).waitFor({ state: 'hidden' });
    assert.equal(await page.getByRole('navigation', { name: '미저장 대화 목록', exact: true }).count(), 0);
    const sidebarBox = await page.getByRole('complementary', { name: '미저장 대화', exact: true }).boundingBox();
    assert.equal(sidebarBox.x, 0);
    assert.ok(sidebarBox.width <= viewport.width);
    const menu = page.getByRole('navigation', { name: '서비스 메뉴', exact: true });
    assert.equal(await menu.isVisible(), viewport.width < 768);
    if (viewport.width < 768) {
      for (const [name, href] of [['홈', '/'], ['가이드', '/guide'], ['컬렉션', '/collection']]) {
        const link = menu.getByRole('link', { name, exact: true });
        assert.equal(await link.getAttribute('href'), href);
        await visibleInViewport(link, page);
      }
    }
    const panel = page.getByRole('complementary', { name: '미저장 대화', exact: true });
    await panel.click({ position: { x: 8, y: 8 } });
    assert.equal(await panel.isVisible(), true);
    if (viewport.width > 320) {
      const box = await input.boundingBox();
      await input.click({ position: { x: box.width - 8, y: 8 } });
    } else {
      // The panel spans this viewport; the header remains outside it.
      await page.mouse.click(viewport.width - 8, 32);
    }
    await panel.waitFor({ state: 'hidden', timeout: 1500 });
    if (viewport.width > 320) assert.equal(await input.evaluate(el => document.activeElement === el), true);
    await page.getByRole('button', { name: '미저장 대화 목록 펼치기' }).click();
    await panel.waitFor();
    await page.getByRole('button', { name: '미저장 대화 목록 접기' }).click();
    await panel.waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: '미저장 대화 목록 펼치기' }).click();
    await page.getByRole('button', { name: '미저장 대화 목록 닫기' }).click();
    await page.screenshot({ path: new URL(`initial-${viewport.width}x${viewport.height}.png`, artifacts).pathname });
    for (const value of [' \n', '가'.repeat(101)]) { await input.fill(value); assert.equal(await send.isDisabled(), true); }
    await input.fill('가'.repeat(98)+' \n'); assert.equal(await send.isEnabled(), true); assert.equal(await page.locator('#talk-count').innerText(), '100/100');
    await input.fill('시험과 진로 때문에 불안해요.');
    if (viewport.width >= 768) {
      await input.press('Shift+Enter'); assert.equal(f.calls().sends, 0);
      await input.dispatchEvent('compositionstart'); await input.press('Enter'); assert.equal(f.calls().sends, 0);
      await input.dispatchEvent('compositionend'); await input.press('Enter');
    } else { await input.press('Enter'); assert.equal(f.calls().sends, 0); await send.click(); }
    await page.getByRole('status', { name: '모리 답변 입력 중' }).waitFor();
    const typing = page.getByRole('status', { name: '모리 답변 입력 중' });
    const frames = await typing.evaluate(element => {
      const dots = [...element.querySelectorAll('span > span')];
      const animations = dots.map(dot => dot.getAnimations()[0]);
      animations.forEach(animation => animation.pause());
      const frames = [0, 550, 1050, 1550].map(time => {
        animations.forEach(animation => { animation.currentTime = time; });
        return dots.filter(dot => getComputedStyle(dot).opacity === '1').length;
      });
      animations.forEach(animation => animation.play());
      return frames;
    });
    assert.deepEqual(frames, [1, 2, 3, 1]);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await typing.evaluate(element => element.getAnimations({ subtree: true }).length), 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    assert.equal(await finish.isEnabled(), true);
    await page.getByRole('button', { name: '미저장 대화 목록 펼치기' }).click();
    await page.getByRole('navigation', { name: '미저장 대화 목록', exact: true }).waitFor();
    assert.equal(await page.getByRole('link', { name: /시험과 진로 때문에 불안해요/ }).count(), 1);
    await page.getByRole('button', { name: '미저장 대화 목록 닫기' }).click();
    await input.fill('대기 중에 적는 미전송 초안'); assert.equal(await send.isDisabled(), true);
    await input.press('Enter'); assert.equal(f.calls().sends, 1);
    await visibleInViewport(input, page); await visibleInViewport(page.locator('#talk-count'), page); await visibleInViewport(send, page);
    await page.screenshot({ path: new URL(`conversation-${viewport.width}x${viewport.height}.png`, artifacts).pathname.replace(/^\/(\w:)/, '$1') });
    await finish.click(); await page.getByText('진행 중인 모리 응답을 기다린 뒤, 저장된 대화를 요약할게요.').waitFor();
    assert.equal(f.calls().summaries, 0); assert.equal(await input.isEditable(), true);
    f.reply(); await waitFor(() => f.calls().summaries === 1, page);
    await page.getByText('저장된 원문으로 요약을 만들고 있어요…').waitFor();
    await page.screenshot({ path: new URL(`wrapup-${viewport.width}x${viewport.height}.png`, artifacts).pathname.replace(/^\/(\w:)/, '$1') });
    f.summary(); await page.getByRole('heading', { name: '지금까지의 고민 요약' }).waitFor();
    assert.equal(await page.getByRole('heading', { name: '지금의 마음' }).count(), 1);
    assert.equal(await page.getByRole('button', { name: '같은 대화로 돌아가기' }).count(), 0);

    assert.equal(await page.getByRole('heading', { name: '주요 고민' }).count(), 1);
    assert.equal(await page.getByRole('heading', { name: '자주 느끼는 감정' }).count(), 1);
    assert.equal(await page.getByText('대기 중에 적는 미전송 초안').count(), 0);
    const confirm = page.getByRole('button', { name: '이 내용으로 정리하기' });
    await visibleInViewport(confirm, page);
    await page.screenshot({ path: new URL(`summary-${viewport.width}x${viewport.height}.png`, artifacts).pathname.replace(/^\/(\w:)/, '$1') });
    await page.getByRole('button', { name: '다시 이야기하기', exact: true }).click();
    await input.waitFor();
    assert.ok((await input.inputValue()).includes('대기 중에 적는 미전송 초안'));
    await input.fill('추가로 가족과의 관계도 고민이에요.'); await send.click(); await waitFor(() => f.calls().sends === 2, page); f.reply();
    await page.getByRole('status', { name: '모리 답변 입력 중' }).waitFor({ state: 'hidden' });
    await finish.click(); await waitFor(() => f.calls().summaries === 2, page); f.summary();
    await confirm.waitFor();
    const conversationUrl = page.url();
    await confirm.click();
    const summaryId = f.conversation.summaries.at(-1).id;
    assert.equal(f.calls().confirmations, 1); assert.equal(f.conversation.summaries.length, 2);
    await waitFor(() => f.calls().imageRequests === 1, page);
    assert.equal(page.url(), conversationUrl);
    await page.getByRole('alert').filter({ hasText: '이미지를 만들지 못했어요.' }).waitFor();
    assert.equal(await page.getByRole('button', { name: '이 요약으로 그림 만들기' }).count(), 0);
    assert.equal(await page.getByText(f.conversation.summaries.at(-1).current_feeling, { exact: true }).count(), 0);
    await page.getByRole('button', { name: '그림 다시 만들기' }).click();
    await page.getByRole('heading', { name: '마음을 쉬어가는 하루' }).waitFor();
    assert.equal(f.calls().imageRequests, 2);
    await page.getByRole('button', { name: '컬렉션에 저장하기' }).click();
    await page.getByRole('link', { name: '저장한 일기 보기' }).waitFor();
    const regenerate = page.getByRole('button', { name: '다른 그림도 만들어보기' });
    await regenerate.waitFor({ timeout: 5000 });
    await regenerate.click();
    await waitFor(() => f.calls().imageRequests === 3, page);
    assert.equal(await page.getByRole('button', { name: '그림을 만들고 있어요…' }).isDisabled(), true);
    await page.getByRole('heading', { name: '마음을 쉬어가는 하루' }).waitFor();
    assert.equal(await page.getByRole('link', { name: '저장한 일기 보기' }).getAttribute('href'), '/collection#entry=entry-a');
    f.finishRegeneration(false);
    await page.getByRole('alert').filter({ hasText: '이미지를 만들지 못했어요.' }).waitFor();
    assert.equal(await page.getByRole('link', { name: '저장한 일기 보기' }).getAttribute('href'), '/collection#entry=entry-a');
    await regenerate.click();
    await waitFor(() => f.calls().imageRequests === 4, page);
    f.finishRegeneration(true);
    await page.getByRole('heading', { name: '새롭게 쉬어가는 하루' }).waitFor();
    assert.equal(await page.getByRole('link', { name: '저장한 일기 보기' }).count(), 0);
    await page.getByRole('button', { name: '컬렉션에 저장하기' }).click();
    await page.getByRole('link', { name: '저장한 일기 보기' }).waitFor();
    assert.equal(await page.getByRole('link', { name: '저장한 일기 보기' }).getAttribute('href'), '/collection#entry=entry-b');
    assert.deepEqual(f.savedResults, ['result-a', 'result-b']);
    assert.equal(page.url(), conversationUrl);
    await page.goto(`${base}/talk/${f.conversation.id}/handoff/${summaryId}`);
    await page.getByRole('link', { name: '확정 요약 보기' }).click(); await page.waitForURL('**/handoff/**'); await page.reload();
    await page.getByText('요약을 확정했어요. 이 내용으로 그림일기를 만들 수 있어요.').waitFor();
    await page.getByRole('button', { name: '다시 이야기하기', exact: true }).click(); await page.waitForURL(`**/talk/${f.conversation.id}`);
    await input.waitFor(); await input.fill('재접속 시 복원되면 안 되는 초안');
    // Return to the same persisted conversation URL, then reload.
    await page.goto(`${base}/talk/${f.conversation.id}`); await input.waitFor();
    assert.equal(await input.inputValue(), ''); assert.equal(await page.locator('time').count(), 4);
    assert.equal(await page.getByRole('navigation').count(), 0);
    assert.equal(await page.locator('input[type=file]').count(), 0);
    const overflowing = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth); assert.equal(overflowing, false);
    assert.deepEqual(errors, []); results.push({ viewport, result: 'passed' }); await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); const f = await fixture(page);
  await page.goto(`${base}/talk`); const input = page.getByLabel('메시지', { exact: true }); await input.fill('실패 확인'); await page.getByRole('button', { name: '메시지 전송' }).click();
  await waitFor(() => f.calls().sends === 1, page); f.reply('AI_NOT_CONFIGURED'); await page.getByText(/모리 응답 서비스를 아직 연결/).waitFor();
  await page.getByRole('button', { name: /대화 마무리하기/ }).click(); await waitFor(() => f.calls().summaries === 1, page); f.summary('AI_FAILED');
  await page.getByText('요약을 완료하지 못했어요. 현재 단계는 보류 중이에요.').waitFor();
  assert.equal(await page.getByRole('button', { name: /재시도|다시 시도/ }).count(), 0);
  assert.equal(await page.getByRole('button', { name: '이 내용으로 정리하기' }).count(), 0);
  results.push({ failureStates: 'passed' }); await page.close();
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 320 }]) {
    const page = await browser.newPage({ viewport, timezoneId: 'Asia/Seoul' }); const f = await fixture(page);
    await page.goto(`${base}/talk`); const input = page.getByLabel('메시지', { exact: true }); await input.waitFor();
    await visibleInViewport(input, page); await visibleInViewport(page.getByRole('button', { name: '메시지 전송' }), page);
    f.holdNextSend(); await input.fill('전송 지연 검증'); await page.getByRole('button', { name: '메시지 전송' }).click();
    await page.getByText('보내는 중…', { exact: true }).waitFor();
    assert.equal(await page.getByText('전송 지연 검증', { exact: true }).count(), 1);
    assert.equal(await input.inputValue(), '');
    assert.equal(await page.getByRole('button', { name: /대화 마무리하기/ }).isDisabled(), true);
    const sendBox = await input.boundingBox(); assert.ok(sendBox.y > viewport.height / 2);
    await input.fill('새로 작성한 초안'); f.acceptSend(false);
    await page.getByText('메시지를 보내지 못했어요. 저장 여부를 확인할 수 없어요.').waitFor();
    assert.equal(await page.getByText('전송 지연 검증', { exact: true }).count(), 0);
    assert.equal(await input.inputValue(), '새로 작성한 초안');
    f.holdNextSend(); await input.fill('저장 성공 검증'); await page.getByRole('button', { name: '메시지 전송' }).click();
    await page.getByText('보내는 중…', { exact: true }).waitFor(); f.acceptSend(true);
    await page.getByText('보내는 중…', { exact: true }).waitFor({ state: 'hidden' });
    assert.equal(await page.getByText('저장 성공 검증', { exact: true }).count(), 1); f.reply();
    await page.getByRole('status', { name: '모리 답변 입력 중' }).waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: '미저장 대화 목록 펼치기' }).click();
    await page.getByRole('link', { name: '새 이야기 시작하기' }).click();
    await page.waitForURL(`${base}/talk`); await page.waitForLoadState('networkidle');
    assert.equal(await page.getByText('저장 성공 검증', { exact: true }).count(), 0);
    assert.equal(await input.inputValue(), '');
    f.setHistory([
      { id: f.conversation.id, title: '오늘의 미저장 이야기', updated_at: '2026-10-13T02:00:00Z' },
      { id: randomUUID(), title: '어제의 미저장 이야기', updated_at: '2026-10-12T04:00:00Z' },
    ]);
    await page.getByRole('button', { name: '미저장 대화 목록 펼치기' }).click();
    const list = page.getByRole('navigation', { name: '미저장 대화 목록', exact: true }); await list.waitFor();
    assert.deepEqual(await list.locator('h3').allTextContents(), ['2026년 10월 13일', '2026년 10월 12일']);
    await page.screenshot({ path: new URL(`history-${viewport.width}x${viewport.height}.png`, artifacts).pathname });
    await page.getByRole('link', { name: '오늘의 미저장 이야기', exact: true }).click();
    await page.waitForURL(`**/talk/${f.conversation.id}`); await page.waitForLoadState("networkidle"); await input.waitFor();
    await page.getByText('저장 성공 검증', { exact: true }).waitFor();
    assert.equal(await page.getByText('저장 성공 검증', { exact: true }).count(), 1);
    assert.equal(await list.count(), 0);
    f.failHistory(true); await page.getByRole('button', { name: '미저장 대화 목록 펼치기' }).click();
    await page.getByText('대화 목록을 불러오지 못했어요.').waitFor();
    f.failHistory(false); await page.getByRole('button', { name: '다시 불러오기' }).click(); await list.waitFor();
    await page.getByRole('link', { name: '오늘의 미저장 이야기', exact: true }).focus(); await page.keyboard.press('Escape');
    assert.equal(await list.count(), 0);
    assert.equal(await page.getByRole('button', { name: '미저장 대화 목록 펼치기' }).evaluate(el => document.activeElement === el), true);
    results.push({ optimisticSendAndHistory: viewport, result: 'passed' }); await page.close();
  }
  const anonymous = await browser.newPage(); const anonymousFixture = await fixture(anonymous); anonymousFixture.logout();
  await anonymous.goto(`${base}/talk/${anonymousFixture.conversation.id}`); await anonymous.waitForURL('**/login?**');
  assert.equal(await anonymous.getByLabel('메시지', { exact: true }).count(), 0); results.push({ authGuard: 'passed' }); await anonymous.close();
  console.log(JSON.stringify({ evidence: 'Intercepted API fixtures; no real AI/DB', results }, null, 2));
} finally { await browser.close(); }
