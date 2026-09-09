-- Applied to the live Dastyar museum Supabase project on 2026-09-09.
-- Preserve the historical UI while allowing the browser to validate cached
-- user state against the server-side museum session after reload/restart.

create or replace function public.museum_current_user()
returns table(
  id uuid,
  username text,
  role text,
  is_default_password boolean,
  full_name text,
  personnel_code text,
  avatar text
)
language plpgsql
security definer
set search_path = pg_catalog, public, museum_private
as $$
declare
  user_key text;
  u public.app_users%rowtype;
  p public.personnel%rowtype;
begin
  user_key := museum_private.current_session_user_key();
  if user_key is null then return; end if;

  select au.* into u from public.app_users au where au.id::text = user_key limit 1;
  if u.id is null then return; end if;

  if u.personnel_id is not null then
    select per.* into p from public.personnel per where per.id = u.personnel_id;
  end if;

  id := u.id;
  username := u.username;
  role := case
    when lower(replace(coalesce(u.role,''), '_', ' ')) in ('admin','super admin') then 'ADMIN'
    when lower(replace(coalesce(u.role,''), '_', ' ')) in ('operator','user') then 'USER'
    when upper(coalesce(u.role,'')) in ('STOREKEEPER','INSPECTOR','MANAGER','EXPERT') then upper(u.role)
    else upper(coalesce(u.role,'USER'))
  end;
  is_default_password := coalesce(u.is_default_password, false);
  full_name := case when lower(u.username) = 'admin' then 'مدیر سیستم' else coalesce(p.full_name, u.username) end;
  personnel_code := p.personnel_code;
  avatar := coalesce(u.avatar, p.profile_picture);
  return next;
end;
$$;

revoke all on function public.museum_current_user() from public;
grant execute on function public.museum_current_user() to anon, authenticated;
