# Technology structure — Singgah

*What this doc does: explains the shape of the technology stack and how data moves through it.
Read this first if you are new to the project. Sources of truth: `docs/SPEC-singgah.md`,
`AGENTS.md`.*

**Status: backend app planned, not built. Revised 2026-11-14 for the Vue 3 + Vite stack (OQ-15).**
The Supabase-backed app does not exist yet; what does exist is the clickable mock-data prototype
`prototype/index.html` (Wave P, verified 2026-11-10 — `docs/prototype-verification.md`), which is
**plain JS on purpose and stays untouched as the design reference** — it is not the architecture
described here. This doc describes the system we intend to build, so parallel agents and the
owner share one mental model. If a decision changes, update `docs/SPEC-singgah.md` FIRST, then
this doc.

---

## 1. The one-sentence shape

**A Vue 3 single-page app, built by Vite, that talks directly to a hosted database.** There is no
server we write and no backend code — the browser loads one built bundle, then reads spots from
Supabase over HTTPS. Bootstrap, Leaflet and supabase-js are npm dependencies bundled by Vite.

That shape serves the owner's goal (OQ-15, 2026-11-14: learn Vue for their career) while keeping
the project's rule: every file readable top to bottom, "it just works" over cleverness.

## 2. Layer map

```
   ┌─────────────────────────────────────────────────────────────────────┐
   │  BROWSER (phone or laptop, mobile data)                              │
   │                                                                     │
   │  index.html (Vite entry) ── loads ──> dist/ bundle built by Vite     │
   │      │                                                              │
   │      ├── src/main.js      createApp + Bootstrap CSS/Icons imports    │
   │      ├── src/App.vue      layout shell (two-pane desktop / sheet)    │
   │      ├── src/lib/         config.js + supabase.js (client)           │
   │      ├── src/composables/ useSpots.js + useGeolocation.js            │
   │      └── src/components/  MapPane · SpotList · SpotDetail ·          │
   │                           AddSpotSheet · DarkModeToggle              │
   │                                                                     │
   │      npm deps bundled in: Bootstrap 5.3 + Icons · Leaflet 1.9 ·      │
   │                           @supabase/supabase-js v2                   │
   └───────┬───────────────────────────────┬─────────────────────────────┘
           │ HTTPS (anon key only)          │ HTTPS (tiles, no API key)
           ▼                               ▼
   ┌───────────────────────┐      ┌──────────────────────────────┐
   │  SUPABASE (free tier) │      │  OpenStreetMap tile server   │
   │  Postgres table spots │      │  tile.openstreetmap.org      │
   │  + PostgREST REST API │      │  (network only, never cached)│
   │  + Row Level Security │      └──────────────────────────────┘
   │  + dashboard (owner)  │
   └───────────┬───────────┘
               │ owner-only, manual
               ▼
   ┌─────────────────────────────────────────────────────────────────────┐
   │  OFFLINE TOOLING (never shipped to the browser)                     │
   │  scripts/seed-spots.mjs  (Node >= 18) ──> Overpass API              │
   │  data/playbook-spots.json (researched real spots)                    │
   └─────────────────────────────────────────────────────────────────────┘

   Hosting: Vercel free tier — auto-detects Vite, `npm run build` → `dist/`,
   deployed with `npx vercel --prod`
```

### What each layer is responsible for

| Layer | Files / service | Job | Must NOT do |
|---|---|---|---|
| Entry | `index.html` + `src/main.js` | Root div, `createApp`, Bootstrap imports, theme bootstrap | Contain business logic |
| Shell | `src/App.vue` | Two-pane layout, mounts the five components, wires props/emits | Own a lane's logic |
| UI kit | Bootstrap 5 + Icons (npm) | Offcanvas, toast, badge, buttons, validation, dark mode | Be replaced by custom JS widgets |
| Map | `MapPane.vue` + Leaflet (npm) | Map init, markers, geolocate, pin-drop mode | Write to the database |
| View | `SpotList.vue`, `SpotDetail.vue` | List cards, detail card, verification button | Own the map |
| Input | `AddSpotSheet.vue` | Add-spot flow, form, success state | Publish a spot directly |
| Data | `src/lib/*` | Constants + the only Supabase calls | Change shape without telling other lanes |
| State | `src/composables/useSpots.js` | Spots, filters, pending-mine — one source of truth | Be bypassed by lane-to-lane calls |
| Store | Supabase `spots` + RLS | Persist spots, enforce who sees/writes what | Trust the frontend |
| Seed | `scripts/seed-spots.mjs` | Batch-import OSM + playbook spots | Run in the browser |

## 3. The three data flows

**Read (public, every page load)**
`App.vue` mounts → `useSpots.load()` → `loadApprovedSpots()` → supabase-js
`from('spots').select('*').eq('status','approved')` → RLS returns approved rows only → the same
array drives `SpotList.vue` and `MapPane.vue` (props). Pending rows are filtered by the database,
not by JavaScript. This is a hard boundary: the frontend never receives them.

**Write (contribute, anonymous)**
`AddSpotSheet.vue` → `insertPendingSpot(payload)` → insert with
`status: 'pending'`, `source: 'user'`, `last_verified_at: null` → RLS forces pending → the row is
invisible to everyone until the owner approves it in the Supabase dashboard. No login, no
accounts.

**Verify (decided at G3, 2026-11-09: Postgres function)**
`Masih ada ✓` in `SpotDetail.vue` → `bumpVerified(spotId)` → `supabase.rpc('bump_verified')` → a
Postgres function (`security definer`) updates only `last_verified_at` on an approved row,
enforcing **1 bump per spot per hour inside the database**. Anon still has no
`UPDATE`/`DELETE` policies — the function is the only write path it can reach. The Edge Function
alternative was rejected for MVP (extra runtime + deploy step). See `docs/decision-log.md`
(OQ-1, resolved).

**Seed (one-off, offline, not a runtime flow)**
Node script reads `data/playbook-spots.json`, queries Overpass for mosques/musala in the Yogya
bbox + Jakarta→Yogya corridor, dedupes by name + proximity, maps OSM tags to our columns, and
upserts with `status: 'approved'`, `source: 'osm' | 'playbook'`. It uses a privileged key via an
environment variable — **never** a key in any frontend file. See `docs/research-osm-seeding.md`.

## 4. Security boundary

The **database** is the security boundary, not the browser. Three rules:

1. The browser holds only the **anon key**. It is public by design (it ships inside the Vite
   bundle); RLS makes that safe. The `service_role` key must never appear in any frontend file,
   nor in git.
2. RLS: anon `SELECT` where `status = 'approved'`; anon `INSERT` forced to pending/user;
   **no** anon `UPDATE` or `DELETE`.
3. No personal data is collected. No emails, no phone numbers, no accounts.

OSM tiles stay network-only. The OSM tile policy bans bulk and pre-emptive caching, so v0.1 has
no offline map and no service worker caching of tiles. The tile URL lives in **one** config
constant (`src/lib/config.js`) so a later switch to a friendlier style is a one-line change.
Attribution `© OpenStreetMap contributors` is mandatory (ODbL).

## 5. Screen state machine (single page, no router)

```
map + list ──tap card/marker──> detail ──Rute──> Google Maps (external link)
    │                             │
    │ + Tambah                    └─ Masih ada ✓ ─> bumpVerified() ─> re-render line
    ▼
pin-drop mode ──pin placed──> Lanjut ──> add form (offcanvas)
                                            │
                                        Kirim untuk ditinjau
                                            ▼
                                     success state ──> back to list
```

No vue-router and no Pinia in v0.1: `App.vue` decides which panel is visible with plain refs, and
`useSpots.js` is the single shared state. Under 992px the list/detail live in a bottom sheet over
a full-screen map; at 992px and up the sheet becomes a static left sidebar and the map fills the
rest. Same components both sizes, CSS-driven (confirmed at gate G4, 2026-11-09: the always-on
two-pane desktop stays).

## 6. What is deliberately absent

No TypeScript, no vue-router, no Pinia/Vuex, no other UI framework, no test runner, no
PWA/offline, no service worker, no photos, no accounts, no reviews, no admin UI, no instant
publish, no second tile provider. All parked on purpose — see `docs/SPEC-singgah.md` →
Boundaries and Out of Scope.

**"Mobile" here means a phone browser, not a native app** (SPEC decision 5). The future mobile
path wraps this same Vue app as a PWA → TWA; it is not a React Native conversion. The
React/React Native idea was considered and rejected before OQ-15 — see
`docs/decision-log.md` §F.

## 7. Why this structure suits parallel agents

`src/lib/*`, the component props/emits list and the `useSpots` shape are the **contract**. Every
other lane builds against it by name and never edits it. Because no two lanes own the same file,
2 agents can work at once with zero merge conflicts. The full breakdown is in `tasks/todo.md`;
the frozen interface spec is in `docs/api-contract.md`.

## 8. Related docs

- `docs/api-contract.md` — frozen function signatures, props/emits, state shape
- `docs/data-model.md` — the `spots` table, column by column
- `docs/design-system.md` — colors, type, spacing, accessibility
- `docs/setup.md` / `docs/deployment.md` — running and shipping it
- `docs/decision-log.md` — locked decisions and open questions (OQ-15 = the Vue switch)
- `docs/research-mobile-strategy.md`, `docs/research-osm-seeding.md` — the research behind it
