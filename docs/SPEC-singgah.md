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
   browser", not a native app. App-store packaging (PWA/TWA) is out of scope for MVP. Desktop
   layout confirmed at gate G4, 2026-11-09: keep the always-on map (two-pane), as the board shows.
6. **UI framework:** Bootstrap 5 (CSS + Icons) as npm dependencies replaces hand-rolled CSS
   (locked with owner, 2026-11-09; moved from CDN to npm on 2026-11-14 with OQ-15). The approved
   look and design tokens live in `design/singgah-mockup.html`.
7. **Dark mode:** v0.1 ships a light/dark toggle (`data-bs-theme`, persisted in `localStorage`).
   The approved board stays the light-theme reference; dark tokens live in
   `docs/design-system.md` §6. Confirmed with the owner at gate G1, 2026-11-09.
8. **App framework — Vue 3 + Vite (amends the original stack, 2026-11-14, OQ-15):** the MVP is a
   Vue 3 single-page app built with Vite (JavaScript, no TypeScript). The original "plain
   HTML/JS, no framework, no build step, no npm project" choice (locked 2026-11-09) is amended
   with the owner's consent: the owner's goal is learning Vue for their career, and no app code
   existed yet, so the switch cost is documents only. supabase-js v2 is used via npm (amending
   OQ-2's plain-fetch choice). The verified plain-JS `prototype/` stays untouched as the design
   reference — it is not migrated.

## Tech Stack

| Piece | Choice | Why |
|---|---|---|
| Frontend | Vue 3 (Composition API, Single-File Components, JavaScript) + Vite; Bootstrap 5.3 CSS + Bootstrap Icons as npm dependencies | Component structure; industry-standard skill for the owner (OQ-15, 2026-11-14) |
| Map | Leaflet 1.9 (npm) + OpenStreetMap tiles | Free, no API key |
| Database | Supabase (free tier) via supabase-js v2 (npm; OQ-2 amended 2026-11-14 — supersedes the plain-`fetch` wrapper) | Free, has dashboard for approving spots; the standard client |
| Hosting | Vercel free tier (Netlify/Cloudflare Pages are acceptable substitutes) — auto-detects Vite, runs `npm run build`, serves `dist/` | Free, one-command deploy |
| Seed tooling | Node ≥ 18 script hitting the Overpass API + a JSON file of playbook spots (outside the Vue app) | OSM already has mosques mapped; the trip playbook is real data |

Vite is the bundler and dev server. No TypeScript in v0.1 — plain JavaScript inside `.vue` files
keeps the learning curve gentle. The only install is `npm install` (once).

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
- Nobody: `update`/`delete` via anon key. The one exception: `Masih ada ✓` calls the
  `bump_verified(spot_id)` Postgres function (`security definer`), which updates only
  `last_verified_at` on an approved row, rate-limited to one bump per spot per hour. Decided at
  gate G3, 2026-11-09 — see Open Question 1 (resolved).

## Commands

```
Install (once):       npm install                     # Vue, Vite, Bootstrap, Leaflet, supabase-js
Dev (local server):   npm run dev                     # Vite dev server with hot reload
Stop (local server):  Ctrl+C in the dev terminal      # kills the Vite dev server, nothing is lost
Seed database:        node scripts/seed-spots.mjs     # Overpass + playbook JSON → Supabase
Deploy:               npx vercel --prod               # auto-detects Vite: builds, then serves dist/
```

No lint, no test runner in MVP (see Testing Strategy). `npm run build` produces `dist/`.

## Project Structure

```
singgah-web/
├── index.html               # Vite entry: one root <div> + module script
├── prototype/
│   └── index.html           # verified plain-JS prototype — untouched design reference
├── src/
│   ├── main.js              # createApp + Bootstrap CSS/Icons imports + theme bootstrap
│   ├── App.vue              # layout shell: two-pane desktop, bottom sheet on mobile
│   ├── lib/
│   │   ├── config.js        # Supabase URL + anon key (public by design) + TILE_URL
│   │   └── supabase.js      # supabase-js client: loadApprovedSpots / insertPendingSpot / bumpVerified
│   ├── composables/
│   │   ├── useSpots.js      # approved-spots state, search + type filters, own pending spots
│   │   └── useGeolocation.js# navigator.geolocation wrapper with Indonesian failure toast
│   └── components/
│       ├── MapPane.vue      # Leaflet init, teardrop pins, pin-drop mode
│       ├── SpotList.vue     # card list + search + type chips + "Tinjauan saya"
│       ├── SpotDetail.vue   # detail fields + "Masih ada ✓" + Rute link
│       ├── AddSpotSheet.vue # tap map → pin → add form → success
│       └── DarkModeToggle.vue
├── scripts/
│   └── seed-spots.mjs       # OSM Overpass import + playbook spots import (Node, not part of the build)
├── data/
│   └── playbook-spots.json  # researched spots from the Jakarta→Yogya trip
├── docs/                    # full documentation set — index in docs/README.md
│   └── SPEC-singgah.md      # this file — source of truth
└── tasks/                   # plan.md, todo.md
```

## Code Style

Simple, commented for a reader who is learning. UI strings Indonesian, code comments simple English.

```js
// src/lib/supabase.js — satu pintu untuk semua panggilan Supabase
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function loadApprovedSpots() {
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .eq('status', 'approved');
  if (error) throw error;
  return data; // array of spot objects
}
```

- `camelCase` for JS functions/variables, `PascalCase.vue` for components, one job per file.
- Every file starts with a one-line comment saying what it does.
- No cleverness: explicit code over compact code. If it needs a comment to understand, simplify first.
- Unknown values are shown honestly: "belum ada info" — never invented defaults.
- Bootstrap first: use built-in components and utilities (offcanvas, toast, badge, btn) before
  writing any custom CSS; custom CSS is limited to the token override block, map pins, and
  sheet mechanics.

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
- Adding any dependency beyond Vue, Vite, Bootstrap, Leaflet + supabase-js (all npm).
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

1. **Verification writes — DECIDED 2026-11-09 (gate G3): Postgres function.** A
   `bump_verified(spot_id uuid)` function (`security definer`) is the only write path anon can
   reach: it updates only `last_verified_at` on an approved row and enforces the rate limit of
   one bump per spot per hour inside the database. Called from `js/api.js` via
   `POST /rest/v1/rpc/bump_verified`. The Edge Function alternative was rejected for MVP — it adds
   a separate runtime and deploy step for no benefit at this scale. No anon `UPDATE`/`DELETE`
   policies are added.
2. **Hosting account:** Supabase project created 2026-11-14 (URL + anon key recorded by the
   owner). The Vercel account is the remaining half of gate G2 — deferred to before deploy
   (decision-log OQ-14).
3. **Exact tile style:** default OSM tiles for MVP; a friendlier style (e.g. Carto) is a
   one-line swap later if desired.
4. **Supabase free tier auto-pause:** free projects pause after 7 days of inactivity — before
   launch, set up a weekly heartbeat (e.g. GitHub Actions cron hitting a real query).
   Researched 2026-11-09.
5. **OSM tile policy + mobile path:** OSM tile usage policy bans bulk/pre-emptive caching —
   keep tiles network-only in v0.1 with the tile URL in one config constant. Mobile path
   decided from research 2026-11-09: PWA-first, TWA to Play Store later (manifest + icons
   prepared at real build).

## Out of Scope (parked on purpose — revisit after dogfooding)

Accounts/profiles · photos · reviews & comments · offline/PWA · moderation dashboard
(*scheduled for v0.2* — owner review page with Supabase Auth, decided 2026-11-15, OQ-17) ·
Play Store / TWA · turn-by-turn navigation · cities outside Yogya + corridor.
