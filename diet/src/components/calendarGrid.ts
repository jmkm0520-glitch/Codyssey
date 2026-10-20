export type CalendarGridCell = number | null;

export function buildCalendarGrid(year: number, monthIndex: number): CalendarGridCell[] {
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const lastDate = new Date(year, monthIndex + 1, 0).getDate();
  const cells: CalendarGridCell[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: lastDate }, (_, index) => index + 1),
  ];
  const trailingCells = (7 - (cells.length % 7)) % 7;
  return [...cells, ...Array<null>(trailingCells).fill(null)];
}
