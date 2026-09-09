-- Make the historical audit trail identify the real legacy application user.
create or replace function public.audit_data_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, museum_private
as $$
declare
  actor text;
begin
  actor := coalesce(
    museum_private.current_session_user_key(),
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claim.email', true), ''),
    current_user,
    'database/system'
  );

  if tg_op = 'INSERT' then
    insert into public.data_change_audit (table_name, record_id, operation, changed_by, old_data, new_data)
    values (tg_table_name, new.id::text, 'INSERT', actor, null, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.data_change_audit (table_name, record_id, operation, changed_by, old_data, new_data)
    values (tg_table_name, coalesce(new.id::text, old.id::text), 'UPDATE', actor, to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.data_change_audit (table_name, record_id, operation, changed_by, old_data, new_data)
    values (tg_table_name, old.id::text, 'DELETE', actor, to_jsonb(old), null);
    return old;
  end if;

  return null;
end;
$$;

-- Extend auditing to high-value operational records that were previously not covered.
do $$
declare
  t text;
begin
  foreach t in array array[
    'projects',
    'project_objectives',
    'project_milestones',
    'project_attachments',
    'purchase_requests',
    'technical_suggestions',
    'meeting_minutes',
    'shift_reports',
    'performance_evaluations',
    'technical_documents',
    'part_request_items',
    'equipment_runtime_hours'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', 'trg_audit_' || t, t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_data_change()',
      'trg_audit_' || t,
      t
    );
  end loop;
end
$$;
