-- Historical museum hardening: app_users metadata is administrator-managed.
-- Password changes use dedicated SECURITY DEFINER RPCs that validate the
-- current museum session. Allowing a user to update their own app_users row
-- would also allow direct mutation of the role column through PostgREST.

drop policy if exists museum_app_users_update on public.app_users;

create policy museum_app_users_update
on public.app_users
for update
to anon, authenticated
using (museum_private.is_admin_session())
with check (museum_private.is_admin_session());
