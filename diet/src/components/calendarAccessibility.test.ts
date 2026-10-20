import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildCalendarDateLabel } from "./calendarAccessibility.ts";

describe("buildCalendarDateLabel", () => {
  it("describes today, meal status, and weight without relying on color", () => {
    assert.equal(
      buildCalendarDateLabel("2026-08-12", true, { status: "clean", weight: 60.5 }),
      "2026-08-12 날짜 선택, 오늘, 클린식, 체중 60.5kg",
    );
  });

  it("describes a free-meal date without a weight", () => {
    assert.equal(
      buildCalendarDateLabel("2026-08-10", false, { status: "free", weight: null }),
      "2026-08-10 날짜 선택, 자유식 포함",
    );
  });

  it("keeps an empty date label concise", () => {
    assert.equal(buildCalendarDateLabel("2026-08-09", false), "2026-08-09 날짜 선택");
  });
});
