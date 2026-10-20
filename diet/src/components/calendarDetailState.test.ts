import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { DayRecord } from "../types/api.ts";
import { getCalendarDetailState } from "./calendarDetailState.ts";

const emptyMeals: DayRecord["meals"] = {
  breakfast: null,
  lunch: null,
  dinner: null,
  snack: null,
};

describe("getCalendarDetailState", () => {
  it("uses the edit screen state when a meal record exists", () => {
    const state = getCalendarDetailState({
      date: "2026-08-12",
      weight: null,
      meals: {
        ...emptyMeals,
        breakfast: {
          id: "meal-1",
          date: "2026-08-12",
          meal: "breakfast",
          food: "공복",
          type: "clean",
        },
      },
    });

    assert.deepEqual(state, {
      mode: "recorded",
      status: "clean",
      hasAnyRecord: true,
      action: "edit",
    });
  });

  it("uses the weight-only screen state without a character", () => {
    const state = getCalendarDetailState({
      date: "2026-08-12",
      weight: { date: "2026-08-12", weight: 60.5 },
      meals: emptyMeals,
    });

    assert.deepEqual(state, {
      mode: "weight-only",
      status: null,
      hasAnyRecord: true,
      action: "edit",
    });
  });

  it("uses the record screen state for an empty date", () => {
    const state = getCalendarDetailState({
      date: "2026-08-12",
      weight: null,
      meals: emptyMeals,
    });

    assert.deepEqual(state, {
      mode: "empty",
      status: null,
      hasAnyRecord: false,
      action: "record",
    });
  });
});
