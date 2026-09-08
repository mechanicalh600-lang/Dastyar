# Museum session security model

A museum login is verified inside PostgreSQL against a one-way password hash stored in the private `museum_private` schema. Successful login returns a random opaque session token; only its SHA-256 hash is stored server-side. The browser attaches the token as `x-museum-session` on Supabase requests. RLS policies can therefore distinguish a valid museum session even though the historical application is not being visually redesigned around Supabase Auth.

This compatibility layer exists specifically to preserve the old login experience while moving authentication authority away from browser-side table reads.
