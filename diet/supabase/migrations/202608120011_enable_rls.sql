begin;

-- The browser does not query these tables directly. RLS is enabled without
-- anon/authenticated policies so only the server-side service role can access them.
alter table public.meals enable row level security;
alter table public.weights enable row level security;

revoke all privileges on table public.meals, public.weights from anon, authenticated;
grant select, insert, update, delete on table public.meals, public.weights to service_role;

commit;
