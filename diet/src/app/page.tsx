"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import Image from "next/image";
import { MealCard } from "../components/MealCard";
import { TabNav } from "../components/TabNav";
import { SiteMenuButton } from "../components/AuthGate";
import {
  formatLocalDate,
  isFutureLocalDate,
  isLocalDate,
  readDateFromUrl,
  writeDateToUrl,
} from "../services/date";
import {
  openTargetWeightMenu,
  readTargetWeight,
  TARGET_WEIGHT_UPDATED_EVENT,
} from "../services/targetWeight";
import { ApiClientError, fetchApi } from "../services/apiClient";
import type { DayRecord, Meal, MealRecord, MealType } from "../types/api";
import {
  clearLocalMeal,
  clearLocalMeals,
  readLocalDay,
  saveLocalMeal,
  saveLocalWeight,
} from "../services/localDayStorage";

function isApiNotFound(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 404;
}

const meals: { meal: Meal; title: string; defaultFood: string; defaultType: MealType }[] = [
  { meal: "breakfast", title: "아침", defaultFood: "", defaultType: "clean" },
  { meal: "lunch", title: "점심", defaultFood: "", defaultType: "clean" },
  { meal: "dinner", title: "저녁", defaultFood: "", defaultType: "clean" },
  { meal: "snack", title: "간식", defaultFood: "", defaultType: "clean" },
];

export default function Home() {
  const todayDate = formatLocalDate();
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate());
  const [dayRecord, setDayRecord] = useState<DayRecord | null>(null);
  const [isLoadingDay, setIsLoadingDay] = useState(true);
  const [weightInput, setWeightInput] = useState("");
  const [weightError, setWeightError] = useState<string | null>(null);
  const [weightSaveError, setWeightSaveError] = useState<string | null>(null);
  const [weightStatus, setWeightStatus] = useState("");
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [isWeightEditorOpen, setIsWeightEditorOpen] = useState(false);
  const [configuredTargetWeight, setConfiguredTargetWeight] = useState<number | null>(null);
  const [isResettingMeals, setIsResettingMeals] = useState(false);
  const [mealResetVersion, setMealResetVersion] = useState(0);
  const [mealResetError, setMealResetError] = useState<string | null>(null);
  const [dayLoadError, setDayLoadError] = useState<string | null>(null);
  const [mealResetStatus, setMealResetStatus] = useState("");
  const weightInputRef = useRef<HTMLInputElement>(null);

  const selectDate = useCallback(
    (nextDate: string) => {
      if (!isLocalDate(nextDate)) return;
      const safeDate = isFutureLocalDate(nextDate) ? todayDate : nextDate;
      setSelectedDate(safeDate);
      writeDateToUrl(safeDate);
      setDayRecord(null);
      setIsLoadingDay(true);
      setIsWeightEditorOpen(false);
      setWeightSaveError(null);
      setWeightStatus("");
      setMealResetError(null);
      setMealResetStatus("");
    },
    [todayDate],
  );

  useEffect(() => {
    const urlDate = readDateFromUrl("");
    if (!urlDate) return;
    const timeoutId = window.setTimeout(() => selectDate(urlDate), 0);
    return () => window.clearTimeout(timeoutId);
  }, [selectDate]);

  useEffect(() => {
    const syncTargetWeight = () => setConfiguredTargetWeight(readTargetWeight());
    syncTargetWeight();
    window.addEventListener(TARGET_WEIGHT_UPDATED_EVENT, syncTargetWeight);
    return () => window.removeEventListener(TARGET_WEIGHT_UPDATED_EVENT, syncTargetWeight);
  }, []);

  useEffect(() => {
    if (!isWeightEditorOpen) return;
    const timeoutId = window.setTimeout(() => weightInputRef.current?.focus(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [isWeightEditorOpen]);

  function updateWeightInput(value: string) {
    setWeightInput(value);
    setWeightSaveError(null);
    setWeightStatus("");
    if (!value.trim()) {
      setWeightError("체중을 입력해 주세요.");
      return;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      setWeightError("숫자를 입력해 주세요.");
      return;
    }
    setWeightError(parsed > 0 ? null : "0보다 큰 숫자를 입력해 주세요.");
  }

  async function saveWeight() {
    if (weightError || !weightInput.trim()) {
      updateWeightInput(weightInput);
      return;
    }
    setIsSavingWeight(true);
    setWeightSaveError(null);
    setWeightStatus("");
    try {
      await fetchApi(`/api/weight`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, weight: Number(weightInput) }),
      });
      setDayRecord((current) => ({
        ...(current ?? readLocalDay(selectedDate)),
        date: selectedDate,
        weight: { date: selectedDate, weight: Number(weightInput) },
      }));
      setWeightStatus("체중이 저장되었습니다.");
      setIsWeightEditorOpen(false);
    } catch (error) {
      if (isApiNotFound(error)) {
        const record = saveLocalWeight(selectedDate, Number(weightInput));
        setDayRecord((current) => ({
          ...(current ?? readLocalDay(selectedDate)),
          date: selectedDate,
          weight: record,
        }));
        setWeightStatus("체중이 저장되었습니다.");
        setIsWeightEditorOpen(false);
      } else {
        setWeightSaveError("체중 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setIsSavingWeight(false);
    }
  }

  function openWeightEditor() {
    setWeightInput(currentWeight === null ? "" : String(currentWeight));
    setWeightError(null);
    setWeightSaveError(null);
    setWeightStatus("");
    setIsWeightEditorOpen(true);
  }

  function cancelWeightEditor() {
    setWeightInput(currentWeight === null ? "" : String(currentWeight));
    setWeightError(null);
    setWeightSaveError(null);
    setIsWeightEditorOpen(false);
  }

  async function saveMeal(meal: Meal, food: string, type: MealType) {
    let record: MealRecord;
    try {
      record = await fetchApi<MealRecord>("/api/meal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, meal, food, type }),
      });
    } catch (error) {
      if (!isApiNotFound(error)) throw error;
      record = saveLocalMeal(selectedDate, meal, food, type);
    }

    setDayRecord((current) => ({
      ...(current ?? readLocalDay(selectedDate)),
      date: selectedDate,
      meals: { ...(current?.meals ?? readLocalDay(selectedDate).meals), [meal]: record },
    }));
  }

  async function deleteMeal(meal: Meal) {
    try {
      await fetchApi<{ date: string; deleted: number }>(
        `/api/meal?date=${selectedDate}&meal=${meal}`,
        { method: "DELETE" },
      );
    } catch (error) {
      if (!isApiNotFound(error)) throw error;
    }

    const clearedLocalDay = clearLocalMeal(selectedDate, meal);
    setDayRecord((current) => ({
      ...(current ?? clearedLocalDay),
      date: selectedDate,
      meals: { ...(current?.meals ?? clearedLocalDay.meals), [meal]: null },
    }));
  }

  async function resetMeals() {
    const confirmed = window.confirm(
      `${dateTitle}의 아침, 점심, 저녁, 간식 기록을 모두 초기화할까요?`,
    );
    if (!confirmed) return;

    setIsResettingMeals(true);
    setMealResetError(null);
    setMealResetStatus("");
    try {
      await fetchApi<{ date: string; deleted: number }>(`/api/meal?date=${selectedDate}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (!isApiNotFound(error)) {
        setMealResetError("식단 기록을 초기화하지 못했어요.");
        setIsResettingMeals(false);
        return;
      }
    }

    const clearedLocalDay = clearLocalMeals(selectedDate);
    setDayRecord((current) => ({
      ...(current ?? clearedLocalDay),
      date: selectedDate,
      meals: clearedLocalDay.meals,
    }));
    setMealResetVersion((current) => current + 1);
    setMealResetStatus("식단 기록을 초기화했습니다.");
    setIsResettingMeals(false);
  }

  function shiftDate(days: number) {
    const current = new Date(`${selectedDate}T12:00:00`);
    current.setDate(current.getDate() + days);
    const nextDate = formatLocalDate(current);
    selectDate(isFutureLocalDate(nextDate) ? todayDate : nextDate);
  }

  function shiftMonth(months: number) {
    const current = new Date(`${selectedDate}T12:00:00`);
    const target = new Date(current.getFullYear(), current.getMonth() + months, 1);
    const lastDayOfTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(current.getDate(), lastDayOfTargetMonth));
    const nextDate = formatLocalDate(target);
    selectDate(isFutureLocalDate(nextDate) ? todayDate : nextDate);
  }

  const dateTitle = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(`${selectedDate}T12:00:00`));
  const formatCompactDate = (value: string) => {
    const [, month, day] = value.split("-");
    return `${Number(month)}.${Number(day)}`;
  };
  const adjacentDate = (days: number) => {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() + days);
    return formatLocalDate(date);
  };
  const previousDate = adjacentDate(-1);
  const nextDate = adjacentDate(1);
  const isViewingToday = selectedDate === todayDate;
  const hasSavedMeals = Boolean(
    dayRecord && Object.values(dayRecord.meals).some((meal) => meal !== null),
  );
  const savedMeals = Object.values(dayRecord?.meals ?? {}).filter(
    (meal): meal is MealRecord => meal !== null,
  );
  const cleanMealCount = savedMeals.filter((meal) => meal.type === "clean").length;
  const freeMealCount = savedMeals.filter((meal) => meal.type === "free").length;
  const currentWeight = dayRecord?.weight?.weight ?? null;
  const remainingWeight =
    currentWeight !== null && configuredTargetWeight !== null
      ? Math.round((Math.max(currentWeight - configuredTargetWeight, 0) + Number.EPSILON) * 10) / 10
      : null;

  useEffect(() => {
    let cancelled = false;
    fetchApi<DayRecord>(`/api/day?date=${selectedDate}`)
      .then((record) => {
        if (!cancelled) {
          setDayLoadError(null);
          setDayRecord(record);
          setWeightInput(record.weight ? String(record.weight.weight) : "");
          setWeightError(null);
          setWeightSaveError(null);
          setWeightStatus("");
          setIsWeightEditorOpen(false);
          setIsLoadingDay(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const localDay = isApiNotFound(error) ? readLocalDay(selectedDate) : null;
          setDayLoadError(localDay ? null : "식단 기록을 불러오지 못했습니다.");
          setDayRecord(localDay);
          setWeightInput(localDay?.weight ? String(localDay.weight.weight) : "");
          setWeightError(null);
          setWeightSaveError(null);
          setWeightStatus("");
          setIsWeightEditorOpen(false);
          setIsLoadingDay(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  return (
    <main className={`${styles.main} ${styles.referenceDashboard}`}>
      <header className={styles.siteHeader}>
        <Link className={styles.brand} href="/" aria-label="오늘도 가볍게 홈">
          <Image
            className={styles.brandMark}
            src="/broccoli-logo.png"
            alt=""
            width={32}
            height={32}
            priority
          />
          <span>오늘도 가볍게</span>
        </Link>
        <div className={styles.headerActions}>
          <TabNav />
          <SiteMenuButton />
        </div>
      </header>
      <div className={styles.dashboard}>
        <section className={styles.header}>
          <p>오늘의 기록</p>
          <h1 className={styles.srOnly}>{dateTitle}</h1>
          <div className={styles.dateNavigationRow} aria-label="날짜 이동">
            <button
              className={styles.dateNeighbor}
              type="button"
              aria-label={`${formatCompactDate(previousDate)} 기록 보기`}
              onClick={() => shiftDate(-1)}
            >
              {formatCompactDate(previousDate)}
            </button>
            <label className={`${styles.datePicker} ${styles.currentDate}`}>
              <span>{formatCompactDate(selectedDate)}</span>
              {isViewingToday ? <strong>오늘</strong> : null}
              <span className={styles.srOnly}>날짜 선택</span>
              <input
                aria-label="기록 날짜 선택"
                max={todayDate}
                type="date"
                value={selectedDate}
                onChange={(event) => selectDate(event.target.value)}
                onClick={(event) => {
                  const input = event.currentTarget;
                  if (typeof input.showPicker !== "function") return;
                  try {
                    input.showPicker();
                  } catch {
                    // 브라우저가 달력 열기를 거부하면 포커스만 준 기본 동작을 남긴다.
                  }
                }}
              />
            </label>
            <button
              className={styles.dateNeighbor}
              type="button"
              aria-label={`${formatCompactDate(nextDate)} 기록 보기`}
              disabled={isViewingToday}
              onClick={() => shiftDate(1)}
            >
              {formatCompactDate(nextDate)}
            </button>
          </div>
        </section>
        <section
          className={styles.weightCard}
          aria-busy={isLoadingDay || isSavingWeight}
          aria-labelledby="weight-title"
        >
          <div>
            <p className={styles.eyebrow}>오늘의 체중</p>
            <h2 id="weight-title">
              <span className={styles.desktopWeightTitle}>오늘의 몸무게를 저장해 보세요</span>
              <span className={styles.mobileWeightTitle}>오늘의 몸무게</span>
            </h2>
            <p className={styles.cardHint}>목표 체중은 메뉴에서 설정할 수 있어요.</p>
          </div>
          <div className={styles.weightControl}>
            <button
              aria-expanded={isWeightEditorOpen}
              aria-haspopup="dialog"
              aria-label={`오늘의 체중 ${currentWeight === null ? "입력" : `${currentWeight}kg 수정`}`}
              className={`${styles.weightDisplay}${currentWeight === null ? ` ${styles.weightRecordButton}` : ""}`}
              type="button"
              onClick={openWeightEditor}
            >
              {currentWeight === null ? "기록하기" : <>{currentWeight}{" "}<span>kg</span></>}
            </button>
            {isWeightEditorOpen ? (
              <form
                aria-labelledby="weight-editor-title"
                className={styles.weightEditorToast}
                onKeyDown={(event) => {
                  if (event.key === "Escape") cancelWeightEditor();
                }}
                onSubmit={(event) => {
                  event.preventDefault();
                  void saveWeight();
                }}
                role="dialog"
              >
                <p id="weight-editor-title">오늘의 몸무게</p>
                <label htmlFor="today-weight-input">몸무게 (kg)</label>
                <div className={styles.weightEditorInputRow}>
                  <input
                    aria-describedby={weightError || weightSaveError ? "weight-error" : undefined}
                    aria-invalid={Boolean(weightError || weightSaveError)}
                    id="today-weight-input"
                    inputMode="decimal"
                    min="0.01"
                    placeholder="60.5"
                    ref={weightInputRef}
                    step="0.01"
                    type="text"
                    value={weightInput}
                    onChange={(event) => updateWeightInput(event.target.value)}
                  />
                  <span>kg</span>
                </div>
                {weightError || weightSaveError ? (
                  <p className={styles.inputError} id="weight-error" role="alert">
                    {weightError ?? weightSaveError}
                  </p>
                ) : null}
                <div className={styles.weightEditorActions}>
                  <button type="button" disabled={isSavingWeight} onClick={cancelWeightEditor}>
                    취소
                  </button>
                  <button type="submit" disabled={isSavingWeight}>
                    {isSavingWeight ? "저장 중..." : "확인"}
                  </button>
                </div>
              </form>
            ) : null}
            <p className={styles.srOnly} id="weight-status" role="status" aria-live="polite">
              {weightStatus}
            </p>
          </div>
          <dl className={styles.weightProgress}>
            <div>
              <dt>목표 체중</dt>
              <dd>
                <button
                  aria-label="목표 몸무게 설정 열기"
                  className={styles.targetWeightQuickLink}
                  type="button"
                  onClick={openTargetWeightMenu}
                >
                  {configuredTargetWeight === null ? "메뉴에서 설정" : `${configuredTargetWeight}kg`}
                </button>
              </dd>
            </div>
            <div>
              <dt>남은 감량</dt>
              <dd>
                {currentWeight === null
                  ? "-"
                  : remainingWeight === null
                    ? "목표 체중을 설정해 주세요"
                    : `${remainingWeight}kg`}
              </dd>
            </div>
          </dl>
        </section>
        {dayLoadError ? (
          <p className={styles.dayLoadError} role="alert">
            {dayLoadError}
          </p>
        ) : null}
        <section
          className={styles.mealGrid}
          aria-busy={isLoadingDay || isResettingMeals}
          aria-label="오늘의 식단"
        >
          {meals.map((meal) => (
            <MealCard
              key={`${selectedDate}-${meal.meal}-${isLoadingDay}-${mealResetVersion}`}
              {...meal}
              isLoading={isLoadingDay}
              onDelete={deleteMeal}
              onSave={saveMeal}
              record={dayRecord?.meals[meal.meal] ?? null}
            />
          ))}
        </section>
        <section className={styles.summaryStrip} aria-label="오늘의 식단 요약">
          <div className={styles.summaryMetric}>
            <span aria-hidden="true" className={styles.summaryLeaf} />
            <p>식단 기록</p>
            <strong>
              {savedMeals.length}
              <small>/4</small>
            </strong>
          </div>
          <div className={styles.summaryMetric}>
            <span aria-hidden="true" className={styles.summaryGrain} />
            <p>클린식</p>
            <strong>
              {cleanMealCount}
              <small>회</small>
            </strong>
          </div>
          <div className={styles.summaryMetric}>
            <span aria-hidden="true" className={styles.summaryDrop} />
            <p>자유식</p>
            <strong>
              {freeMealCount}
              <small>회</small>
            </strong>
          </div>
        </section>
        {!isLoadingDay && !dayLoadError && !hasSavedMeals ? (
          <p className={styles.mealEmptyState}>
            {isViewingToday
              ? "아직 오늘 기록한 식단이 없어요. 첫 식단을 기록해보세요."
              : "이 날짜에는 기록된 식단이 없습니다."}
          </p>
        ) : null}
        <div className={styles.mealResetRow}>
          {mealResetError ? (
            <p aria-live="polite" className={styles.mealResetError}>
              {mealResetError}
            </p>
          ) : null}
          <button
            aria-label={`${dateTitle} 식단 초기화`}
            type="button"
            disabled={isLoadingDay || isResettingMeals || !hasSavedMeals}
            onClick={resetMeals}
          >
            {isResettingMeals ? "초기화 중..." : "식단 초기화"}
          </button>
          {mealResetStatus ? (
            <p className={styles.srOnly} role="status" aria-live="polite">
              {mealResetStatus}
            </p>
          ) : null}
        </div>
        {!isViewingToday ? (
          <div className={styles.todayFooter}>
            <button
              aria-label="오늘 날짜로 돌아가기"
              type="button"
              onClick={() => selectDate(todayDate)}
            >
              오늘로 돌아가기 <span aria-hidden="true">›</span>
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
