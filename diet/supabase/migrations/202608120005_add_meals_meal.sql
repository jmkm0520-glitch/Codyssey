alter table public.meals
  add column if not exists meal text not null,
  add constraint meals_meal_valid check (meal in ('breakfast', 'lunch', 'dinner', 'snack'));
