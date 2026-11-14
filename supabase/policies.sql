-- supabase/policies.sql — enables Row Level Security on `spots` and creates exactly the
-- two anon policies the spec allows (docs/data-model.md §3). Run this SECOND, after schema.sql.

-- ---------------------------------------------------------------------------
-- 1. Enable RLS (a hard boundary in AGENTS.md — it must always stay on).
--    This line is safe to re-run; enabling an already-enabled table changes nothing.
-- ---------------------------------------------------------------------------
alter table public.spots enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Anon SELECT: approved rows only.
--    The USING clause filters every row: anything with status != 'approved'
--    (i.e. every pending row) is invisible to anon, so pending spots can never
--    leak to the public map or list.
-- ---------------------------------------------------------------------------
drop policy if exists "anon_select_approved_spots" on public.spots;
create policy "anon_select_approved_spots"
  on public.spots
  for select
  to anon
  using (status = 'approved');

-- ---------------------------------------------------------------------------
-- 3. Anon INSERT: forced to status='pending' AND source='user'.
--    The WITH CHECK clause is what forces every anon insert to land pending + user:
--    the DATABASE itself rejects any insert whose new row fails this test — for example
--    status='approved' or source='osm' — no matter what the client sends. So an anonymous
--    visitor can never publish a spot directly; the only person who can turn a row
--    approved is the owner, in the Supabase dashboard (see supabase/README.md).
-- ---------------------------------------------------------------------------
drop policy if exists "anon_insert_pending_user_spots" on public.spots;
create policy "anon_insert_pending_user_spots"
  on public.spots
  for insert
  to anon
  with check (status = 'pending' and source = 'user');

-- ---------------------------------------------------------------------------
-- 4. DELIBERATE ABSENCE — there is NO anon UPDATE policy and NO anon DELETE policy
--    in this file or anywhere else in the repo. That is on purpose: with RLS enabled
--    and no policy for an action, PostgreSQL rejects that action for anon by default,
--    so anonymous visitors can never change or remove any row. The ONLY anon write
--    path is the rate-limited bump_verified(spot_id) function
--    (supabase/functions/bump_verified.sql), which runs as the table owner and
--    touches just last_verified_at on approved rows. Do not add anon UPDATE/DELETE
--    policies later without asking the owner.
-- ---------------------------------------------------------------------------

-- Why seed rows (source='osm' / 'playbook', status='approved') can still exist:
-- scripts/seed-spots.mjs runs server-side with the service key, kept in an
-- environment variable and never committed. The service role bypasses RLS,
-- so the policies above do not apply to it.
