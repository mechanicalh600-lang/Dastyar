# Security rules for the preserved museum

- Never reintroduce browser-side password comparison or embedded administrative passwords.
- Never store plaintext passwords in a public API table.
- Never grant anonymous write access to application tables.
- `SECURITY DEFINER` functions must have an explicit `search_path` and minimum EXECUTE grants.
- Dynamic SQL helpers must never be publicly executable.
- Application authorization must be enforceable by the database/session layer, not only by hidden buttons or React routes.
- Re-run Supabase security advisors after every schema, function, or policy change.
