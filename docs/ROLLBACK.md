# Museum rollback strategy

The visible application is preserved by keeping all hardening changes on a dedicated branch until validation succeeds.

If a frontend regression appears after merge, restore the previous Git commit and redeploy GitHub Pages. Database hardening migrations are designed in phases: compatibility objects are added first; destructive cleanup and RLS lockdown are applied only after the compatible frontend is live.

Credential hashes in `museum_private` are independent from legacy public password columns during transition, allowing the database cleanup phase to be delayed or rolled back without rewriting the historical UI.
