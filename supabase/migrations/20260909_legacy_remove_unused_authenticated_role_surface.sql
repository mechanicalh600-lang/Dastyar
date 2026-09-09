-- Applied to the live Dastyar preservation database on 2026-09-09.
-- Dastyar uses the Supabase anon publishable key plus its own server-validated
-- museum session and currently has no Supabase Auth users.

revoke all privileges on all tables in schema public from authenticated;
revoke all privileges on all sequences in schema public from authenticated;
revoke execute on all functions in schema public from authenticated;

grant execute on function public.museum_healthcheck() to anon;
grant execute on function public.museum_login(text,text) to anon;
grant execute on function public.museum_current_user() to anon;
grant execute on function public.museum_change_password(text,text) to anon;
grant execute on function public.museum_admin_reset_password(uuid,text) to anon;
grant execute on function public.museum_logout() to anon;
