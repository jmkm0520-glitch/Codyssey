import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildDailyBars, buildWeightLine, donutDash, donutLabel } from "./statsChart.ts";

describe("donutDash", () => {
  it("fills the whole ring when every meal is clean", () => {
    assert.deepEqual(donutDash(100, 300), [300, 0]);
  });

  it("leaves the ring empty when nothing is clean", () => {
    assert.deepEqual(donutDash(0, 300), [0, 300]);
  });

  it("splits the ring by the clean ratio", () => {
    assert.deepEqual(donutDash(76, 300), [228, 72]);
  });

  it("clamps a ratio that falls outside 0 to 100", () => {
    assert.deepEqual(donutDash(140, 300), [300, 0]);
    assert.deepEqual(donutDash(-20, 300), [0, 300]);
  });
});

describe("buildDailyBars", () => {
  const daily = [
    { date: "2026-08-18", clean: 2, free: 2, weight: null },
    { date: "2026-08-19", clean: 0, free: 0, weight: null },
    { date: "2026-08-20", clean: 1, free: 0, weight: null },
  ];

  it("scales the busiest day to the full chart height", () => {
    const bars = buildDailyBars(daily);
    assert.equal(bars[0].cleanHeight + bars[0].freeHeight, 1);
  });

  it("keeps a day without records as an empty slot", () => {
    const bars = buildDailyBars(daily);
    assert.equal(bars[1].total, 0);
    assert.equal(bars[1].cleanHeight, 0);
    assert.equal(bars[1].freeHeight, 0);
    assert.equal(bars.length, 3);
  });

  it("labels each column with the day of the month", () => {
    assert.deepEqual(
      buildDailyBars(daily).map((bar) => bar.label),
      ["18", "19", "20"],
    );
  });

  it("scales a quieter day proportionally", () => {
    assert.equal(buildDailyBars(daily)[2].cleanHeight, 0.25);
  });

  it("gives every day zero height when nothing is recorded", () => {
    const bars = buildDailyBars([{ date: "2026-08-20", clean: 0, free: 0, weight: null }]);
    assert.equal(bars[0].cleanHeight, 0);
    assert.equal(bars[0].freeHeight, 0);
  });
});

describe("donutLabel", () => {
  it("describes both shares for screen readers", () => {
    assert.equal(donutLabel(16, 5, 76), "클린식 16회 76퍼센트, 자유식 5회 24퍼센트");
  });
});

describe("buildWeightLine", () => {
  const daily = [
    { date: "2026-08-18", weight: 55.5 },
    { date: "2026-08-19", weight: null },
    { date: "2026-08-20", weight: 54.5 },
  ];

  it("skips days without a weight instead of drawing them at zero", () => {
    const line = buildWeightLine(daily);
    assert.equal(line.points.length, 2);
    assert.deepEqual(
      line.points.map((point) => point.date),
      ["2026-08-18", "2026-08-20"],
    );
  });

  it("spreads points across the window by their position, not their order", () => {
    const line = buildWeightLine(daily);
    assert.equal(line.points[0].x, 0);
    assert.equal(line.points[1].x, 1);
  });

  it("formats every plotted date for the horizontal axis", () => {
    assert.deepEqual(
      buildWeightLine(daily).points.map((point) => point.dateLabel),
      ["8/18", "8/20"],
    );
  });

  it("scales to the recorded range so a small change stays visible", () => {
    const line = buildWeightLine(daily);
    assert.equal(line.min, 54.5);
    assert.equal(line.max, 55.5);
    assert.equal(line.points[0].y, 1);
    assert.equal(line.points[1].y, 0);
  });

  it("centres a single point instead of pinning it to an edge", () => {
    const line = buildWeightLine([{ date: "2026-08-20", weight: 55 }]);
    assert.equal(line.points[0].x, 0.5);
    assert.equal(line.points[0].y, 0.5);
  });

  it("centres every point when the weight never changed", () => {
    const line = buildWeightLine([
      { date: "2026-08-19", weight: 55 },
      { date: "2026-08-20", weight: 55 },
    ]);
    assert.deepEqual(
      line.points.map((point) => point.y),
      [0.5, 0.5],
    );
  });

  it("returns an empty line when no weight is recorded", () => {
    assert.deepEqual(buildWeightLine([{ date: "2026-08-20", weight: null }]), {
      points: [],
      min: 0,
      max: 0,
    });
  });
});
