import type { DayRecord, Meal, MealRecord, MealType, WeightRecord } from "../types/api";
import { formatLocalDate } from "./date";

const storageKey = (date: string) => `diet-day:${date}`;

export function readLocalDay(date: string): DayRecord {
  const emptyMeals: Record<Meal, MealRecord | null> = {
    breakfast: null,
    lunch: null,
    dinner: null,
    snack: null,
  };
  if (typeof window === "undefined") return { date, weight: null, meals: emptyMeals };
  const raw = window.localStorage.getItem(storageKey(date));
  if (!raw) return { date, weight: null, meals: emptyMeals };
  try {
    return JSON.parse(raw) as DayRecord;
  } catch {
    window.localStorage.removeItem(storageKey(date));
    return { date, weight: null, meals: emptyMeals };
  }
}

export function saveLocalWeight(date: string, weight: number): WeightRecord {
  const day = readLocalDay(date);
  const record = { date, weight };
  window.localStorage.setItem(storageKey(date), JSON.stringify({ ...day, weight: record }));
  return record;
}

export function saveLocalMeal(
  date: string,
  meal: Meal,
  food: string,
  type: "clean" | "free",
): MealRecord {
  const day = readLocalDay(date);
  const record: MealRecord = {
    id: `local-${date}-${meal}`,
    date,
    meal,
    food: food.trim(),
    type,
  };
  window.localStorage.setItem(
    storageKey(date),
    JSON.stringify({ ...day, meals: { ...day.meals, [meal]: record } }),
  );
  return record;
}

export function clearLocalMeals(date: string): DayRecord {
  const day = readLocalDay(date);
  const clearedDay: DayRecord = {
    ...day,
    date,
    meals: {
      breakfast: null,
      lunch: null,
      dinner: null,
      snack: null,
    },
  };

  if (day.weight) {
    window.localStorage.setItem(storageKey(date), JSON.stringify(clearedDay));
  } else {
    window.localStorage.removeItem(storageKey(date));
  }

  return clearedDay;
}

/** Remove one locally stored meal while preserving the other meal slots and weight. */
export function clearLocalMeal(date: string, meal: Meal): DayRecord {
  const day = readLocalDay(date);
  const clearedDay: DayRecord = {
    ...day,
    date,
    meals: { ...day.meals, [meal]: null },
  };

  if (clearedDay.weight || Object.values(clearedDay.meals).some((record) => record !== null)) {
    window.localStorage.setItem(storageKey(date), JSON.stringify(clearedDay));
  } else {
    window.localStorage.removeItem(storageKey(date));
  }

  return clearedDay;
}

export function clearLocalDay(date: string): DayRecord {
  const clearedDay: DayRecord = {
    date,
    weight: null,
    meals: {
      breakfast: null,
      lunch: null,
      dinner: null,
      snack: null,
    },
  };

  window.localStorage.removeItem(storageKey(date));
  return clearedDay;
}

/** Return the meal status for every locally stored day in one calendar month. */
export function readLocalMealStatuses(
  year: number,
  monthIndex: number,
): Record<string, "clean" | "free"> {
  const lastDate = new Date(year, monthIndex + 1, 0).getDate();
  const statuses: Record<string, "clean" | "free"> = {};

  for (let day = 1; day <= lastDate; day += 1) {
    const date = formatLocalDate(new Date(year, monthIndex, day));
    const meals = Object.values(readLocalDay(date).meals).filter(
      (meal): meal is MealRecord => meal !== null,
    );

    if (meals.some((meal) => meal.type === "free")) {
      statuses[date] = "free";
    } else if (meals.length > 0 && meals.every((meal) => meal.type === "clean")) {
      statuses[date] = "clean";
    }
  }

  return statuses;
}

export type LocalCalendarRecord = {
  status: MealType | null;
  weight: number | null;
};

/** Return the locally saved meal state and weight needed to draw a calendar month. */
export function readLocalCalendarRecords(
  year: number,
  monthIndex: number,
): Record<string, LocalCalendarRecord> {
  const lastDate = new Date(year, monthIndex + 1, 0).getDate();
  const records: Record<string, LocalCalendarRecord> = {};

  for (let day = 1; day <= lastDate; day += 1) {
    const date = formatLocalDate(new Date(year, monthIndex, day));
    const localDay = readLocalDay(date);
    const meals = Object.values(localDay.meals).filter((meal): meal is MealRecord => meal !== null);
    const status = meals.some((meal) => meal.type === "free")
      ? "free"
      : meals.length > 0 && meals.every((meal) => meal.type === "clean")
        ? "clean"
        : null;

    if (status || localDay.weight) {
      records[date] = { status, weight: localDay.weight?.weight ?? null };
    }
  }

  return records;
}
