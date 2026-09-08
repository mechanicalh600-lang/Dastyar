# Museum Hardening Rollout

1. Preserve the historical UI and navigation unchanged.
2. Introduce private credential/session storage and RPC authentication.
3. Deploy compatible frontend authentication.
4. Verify login, default-password change, normal navigation, and core writes.
5. Remove public plaintext password material.
6. Replace anonymous/public database policies with museum-session policies.
7. Revoke legacy public SECURITY DEFINER helpers that are not application APIs.
8. Re-run Supabase security/performance advisors.
9. Keep migration history and CI as permanent preservation controls.

Database lockdown is intentionally sequenced after compatible frontend deployment so the historical application is never deliberately cut off from its own data during migration.
