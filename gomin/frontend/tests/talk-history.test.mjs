import assert from 'node:assert/strict';
import { test } from 'node:test';
import { groupTalkHistory } from '../src/lib/talk-history.ts';

test('history groups midnight boundaries in the viewer timezone and sorts latest first without mutating input', () => {
  const input = [
    { id: 'older', title: '어제 이야기', updated_at: '2026-10-12T14:59:00Z' },
    { id: 'newer', title: '오늘 이야기', updated_at: '2026-10-12T15:01:00Z' },
    { id: 'latest', title: '가장 최근 이야기', updated_at: '2026-10-13T02:00:00Z' },
  ];
  const groups = groupTalkHistory(input, 'Asia/Seoul');
  assert.deepEqual(groups.map(group => group.date), ['2026년 10월 13일', '2026년 10월 12일']);
  assert.deepEqual(groups.map(group => group.items.map(item => item.id)), [['latest', 'newer'], ['older']]);
  assert.equal(input[0].id, 'older');
  assert.deepEqual(groupTalkHistory([], 'Asia/Seoul'), []);
});
