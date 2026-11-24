-- supabase/constraints.sql — server-side validation for anon-submitted spots (PR #1 review).
-- Run this FOURTH, after schema.sql, policies.sql and functions/bump_verified.sql.
-- The form's `maxlength` is only client-side; anyone can call the REST API directly, so the
-- DATABASE enforces the limits. Safe to re-run (drops and re-adds each constraint).
-- These limits match the add-spot form (AddSpotSheet.vue) and the existing data.
alter table public.spots drop constraint if exists spots_name_len;
alter table public.spots add constraint spots_name_len
  check (char_length(btrim(name)) between 1 and 120);

alter table public.spots drop constraint if exists spots_notes_len;
alter table public.spots add constraint spots_notes_len
  check (notes is null or char_length(notes) <= 300);

alter table public.spots drop constraint if exists spots_hours_len;
alter table public.spots add constraint spots_hours_len
  check (hours is null or char_length(hours) <= 60);

alter table public.spots drop constraint if exists spots_lat_range;
alter table public.spots add constraint spots_lat_range check (lat between -90 and 90);

alter table public.spots drop constraint if exists spots_lng_range;
alter table public.spots add constraint spots_lng_range check (lng between -180 and 180);
