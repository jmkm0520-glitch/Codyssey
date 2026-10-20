export const TARGET_WEIGHT_STORAGE_KEY = "diet-target-weight";
export const TARGET_WEIGHT_UPDATED_EVENT = "diet:target-weight-updated";
export const OPEN_TARGET_WEIGHT_MENU_EVENT = "diet:open-target-weight-menu";

export function readTargetWeight(): number | null {
  if (typeof window === "undefined") return null;

  const savedValue = window.localStorage.getItem(TARGET_WEIGHT_STORAGE_KEY);
  const parsedValue = Number(savedValue);

  if (!savedValue || !Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

export function saveTargetWeight(value: number) {
  window.localStorage.setItem(TARGET_WEIGHT_STORAGE_KEY, String(value));
  window.dispatchEvent(new CustomEvent(TARGET_WEIGHT_UPDATED_EVENT));
}

export function openTargetWeightMenu() {
  window.dispatchEvent(new CustomEvent(OPEN_TARGET_WEIGHT_MENU_EVENT));
}
