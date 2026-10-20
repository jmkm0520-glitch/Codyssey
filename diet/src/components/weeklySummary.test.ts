import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { DietStats } from "../types/api.ts";
import { buildWeeklySummary, trendSentence } from "./weeklySummary.ts";

function stats(overrides: Partial<DietStats> = {}): DietStats {
  return {
    range: { start: "2026-08-14", end: "2026-08-20", days: 7 },
    total: 21,
    clean: 16,
    free: 5,
    cleanRatio: 76,
    recordedDays: 6,
    daily: [],
    topMeal: "dinner",
    previous: { total: 18, clean: 10, free: 8, cleanRatio: 56 },
    cleanRatioDelta: 20,
    ...overrides,
  };
}

describe("trendSentence", () => {
  it("says the ratio rose", () => {
    assert.equal(trendSentence(20, 18), "지난주보다 클린식 비율이 20%p 높아졌습니다.");
  });

  it("says the ratio fell, without a minus sign", () => {
    assert.equal(trendSentence(-12, 18), "지난주보다 클린식 비율이 12%p 낮아졌습니다.");
  });

  it("says the ratio held", () => {
    assert.equal(trendSentence(0, 18), "지난주와 클린식 비율이 같습니다.");
  });

  it("refuses to compare when last week holds nothing", () => {
    assert.equal(trendSentence(0, 0), "지난주에는 기록이 없어 비교할 수 없습니다.");
  });
});

describe("buildWeeklySummary", () => {
  it("writes the summary from the requirement example", () => {
    assert.deepEqual(buildWeeklySummary(stats()), [
      "총 21회의 식사를 기록했습니다.",
      "클린식은 16회, 자유식은 5회 기록했습니다.",
      "가장 많이 기록한 식사 시간은 저녁입니다.",
      "7일 중 6일을 기록했습니다.",
      "지난주보다 클린식 비율이 20%p 높아졌습니다.",
    ]);
  });

  it("returns nothing when the window holds no record", () => {
    assert.deepEqual(buildWeeklySummary(stats({ total: 0 })), []);
  });

  it("skips the meal-time line when no slot stands out", () => {
    const lines = buildWeeklySummary(stats({ topMeal: null }));
    assert.equal(
      lines.some((line) => line.includes("식사 시간")),
      false,
    );
    assert.equal(lines.length, 4);
  });

  it("labels every meal slot in Korean", () => {
    const labels = (["breakfast", "lunch", "dinner", "snack"] as const).map(
      (slot) => buildWeeklySummary(stats({ topMeal: slot }))[2],
    );
    assert.deepEqual(labels, [
      "가장 많이 기록한 식사 시간은 아침입니다.",
      "가장 많이 기록한 식사 시간은 점심입니다.",
      "가장 많이 기록한 식사 시간은 저녁입니다.",
      "가장 많이 기록한 식사 시간은 간식입니다.",
    ]);
  });

  it("states the record rate so a partly recorded week is not read as a full one", () => {
    const lines = buildWeeklySummary(stats({ recordedDays: 2 }));
    assert.equal(lines[3], "7일 중 2일을 기록했습니다.");
  });
});
