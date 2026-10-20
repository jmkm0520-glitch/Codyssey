import { isLocalDate } from "../services/date.ts";

export function buildRecordPageHref(date: string): string {
  if (!isLocalDate(date)) throw new Error("올바른 날짜가 필요합니다.");
  return `/?date=${date}`;
}

export function getCalendarMonthForDate(date: string): Date {
  if (!isLocalDate(date)) throw new Error("올바른 날짜가 필요합니다.");
  const [year, month] = date.split("-").map(Number);
  return new Date(year, month - 1, 1);
}
