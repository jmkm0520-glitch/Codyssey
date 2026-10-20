import type { DayRecord, MealRecord, MealType } from "../types/api";

export type CalendarDetailState = {
  mode: "recorded" | "weight-only" | "empty";
  status: MealType | null;
  hasAnyRecord: boolean;
  action: "edit" | "record";
};

export function getCalendarDetailState(day: DayRecord): CalendarDetailState {
  const meals = Object.values(day.meals).filter((meal): meal is MealRecord => meal !== null);
  const status = meals.some((meal) => meal.type === "free")
    ? "free"
    : meals.length > 0 && meals.every((meal) => meal.type === "clean")
      ? "clean"
      : null;
  const hasWeight = day.weight !== null;
  const hasMeals = meals.length > 0;
  const mode = hasMeals ? "recorded" : hasWeight ? "weight-only" : "empty";

  return {
    mode,
    status,
    hasAnyRecord: hasMeals || hasWeight,
    action: hasMeals || hasWeight ? "edit" : "record",
  };
}
