begin;

create table public.member_signup_claims (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  created_at timestamptz not null default now(),
  constraint member_signup_claims_display_name_length
    check (char_length(display_name) between 1 and 50)
);

alter table public.member_signup_claims enable row level security;
revoke all privileges on table public.member_signup_claims from public, anon, authenticated;
grant select, insert, update, delete on table public.member_signup_claims to service_role;

create or replace function public.reserve_single_member_signup(
  requested_user_id uuid,
  requested_email text,
  requested_display_name text
) returns public.member_signup_claims
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_claim public.member_signup_claims;
begin
  perform pg_advisory_xact_lock(hashtext('diet-single-member'));

  if exists (select 1 from public.members) then
    raise exception 'SINGLE_MEMBER_EXISTS' using errcode = 'P0001';
  end if;

  insert into public.member_signup_claims (singleton, user_id, email, display_name)
  values (true, requested_user_id, lower(trim(requested_email)), trim(requested_display_name))
  on conflict (singleton) do update
    set user_id = excluded.user_id,
        email = excluded.email,
        display_name = excluded.display_name,
        created_at = now()
    where public.member_signup_claims.email = excluded.email
      and public.member_signup_claims.user_id = excluded.user_id
  returning * into signup_claim;

  if signup_claim is null then
    raise exception 'SIGNUP_ALREADY_RESERVED' using errcode = 'P0001';
  end if;

  return signup_claim;
end;
$$;

create or replace function public.complete_verified_member_signup(
  requested_user_id uuid,
  requested_email text
) returns public.members
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  signup_claim public.member_signup_claims;
  created_member public.members;
begin
  perform pg_advisory_xact_lock(hashtext('diet-single-member'));

  if exists (select 1 from public.members) then
    raise exception 'SINGLE_MEMBER_EXISTS' using errcode = 'P0001';
  end if;

  select * into signup_claim
  from public.member_signup_claims
  where singleton = true
    and user_id = requested_user_id
    and email = lower(trim(requested_email));

  if signup_claim is null then
    raise exception 'SIGNUP_CLAIM_NOT_FOUND' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from auth.users
    where id = requested_user_id and email_confirmed_at is not null
  ) then
    raise exception 'EMAIL_NOT_VERIFIED' using errcode = 'P0001';
  end if;

  insert into public.members (id, email, display_name)
  values (signup_claim.user_id, signup_claim.email, signup_claim.display_name)
  returning * into created_member;

  update public.meals set member_id = requested_user_id where member_id is null;
  update public.weights set member_id = requested_user_id where member_id is null;
  delete from public.member_signup_claims where singleton = true;

  return created_member;
end;
$$;

revoke all on function public.reserve_single_member_signup(uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.complete_verified_member_signup(uuid, text)
  from public, anon, authenticated;
grant execute on function public.reserve_single_member_signup(uuid, text, text) to service_role;
grant execute on function public.complete_verified_member_signup(uuid, text) to service_role;

commit;
