import type { MealType } from "../types/api";
import { CLEAN_MEAL_KEYWORDS, FREE_MEAL_OVERRIDE_KEYWORDS } from "./mealKeywords";

export type MealCardState = {
  isFree: boolean;
  isSelected: boolean;
  label: "분류 선택 전" | "클린식" | "자유식";
};

export function getMealCardState(type: MealType | null): MealCardState {
  if (type === null) return { isFree: false, isSelected: false, label: "분류 선택 전" };
  return type === "free"
    ? { isFree: true, isSelected: true, label: "자유식" }
    : { isFree: false, isSelected: true, label: "클린식" };
}

/** Select a meal type once, or clear it by selecting the same type again. */
export function toggleMealType(currentType: MealType | null, nextType: MealType): MealType | null {
  return currentType === nextType ? null : nextType;
}

/** Food and type saved when a meal card is left empty. */
export const EMPTY_FOOD = "공복";
export const EMPTY_FOOD_TYPE: MealType = "clean";

export type MealSaveInput = { food: string; type: MealType };

/**
 * Offer a conservative keyword-based suggestion only. A food is clean only
 * when it matches the explicit allowlist; every other food is suggested as
 * free. The user must still choose before saving.
 */
export function getMealTypeSuggestion(foodInput: string): MealType | null {
  const food = foodInput.trim();
  if (!food) return null;
  if (food === EMPTY_FOOD) return EMPTY_FOOD_TYPE;
  if (FREE_MEAL_OVERRIDE_KEYWORDS.some((keyword) => food.includes(keyword))) return "free";
  return CLEAN_MEAL_KEYWORDS.some((keyword) => food.includes(keyword)) ? "clean" : "free";
}

/** Fill an empty meal card in as a clean 공복 record instead of blocking the save. */
export function getMealSaveInput(
  foodInput: string,
  type: MealType | null,
  defaultType: MealType,
): MealSaveInput {
  const food = foodInput.trim();
  if (!food) return { food: EMPTY_FOOD, type: EMPTY_FOOD_TYPE };
  return { food, type: type ?? defaultType };
}
