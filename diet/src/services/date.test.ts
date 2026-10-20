import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatLocalDate, isFutureLocalDate, isLocalDate } from "./date.ts";

describe("formatLocalDate", () => {
  it("keeps the local calendar date instead of shifting through UTC", () => {
    assert.equal(formatLocalDate(new Date(2026, 7, 12, 0, 5)), "2026-08-12");
    assert.equal(formatLocalDate(new Date(2026, 7, 12, 23, 55)), "2026-08-12");
  });

  it("keeps month and year boundaries local", () => {
    assert.equal(formatLocalDate(new Date(2026, 0, 1, 0, 1)), "2026-01-01");
    assert.equal(formatLocalDate(new Date(2025, 11, 31, 23, 59)), "2025-12-31");
  });

  it("accepts only real local calendar dates for URL state", () => {
    assert.equal(isLocalDate("2026-08-12"), true);
    assert.equal(isLocalDate("2026-02-29"), false);
    assert.equal(isLocalDate("2028-02-29"), true);
    assert.equal(isLocalDate("2026-8-12"), false);
  });

  it("distinguishes future dates from today and past dates", () => {
    const today = new Date(2026, 7, 12, 12);

    assert.equal(isFutureLocalDate("2026-08-13", today), true);
    assert.equal(isFutureLocalDate("2026-08-12", today), false);
    assert.equal(isFutureLocalDate("2026-08-11", today), false);
  });
});
