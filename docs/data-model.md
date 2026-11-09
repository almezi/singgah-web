# Data model — Singgah `spots` table

*What this doc does: explains every column, every allowed value, and who is allowed to read or
write each row. Source of truth: `SPEC-singgah.md` → Data Model. Companion: `docs/api-contract.md`.*

**Status: planned.** Ask the owner before any schema change. If a decision changes, update
`SPEC-singgah.md` FIRST, then this doc.

---

## 1. Table definition (SQL reference)

```sql
create table spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in
    ('masjid_besar','musala','terminal','spbu','rest_area')),
  lat double precision not null,
  lng double precision not null,
  water text check (water in
    ('kran_mandi','wudhu_only','air_isi','tidak_ada') or water is null),
  hours text,                -- free text, e.g. '24 jam'
  bike_parking boolean default false,
  women_friendly boolean,    -- null = belum ada info (shown as such, never guessed)
  notes text,                -- etiquette notes, e.g. 'izin dulu untuk tidur'
  status text not null default 'pending' check (status in ('approved','pending')),
  source text not null default 'user' check (source in ('osm','playbook','user')),
  last_verified_at timestamptz,
  created_at timestamptz default now()
);
```

## 2. Column by column

| Column | Type | Null? | Default | Shown in UI as |
|---|---|---|---|---|
| `id` | uuid | no | generated | never shown |
| `name` | text | no | — | card title, detail title |
| `type` | text | no | — | colored badge + pin glyph |
| `lat` | double | no | — | marker position, `Rute` link |
| `lng` | double | no | — | marker position, `Rute` link |
| `water` | text | yes | `null` | `Air` row |
| `hours` | text | yes | `null` | `Jam` row |
| `bike_parking` | boolean | yes | `false` | `Parkir sepeda` row |
| `women_friendly` | boolean | yes | `null` | `Ramah perempuan` row (3-state) |
| `notes` | text | yes | `null` | amber etiquette box |
| `status` | text | no | `pending` | pending spots appear only in `Tinjauan saya` |
| `source` | text | no | `user` | internal, not shown |
| `last_verified_at` | timestamptz | yes | `null` | `Diverifikasi …` / `Belum diverifikasi` |
| `created_at` | timestamptz | yes | `now()` | internal |

### Allowed value → Indonesian label

| `type` | Badge | Pin color | Glyph |
|---|---|---|---|
| `masjid_besar` | `Masjid Besar` | teal `#0E7C66` | dome |
| `musala` | `Musala` | violet `#9333EA` | building |
| `terminal` | `Terminal` | amber `#B45309` | bus |
| `spbu` | `SPBU` | water blue `#0E7490` | droplet |
| `rest_area` | `Rest Area` | green `#15803D` | tent |

| `water` | Label |
|---|---|
| `kran_mandi` | `Kran mandi` |
| `wudhu_only` | `Wudhu saja` |
| `air_isi` | `Air isi` |
| `tidak_ada` | `Tidak ada` |
| `null` | `Belum ada info` |

`women_friendly`: `true` → `Ya`, `false` → `Tidak`, `null` → `Belum ada info` (the default in the
add form). `bike_parking`: `true` → `Ya`, `false` → `Tidak`.

**Never invent a default.** A missing value is shown as `Belum ada info`, not guessed. See
`docs/ui-copy.md` for the exact strings.

## 3. Row Level Security (must be on)

| Who | Action | Rule |
|---|---|---|
| anon | `SELECT` | only where `status = 'approved'` |
| anon | `INSERT` | allowed, but forced to `status = 'pending'` and `source = 'user'` |
| anon | `UPDATE` | **forbidden** |
| anon | `DELETE` | **forbidden** |
| owner (dashboard) | all | full access, including approving pending rows |

The verification bump is the exception that needs design: `Masih ada ✓` must update
`last_verified_at` but an anon key cannot `UPDATE`. It needs a rate-limited write path — either a
Supabase Edge Function or a Postgres function — limited to **one bump per spot per hour**.
**Undecided: see `docs/decision-log.md` (OQ-1) and gate G3 in `tasks/todo.md`.**

Consequence that must hold: `pending` rows are never readable anonymously, so the frontend can
never accidentally show them. Public list and map are built from `loadApprovedSpots()` only.

## 4. Where rows come from

| `source` | Who creates it | `status` on insert |
|---|---|---|
| `playbook` | `scripts/seed-spots.mjs` from `data/playbook-spots.json` | `approved` |
| `osm` | `scripts/seed-spots.mjs` from Overpass API | `approved` |
| `user` | the add-spot form in the browser | `pending` |

The playbook JSON is **research data** — do not rewrite it casually or delete it. It comes from the
real Jakarta→Yogyakarta trip playbook. Note: the source playbook markdown named in
`HANDOFF-musafir-project.md` is **not currently in this repo**; the owner must copy it in before
step D1. This is a real gap, listed in `docs/decision-log.md` (OQ-6).

### OSM tag mapping (from `docs/research-osm-seeding.md`)

Base query tag: `amenity=place_of_worship` + `religion=muslim`. A live test returned **282
elements** in the central Yogya bbox. `amenity=prayer_room` has 0 uses in Indonesia — ignore it.

- `name` → `name` (91% filled; 9% unnamed need a `Musala (tanpa nama)` fallback)
- `building=mosque` + name regex `musal|musoll|mushol|surau|langgar` → `type`
- `opening_hours` → `hours` (only 3% filled — keep `null` by default)
- `toilets`, `drinking_water`, `wheelchair` → optional hints, rarely populated
- **Dedupe** by proximity + name similarity (node-on-building duplicates are common)
- Always send a `User-Agent`; retry with backoff and a mirror fallback (Overpass returns 502s)

**Important honesty limit:** OSM facility tags are effectively empty (toilets 0.4%, drinking
water 0%, opening hours 3%). We cannot promise water/toilet availability from OSM alone. Unknown
stays unknown, and on-site verification is the primary data loop.

Attribution `© OpenStreetMap contributors` is mandatory (ODbL). Data is ODbL licensed.

## 5. Backfill / seed rules

- Never pre-cache OSM tiles (tile usage policy).
- Upsert with a `--dry-run` flag first; show the count before writing.
- Target: **≥ 100 approved spots** across Yogya + the Jakarta→Yogya corridor, including the
  playbook spots (Giwangan musala, Masjid Jami Ni'matul Ittihad, etc.).
- Kemenag/SIMAS data is browse-only with anti-scraping — not usable as open data. Use its counts
  only as a coverage yardstick (Kota Yogya 2023: 542 masjid + 512 musholla vs 282 OSM elements).

## 6. Related docs

- `docs/api-contract.md` — the JS-side field contract
- `docs/research-osm-seeding.md` — the full Overpass research
- `docs/owner-guide.md` — approving pending rows in the dashboard
