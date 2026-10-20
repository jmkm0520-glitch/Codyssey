alter table public.meals
  add column if not exists id uuid primary key default gen_random_uuid();
