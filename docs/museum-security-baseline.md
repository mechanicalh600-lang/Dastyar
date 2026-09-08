# Museum Security Baseline

Baseline date: 2026-09-08

The museum-hardening initiative preserves the historical UI while replacing unsafe implementation details below it.

## Baseline findings

- Browser-side password comparison against `app_users`.
- A hard-coded administrative login fallback in client source.
- Legacy plain-text password storage and unusable legacy hashes.
- Broad anonymous/public database policies.
- Publicly executable `SECURITY DEFINER` helper functions, including a dynamic read-only SQL executor.
- A public table with RLS disabled.
- No tracked Supabase migration history before the preservation initiative.

## Target invariant

A visitor may only reach museum data operations after a valid museum session is established. Password material is stored only as a one-way hash in a private, non-API schema. Public-facing application code must not need to read password material or carry an embedded administrative password.
