alter table public.meals
  add constraint meals_date_meal_unique unique (date, meal);
