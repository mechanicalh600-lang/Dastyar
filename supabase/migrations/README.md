# Supabase migrations

Migration SQL for the preserved museum database is tracked here from the 2026-09-08 hardening baseline onward. The database predates this history, so earlier schema evolution remains legacy state.

Live museum hardening sequence:

1. `museum_security_foundation` — private credential hashes, museum sessions, login throttling, and compatibility RPCs.
2. `museum_lockdown_phase2` — removes plaintext credential dependence and gates operational data behind the museum session.
3. `museum_enable_rls_all_tables` — enables RLS across the exposed historical schema.
4. `museum_fk_indexes_and_duplicate_cleanup` — adds covering foreign-key indexes and removes exact duplicate indexes.

Repository SQL files are preservation records for the live changes. Never modernize the historical UI as part of a database migration.
