import Image from "next/image";
import { useState } from "react";

import styles from "../app/page.module.css";
import type { Meal, MealRecord, MealType } from "../types/api";
import {
  getMealCardState,
  getMealSaveInput,
  getMealTypeSuggestion,
  toggleMealType,
} from "./mealCardState";

export type MealCardProps = {
  meal: Meal;
  title: string;
  defaultFood: string;
  defaultType: MealType;
  record: MealRecord | null;
  isLoading: boolean;
  onSave: (meal: Meal, food: string, type: MealType) => Promise<void>;
  onDelete: (meal: Meal) => Promise<void>;
};

export function MealCard({
  meal,
  title,
  defaultFood,
  defaultType,
  record,
  isLoading,
  onSave,
  onDelete,
}: MealCardProps) {
  const food = record?.food ?? defaultFood;
  const initialType = record?.type ?? (food.trim() ? defaultType : null);
  const [type, setType] = useState<MealType | null>(initialType);
  const [foodInput, setFoodInput] = useState(food);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(() => Boolean(record));
  const { isFree, isSelected, label } = getMealCardState(type);
  const suggestedType = getMealTypeSuggestion(foodInput);
  const editModeStatus = `${title} 식단 수정 모드입니다.`;

  async function saveMeal() {
    const { food: inputFood, type: selectedType } = getMealSaveInput(foodInput, type, defaultType);
    setIsSaving(true);
    setError(null);
    setSaveStatus("");
    try {
      await onSave(meal, inputFood, selectedType);
      setFoodInput(inputFood);
      setType(selectedType);
      setIsLocked(true);
      setSaveStatus(`${title} 식단이 저장되었습니다.`);
    } catch {
      setError("식단 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  /** Enter edit mode, whether the user pressed 수정 or just touched a field. */
  function startEditing() {
    if (!isLocked) return;
    setIsLocked(false);
    setError(null);
    setSaveStatus(editModeStatus);
  }

  function selectMealType(nextType: MealType) {
    setType((currentType) => toggleMealType(currentType, nextType));
    startEditing();
  }

  async function deleteMeal() {
    const confirmed = window.confirm(`${title} 식단 기록을 삭제할까요?`);
    if (!confirmed) return;

    setIsSaving(true);
    setError(null);
    setSaveStatus("");
    try {
      await onDelete(meal);
      setFoodInput("");
      setType(null);
      setIsLocked(false);
      setSaveStatus(`${title} 식단 기록을 삭제했습니다.`);
    } catch {
      setError("식단 기록을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  const mealTypeChoices = (
    <div className={styles.mealChoices} aria-label={`${title} 식단 종류 선택`}>
      <button
        aria-label={`${title} 클린식 선택`}
        aria-pressed={type === "clean"}
        className={type === "clean" ? styles.selectedChoice : ""}
        disabled={isSaving}
        type="button"
        onClick={() => selectMealType("clean")}
      >
        클린식
      </button>
      <button
        aria-label={`${title} 자유식 선택`}
        aria-pressed={isFree}
        className={isFree ? styles.selectedChoice : ""}
        disabled={isSaving}
        type="button"
        onClick={() => selectMealType("free")}
      >
        자유식
      </button>
    </div>
  );

  return (
    <article
      aria-label={`${title} (${meal}) 식단 기록`}
      aria-busy={isLoading || isSaving}
      className={`${styles.mealCard} ${isFree ? styles.freeMealCard : ""} ${!isSelected ? styles.unselectedMealCard : ""}`}
    >
      <div className={styles.mealHeader}>
        <p className={styles.mealName}>
          {title}
          {isSelected ? (
            <Image
              aria-hidden="true"
              className={styles.mealEmoji}
              src={isFree ? "/free.png" : "/clean.png"}
              alt=""
              width={35}
              height={35}
            />
          ) : null}
        </p>
        <span
          className={!isSelected ? styles.unselectedTag : isFree ? styles.freeTag : styles.cleanTag}
        >
          {label}
        </span>
      </div>
      <div className={styles.mealContent}>
        <label className={styles.srOnly} htmlFor={`food-${meal}`}>
          {title} 음식 내용
        </label>
        <input
          aria-describedby={error ? `food-error-${meal}` : undefined}
          aria-invalid={Boolean(error)}
          aria-label={`${title} 음식 내용`}
          className={styles.foodInput}
          disabled={isLoading || isSaving}
          id={`food-${meal}`}
          maxLength={500}
          name="food"
          placeholder="음식을 입력해 주세요"
          type="text"
          value={foodInput}
          onChange={(event) => {
            const nextFood = event.target.value;
            setFoodInput(nextFood);
            if (!nextFood.trim()) setType(null);
            if (nextFood.trim() && type === null) setType(defaultType);
            setError(null);
            setSaveStatus(isLocked ? editModeStatus : "");
            setIsLocked(false);
          }}
        />
        <div className={styles.mealActions}>
          {suggestedType ? (
            <section className={styles.aiMealSuggestion} aria-live="polite" aria-label={`${title} 키워드 기반 기록 보조`}>
              <p><strong>키워드 기반 제안</strong>{suggestedType === "clean" ? "클린식" : "자유식"}</p>
              <span>아래에서 직접 선택해 확정해 주세요.</span>
              {mealTypeChoices}
            </section>
          ) : mealTypeChoices}
          {isLocked ? (
            <div className={styles.savedMealActions}>
              <button
                aria-label={`${title} 식단 수정`}
                className={`${styles.mealSaveButton} ${styles.mealSaveButtonEdit}`}
                disabled={isSaving}
                type="button"
                onClick={startEditing}
              >
                수정
              </button>
              <button
                aria-label={`${title} 식단 삭제`}
                className={styles.mealDeleteButton}
                disabled={isSaving}
                type="button"
                onClick={deleteMeal}
              >
                삭제
              </button>
            </div>
          ) : (
            <button
              aria-label={`${title} 식단 저장`}
              className={styles.mealSaveButton}
              disabled={isSaving}
              type="button"
              onClick={saveMeal}
            >
              {isSaving ? "저장 중..." : "저장"}
            </button>
          )}
        </div>
        {error && (
          <p className={styles.mealInputError} id={`food-error-${meal}`} role="alert">
            {error}
          </p>
        )}
        {saveStatus ? (
          <p className={styles.srOnly} role="status" aria-live="polite">
            {saveStatus}
          </p>
        ) : null}
      </div>
    </article>
  );
}
