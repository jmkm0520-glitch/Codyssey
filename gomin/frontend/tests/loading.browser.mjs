// Delayed API fixtures only: no environment files, real credentials, AI, or DB.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? '@playwright/test');
const base = process.env.LOADING_QA_URL ?? 'http://127.0.0.1:3012';
const artifacts = new URL('../../.dev/loading-qa/', import.meta.url);
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const id = '11111111-1111-4111-8111-111111111111';
const member = { id: 'qa', name: '검증 회원', email: 'qa@example.test' };
const row = { id, source_result_id: 'qa', title: '검증 이야기', diary_date: '2026-10-14', emotion_tags: ['기쁨'],
  image_url: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#8ca58c"/></svg>'),
  encouragement_text: '잠시 쉬어도 괜찮아요.', current_feeling: '편안한 마음', main_concerns: ['오늘의 고민'] };
const conversation = { id, phase: 'chatting', messages: [{ id: 'message', conversation_id: id, seq_no: 1, role: 'user', content: '저장된 이야기', created_at: '2026-10-14T01:00:00Z' }], summaries: [], jobs: [] };
function gate() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
async function reducedMotion(page, locator) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await locator.evaluate(element => element.getAnimations({ subtree: true }).length), 0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
}
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    const page = await browser.newPage({ viewport });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    let list = gate(), detail = gate(), chat = gate(), history = gate();
    await page.route('**/api/v1/**', async route => {
      const path = new URL(route.request().url()).pathname;
      const headers = { 'access-control-allow-origin': base, 'access-control-allow-credentials': 'true' };
      const success = data => route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ success: true, data, error: null }) });
      if (path === '/api/v1/auth/me') return success(member);
      const result = await (path === '/api/v1/collection' ? list.promise : path.startsWith('/api/v1/collection/') ? detail.promise : path === '/api/v1/conversations' ? history.promise : chat.promise);
      if (result.error) return route.fulfill({ status: 503, headers, contentType: 'application/json', body: JSON.stringify({ success: false, data: null, error: { code: 'SERVICE_UNAVAILABLE', message: '검증 오류', details: [] } }) });
      return success(result.data);
    });
    await page.goto(`${base}/collection`);
    const collection = page.getByRole('region', { name: viewport.width >= 768 ? '고민일기 필름' : '고민일기 목록', exact: true });
    await collection.locator('[aria-hidden="true"] [class*="skeleton"]').first().waitFor();
    assert.equal(await collection.getAttribute('aria-busy'), 'true');
    assert.equal(await collection.getByRole('button', { name: /상세 보기/ }).count(), 0);
    assert.equal(await page.getByText('컬렉션을 불러오는 중이에요…', { exact: true }).count(), 0);
    const photo = collection.locator('[class*="photo"]').first(); const box = await photo.boundingBox(); assert.ok(box.height > box.width * .8);
    await page.screenshot({ path: new URL(`collection-${viewport.width}.png`, artifacts).pathname });
    await reducedMotion(page, collection);
    list.resolve({ data: [row] });
    const card = page.getByRole('button', { name: /검증 이야기 상세 보기/ }); await card.click();
    const entry = viewport.width >= 768 ? page.getByRole('dialog') : page.getByRole('article', { name: '고민일기 상세' });
    await entry.getByRole('status', { name: '이야기 불러오는 중' }).waitFor();
    assert.equal(await entry.locator('[class*="detailImageSkeleton"]').count(), 0);
    const hero = entry.locator('[class*="heroPhoto"] img');
    assert.equal(await hero.getAttribute('src'), row.image_url);
    assert.equal(await entry.locator('[class*="summaryCards"] > div').count(), 3);
    assert.equal(await page.getByText('이야기를 불러오는 중이에요…', { exact: true }).count(), 0);
    await page.screenshot({ path: new URL(`detail-${viewport.width}.png`, artifacts).pathname });
    await reducedMotion(page, entry);
    const refreshed = { ...row, image_url: row.image_url.replace('%238ca58c', '%23557c68') };
    detail.resolve({ data: refreshed }); await entry.getByRole('heading', { name: row.title, exact: true }).waitFor();
    assert.equal(await hero.getAttribute('src'), row.image_url);
    await hero.dispatchEvent('error');
    await page.waitForFunction(({ expected }) => [...document.querySelectorAll('[class*="heroPhoto"] img')].some(image => image.getAttribute('src') === expected), { expected: refreshed.image_url });
    await hero.dispatchEvent('error');
    await entry.getByRole('alert').filter({ hasText: '이미지를 불러오지 못했어요.' }).waitFor();
    assert.equal(await entry.getAttribute('aria-busy'), 'false');
    const close = () => page.getByRole('button', { name: viewport.width >= 768 ? '상세 닫기' : '컬렉션으로 돌아가기' }).click();
    await close(); await entry.waitFor({ state: 'hidden' });
    detail = gate(); await card.click(); await entry.getByRole('status', { name: '이야기 불러오는 중' }).waitFor();
    await close(); await entry.waitFor({ state: 'hidden' }); detail.resolve({ data: row });
    detail = gate(); await card.click(); await entry.getByRole('status', { name: '이야기 불러오는 중' }).waitFor();
    detail.resolve({ error: true }); await entry.getByRole('alert').waitFor();
    detail = gate(); await entry.getByRole('button', { name: '다시 시도' }).click(); await entry.getByRole('status', { name: '이야기 불러오는 중' }).waitFor();
    detail.resolve({ data: row }); await entry.getByRole('heading', { name: row.title, exact: true }).waitFor(); await close();
    list = gate(); await page.goto(`${base}/collection`); await collection.waitFor(); list.resolve({ error: true });
    await page.getByRole('heading', { name: '컬렉션을 불러오지 못했어요.' }).waitFor();
    list = gate(); await page.getByRole('button', { name: '다시 시도' }).click(); await collection.waitFor(); list.resolve({ data: [] });
    await page.getByRole('heading', { name: '아직 모아둔 이야기가 없어요.' }).waitFor();
    list = gate(); detail = gate(); await page.goto(`${base}/collection#entry=${id}`);
    await entry.getByRole('status', { name: '이야기 불러오는 중' }).waitFor();
    assert.equal(await entry.locator('[class*="detailImageSkeleton"]').count(), 1);
    detail.resolve({ data: row }); await entry.getByRole('heading', { name: row.title, exact: true }).waitFor();
    assert.equal(await entry.locator('[class*="heroPhoto"] img').getAttribute('src'), row.image_url);
    list.resolve({ data: [] }); await close();
    await page.goto(`${base}/talk/${id}`);
    const transcript = page.getByRole('status', { name: '대화 불러오는 중' }); await transcript.waitFor();
    assert.equal(await page.getByLabel('메시지', { exact: true }).count(), 0);
    assert.equal(await page.getByText('저장된 대화를 불러오고 있어요.', { exact: true }).count(), 0);
    assert.equal(await transcript.locator('li').count(), 4);
    await page.screenshot({ path: new URL(`talk-${viewport.width}.png`, artifacts).pathname });
    await reducedMotion(page, transcript);
    chat.resolve({ data: conversation }); await transcript.waitFor({ state: 'hidden' }); await page.getByText('저장된 이야기', { exact: true }).waitFor();
    const input = page.getByLabel('메시지', { exact: true }); assert.equal(await input.evaluate(element => document.activeElement === element), true);
    await page.getByRole('button', { name: '미저장 대화 목록 펼치기' }).click();
    const spinner = page.getByRole('status', { name: '이전 대화 불러오는 중' }); await spinner.waitFor();
    assert.equal(await spinner.textContent(), ''); assert.equal(await page.getByText('이야기를 불러오고 있어요…', { exact: true }).count(), 0);
    await page.screenshot({ path: new URL(`history-${viewport.width}.png`, artifacts).pathname });
    await reducedMotion(page, spinner);
    history.resolve({ error: true }); await page.getByText('대화 목록을 불러오지 못했어요.').waitFor();
    history = gate(); await page.getByRole('button', { name: '다시 불러오기' }).click(); await spinner.waitFor();
    history.resolve({ data: [{ id, title: '지난 이야기', updated_at: '2026-10-14T01:00:00Z' }] });
    await page.getByRole('link', { name: '지난 이야기', exact: true }).waitFor(); await spinner.waitFor({ state: 'hidden' });
    assert.deepEqual(errors, []); console.log('Loading UI passed', viewport); await page.close();
  }
} finally { await browser.close(); }
