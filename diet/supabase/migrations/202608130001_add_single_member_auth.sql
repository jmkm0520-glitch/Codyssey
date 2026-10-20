begin;

create table public.members (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint members_display_name_length check (char_length(display_name) between 1 and 50)
);

alter table public.meals add column member_id uuid references public.members(id) on delete cascade;
alter table public.weights add column member_id uuid references public.members(id) on delete cascade;

alter table public.meals drop constraint meals_date_meal_unique;
alter table public.meals add constraint meals_member_date_meal_unique unique (member_id, date, meal);
alter table public.weights drop constraint weights_pkey;
alter table public.weights add constraint weights_member_date_unique unique (member_id, date);

create index meals_member_date_index on public.meals (member_id, date);
create index weights_member_date_index on public.weights (member_id, date);

alter table public.members enable row level security;

revoke all privileges on table public.members, public.meals, public.weights from anon, authenticated;
grant select, insert, update, delete on table public.members, public.meals, public.weights to service_role;

create or replace function public.claim_single_member(
  requested_user_id uuid,
  requested_email text,
  requested_display_name text
) returns public.members
language plpgsql
security definer
set search_path = public
as $$
declare
  created_member public.members;
begin
  perform pg_advisory_xact_lock(hashtext('diet-single-member'));

  if exists (select 1 from public.members) then
    raise exception 'SINGLE_MEMBER_EXISTS' using errcode = 'P0001';
  end if;

  insert into public.members (id, email, display_name)
  values (requested_user_id, lower(trim(requested_email)), trim(requested_display_name))
  returning * into created_member;

  update public.meals set member_id = requested_user_id where member_id is null;
  update public.weights set member_id = requested_user_id where member_id is null;

  return created_member;
end;
$$;

revoke all on function public.claim_single_member(uuid, text, text) from public, anon, authenticated;
grant execute on function public.claim_single_member(uuid, text, text) to service_role;

commit;
