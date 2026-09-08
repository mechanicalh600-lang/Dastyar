-- Historical record of the migration applied to Supabase on 2026-09-08.
-- This file documents the security foundation; subsequent migrations build on it.
-- The live database migration was applied through Supabase migration tooling.

create schema if not exists museum_private;

-- Private tables hold credential hashes, sessions, and login throttling state.
-- Public application code must never SELECT credential material directly.

-- See docs/museum-hardening-plan.md for rollout sequencing.
