import type { StatsDay } from "../types/api";

/**
 * Chart geometry lives here rather than inside the component so the shapes can
 * be checked without rendering, the same way the meal card and calendar rules
 * are tested.
 */

/** Split a ring into the clean arc and the remaining gap for stroke-dasharray. */
export function donutDash(cleanRatio: number, circumference: number): [number, number] {
  const bounded = Math.min(100, Math.max(0, cleanRatio));
  const filled = (bounded / 100) * circumference;
  return [filled, circumference - filled];
}

export type DailyBar = {
  date: string;
  /** Day of month, e.g. "10". */
  label: string;
  clean: number;
  free: number;
  total: number;
  /** Share of the chart height, 0–1, scaled against the busiest day. */
  cleanHeight: number;
  freeHeight: number;
};

/**
 * Scale each day against the busiest day so the tallest column fills the chart.
 * A day with no record keeps its slot at zero height instead of disappearing —
 * the gaps are the point of this chart.
 */
export function buildDailyBars(daily: StatsDay[]): DailyBar[] {
  const peak = daily.reduce((highest, day) => Math.max(highest, day.clean + day.free), 0);
  const scale = peak > 0 ? 1 / peak : 0;

  return daily.map((day) => ({
    date: day.date,
    label: String(Number(day.date.split("-")[2])),
    clean: day.clean,
    free: day.free,
    total: day.clean + day.free,
    cleanHeight: day.clean * scale,
    freeHeight: day.free * scale,
  }));
}

/** One sentence describing the ring for screen readers. */
export function donutLabel(clean: number, free: number, cleanRatio: number): string {
  return `클린식 ${clean}회 ${cleanRatio}퍼센트, 자유식 ${free}회 ${100 - cleanRatio}퍼센트`;
}

export type WeightPoint = {
  date: string;
  /** Month and day, e.g. "8/20", for the chart's horizontal axis. */
  dateLabel: string;
  label: string;
  weight: number;
  /** Position inside the plot box, 0–1, left to right and bottom to top. */
  x: number;
  y: number;
};

export type WeightLine = {
  points: WeightPoint[];
  min: number;
  max: number;
};

/**
 * Place the recorded weights on a line. Days without a weight are skipped
 * rather than drawn at zero, and the scale hugs the recorded range so a small
 * change is still visible. A single point sits in the middle of the box.
 */
export function buildWeightLine(daily: { date: string; weight: number | null }[]): WeightLine {
  const recorded = daily.filter(
    (day): day is { date: string; weight: number } => typeof day.weight === "number",
  );
  if (recorded.length === 0) return { points: [], min: 0, max: 0 };

  const weights = recorded.map((day) => day.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const span = max - min;
  const lastIndex = daily.length - 1;

  const points = recorded.map((day) => {
    const index = daily.findIndex((entry) => entry.date === day.date);
    const [, month, date] = day.date.split("-");
    return {
      date: day.date,
      dateLabel: `${Number(month)}/${Number(date)}`,
      label: String(Number(day.date.split("-")[2])),
      weight: day.weight,
      x: lastIndex > 0 ? index / lastIndex : 0.5,
      y: span > 0 ? (day.weight - min) / span : 0.5,
    };
  });

  return { points, min, max };
}
