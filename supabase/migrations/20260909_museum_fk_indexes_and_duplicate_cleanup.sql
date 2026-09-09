-- Applied to the live Dastyar museum Supabase project on 2026-09-09.
-- Invisible performance hardening only: no schema semantics or UI behavior changes.

create index if not exists ix_fk_app_users_personnel_id on public.app_users(personnel_id);
create index if not exists ix_fk_cartable_items_initiator_id on public.cartable_items(initiator_id);
create index if not exists ix_fk_checklist_items_activity_card_id on public.checklist_items(activity_card_id);
create index if not exists ix_fk_equipment_local_names_class_id on public.equipment_local_names(class_id);
create index if not exists ix_fk_equipment_local_names_group_id on public.equipment_local_names(group_id);
create index if not exists ix_fk_equipment_runtime_hours_created_by on public.equipment_runtime_hours(created_by);
create index if not exists ix_fk_equipment_tree_equipment_id on public.equipment_tree(equipment_id);
create index if not exists ix_fk_equipment_tree_parent_id on public.equipment_tree(parent_id);
create index if not exists ix_fk_locations_parent_id on public.locations(parent_id);
create index if not exists ix_fk_maintenance_plans_equipment_id on public.maintenance_plans(equipment_id);
create index if not exists ix_fk_meeting_minutes_creator_id on public.meeting_minutes(creator_id);
create index if not exists ix_fk_org_chart_manager_id on public.org_chart(manager_id);
create index if not exists ix_fk_org_chart_parent_id on public.org_chart(parent_id);
create index if not exists ix_fk_part_categories_parent_id on public.part_categories(parent_id);
create index if not exists ix_fk_part_request_items_part_id on public.part_request_items(part_id);
create index if not exists ix_fk_part_request_items_request_id on public.part_request_items(request_id);
create index if not exists ix_fk_part_requests_work_order_id on public.part_requests(work_order_id);
create index if not exists ix_fk_parts_category_id on public.parts(category_id);
create index if not exists ix_fk_performance_evaluations_evaluator_id on public.performance_evaluations(evaluator_id);
create index if not exists ix_fk_personnel_org_unit_id on public.personnel(org_unit_id);
create index if not exists ix_fk_project_attachments_project_id on public.project_attachments(project_id);
create index if not exists ix_fk_project_milestones_project_id on public.project_milestones(project_id);
create index if not exists ix_fk_project_objectives_project_id on public.project_objectives(project_id);
create index if not exists ix_fk_system_logs_user_id on public.system_logs(user_id);
create index if not exists ix_fk_technical_suggestions_user_id on public.technical_suggestions(user_id);

drop index if exists public.idx_cartable_items_status;
drop index if exists public.idx_parts_name;
drop index if exists public.ux_report_definitions_slug;
