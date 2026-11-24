# supabase/ — database setup for Singgah

The three `.sql` files in this folder are run **once each, in order**, in the Supabase dashboard
SQL editor. After that the database is ready for the app and for `scripts/seed-spots.mjs`.
No keys, URLs or secrets live in these files — that is on purpose.

## 1. Run order (one file per query)

1. Open https://supabase.com/dashboard → your Singgah project → **SQL Editor** → **New query**.
2. Paste the whole of `schema.sql` → **Run**. This creates the `spots` table.
3. **New query** again: paste the whole of `policies.sql` → **Run**. This enables Row Level
   Security and adds the two anon policies (read approved rows only; insert pending rows only).
4. **New query** again: paste the whole of `functions/bump_verified.sql` → **Run**. This creates
   the rate-limited `bump_verified(spot_id)` function and lets only anon call it.
5. **New query** again: paste the whole of `constraints.sql` → **Run**. This adds the length and
   coordinate limits (name ≤120, notes ≤300, hours ≤60, lat/lng ranges) that the database
   enforces even when someone skips the form.

All four files are safe to re-run (they use `if not exists` / `drop policy if exists` /
`create or replace`). Run them in this order — each step depends on the one before it.

After step 2 you can check it worked: **Table Editor** → `spots` shows the table with its
14 columns (id, name, type, lat, lng, water, hours, bike_parking, women_friendly, notes,
status, source, last_verified_at, created_at).

## 2. How to approve a pending spot (the owner's only admin job)

1. Dashboard → **Table Editor** → `spots`.
2. Find the new row with `status = pending` — every user submission lands there.
3. Click the row's `status` cell → change it to `approved` → save (Enter).
4. Done. The row now passes the anon SELECT policy, so it appears on the public map and list
   the next time the app loads spots.

There is no admin UI on purpose — the dashboard is the admin tool. Check a submission before
approving it, and never approve rows in bulk.

## 3. Weekly heartbeat (free tier)

**Supabase free projects auto-pause after ~7 days of inactivity.** A paused project makes the
app look dead to early users. Set up a weekly heartbeat: a scheduled job (e.g. a GitHub Actions
cron) that runs one **real query** against the database once a week — a plain REST ping is not
enough. Full details and the other free-tier limits: `docs/deployment.md` §5.

## 4. Safety rules already baked into these files

- RLS is enabled and must stay enabled.
- Anon can only: SELECT rows where `status = 'approved'`, INSERT rows that are
  `status = 'pending'` and `source = 'user'`, and EXECUTE `bump_verified`.
- There is deliberately **no anon UPDATE or DELETE policy** anywhere — anonymous visitors can
  never edit or delete data. The only change they can trigger is the 1-per-spot-per-hour
  `last_verified_at` bump through the function.
- Never put any Supabase key in this folder or any frontend file. The anon key belongs only in
  `src/lib/config.js`; the service key lives only in an environment variable for the seed script.
