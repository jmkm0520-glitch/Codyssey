import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRecordPageHref, getCalendarMonthForDate } from "./calendarNavigation.ts";

describe("buildRecordPageHref", () => {
  it("keeps the selected date when opening an existing record for editing", () => {
    assert.equal(buildRecordPageHref("2026-08-11"), "/?date=2026-08-11");
  });

  it("keeps the selected date when opening an empty date for recording", () => {
    assert.equal(buildRecordPageHref("2026-07-07"), "/?date=2026-07-07");
  });

  it("rejects an invalid selected date", () => {
    assert.throws(() => buildRecordPageHref("2026-02-29"));
  });

  it("restores the calendar month from the selected record date", () => {
    const month = getCalendarMonthForDate("2026-07-07");

    assert.equal(month.getFullYear(), 2026);
    assert.equal(month.getMonth(), 6);
    assert.equal(month.getDate(), 1);
  });

  it("rejects an invalid date when restoring the calendar month", () => {
    assert.throws(() => getCalendarMonthForDate("2026-02-29"));
  });
});
