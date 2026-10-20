import type { Meal, MealType } from "../types/api";

export type ImportMeal = { meal: Meal; food: string; type: MealType };
export type ImportDay = { date: string; weight: number | null; meals: ImportMeal[] };
export type ImportIssue = { row: number; message: string };
export type ImportPreview = { rows: ImportDay[]; issues: ImportIssue[]; skipped: number };

const columns: Array<{ meal: Meal; food: number; type: number; label: string }> = [
  { meal: "breakfast", food: 1, type: 2, label: "9시 - 11시" },
  { meal: "lunch", food: 3, type: 4, label: "11시 - 3시" },
  { meal: "snack", food: 6, type: 7, label: "3시 - 6시" },
  { meal: "dinner", food: 8, type: 9, label: "6시 - 8시" },
];

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function dateValue(raw: string): string | null {
  const match = /^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/.exec(raw.trim());
  if (!match) return null;
  const result = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  const date = new Date(`${result}T12:00:00`);
  return date.getFullYear() === Number(match[1]) &&
    date.getMonth() + 1 === Number(match[2]) &&
    date.getDate() === Number(match[3])
    ? result
    : null;
}

function mealType(raw: string): MealType | "skip" | null {
  const value = raw.trim().toLowerCase();
  if (value === "결식") return "skip";
  if (["클린식", "클린", "clean"].includes(value)) return "clean";
  if (["자유식", "프리", "free"].includes(value)) return "free";
  return null;
}

export function parseDietCsv(text: string, today: string): ImportPreview {
  const source = parseCsv(text);
  const issues: ImportIssue[] = [];
  const rows: ImportDay[] = [];
  let skipped = 0;
  if (
    source.length < 3 ||
    source[1]?.[1]?.trim() !== "9시 - 11시" ||
    source[1]?.[11]?.trim() !== "체중"
  ) {
    return {
      rows,
      skipped,
      issues: [{ row: 1, message: "지원하는 다이어트일지 CSV 형식이 아닙니다." }],
    };
  }
  source.slice(2).forEach((record, index) => {
    const sourceRow = index + 3;
    if (record.every((value) => !value.trim())) return;
    const date = dateValue(record[0] ?? "");
    if (!date) {
      skipped += 1;
      return;
    }
    if (date > today) {
      issues.push({ row: sourceRow, message: `${date}: 미래 날짜는 가져올 수 없습니다.` });
      return;
    }
    const weightText = (record[11] ?? "").trim();
    const weight = weightText && weightText !== "-" ? Number(weightText) : null;
    if (weight !== null && (!Number.isFinite(weight) || weight <= 0 || weight > 9999.99)) {
      issues.push({ row: sourceRow, message: "체중 값이 올바르지 않습니다." });
      return;
    }
    const meals: ImportMeal[] = [];
    for (const column of columns) {
      const food = (record[column.food] ?? "").trim();
      const rawType = (record[column.type] ?? "").trim();
      const type = mealType(rawType);
      if (!food && !rawType) continue;
      if ((!food || food === "-") && type === "skip") continue;
      if (!food || food === "-") {
        issues.push({
          row: sourceRow,
          message: `${column.label} 음식과 분류가 일치하지 않습니다.`,
        });
        continue;
      }
      if (food.length > 500) {
        issues.push({ row: sourceRow, message: `${column.label} 음식은 500자 이하여야 합니다.` });
        continue;
      }
      if (type !== "clean" && type !== "free") {
        issues.push({
          row: sourceRow,
          message: `${column.label} 분류는 클린식/자유식/결식이어야 합니다.`,
        });
        continue;
      }
      meals.push({ meal: column.meal, food, type });
    }
    if (!issues.some((issue) => issue.row === sourceRow) && (weight !== null || meals.length))
      rows.push({ date, weight, meals });
  });
  return { rows, issues, skipped };
}
