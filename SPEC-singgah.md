# Spec: Singgah — musafir spot-finder (MVP v0.1)

## Objective

**What:** A mobile-first web app where traveling cyclists and backpackers in Indonesia find free
wash & rest spots: masjid besar, neighborhood musala, terminal musala, SPBU, rest areas.

**Why:** Every musafir on the road asks the same question — *"di mana saya bisa mandi dan istirahat
gratis?"* — and no map answers it. The seed data model comes from the real Jakarta→Yogyakarta trip
playbook (real spots, real constraints: water type, hours, bike parking, mosque etiquette).

**Who:** Budget musafir on bikes (first user: the owner, in Yogya, on their own trips).

**Success looks like:** A live URL the owner opens on their phone on real mobile data, with 100+
real spots in Yogya and along the Jakarta→Yogya corridor, where anyone can add a spot and confirm
one still exists. The owner uses it on their next ride — that is the real acceptance test.

## Decisions (locked with the owner — do not relitigate silently)

1. **Launch area:** Yogya city + Jakarta→Yogya corridor (not all Indonesia).
2. **Contribution:** open add, no login — new spots go to a `pending` queue; only `approved` spots
   are public. Owner approves via the Supabase dashboard (no admin UI in MVP).
3. **UI language:** Indonesian only.
4. **Build style:** ZCode builds the whole MVP, then gives a guided tour of every file.
5. **Platform:** web-first — the MVP runs in the browser at a URL, opened on a laptop OR a phone
   (most users are cyclists on the road, so the layout is mobile-first and desktop gets a widened
   two-pane version of the same screens). "Mobile" in the mockup means "viewed in a phone
   browser", not a native app. App-store packaging (PWA/TWA) is out of scope for MVP.

## Tech Stack

| Piece | Choice | Why |
|---|---|---|
| Frontend | Plain HTML/CSS/JS, no framework, no build step | Owner is a beginner; every file readable |
| Map | Leaflet 1.9 (CDN) + OpenStreetMap tiles | Free, no API key |
| Database | Supabase (free tier), accessed with `supabase-js` v2 via CDN | Free, has dashboard for approving spots |
| Hosting | Vercel free tier (Netlify/Cloudflare Pages are acceptable substitutes) | Free, deploys a static site in one command |
| Seed tooling | Node ≥ 18 script hitting the Overpass API + a JSON file of playbook spots | OSM already has mosques mapped; the trip playbook is real data |

No npm project, no bundler, no TypeScript. The only "install" is nothing — files are served as-is.

## Data Model (Supabase table `spots`)

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

**Row Level Security (must be on):**
- Everyone (anon): `select` only where `status = 'approved'`.
- Everyone (anon): `insert` — but inserts are forced to `status = 'pending'` and `source = 'user'`.
- Nobody: `update`/`delete` via anon key. Verification bump happens with the owner's key only…
  see Open Questions (this is the one hard technical spot in the MVP).

## Commands

```
Dev (local server):   python3 -m http.server 8080     # then open http://localhost:8080
Seed database:        node scripts/seed-spots.mjs     # Overpass + playbook JSON → Supabase
Deploy:               npx vercel --prod               # first run links a free Vercel account
```

No build, no lint, no test runner in MVP (see Testing Strategy).

## Project Structure

```
singgah-web/
├── index.html               # single page: map + list + detail + add form
├── css/
│   └── style.css            # mobile-first styles
├── js/
│   ├── config.js            # Supabase URL + anon key (anon key is public by design)
│   ├── api.js               # small fetch wrapper around Supabase REST
│   ├── map.js               # Leaflet init, markers, geolocate button
│   ├── spots.js             # list + detail card rendering
│   ├── contribute.js        # tap map → drop pin → add-spot form
│   └── verify.js            # "Masih ada ✓" button
├── scripts/
│   └── seed-spots.mjs       # OSM Overpass import + playbook spots import
├── data/
│   └── playbook-spots.json  # researched spots from the Jakarta→Yogya trip
├── docs/
│   └── manual-test-checklist.md
├── SPEC-singgah.md          # this file — source of truth
└── tasks/                   # created in planning phase: plan.md, todo.md
```

## Code Style

Simple, commented for a reader who is learning. UI strings Indonesian, code comments simple English.

```js
// js/spots.js — ambil spot yang sudah approved untuk peta
async function loadApprovedSpots() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/spots?status=eq.approved&select=*`, {
    headers: supabaseHeaders(),
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json(); // array of spot objects
}
```

- `camelCase` for JS functions/variables, `kebab-case` for file names, one job per file.
- Every file starts with a one-line comment saying what it does.
- No cleverness: explicit code over compact code. If it needs a comment to understand, simplify first.
- Unknown values are shown honestly: "belum ada info" — never invented defaults.

## Testing Strategy

No automated test framework in MVP — adding one before there is anything to test would be
process theater. Verification is a **manual checklist** (`docs/manual-test-checklist.md`), run
before every deploy:

1. Map loads on mobile viewport; geolocate button works.
2. Markers appear for approved spots; pending spots are NOT visible anywhere.
3. Detail card shows type, water, hours, bike parking, last-verified (or "belum diverifikasi").
4. Add-spot flow: tap map → form → submit → row appears in Supabase as `pending`.
5. Approve one spot in the Supabase dashboard → it appears on the map.
6. Verify button updates `last_verified_at`.
7. Whole page works on real phone, real mobile data, before calling anything done.

Plus the dogfood criterion: the owner uses the app on one real trip.

## Boundaries

**Always:**
- New user-submitted spots default to `status = 'pending'`.
- Keep UI text in Indonesian; keep all UI strings findable in one place per file.
- Run the manual checklist before deploying.
- Update this spec first when a decision changes, then change code.
- Keep `data/playbook-spots.json` accurate — it is research data.

**Ask first:**
- Any change to the `spots` table schema.
- Adding any dependency beyond Leaflet + supabase-js (both via CDN).
- Adding authentication, photos, reviews, offline mode, or an admin UI.
- Switching hosting provider.

**Never:**
- Put the Supabase `service_role` key anywhere in the frontend. Anon key only.
- Collect personal data (emails, phone numbers) in MVP.
- Deploy with user-submitted spots visible before approval.
- Delete or rewrite `data/playbook-spots.json` without asking.

## Success Criteria

1. A public URL loads the app on a phone over mobile data.
2. Map shows **≥ 100 approved spots** across Yogya + the Jakarta→Yogya corridor, including the
   playbook spots (Giwangan musala, Masjid Jami Ni'matul Ittihad, etc.).
3. Tapping a marker opens a detail card with type / water / hours / bike parking / women-friendly /
   last-verified, with "belum ada info" where data is missing.
4. Anyone can add a spot from the phone; it lands `pending` and is not publicly visible.
5. Owner can approve a pending spot in the Supabase dashboard and it appears on the map.
6. "Masih ada ✓" updates `last_verified_at` on an approved spot.
7. UI is 100% Indonesian.
8. Manual checklist passes on a real phone; owner completes one real-trip dogfood session.

## Open Questions

1. **Verification writes (the one hard spot):** the "Masih ada ✓" button must update a row, but
   anon keys can't `update` under the RLS above. Cheapest honest fix: a free Supabase **Edge
   Function** (or equivalent) that accepts `{spot_id}` and bumps the timestamp, rate-limited to
   one bump per spot per hour. Alternative: allow anon update of *only* `last_verified_at` via a
   Postgres function. Decided in the plan phase — flagged now so it doesn't surprise us later.
2. **Hosting account:** owner must create the Supabase account (and Vercel or similar). This is
   the only manual step the owner owns; everything else is code.
3. **Exact tile style:** default OSM tiles for MVP; a friendlier style (e.g. Carto) is a
   one-line swap later if desired.

## Out of Scope (parked on purpose — revisit after dogfooding)

Accounts/profiles · photos · reviews & comments · offline/PWA · moderation dashboard ·
Play Store / TWA · turn-by-turn navigation · cities outside Yogya + corridor.
