# Database lockdown phase gate

Do not remove legacy plaintext fields or replace open RLS policies until all of the following are true:

- The secure-auth frontend builds successfully.
- The secure-auth frontend is deployed.
- Existing login succeeds through the museum RPC.
- Forced password change succeeds.
- Core post-login reads/writes succeed with the museum session header.

After these conditions are met, the cleanup/lockdown migration may be applied and the Supabase advisors must be rerun.
