import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildCalendarGrid } from "./calendarGrid.ts";

describe("buildCalendarGrid", () => {
  it("places dates below their actual weekday headers", () => {
    const august2026 = buildCalendarGrid(2026, 7);

    assert.equal(august2026.length, 42);
    assert.deepEqual(august2026.slice(0, 7), [null, null, null, null, null, null, 1]);
    assert.equal(august2026[36], 31);
  });

  it("handles leap-year February", () => {
    const february2028 = buildCalendarGrid(2028, 1);

    assert.equal(february2028.filter(Boolean).length, 29);
    assert.equal(february2028.includes(29), true);
  });

  it("keeps year-end and year-start dates under their correct weekdays", () => {
    const december2026 = buildCalendarGrid(2026, 11);
    const january2027 = buildCalendarGrid(2027, 0);

    assert.deepEqual(december2026.slice(0, 7), [null, null, 1, 2, 3, 4, 5]);
    assert.equal(december2026[32], 31);
    assert.deepEqual(january2027.slice(0, 7), [null, null, null, null, null, 1, 2]);
    assert.equal(january2027[35], 31);
  });
});
