alter table public.meals
  add column if not exists type text not null,
  add constraint meals_type_valid check (type in ('clean', 'free'));
