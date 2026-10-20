begin;

drop function if exists public.claim_single_member(uuid, text, text);
drop function if exists public.reserve_single_member_signup(uuid, text, text);
drop function if exists public.complete_verified_member_signup(uuid, text);

alter table public.member_signup_claims drop constraint member_signup_claims_pkey;
alter table public.member_signup_claims drop constraint member_signup_claims_singleton_check;
alter table public.member_signup_claims drop column singleton;
alter table public.member_signup_claims add primary key (user_id);

create or replace function public.reserve_member_signup(
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
  insert into public.member_signup_claims (user_id, email, display_name)
  values (requested_user_id, lower(trim(requested_email)), trim(requested_display_name))
  on conflict (user_id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        created_at = now()
  returning * into signup_claim;

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
  select * into signup_claim
  from public.member_signup_claims
  where user_id = requested_user_id
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
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        updated_at = now()
  returning * into created_member;

  delete from public.member_signup_claims where user_id = requested_user_id;

  return created_member;
end;
$$;

revoke all on function public.reserve_member_signup(uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.complete_verified_member_signup(uuid, text)
  from public, anon, authenticated;
grant execute on function public.reserve_member_signup(uuid, text, text) to service_role;
grant execute on function public.complete_verified_member_signup(uuid, text) to service_role;

commit;
