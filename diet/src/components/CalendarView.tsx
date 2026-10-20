"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import styles from "../app/page.module.css";
import { buildCalendarGrid } from "./calendarGrid";
import {
  clearDateFromUrl,
  formatLocalDate,
  readDateFromUrl,
  writeDateToUrl,
} from "../services/date";
import { clearLocalDay, readLocalCalendarRecords, readLocalDay } from "../services/localDayStorage";
import { ApiClientError, fetchApi } from "../services/apiClient";
import type { CalendarMonth, DayRecord } from "../types/api";
import { getCalendarDetailState } from "./calendarDetailState";
import { buildRecordPageHref, getCalendarMonthForDate } from "./calendarNavigation";
import {
  closeDetailFromButton,
  closeDetailFromKey,
  closeDetailFromPointer,
} from "./calendarDetailClose";
import { buildCalendarDateLabel } from "./calendarAccessibility";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const mealOrder = ["breakfast", "lunch", "dinner", "snack"] as const;
const mealLabels = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

type CalendarRecords = Record<string, { status: "clean" | "free" | null; weight: number | null }>;

function recordsFromMonth(month: CalendarMonth): CalendarRecords {
  return Object.fromEntries(
    month.days
      .filter((day) => day.status !== null || day.weight !== null)
      .map((day) => [day.date, { status: day.status, weight: day.weight }]),
  );
}

export function CalendarView() {
  const now = new Date();
  const todayDate = formatLocalDate(now);
  const router = useRouter();
  const [viewedMonth, setViewedMonth] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const [loadedMonth, setLoadedMonth] = useState<{ key: string; records: CalendarRecords }>({
    key: "",
    records: {},
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayRecord | null>(null);
  const [isSelectedDayLoading, setIsSelectedDayLoading] = useState(false);
  const [isResettingDay, setIsResettingDay] = useState(false);
  const [dayResetError, setDayResetError] = useState<string | null>(null);
  const selectedDayRequest = useRef(0);
  const detailPanelRef = useRef<HTMLElement>(null);
  const selectedDateButtonRef = useRef<HTMLButtonElement>(null);
  const monthTitle = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(viewedMonth);
  const calendarCells = buildCalendarGrid(viewedMonth.getFullYear(), viewedMonth.getMonth());
  const isCurrentMonth =
    viewedMonth.getFullYear() === now.getFullYear() && viewedMonth.getMonth() === now.getMonth();

  const monthKey = `${viewedMonth.getFullYear()}-${viewedMonth.getMonth()}`;
  const isCalendarLoading = loadedMonth.key !== monthKey;
  const calendarRecords = isCalendarLoading ? {} : loadedMonth.records;
  const selectedDateTitle = selectedDate
    ? new Intl.DateTimeFormat("ko-KR", {
        month: "long",
        day: "numeric",
        weekday: "long",
      }).format(new Date(`${selectedDate}T12:00:00`))
    : null;
  const selectedDetailState = selectedDay ? getCalendarDetailState(selectedDay) : null;
  const selectedStatus = selectedDetailState?.status ?? null;
  const hasSelectedRecord = selectedDetailState?.hasAnyRecord ?? false;

  /**
   * Closing the panel only hides it. The date stays selected — its cell keeps
   * the highlight and the URL keeps `?date=`, so switching to 오늘 기록 opens
   * the same day instead of jumping back to today.
   */
  const closeDetailPanel = useCallback(() => {
    const selectedDateButton = selectedDateButtonRef.current;
    setIsDetailOpen(false);
    setIsResettingDay(false);
    setDayResetError(null);
    window.setTimeout(() => selectedDateButton?.focus(), 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const year = viewedMonth.getFullYear();
    const month = viewedMonth.getMonth() + 1;
    const key = `${year}-${viewedMonth.getMonth()}`;

    fetchApi<CalendarMonth>(`/api/calendar?year=${year}&month=${month}`)
      .then((calendarMonth) => {
        if (!cancelled) setLoadedMonth({ key, records: recordsFromMonth(calendarMonth) });
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedMonth({ key, records: readLocalCalendarRecords(year, viewedMonth.getMonth()) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [viewedMonth]);

  useEffect(() => {
    if (!isDetailOpen) return;

    const previousOverflow = document.body.style.overflow;
    const focusTimeoutId = window.setTimeout(() => detailPanelRef.current?.focus(), 0);
    document.body.style.overflow = "hidden";

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      closeDetailFromPointer(closeDetailPanel, {
        clickedDateCell:
          target instanceof Element && Boolean(target.closest("[data-calendar-date]")),
        clickedInsidePanel:
          target instanceof Node && Boolean(detailPanelRef.current?.contains(target)),
      });
    }

    function handleKeyDown(event: KeyboardEvent) {
      closeDetailFromKey(closeDetailPanel, event.key);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimeoutId);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDetailOpen, closeDetailPanel]);

  function moveMonth(amount: number) {
    setViewedMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  function returnToCurrentMonth() {
    setViewedMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  function openSelectedDateRecord() {
    if (selectedDate) router.push(buildRecordPageHref(selectedDate));
  }

  async function resetSelectedDate() {
    if (!selectedDate || !selectedDay || !hasSelectedRecord) return;
    const confirmed = window.confirm(
      `${selectedDateTitle}의 체중과 식단 기록을 모두 초기화할까요?`,
    );
    if (!confirmed) return;

    setIsResettingDay(true);
    setDayResetError(null);
    try {
      await fetchApi<{ date: string; deletedMeals: number; deletedWeights: number }>(
        `/api/day?date=${selectedDate}`,
        {
          method: "DELETE",
        },
      );
    } catch (error) {
      if (!(error instanceof ApiClientError && error.status === 404)) {
        setDayResetError("이 날짜의 기록을 초기화하지 못했어요.");
        setIsResettingDay(false);
        return;
      }
    }

    const clearedDay = clearLocalDay(selectedDate);
    setSelectedDay(clearedDay);
    setLoadedMonth((current) => {
      const records = { ...current.records };
      delete records[selectedDate];
      return { ...current, records };
    });
    setIsResettingDay(false);
  }

  const selectDate = useCallback(
    async (date: string, trigger?: HTMLButtonElement) => {
      if (date > todayDate) {
        clearDateFromUrl();
        return;
      }
      const requestId = selectedDayRequest.current + 1;
      selectedDayRequest.current = requestId;
      if (trigger) selectedDateButtonRef.current = trigger;
      setSelectedDate(date);
      setIsDetailOpen(true);
      writeDateToUrl(date);
      setSelectedDay(null);
      setIsSelectedDayLoading(true);
      setIsResettingDay(false);
      setDayResetError(null);

      try {
        const day = await fetchApi<DayRecord>(`/api/day?date=${date}`);
        if (selectedDayRequest.current === requestId) setSelectedDay(day);
      } catch {
        if (selectedDayRequest.current === requestId) setSelectedDay(readLocalDay(date));
      } finally {
        if (selectedDayRequest.current === requestId) setIsSelectedDayLoading(false);
      }
    },
    [todayDate],
  );

  useEffect(() => {
    const urlDate = readDateFromUrl("");
    if (!urlDate) return;
    const timeoutId = window.setTimeout(() => {
      setViewedMonth(getCalendarMonthForDate(urlDate));
      void selectDate(urlDate);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [selectDate]);

  return (
    <section
      className={styles.calendarSection}
      id="calendar"
      aria-busy={isCalendarLoading}
      aria-labelledby="calendar-title"
    >
      <div className={styles.calendarControls}>
        <button type="button" aria-label="이전 달" onClick={() => moveMonth(-1)}>
          ‹
        </button>
        <h2 id="calendar-title">{monthTitle}</h2>
        <button type="button" aria-label="다음 달" onClick={() => moveMonth(1)}>
          ›
        </button>
      </div>
      <div className={styles.calendarLegend} aria-label="식단 상태 설명">
        <span>
          <Image src="/clean.png" alt="클린식 날짜" width={24} height={24} />
          클린식
        </span>
        <span>
          <Image src="/free.png" alt="자유식 포함 날짜" width={24} height={24} />
          자유식 포함
        </span>
      </div>
      <div className={styles.weekdayHeader} role="row" aria-label="요일">
        {weekdays.map((weekday, index) => (
          <span
            className={index === 0 ? styles.sunday : index === 6 ? styles.saturday : ""}
            key={weekday}
            role="columnheader"
          >
            {weekday}
          </span>
        ))}
      </div>
      <div className={styles.calendarGrid} role="grid" aria-label={`${monthTitle} 날짜`}>
        {calendarCells.map((day, index) => {
          if (!day) {
            return (
              <div
                className={styles.calendarEmptyCell}
                key={`empty-${index}`}
                role="presentation"
              />
            );
          }

          const date = formatLocalDate(
            new Date(viewedMonth.getFullYear(), viewedMonth.getMonth(), day),
          );
          const record = calendarRecords[date];
          const isToday = isCurrentMonth && day === now.getDate();
          const isFutureDate = date > todayDate;

          return (
            <button
              aria-current={isToday ? "date" : undefined}
              aria-label={buildCalendarDateLabel(date, isToday, record)}
              aria-pressed={selectedDate === date}
              className={`${styles.calendarDateCell} ${isToday ? styles.calendarToday : ""}`}
              data-calendar-date={date}
              disabled={isFutureDate}
              key={date}
              onClick={(event) => selectDate(date, event.currentTarget)}
              type="button"
            >
              <span className={styles.calendarDateNumber}>{day}</span>
              {record ? (
                <div className={styles.calendarRecord}>
                  {record.status ? (
                    <Image
                      className={styles.calendarStatusIcon}
                      src={record.status === "clean" ? "/clean.png" : "/free.png"}
                      alt={record.status === "clean" ? "클린식 날짜" : "자유식 포함 날짜"}
                      width={34}
                      height={34}
                    />
                  ) : null}
                  {record.weight !== null ? (
                    <span className={styles.calendarWeight}>{record.weight}kg</span>
                  ) : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className={styles.calendarState}>
        {isCalendarLoading
          ? "기록을 불러오는 중입니다."
          : Object.keys(calendarRecords).length === 0
            ? "이번 달에 저장한 기록이 없습니다."
            : ""}
      </p>
      {isDetailOpen && selectedDate ? (
        <>
          <div aria-hidden="true" className={styles.calendarModalBackdrop} />
          <aside
            className={styles.calendarDetailPanel}
            aria-busy={isSelectedDayLoading || isResettingDay}
            aria-live="polite"
            aria-labelledby="detail-title"
            aria-modal="true"
            ref={detailPanelRef}
            role="dialog"
            tabIndex={-1}
          >
            <button
              aria-label="상세 패널 닫기"
              className={styles.calendarDetailClose}
              type="button"
              onClick={() => closeDetailFromButton(closeDetailPanel)}
            >
              ×
            </button>
            <p className={styles.calendarDetailEyebrow}>선택한 날짜</p>
            <h3 id="detail-title">{selectedDateTitle}</h3>
            {isSelectedDayLoading ? (
              <p className={styles.calendarDetailMessage}>기록을 불러오는 중입니다.</p>
            ) : selectedDay ? (
              <>
                <div className={styles.calendarDetailSummary}>
                  {selectedStatus ? (
                    <span className={styles.calendarDetailStatus}>
                      <Image
                        src={selectedStatus === "clean" ? "/clean.png" : "/free.png"}
                        alt={selectedStatus === "clean" ? "클린식 날짜" : "자유식 포함 날짜"}
                        width={42}
                        height={42}
                      />
                      {selectedStatus === "clean" ? "클린식" : "자유식 포함"}
                    </span>
                  ) : (
                    <span className={styles.calendarDetailEmpty}>식단 기록 없음</span>
                  )}
                  <span className={styles.calendarDetailWeight}>
                    {selectedDay.weight ? `${selectedDay.weight.weight}kg` : "체중 기록 없음"}
                  </span>
                </div>
                <section className={styles.calendarMealDetails} aria-labelledby="meal-detail-title">
                  <h4 id="meal-detail-title">식단 기록</h4>
                  <ul className={styles.calendarMealList}>
                    {mealOrder.map((meal) => {
                      const mealRecord = selectedDay.meals[meal];

                      return (
                        <li key={meal}>
                          <span>{mealLabels[meal]}</span>
                          {mealRecord ? (
                            <strong>
                              {mealRecord.food}
                              <em
                                className={
                                  mealRecord.type === "clean"
                                    ? styles.calendarMealClean
                                    : styles.calendarMealFree
                                }
                              >
                                {mealRecord.type === "clean" ? "클린식" : "자유식"}
                              </em>
                            </strong>
                          ) : (
                            <strong className={styles.calendarMealMissing}>기록 없음</strong>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
                {hasSelectedRecord ? (
                  <>
                    <div className={styles.calendarDetailActions}>
                      <button
                        aria-label={`${selectedDateTitle} 기록 초기화`}
                        className={styles.calendarResetButton}
                        disabled={isResettingDay}
                        type="button"
                        onClick={resetSelectedDate}
                      >
                        {isResettingDay ? "초기화 중..." : "초기화"}
                      </button>
                      <button
                        aria-label={`${selectedDateTitle} 기록 수정`}
                        className={styles.calendarEditButton}
                        type="button"
                        onClick={openSelectedDateRecord}
                      >
                        수정하기
                      </button>
                    </div>
                    {dayResetError ? (
                      <p aria-live="polite" className={styles.calendarResetError}>
                        {dayResetError}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <div className={styles.calendarEmptyAction}>
                    <p>아직 기록이 없어요</p>
                    <button
                      aria-label={`${selectedDateTitle} 기록 시작`}
                      className={styles.calendarEditButton}
                      type="button"
                      onClick={openSelectedDateRecord}
                    >
                      기록하기
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className={styles.calendarDetailMessage}>식단 기록을 불러오지 못했습니다.</p>
            )}
          </aside>
        </>
      ) : null}
      <p aria-live="polite" className={styles.srOnly}>
        {isSelectedDayLoading
          ? `${selectedDate} 기록을 불러오는 중입니다.`
          : selectedDay
            ? `${selectedDay.date} 기록을 불러왔습니다.`
            : ""}
      </p>
      {!isCurrentMonth ? (
        <div className={styles.todayFooter}>
          <button aria-label="이번 달로 돌아가기" type="button" onClick={returnToCurrentMonth}>
            오늘로 돌아가기 <span aria-hidden="true">›</span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
