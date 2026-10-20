export type ApiError = {
  code: string;
  message: string;
};

export type ApiEnvelope<T> = {
  data: T | null;
  error: ApiError | null;
};

export type Meal = "breakfast" | "lunch" | "dinner" | "snack";

export type MealType = "clean" | "free";

export type MealRecord = {
  id: string;
  date: string;
  meal: Meal;
  food: string;
  type: MealType;
};

export type WeightRecord = {
  date: string;
  weight: number;
};

export type DayRecord = {
  date: string;
  weight: WeightRecord | null;
  meals: Record<Meal, MealRecord | null>;
};

export type CalendarDay = {
  date: string;
  weight: number | null;
  status: MealType | null;
};

export type CalendarMonth = {
  year: number;
  month: number;
  days: CalendarDay[];
};

export type StatsRange = {
  start: string;
  end: string;
  days: number;
};

export type StatsDay = {
  date: string;
  clean: number;
  free: number;
  weight: number | null;
};

export type StatsPrevious = {
  total: number;
  clean: number;
  free: number;
  cleanRatio: number;
};

export type DietStats = {
  range: StatsRange;
  total: number;
  clean: number;
  free: number;
  cleanRatio: number;
  recordedDays: number;
  daily: StatsDay[];
  topMeal: Meal | null;
  previous: StatsPrevious;
  cleanRatioDelta: number;
};
