-- Museum preservation hardening: split the original blanket session policy into
-- role-aware read/write/delete boundaries without changing historical UI behavior.

create or replace function museum_private.is_admin_session()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, museum_private
as $$
  select lower(replace(coalesce(museum_private.current_session_role(), ''), '_', ' ')) in ('admin', 'super admin')
$$;

revoke all on function museum_private.is_admin_session() from public;
grant execute on function museum_private.is_admin_session() to anon, authenticated;

do $$
declare
  t text;
  master_tables text[] := array[
    'app_settings','coding_formats','equipment','equipment_boms','equipment_classes','equipment_groups',
    'equipment_local_names','equipment_tree','evaluation_criteria','evaluation_periods','import_tool_profiles',
    'locations','maintenance_plans','measurement_units','org_chart','part_categories','parts','personnel',
    'personnel_skills','pm_plans','report_definitions','report_templates','shift_types','system_config','user_groups',
    'work_activity_types','work_order_priorities','work_order_status','work_types'
  ];
begin
  for t in
    select tablename from pg_tables where schemaname = 'public' and rowsecurity
  loop
    execute format('drop policy if exists museum_session_access on public.%I', t);
    execute format('drop policy if exists %I on public.%I', 'museum_' || t || '_select', t);
    execute format('drop policy if exists %I on public.%I', 'museum_' || t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', 'museum_' || t || '_update', t);
    execute format('drop policy if exists %I on public.%I', 'museum_' || t || '_delete', t);

    if t = 'app_users' then
      execute format('create policy %I on public.%I for select to anon, authenticated using (museum_private.has_valid_session())', 'museum_' || t || '_select', t);
      execute format('create policy %I on public.%I for insert to anon, authenticated with check (museum_private.is_admin_session())', 'museum_' || t || '_insert', t);
      execute format('create policy %I on public.%I for update to anon, authenticated using (museum_private.is_admin_session() or id::text = museum_private.current_session_user_key()) with check (museum_private.is_admin_session() or id::text = museum_private.current_session_user_key())', 'museum_' || t || '_update', t);
      execute format('create policy %I on public.%I for delete to anon, authenticated using (museum_private.is_admin_session())', 'museum_' || t || '_delete', t);
    elsif t = any(master_tables) then
      execute format('create policy %I on public.%I for select to anon, authenticated using (museum_private.has_valid_session())', 'museum_' || t || '_select', t);
      execute format('create policy %I on public.%I for insert to anon, authenticated with check (museum_private.is_admin_session())', 'museum_' || t || '_insert', t);
      execute format('create policy %I on public.%I for update to anon, authenticated using (museum_private.is_admin_session()) with check (museum_private.is_admin_session())', 'museum_' || t || '_update', t);
      execute format('create policy %I on public.%I for delete to anon, authenticated using (museum_private.is_admin_session())', 'museum_' || t || '_delete', t);
    elsif t = 'data_change_audit' then
      execute format('create policy %I on public.%I for select to anon, authenticated using (museum_private.is_admin_session())', 'museum_' || t || '_select', t);
      execute format('create policy %I on public.%I for insert to anon, authenticated with check (museum_private.has_valid_session())', 'museum_' || t || '_insert', t);
      execute format('create policy %I on public.%I for delete to anon, authenticated using (museum_private.is_admin_session())', 'museum_' || t || '_delete', t);
    else
      execute format('create policy %I on public.%I for select to anon, authenticated using (museum_private.has_valid_session())', 'museum_' || t || '_select', t);
      execute format('create policy %I on public.%I for insert to anon, authenticated with check (museum_private.has_valid_session())', 'museum_' || t || '_insert', t);
      execute format('create policy %I on public.%I for update to anon, authenticated using (museum_private.has_valid_session()) with check (museum_private.has_valid_session())', 'museum_' || t || '_update', t);
      execute format('create policy %I on public.%I for delete to anon, authenticated using (museum_private.is_admin_session())', 'museum_' || t || '_delete', t);
    end if;
  end loop;
end
$$;
