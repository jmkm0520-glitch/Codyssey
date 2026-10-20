create table if not exists public.weights (
  date date primary key,
  weight numeric(6, 2) not null,
  constraint weights_weight_positive check (weight > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
