alter table public.meals
  add column if not exists date date not null;
