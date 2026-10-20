alter table public.meals
  add column if not exists food text not null;
