# Security hardening changelog

## 2026-09-08

- Created isolated preservation branch.
- Added CI build validation.
- Added museum preservation contract and security baseline.
- Added private credential/session foundation in Supabase.
- Replaced browser-side login implementation on the preservation branch with secure RPC authentication while preserving the existing login UI.
- Added museum-session request header support to the Supabase client.

Database lockdown and plaintext cleanup remain sequenced after frontend validation/deployment.
