-- NewRay legacy preservation: keep the historical product fully operational,
-- but make authorization reflect the real database user and protect private data.

create or replace function public.museum_login(p_username text, p_password text)
returns table(
  id uuid,
  username text,
  role text,
  is_default_password boolean,
  full_name text,
  personnel_code text,
  avatar text,
  session_token text
)
language plpgsql
security definer
set search_path = pg_catalog, public, museum_private, extensions
as $$
declare
  u public.app_users%rowtype;
  p public.personnel%rowtype;
  cred_hash text;
  raw_token text;
  app_role text;
  normalized_login text := lower(trim(coalesce(p_username, '')));
  attempts museum_private.login_attempts%rowtype;
begin
  if normalized_login = '' or p_password is null then return; end if;

  select * into attempts
  from museum_private.login_attempts
  where login_key = normalized_login;

  if attempts.locked_until is not null and attempts.locked_until > now() then
    perform extensions.crypt(coalesce(p_password,''), extensions.gen_salt('bf', 10));
    return;
  end if;

  select au.* into u
  from public.app_users au
  where lower(au.username) = normalized_login
  limit 1;

  if u.id is not null then
    select c.password_hash into cred_hash
    from museum_private.credentials c
    where c.user_key = u.id::text;
  end if;

  if u.id is null or cred_hash is null or extensions.crypt(p_password, cred_hash) <> cred_hash then
    insert into museum_private.login_attempts(login_key, failed_count, window_started_at, locked_until)
    values (normalized_login, 1, now(), null)
    on conflict (login_key) do update
      set failed_count = case
            when museum_private.login_attempts.window_started_at < now() - interval '15 minutes' then 1
            else museum_private.login_attempts.failed_count + 1
          end,
          window_started_at = case
            when museum_private.login_attempts.window_started_at < now() - interval '15 minutes' then now()
            else museum_private.login_attempts.window_started_at
          end,
          locked_until = case
            when (case
                    when museum_private.login_attempts.window_started_at < now() - interval '15 minutes' then 1
                    else museum_private.login_attempts.failed_count + 1
                  end) >= 10
            then now() + interval '15 minutes'
            else museum_private.login_attempts.locked_until
          end;
    if u.id is null or cred_hash is null then
      perform extensions.crypt(coalesce(p_password,''), extensions.gen_salt('bf', 10));
    end if;
    return;
  end if;

  delete from museum_private.login_attempts where login_key = normalized_login;
  delete from museum_private.sessions
  where expires_at < now() - interval '1 day' or revoked_at is not null;

  app_role := case lower(replace(coalesce(u.role,''), '_', ' '))
    when 'admin' then 'ADMIN'
    when 'super admin' then 'ADMIN'
    when 'operator' then 'USER'
    when 'storekeeper' then 'STOREKEEPER'
    when 'inspector' then 'INSPECTOR'
    when 'manager' then 'MANAGER'
    when 'expert' then 'EXPERT'
    else upper(coalesce(u.role, 'USER'))
  end;

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into museum_private.sessions(token_hash, user_key, role, expires_at)
  values (
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    u.id::text,
    app_role,
    now() + interval '12 hours'
  );

  if u.personnel_id is not null then
    select per.* into p from public.personnel per where per.id = u.personnel_id;
  end if;

  id := u.id;
  username := u.username;
  role := app_role;
  is_default_password := coalesce(u.is_default_password, false);
  full_name := case when lower(u.username) = 'admin' then 'مدیر سیستم' else coalesce(p.full_name, u.username) end;
  personnel_code := p.personnel_code;
  avatar := coalesce(u.avatar, p.profile_picture);
  session_token := raw_token;
  return next;
end;
$$;

update museum_private.sessions
set revoked_at = now()
where role = 'MUSEUM_VISITOR_ADMIN' and revoked_at is null;

drop policy if exists museum_personal_notes_select on public.personal_notes;
drop policy if exists museum_personal_notes_insert on public.personal_notes;
drop policy if exists museum_personal_notes_update on public.personal_notes;
drop policy if exists museum_personal_notes_delete on public.personal_notes;
create policy museum_personal_notes_select on public.personal_notes
for select to anon, authenticated
using (museum_private.is_admin_session() or user_id::text = museum_private.current_session_user_key());
create policy museum_personal_notes_insert on public.personal_notes
for insert to anon, authenticated
with check (museum_private.is_admin_session() or user_id::text = museum_private.current_session_user_key());
create policy museum_personal_notes_update on public.personal_notes
for update to anon, authenticated
using (museum_private.is_admin_session() or user_id::text = museum_private.current_session_user_key())
with check (museum_private.is_admin_session() or user_id::text = museum_private.current_session_user_key());
create policy museum_personal_notes_delete on public.personal_notes
for delete to anon, authenticated
using (museum_private.is_admin_session() or user_id::text = museum_private.current_session_user_key());

drop policy if exists museum_user_column_preferences_select on public.user_column_preferences;
drop policy if exists museum_user_column_preferences_insert on public.user_column_preferences;
drop policy if exists museum_user_column_preferences_update on public.user_column_preferences;
drop policy if exists museum_user_column_preferences_delete on public.user_column_preferences;
create policy museum_user_column_preferences_select on public.user_column_preferences
for select to anon, authenticated
using (museum_private.is_admin_session() or user_id::text = museum_private.current_session_user_key());
create policy museum_user_column_preferences_insert on public.user_column_preferences
for insert to anon, authenticated
with check (museum_private.is_admin_session() or user_id::text = museum_private.current_session_user_key());
create policy museum_user_column_preferences_update on public.user_column_preferences
for update to anon, authenticated
using (museum_private.is_admin_session() or user_id::text = museum_private.current_session_user_key())
with check (museum_private.is_admin_session() or user_id::text = museum_private.current_session_user_key());
create policy museum_user_column_preferences_delete on public.user_column_preferences
for delete to anon, authenticated
using (museum_private.is_admin_session() or user_id::text = museum_private.current_session_user_key());

drop policy if exists museum_system_logs_select on public.system_logs;
drop policy if exists museum_system_logs_insert on public.system_logs;
drop policy if exists museum_system_logs_update on public.system_logs;
drop policy if exists museum_system_logs_delete on public.system_logs;
create policy museum_system_logs_select on public.system_logs
for select to anon, authenticated
using (museum_private.is_admin_session() or user_id::text = museum_private.current_session_user_key());
create policy museum_system_logs_insert on public.system_logs
for insert to anon, authenticated
with check (museum_private.is_admin_session() or user_id::text = museum_private.current_session_user_key());
create policy museum_system_logs_delete on public.system_logs
for delete to anon, authenticated
using (museum_private.is_admin_session());

drop policy if exists museum_data_change_audit_select on public.data_change_audit;
drop policy if exists museum_data_change_audit_insert on public.data_change_audit;
drop policy if exists museum_data_change_audit_delete on public.data_change_audit;
create policy museum_data_change_audit_select on public.data_change_audit
for select to anon, authenticated
using (museum_private.is_admin_session());
create policy museum_data_change_audit_insert on public.data_change_audit
for insert to anon, authenticated
with check (museum_private.has_valid_session());

drop policy if exists museum_messages_select on public.messages;
drop policy if exists museum_messages_insert on public.messages;
drop policy if exists museum_messages_update on public.messages;
drop policy if exists museum_messages_delete on public.messages;
create policy museum_messages_select on public.messages
for select to anon, authenticated
using (
  museum_private.is_admin_session()
  or sender_id = museum_private.current_session_user_key()
  or receiver_type = 'ALL'
  or (receiver_type = 'USER' and receiver_id = museum_private.current_session_user_key())
  or (receiver_type = 'GROUP' and upper(receiver_id) = upper(coalesce(museum_private.current_session_role(), '')))
);
create policy museum_messages_insert on public.messages
for insert to anon, authenticated
with check (
  museum_private.is_admin_session()
  or sender_id = museum_private.current_session_user_key()
);
create policy museum_messages_update on public.messages
for update to anon, authenticated
using (
  museum_private.is_admin_session()
  or sender_id = museum_private.current_session_user_key()
  or (receiver_type = 'USER' and receiver_id = museum_private.current_session_user_key())
  or receiver_type = 'ALL'
  or (receiver_type = 'GROUP' and upper(receiver_id) = upper(coalesce(museum_private.current_session_role(), '')))
)
with check (
  museum_private.is_admin_session()
  or sender_id = museum_private.current_session_user_key()
  or (receiver_type = 'USER' and receiver_id = museum_private.current_session_user_key())
  or receiver_type = 'ALL'
  or (receiver_type = 'GROUP' and upper(receiver_id) = upper(coalesce(museum_private.current_session_role(), '')))
);
create policy museum_messages_delete on public.messages
for delete to anon, authenticated
using (museum_private.is_admin_session() or sender_id = museum_private.current_session_user_key());
