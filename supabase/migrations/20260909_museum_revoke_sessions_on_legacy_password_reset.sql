-- Preserve the historical admin reset path while enforcing modern session safety.
-- The legacy UI writes a temporary password into app_users.password. This trigger
-- hashes it into the private credential store, clears the plaintext field, and
-- now also revokes any existing sessions for that target user.

create or replace function museum_private.capture_legacy_app_user_password()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'museum_private', 'extensions'
as $function$
begin
  if new.password is not null and new.password <> '' then
    insert into museum_private.credentials(user_key, password_hash, updated_at)
    values (new.id::text, extensions.crypt(new.password, extensions.gen_salt('bf', 11)), now())
    on conflict (user_key) do update
      set password_hash = excluded.password_hash,
          updated_at = excluded.updated_at;

    if tg_op = 'UPDATE' then
      update museum_private.sessions
         set revoked_at = now()
       where user_key = new.id::text
         and revoked_at is null;
    end if;

    new.password := null;
  end if;
  return new;
end;
$function$;
