-- supabase/functions/bump_verified.sql — creates the one and only anon write path:
-- the rate-limited bump_verified(spot_id) verification function (gate G3, decided 2026-11-09).
-- Run this THIRD, after schema.sql and policies.sql.

create or replace function public.bump_verified(spot_id uuid)
returns boolean
language plpgsql
security definer          -- runs as the table owner, so anon can call it without an UPDATE policy
set search_path = ''      -- empty search_path (standard hardening for security definer); every name below is schema-qualified
as $$
begin
  -- Updates ONLY last_verified_at, ONLY on an approved row, and ONLY if the last bump
  -- for this spot is at least 1 hour old — the 1-bump-per-spot-per-hour limit is
  -- enforced here inside the database, not in the frontend. If the WHERE matches
  -- nothing (rate-limited, or the spot is pending / does not exist), the special
  -- plpgsql variable `found` is false, so the caller knows the bump was refused.
  update public.spots
     set last_verified_at = now()
   where id = spot_id
     and status = 'approved'
     and (last_verified_at is null or last_verified_at < now() - interval '1 hour');

  return found;
end;
$$;

-- KNOWN LIMITATION (accepted trade-off of the no-login design): the limit is per SPOT, not per
-- person. Anyone can call this for every approved spot once an hour, so "Diverifikasi ..." is a
-- weak signal, not proof. Do not treat it as trusted verification.
--
-- The anon role must be able to EXECUTE this function: that is how the `Masih ada ✓`
-- button reaches the database (POST /rest/v1/rpc/bump_verified). This grant is the
-- entire anon write surface — the function updates one column on approved rows,
-- nothing else. Safe to re-run; granting an already-granted permission changes nothing.
-- Functions are executable by PUBLIC by default, which also covers `authenticated`. The app has
-- no login, so only anon needs it: revoke the default, then grant anon explicitly.
revoke execute on function public.bump_verified(uuid) from public;
revoke execute on function public.bump_verified(uuid) from authenticated;
grant execute on function public.bump_verified(uuid) to anon;

-- Reminder: NO anon UPDATE or DELETE policy exists anywhere (see supabase/policies.sql §4).
-- This function is the only way an anonymous visitor can change any data.
