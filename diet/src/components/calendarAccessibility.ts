export type CalendarDateAccessibilityRecord = {
  status: "clean" | "free" | null;
  weight: number | null;
};

export function buildCalendarDateLabel(
  date: string,
  isToday: boolean,
  record?: CalendarDateAccessibilityRecord,
): string {
  const details = [`${date} 날짜 선택`];
  if (isToday) details.push("오늘");
  if (record?.status === "clean") details.push("클린식");
  if (record?.status === "free") details.push("자유식 포함");
  if (record?.weight !== null && record?.weight !== undefined) {
    details.push(`체중 ${record.weight}kg`);
  }
  return details.join(", ");
}
