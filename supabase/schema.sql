-- supabase/schema.sql — creates the `spots` table exactly as docs/data-model.md §1.
-- Run this FIRST in the Supabase SQL editor (see supabase/README.md for the run order).

-- Safe to re-run: `if not exists` leaves an existing table untouched.
-- `gen_random_uuid()` is built into PostgreSQL 13+ — every Supabase project has it,
-- so no extension setup is needed.
create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in
    ('masjid_besar','musala','terminal','spbu','rest_area')),
  lat double precision not null,
  lng double precision not null,
  water text check (water in
    ('kran_mandi','wudhu_only','air_isi','tidak_ada') or water is null),
  hours text,                -- free text, e.g. '24 jam' (null = belum ada info)
  bike_parking boolean default false,
  women_friendly boolean,    -- null = belum ada info (shown as such, never guessed)
  notes text,                -- etiquette notes, e.g. 'izin dulu untuk tidur'
  status text not null default 'pending' check (status in ('approved','pending')),
  source text not null default 'user' check (source in ('osm','playbook','user')),
  last_verified_at timestamptz,
  created_at timestamptz default now()
);

-- NOTE: no extra columns, indexes or constraints are added here on purpose. The table must
-- match docs/data-model.md §1 and the frozen SPOT field contract (docs/api-contract.md §5)
-- exactly. Schema changes need the owner's approval first (AGENTS.md).
