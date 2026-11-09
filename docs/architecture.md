# Technology structure — Singgah

*What this doc does: explains the shape of the technology stack and how data moves through it.
Read this first if you are new to the project. Sources of truth: `SPEC-singgah.md`, `AGENTS.md`.*

**Status: planned, not built.** The repo is pre-code. This doc describes the system we intend to
build, so parallel agents and the owner share one mental model. It does not change any locked
decision. If a decision changes, update `SPEC-singgah.md` FIRST, then this doc.

---

## 1. The one-sentence shape

**A static web page that talks directly to a hosted database.** There is no server we write, no
build step, and no framework. The browser downloads a handful of plain files, then reads spots
from Supabase over HTTPS. Everything else (map tiles, icons, fonts) comes from a CDN.

That shape is locked because the owner is learning while building: every file must be readable
top to bottom, and "it just works" matters more than cleverness.

## 2. Layer map

```
   ┌─────────────────────────────────────────────────────────────────────┐
   │  BROWSER (phone or laptop, mobile data)                              │
   │                                                                     │
   │  index.html  ── loads ──>  css/style.css                            │
   │      │                    js/config.js  js/api.js                   │
   │      │                    js/map.js  js/spots.js                    │
   │      │                    js/contribute.js  js/verify.js             │
   │      │                                                             │
   │      ├── CDN: Bootstrap 5.3.3 + Bootstrap Icons 1.11.3             │
   │      ├── CDN: Leaflet 1.9.4 + supabase-js v2                       │
   │      ├── CDN: Plus Jakarta Sans (Google Fonts)                      │
   │      └── static DOM: #map  #spot-list  #detail  #add-form  ...      │
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

   Hosting: Vercel free tier, static files, `npx vercel --prod`
```

### What each layer is responsible for

| Layer | Files / service | Job | Must NOT do |
|---|---|---|---|
| Shell | `index.html` | All DOM mount points, CDN tags, script load order | Contain business logic |
| Styles | `css/style.css` | Token overrides, map pins, bottom-sheet mechanics | Re-implement Bootstrap |
| UI kit | Bootstrap 5 + Icons (CDN) | Offcanvas, toast, badge, buttons, validation, dark mode | Be replaced by custom JS widgets |
| Map | `js/map.js` + Leaflet (CDN) | Map init, markers, geolocate, pin-drop mode | Write to the database |
| View | `js/spots.js`, `js/verify.js` | List cards, detail card, verification button | Own the map DOM |
| Input | `js/contribute.js` | Add-spot flow, form, success state | Publish a spot directly |
| Data | `js/config.js`, `js/api.js` | Constants + the only Supabase calls | Change shape without telling other lanes |
| Store | Supabase `spots` + RLS | Persist spots, enforce who sees/writes what | Trust the frontend |
| Seed | `scripts/seed-spots.mjs` | Batch-import OSM + playbook spots | Run in the browser |

## 3. The three data flows

**Read (public, every page load)**
`index.html` → `loadApprovedSpots()` → REST `GET /rest/v1/spots?status=eq.approved&select=*`
→ RLS returns approved rows only → `renderList()` + `filterMarkers()`. Pending rows are filtered
by the database, not by JavaScript. This is a hard boundary: the frontend never receives them.

**Write (contribute, anonymous)**
`js/contribute.js` → `insertPendingSpot(payload)` → REST `POST` with
`status: 'pending'`, `source: 'user'`, `last_verified_at: null` → RLS forces pending → the row is
invisible to everyone until the owner approves it in the Supabase dashboard. No login, no accounts.

**Verify (the one hard technical spot)**
`Masih ada ✓` → `bumpVerified(spotId)` → a **rate-limited write path** updates only
`last_verified_at` (1 bump per spot per hour). An anon key cannot `UPDATE` under our RLS, so this
needs either a Supabase Edge Function or a Postgres function. **Undecided — see
`docs/decision-log.md` (OQ-1) and gate G3.** The choice belongs to the owner.

**Seed (one-off, offline, not a runtime flow)**
Node script reads `data/playbook-spots.json`, queries Overpass for mosques/musala in the Yogya
bbox + Jakarta→Yogya corridor, dedupes by name + proximity, maps OSM tags to our columns, and
upserts with `status: 'approved'`, `source: 'osm' | 'playbook'`. It uses a privileged key via an
environment variable — **never** a key in any frontend file. See `docs/research-osm-seeding.md`.

## 4. Security boundary

The **database** is the security boundary, not the browser. Three rules:

1. The browser holds only the **anon key**. It is public by design; RLS makes that safe.
   The `service_role` key must never appear in any frontend file, nor in git.
2. RLS: anon `SELECT` where `status = 'approved'`; anon `INSERT` forced to pending/user;
   **no** anon `UPDATE` or `DELETE`.
3. No personal data is collected. No emails, no phone numbers, no accounts.

OSM tiles stay network-only. The OSM tile policy bans bulk and pre-emptive caching, so v0.1 has
no offline map and no service worker caching of tiles. The tile URL lives in **one** config
constant so a later switch to a friendlier style is a one-line change. Attribution
`© OpenStreetMap contributors` is mandatory (ODbL).

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

The same DOM serves both sizes. Under 992px the list/detail live in a draggable bottom sheet over
a full-screen map. At 992px and up, the sheet becomes a static left sidebar and the map fills the
rest. No separate desktop code path. (Gate G4 may change the desktop mode — see decision log.)

## 6. What is deliberately absent

No npm project, no bundler, no TypeScript, **no React or any JS framework**, no test runner,
no PWA/offline, no service worker, no photos, no accounts, no reviews, no admin UI, no instant
publish, no second tile provider. All parked on purpose — see `SPEC-singgah.md` → Boundaries
and Out of Scope.

**"Mobile" here means a phone browser, not a native app** (SPEC decision 5). The future mobile
path wraps this same codebase as a PWA → TWA; it is not a React Native conversion. The
React/React Native idea was considered and rejected — see `docs/decision-log.md` §F.

## 7. Why this structure suits parallel agents

`js/config.js`, `js/api.js` and the `index.html` DOM IDs are the **contract**. Every other lane
calls those functions and IDs by name and never edits them. Because no two lanes own the same
file, 2 agents can work at once with zero merge conflicts. The full breakdown is in
`tasks/todo.md`; the frozen interface spec is in `docs/api-contract.md`.

## 8. Related docs

- `docs/api-contract.md` — frozen function signatures and DOM IDs
- `docs/data-model.md` — the `spots` table, column by column
- `docs/design-system.md` — colors, type, spacing, accessibility
- `docs/setup.md` / `docs/deployment.md` — running and shipping it
- `docs/decision-log.md` — locked decisions and open questions
- `docs/research-mobile-strategy.md`, `docs/research-osm-seeding.md` — the research behind it
