-- A repeat sign-up on an address that already has a pending claim used to hit the
-- unique constraint on member_signup_claims.email and surface as a 500. The claim
-- row belongs to nobody until the address is verified, so a retry should replace
-- it. An address that already belongs to a member is a different case and gets a
-- named error the API can translate.
begin;

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
  normalized_email text := lower(trim(requested_email));
  signup_claim public.member_signup_claims;
begin
  if exists (select 1 from public.members where email = normalized_email) then
    raise exception 'EMAIL_ALREADY_REGISTERED' using errcode = '23505';
  end if;

  -- An unverified claim held by a different auth user cannot be completed by
  -- anyone else, so the retry takes it over.
  delete from public.member_signup_claims
  where email = normalized_email
    and user_id <> requested_user_id;

  insert into public.member_signup_claims (user_id, email, display_name)
  values (requested_user_id, normalized_email, trim(requested_display_name))
  on conflict (user_id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        created_at = now()
  returning * into signup_claim;

  return signup_claim;
end;
$$;

revoke all on function public.reserve_member_signup(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.reserve_member_signup(uuid, text, text) to service_role;

commit;
