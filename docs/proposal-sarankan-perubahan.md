# Proposal — "Sarankan perubahan" (suggest a change)

*What this doc does: proposes (1) a way for visitors to correct a spot's information without
being able to edit it directly, and (2) an owner review page to approve new spots and
suggestions without using the Supabase dashboard. Status: **PROPOSED 2026-11-24, awaiting owner approval (OQ-18).** No
code, schema or SPEC change is made until the owner approves this in a later turn.*

## 1. Problem

The spot detail page has no way to fix wrong or missing information. That is on purpose: anon has
no UPDATE policy, so a plain edit button would let anyone overwrite any spot. But most spots are
OSM rows with `Belum ada info` for water, hours and women-friendly, and the people who know the
real answer are the travelers standing at the spot.

## 2. Proposed behaviour

1. On the spot detail page, a secondary button **`Sarankan perubahan`** sits below `Masih ada ✓`.
2. It opens a sheet (same offcanvas pattern as the add-spot form), **pre-filled with the spot's
   current values**:
   - `Air` (select) · `Jam buka` (text) · `Parkir sepeda` (switch) · `Ramah perempuan`
     (Ya / Tidak / Belum ada info) · `Catatan` (textarea)
   - a checkbox **`Spot ini sudah tidak ada`** (closed, demolished, no longer allows visitors)
   - an optional `Keterangan` (why / what you saw), max 300 characters
3. `Kirim saran` is disabled until at least one field differs from the current value, or the
   "sudah tidak ada" box is ticked. Only the changed fields are sent.
4. Success: `Terima kasih! Saranmu akan ditinjau dulu.` The public spot does **not** change.
5. The owner reviews suggestions in the Supabase dashboard, applies the good ones to the
   `spots` row by hand, then marks the suggestion done.

**Not editable in v1:** `name`, `type`, `lat`/`lng`. Those are the fields that vandalism would hurt
most, and a wrong location is better handled by adding a new spot. (See open question Q1.)

## 3. Data model (new table — schema change, needs approval)

```sql
create table public.spot_suggestions (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  -- proposed values; null = "no change suggested for this field"
  water text check (water in ('kran_mandi','wudhu_only','air_isi','tidak_ada') or water is null),
  hours text check (hours is null or char_length(hours) <= 60),
  bike_parking boolean,
  women_friendly boolean,
  notes text check (notes is null or char_length(notes) <= 300),
  gone boolean not null default false,          -- "Spot ini sudah tidak ada"
  comment text check (comment is null or char_length(comment) <= 300),
  status text not null default 'pending' check (status in ('pending','done')),
  created_at timestamptz not null default now(),
  -- a suggestion must change something
  check (gone or water is not null or hours is not null or bike_parking is not null
         or women_friendly is not null or notes is not null)
);
```

**Limitation of "null = no change":** a visitor cannot suggest setting a known value back to
`Belum ada info`. That is acceptable: suggestions are for adding or correcting information.

**Row Level Security:**
- anon: `insert` only, forced to `status = 'pending'`, and only for a spot that is `approved`
  (`exists (select 1 from public.spots s where s.id = spot_id and s.status = 'approved')`).
- anon: **no** `select`, `update` or `delete`. Suggestions are never public. The owner reads them
  in the dashboard (service role bypasses RLS).
- The `spots` table and its policies are **unchanged**. No anon UPDATE on `spots` is added.

## 4. Code changes (after approval)

| File | Change |
|---|---|
| `supabase/suggestions.sql` | new: table, constraints, RLS, policy |
| `src/lib/supabase.js` | new `insertSuggestion(spotId, changes)` (insert, no `.select()`, same pattern as `insertPendingSpot`) |
| `src/composables/useSpots.js` | new `suggestChange(spotId, changes)` |
| `src/components/SuggestChangeSheet.vue` | new: the pre-filled form + success view |
| `src/components/SpotDetail.vue` | `Sarankan perubahan` button, emits `suggest(spotId)` |
| `src/App.vue` | wires the sheet, owns the toast and submit state (same honest pattern as add-spot) |
| tests | `changedFields(current, form)` helper: only changed fields are sent |

Docs updated in this order: `SPEC-singgah.md` (data model, RLS, success criteria) →
`decision-log.md` (OQ-18 closed) → `data-model.md`, `api-contract.md`, `ui-copy.md`,
`owner-guide.md` (how to review suggestions), `manual-test-checklist.md`, `tasks/todo.md`.

## 5. Risks and trade-offs

- **Spam.** No login means no per-person limit, the same as adding a spot. Suggestions are
  invisible until the owner acts, so spam costs review time but never reaches the public map.
- **Owner workload.** Every suggestion is applied by hand. Fine at MVP scale; the v0.2 review page
  (OQ-17) can add a one-click "apply" later.
- **No personal data.** The form collects no name, email or phone number.

## 6. Part 2 — owner review page (replaces dashboard work, OQ-17)

The owner does not want to edit rows in the Supabase dashboard. OQ-17 (2026-11-15) already
scheduled an owner review page with login for v0.2; this section designs it so it covers **both**
new spots and suggestions.

### What the page does

A separate page **`/tinjau.html`**, not linked from the public app.

- **Login:** the owner signs in with email + password (Supabase Auth). Public sign-up is switched
  off in Supabase, so the owner's account is the only one.
- **Tab `Spot baru`:** every pending spot from everyone, newest first. For each one: a small map,
  all fields editable, and the buttons `Setujui` (status → approved) and `Tolak` (delete).
- **Tab `Saran perubahan`:** every pending suggestion. It shows the **current value next to the
  suggested value** for each field, with a checkbox per field. `Terapkan` copies the ticked
  fields into the spot and marks the suggestion done. `Abaikan` marks it done without changes.
  A "sudah tidak ada" suggestion offers `Sembunyikan spot` (see Q5).
- **Tab `Semua spot`** (optional, Q6): search any approved spot and edit it directly.

### How it stays safe

- The page uses the **same anon key** as the public app. The **login session**, checked by RLS,
  is what gives the owner more rights. The `service_role` key still never appears in the frontend.
- A small `public.admins (user_id uuid primary key)` table lists who is the owner. A helper
  `public.is_admin()` returns true only for those users. Owner-only policies on `spots` and
  `spot_suggestions` use `is_admin()`. Being signed in is not enough by itself.
- `Terapkan` calls one Postgres function, `apply_suggestion(suggestion_id, fields text[])`. It
  checks `is_admin()` and updates the spot and the suggestion **in one transaction**, so a
  half-applied suggestion is impossible.
- Anon rights stay exactly as they are today.

### How it is built

- Vite multi-page build: `tinjau.html` + `src/admin/main.js` + `src/admin/*.vue`. **No Vue Router
  and no new dependency.** Admin code stays out of the public bundle.
- It reuses `spotView.js` (labels, `Belum ada info`) and the Bootstrap and Leaflet setup.

### What this changes in the locked decisions

- **Auth** is parked in the SPEC ("Ask first: adding authentication … or an admin UI"). This
  proposal is that ask.
- **Personal data:** only the owner's own login email is stored, in Supabase Auth. Visitors still
  give nothing.
- **"Owner approves via the Supabase dashboard"** (L3) changes to "via the review page". The
  dashboard still works as a fallback.

### Suggested order

1. **v0.1:** deploy the current MVP and do the dogfood trip. Review stays in the dashboard for now.
2. **v0.2:** build suggestions (Part 1) **and** the review page (Part 2) together. Shipping
   suggestions without the page would mean more dashboard work, which is what you want to avoid.

## 7. Owner answers (2026-11-24)

| Q | Answer |
|---|---|
| Q1 fields | Recommendation accepted: water, hours, bike parking, women-friendly, notes, "sudah tidak ada". Not name, type or location |
| Q2 timing | v0.2, after the first deploy |
| Q3 copy | Approved as written |
| Q4 login | **Open**: owner asked for pros and cons |
| Q5 closed spots | **Soft delete.** Implemented as a third `spots.status` value, `hidden`. The existing anon policy only reads `approved`, so hidden spots vanish from the map with no RLS change, and the owner can restore them from the review page |
| Q6 edit any spot | Yes: the `Semua spot` tab edits any approved or hidden spot |

The SPEC is updated once Q4 is answered, before any code.

## 8. Open questions for the owner (original list)

- **Q1. Which fields can be suggested?** Recommended: water, hours, bike parking, women-friendly,
  notes, and "sudah tidak ada". Not name, type or location.
- **Q2. When does it ship?** Recommended: after the first deploy and dogfood trip, so the first
  release is not delayed. It can also go in before deploy if you prefer.
- **Q3. Copy.** Button `Sarankan perubahan`, submit `Kirim saran`, success
  `Terima kasih! Saranmu akan ditinjau dulu.` OK, or different wording?
- **Q4. Login method for the review page.** Recommended: email + password (works offline from
  email, simple). Alternative: magic link sent to your email each time.
- **Q5. A spot reported "sudah tidak ada".** Recommended: add a third status `hidden` to `spots`
  (schema change), so the spot disappears from the map but can be restored. Alternative: delete
  it (cannot be undone).
- **Q6. Edit any approved spot from the page** (the `Semua spot` tab)? Recommended: yes, so you
  never need the dashboard.
