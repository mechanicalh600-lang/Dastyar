
export const DB_SETUP_SQL = `-- کدهای زیر را در بخش SQL Editor در Supabase اجرا کنید

-- 1. جداول اصلی
create table if not exists personnel (
  id uuid default gen_random_uuid() primary key,
  personnel_code text unique not null,
  full_name text,
  unit text,
  mobile text,
  email text,
  profile_picture text,
  created_at timestamptz default now()
);

create table if not exists app_users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text,
  role text not null,
  personnel_id uuid references personnel(id),
  is_default_password boolean default true,
  avatar text,
  created_at timestamptz default now()
);

-- جدول لاگ‌های سیستم
create table if not exists system_logs (
  id uuid default gen_random_uuid() primary key,
  user_id text,
  user_name text,
  personnel_code text,
  action text,
  ip_address text,
  details text,
  created_at timestamptz default now()
);

-- جدول پیام ها
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  sender_id text,
  sender_name text,
  receiver_id text,
  receiver_type text,
  subject text,
  body text,
  read_by jsonb default '[]'::jsonb,
  created_at text,
  attachments jsonb default '[]'::jsonb
);

-- 2. جداول اطلاعات پایه
create table if not exists locations ( id uuid default gen_random_uuid() primary key, code text unique, name text not null, parent_id uuid references locations(id), created_at timestamptz default now() );

-- جدول واحدها (با نماد)
create table if not exists measurement_units ( 
  id uuid default gen_random_uuid() primary key, 
  title text not null, 
  symbol text, 
  created_at timestamptz default now() 
);

create table if not exists equipment_classes ( id uuid default gen_random_uuid() primary key, name text not null, created_at timestamptz default now() );
create table if not exists equipment_groups ( id uuid default gen_random_uuid() primary key, name text not null, class_id uuid references equipment_classes(id), created_at timestamptz default now() );

-- جدول دسته‌بندی قطعات (اصلی، فرعی، فرعیِ فرعی)
create table if not exists part_categories ( 
  id uuid default gen_random_uuid() primary key, 
  code text unique not null, 
  name text unique not null, 
  parent_id uuid references part_categories(id), 
  level_type text not null, -- MAIN, SUB, SUB_SUB
  created_at timestamptz default now() 
);

create table if not exists equipment (
  id uuid default gen_random_uuid() primary key,
  code text unique,
  name text not null,
  class_id uuid references equipment_classes(id),
  group_id uuid references equipment_groups(id),
  location_id uuid references locations(id),
  description text,
  created_at timestamptz default now()
);

create table if not exists equipment_local_names (
  id uuid default gen_random_uuid() primary key,
  local_name text not null,
  class_id uuid references equipment_classes(id),
  group_id uuid references equipment_groups(id),
  created_at timestamptz default now()
);

-- 3. جدول اصلی گردش کار (Cartable)
create table if not exists cartable_items (
  id uuid default gen_random_uuid() primary key,
  workflow_id text,
  tracking_code text unique,
  module text not null,
  title text,
  description text,
  current_step_id text,
  initiator_id uuid references app_users(id),
  assignee_role text,
  assignee_id uuid references app_users(id),
  status text,
  data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. جداول مدیریت پروژه
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  tracking_code text unique not null,
  title text not null,
  manager_id uuid references personnel(id),
  manager_name text,
  budget numeric default 0,
  start_date text,
  end_date text,
  status text default 'PLANNED',
  progress integer default 0,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists project_objectives (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  objective_text text not null,
  created_at timestamptz default now()
);

create table if not exists project_milestones (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  weight_percent integer not null,
  progress_percent integer default 0,
  created_at timestamptz default now()
);

create table if not exists project_attachments (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  file_name text not null,
  file_path text,
  file_size integer,
  file_type text,
  uploaded_at timestamptz default now()
);

-- جدول گزارشات شیفت
create table if not exists shift_reports (
  id uuid default gen_random_uuid() primary key,
  tracking_code text unique not null,
  shift_date text,
  shift_name text,
  shift_type text,
  shift_duration text,
  supervisor_id uuid,
  supervisor_name text,
  total_production_a numeric default 0,
  total_production_b numeric default 0,
  full_data jsonb,
  created_at timestamptz default now()
);

-- 5. جدول ارزیابی عملکرد
create table if not exists performance_evaluations (
  id uuid default gen_random_uuid() primary key,
  tracking_code text unique not null,
  personnel_id uuid references personnel(id),
  personnel_name text,
  unit text,
  period text,
  total_score numeric,
  criteria_data jsonb,
  evaluator_id uuid references app_users(id),
  status text default 'PENDING',
  description text,
  created_at timestamptz default now()
);

-- سایر جداول کمکی
create table if not exists user_groups ( id uuid default gen_random_uuid() primary key, code text, name text, created_at timestamptz default now() );
create table if not exists org_chart ( id uuid default gen_random_uuid() primary key, code text, name text, manager_name text, created_at timestamptz default now() );
create table if not exists evaluation_periods ( id uuid default gen_random_uuid() primary key, code text, title text, created_at timestamptz default now() );
create table if not exists evaluation_criteria ( id uuid default gen_random_uuid() primary key, title text, max_score numeric, created_at timestamptz default now() );
create table if not exists equipment_tree ( id uuid default gen_random_uuid() primary key, equipment_id uuid references equipment(id), code text, name text, parent_id uuid references equipment_tree(id), created_at timestamptz default now() );
create table if not exists activity_cards ( id uuid default gen_random_uuid() primary key, code text, name text, created_at timestamptz default now() );
create table if not exists checklist_items ( id uuid default gen_random_uuid() primary key, activity_card_id uuid references activity_cards(id), sort_order int, description text, created_at timestamptz default now() );
create table if not exists maintenance_plans ( id uuid default gen_random_uuid() primary key, code text, name text, equipment_id uuid references equipment(id), created_at timestamptz default now() );

-- جدول قطعات (متصل به دسته‌بندی و واحدها)
create table if not exists parts ( 
  id uuid default gen_random_uuid() primary key, 
  code text, 
  name text not null, 
  category_id uuid references part_categories(id), 
  stock_unit_id uuid references measurement_units(id), 
  consumption_unit_id uuid references measurement_units(id), 
  created_at timestamptz default now() 
);

-- 6. جدول درخواست قطعه (هدر و اقلام)
create table if not exists part_requests (
  id uuid default gen_random_uuid() primary key,
  tracking_code text unique not null,
  requester_id uuid references app_users(id),
  requester_name text,
  work_order_id uuid references cartable_items(id), -- اتصال به دستور کار
  work_order_code text,
  request_date text,
  status text default 'PENDING',
  description text,
  created_at timestamptz default now()
);

create table if not exists part_request_items (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references part_requests(id) on delete cascade,
  part_id uuid references parts(id),
  part_name text,
  qty numeric,
  unit text,
  note text,
  created_at timestamptz default now()
);

-- 7. جدول اسناد فنی
create table if not exists technical_documents (
  id uuid default gen_random_uuid() primary key,
  code text not null,
  title text not null,
  type text,
  file_name text,
  created_at timestamptz default now()
);

-- 8. جدول صورتجلسات
create table if not exists meeting_minutes (
  id uuid default gen_random_uuid() primary key,
  tracking_code text unique not null,
  subject text not null,
  location text,
  meeting_date text,
  start_time text,
  end_time text,
  attendees jsonb default '[]'::jsonb,
  decisions jsonb default '[]'::jsonb,
  attached_files jsonb default '[]'::jsonb,
  creator_id uuid references app_users(id),
  status text default 'PENDING',
  created_at timestamptz default now()
);

-- 9. جدول پیشنهادات فنی
create table if not exists technical_suggestions (
  id uuid default gen_random_uuid() primary key,
  tracking_code text unique not null,
  user_id uuid references app_users(id),
  user_name text,
  description text not null,
  attached_files jsonb default '[]'::jsonb,
  status text default 'PENDING',
  created_at timestamptz default now()
);

-- 10. جدول درخواست خرید (جدید)
create table if not exists purchase_requests (
  id uuid default gen_random_uuid() primary key,
  tracking_code text unique not null,
  request_number text not null,
  requester_id uuid references app_users(id),
  requester_name text,
  request_date text,
  description text not null,
  qty numeric default 1,
  unit text,
  location text,
  priority text,
  status text default 'PENDING',
  created_at timestamptz default now()
);

-- 11. جدول یادداشت‌های شخصی (جدید)
create table if not exists personal_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references app_users(id),
  title text not null,
  content text,
  tags jsonb default '[]'::jsonb,
  reminder_date text,
  reminder_time text,
  is_completed boolean default false,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 12. جدول دستور کارها (جدید)
create table if not exists work_orders (
  id uuid default gen_random_uuid() primary key,
  tracking_code text unique not null,
  requester_id uuid references app_users(id),
  requester_name text,
  request_date text,
  request_time text,
  shift text,
  equipment_id uuid references equipment(id),
  equipment_code text,
  equipment_name text,
  local_name text,
  location_id uuid references locations(id),
  location_details text,
  production_line text,
  work_category text,
  work_type text,
  priority text,
  failure_description text,
  action_taken text,
  downtime integer default 0,
  repair_time integer default 0,
  labor_details jsonb default '[]'::jsonb,
  used_parts jsonb default '[]'::jsonb,
  attachments jsonb default '[]'::jsonb,
  status text default 'REQUEST',
  created_at timestamptz default now()
);

-- بروزرسانی‌ها و روابط
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password text;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS personnel_id uuid REFERENCES personnel(id);
ALTER TABLE org_chart ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES org_chart(id);
ALTER TABLE org_chart ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES personnel(id);
ALTER TABLE personnel ADD COLUMN IF NOT EXISTS org_unit_id uuid REFERENCES org_chart(id);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES locations(id);
ALTER TABLE equipment_classes ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE equipment_groups ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE evaluation_criteria ADD COLUMN IF NOT EXISTS org_unit_id uuid REFERENCES org_chart(id);
ALTER TABLE measurement_units ADD COLUMN IF NOT EXISTS symbol text;

-- Constraints
ALTER TABLE equipment_classes DROP CONSTRAINT IF EXISTS equipment_classes_code_key;
ALTER TABLE equipment_classes ADD CONSTRAINT equipment_classes_code_key UNIQUE (code);
ALTER TABLE equipment_classes DROP CONSTRAINT IF EXISTS equipment_classes_name_key;
ALTER TABLE equipment_classes ADD CONSTRAINT equipment_classes_name_key UNIQUE (name);
ALTER TABLE equipment_groups DROP CONSTRAINT IF EXISTS equipment_groups_code_key;
ALTER TABLE equipment_groups ADD CONSTRAINT equipment_groups_code_key UNIQUE (code);
ALTER TABLE equipment ALTER COLUMN code SET NOT NULL;

-- RLS Policies (Simplified for development - allow all)
alter table personnel enable row level security; drop policy if exists "Allow all personnel" on personnel; create policy "Allow all personnel" on personnel for all using (true) with check (true);
alter table app_users enable row level security; drop policy if exists "Allow all users" on app_users; create policy "Allow all users" on app_users for all using (true) with check (true);
alter table shift_reports enable row level security; drop policy if exists "Allow all reports" on shift_reports; create policy "Allow all reports" on shift_reports for all using (true) with check (true);
alter table locations enable row level security; drop policy if exists "Allow all loc" on locations; create policy "Allow all loc" on locations for all using (true) with check (true);
alter table cartable_items enable row level security; drop policy if exists "Allow all cartable" on cartable_items; create policy "Allow all cartable" on cartable_items for all using (true) with check (true);
alter table messages enable row level security; drop policy if exists "Allow all messages" on messages; create policy "Allow all messages" on messages for all using (true) with check (true);
alter table projects enable row level security; drop policy if exists "Allow all projects" on projects; create policy "Allow all projects" on projects for all using (true) with check (true);
alter table project_objectives enable row level security; drop policy if exists "Allow all project_obj" on project_objectives; create policy "Allow all project_obj" on project_objectives for all using (true) with check (true);
alter table project_milestones enable row level security; drop policy if exists "Allow all project_mil" on project_milestones; create policy "Allow all project_mil" on project_milestones for all using (true) with check (true);
alter table project_attachments enable row level security; drop policy if exists "Allow all project_att" on project_attachments; create policy "Allow all project_att" on project_attachments for all using (true) with check (true);
alter table performance_evaluations enable row level security; drop policy if exists "Allow all evaluations" on performance_evaluations; create policy "Allow all evaluations" on performance_evaluations for all using (true) with check (true);
alter table parts enable row level security; drop policy if exists "Allow all parts" on parts; create policy "Allow all parts" on parts for all using (true) with check (true);
alter table part_categories enable row level security; drop policy if exists "Allow all part_cats" on part_categories; create policy "Allow all part_cats" on part_categories for all using (true) with check (true);
alter table part_requests enable row level security; drop policy if exists "Allow all part_req" on part_requests; create policy "Allow all part_req" on part_requests for all using (true) with check (true);
alter table part_request_items enable row level security; drop policy if exists "Allow all part_req_items" on part_request_items; create policy "Allow all part_req_items" on part_request_items for all using (true) with check (true);
alter table technical_documents enable row level security; drop policy if exists "Allow all docs" on technical_documents; create policy "Allow all docs" on technical_documents for all using (true) with check (true);
alter table meeting_minutes enable row level security; drop policy if exists "Allow all meetings" on meeting_minutes; create policy "Allow all meetings" on meeting_minutes for all using (true) with check (true);
alter table technical_suggestions enable row level security; drop policy if exists "Allow all suggestions" on technical_suggestions; create policy "Allow all suggestions" on technical_suggestions for all using (true) with check (true);
alter table purchase_requests enable row level security; drop policy if exists "Allow all purchase requests" on purchase_requests; create policy "Allow all purchase requests" on purchase_requests for all using (true) with check (true);
alter table personal_notes enable row level security; drop policy if exists "Allow user notes" on personal_notes; create policy "Allow user notes" on personal_notes for all using (true) with check (true);
alter table system_logs enable row level security; drop policy if exists "Allow logs" on system_logs; create policy "Allow logs" on system_logs for all using (true) with check (true);
alter table work_orders enable row level security; drop policy if exists "Allow all work_orders" on work_orders; create policy "Allow all work_orders" on work_orders for all using (true) with check (true);
alter table measurement_units enable row level security; drop policy if exists "Allow all units" on measurement_units; create policy "Allow all units" on measurement_units for all using (true) with check (true);

-- تابع پیشرفته تولید کد رهگیری منحصر به فرد
create or replace function get_next_tracking_code(prefix_input text)
returns text
language plpgsql
as $$
declare
  last_code text;
  next_num integer;
  new_code text;
begin
  select tracking_code into last_code
  from cartable_items
  where tracking_code like prefix_input || '%'
  order by tracking_code desc
  limit 1;

  if last_code is null then
    next_num := 1;
  else
    begin
        next_num := to_number(right(last_code, 4), '9999') + 1;
    exception when others then
        next_num := 1;
    end;
  end if;

  new_code := prefix_input || lpad(next_num::text, 4, '0');
  
  return new_code;
end;
$$;

-- تابع اختصاصی برای کد رهگیری گزارشات شیفت (جلوگیری از تکرار)
create or replace function get_next_shift_code_from_prefix(prefix_input text)
returns text
language plpgsql
as $$
declare
  last_code text;
  next_num integer;
begin
  -- پیدا کردن آخرین کد با این پیشوند
  select tracking_code into last_code
  from shift_reports
  where tracking_code like prefix_input || '%'
  order by tracking_code desc
  limit 1;

  -- محاسبه شمارنده بعدی
  if last_code is null then
    next_num := 1;
  else
    -- فرض بر این است که 4 رقم آخر شمارنده هستند
    next_num := to_number(right(last_code, 4), '9999') + 1;
  end if;

  -- بازگرداندن کد نهایی
  return prefix_input || lpad(next_num::text, 4, '0');
end;
$$;`;
