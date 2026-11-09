# TODO — Singgah web app (small steps, parallel agents)

**Status: APPROVED 2026-11-09 (gate G1).** The owner approved this list and `tasks/plan.md` with
the review fixes applied, and answered G3 (Postgres function), G4 (keep two-pane), G5 (prototype
first), OQ-2 (plain fetch) and OQ-13 (branching adopted) the same day. **Wave P is unblocked.**
Wave 0+ still waits on G2 (accounts), and D1 needs the playbook file (OQ-6).

**Sources of truth:** `SPEC-singgah.md` · `AGENTS.md` · `PROTOTYPE-PROMPT-singgah.md` ·
`MOCKUP-PROMPT-singgah.md` · `design/singgah-mockup-board.html` (12 frames; the six phone frames
are the component reference).

**Goal:** a public URL that opens on a phone over mobile data, shows 100+ approved spots in Yogya
and the Jakarta→Yogya corridor, lets anyone add a `pending` spot, and lets anyone confirm a spot
still exists.

---

## Parallel launch playbook (how you run multiple agents)

This list is built so **two agents can work at the same time with zero file conflicts** — every
lane owns different files, and the shared contract (`index.html`, `js/config.js`, `js/api.js`) is
frozen after Wave 0. You launch agents in waves of 2 using the copy-paste prompts at the bottom.

1. **Gates first (you, not an agent).** G1, G3, G4, G5, OQ-2 and OQ-13 are done (2026-11-09).
   Remaining: **G2** — create the Supabase + Vercel accounts — before Wave 0. Wave P needs no
   accounts and can run now.
2. **Wave P — prototype (1 agent).** G5 = yes: build `prototype/index.html` from
   `PROTOTYPE-PROMPT-singgah.md` (mock data, no backend). It owns only `prototype/`.
3. **Wave 0 — contract (1 agent, serial).** Run F1–F6. Everything waits on this; it defines the
   frozen DOM IDs and API the other lanes call by name.
4. **Wave 1 — map + list (2 agents, parallel).** Agent 1 = A1–A7 (`js/map.js`); Agent 2 = B1–B9
   (`js/spots.js`, `js/verify.js`). They only share function names, never files.
5. **Wave 2 — contribute + data (2 agents, parallel).** Agent 1 = C1–C8 (`js/contribute.js`);
   Agent 2 = D1–D7 (`data/`, `scripts/`). D1/D4 (research) can even start right after G1,
   overlapping Wave 0, since they only need owner approval. D6 (upsert) needs E1 — the table only
   needs G2, so it can be created early.
6. **Wave 3 — backend + docs (2 agents, parallel).** Agent 1 = E1–E6 (`supabase/`); Agent 2 =
   T1–T4 (`docs/`, `README.md`). Docs touch no code.
7. **Wave 4 — integration (1 agent, serial).** Run I1–I6; this agent alone edits `index.html` to
   wire the lanes and run the checklist.
8. **Deploy + dogfood (P1–P4 + your P5).** `npx vercel --prod`, approve a spot, verify on a real trip.

**Concurrency cap:** 2 agents at once (from `HANDOFF-musafir-project.md`). If you raise the cap,
waves can overlap — the one-file/one-owner rule still prevents merge conflicts.

## How to read this

- One step = **one agent turn**: one file, one verifiable outcome. If a step takes more than about
  15 minutes, split it into two rows.
- `Needs` = step IDs that must finish first. **Two steps in the same batch never depend on each other.**
- `Done when` is checkable by a human without running a test framework.
- Concurrency cap is **2 agents** (`HANDOFF-musafir-project.md`). Every batch is sized for 2.
- All UI strings are Indonesian. Unknown data is `Belum ada info`, never a guess.

### Dependency shape

```
G1–G5  owner gates (manual; only G2 still open)
   |
Wave P  prototype (mock data, G5 = yes, 1 agent)
   |
F1–F6  contract  (1 agent, SERIAL — blocks everything)
   |
   +-- batch 1 : A (map)        | B (list/detail/verify)
   +-- batch 2 : C (contribute) | D (data/seed)
   +-- batch 3 : E (backend)    | T (docs)
   |
I1–I6  integration (1 agent, SERIAL)
   |
P1–P5  deploy + owner dogfood
```

---

## G — Gates (owner only, no agent)

| ID | Step | Done when |
|---|---|---|
| G1 | Approve this todo + `tasks/plan.md` | ✅ done 2026-11-09 — owner approved with the review fixes |
| G2 | Create the Supabase project and the Vercel account | **open** — Project URL + anon key available. Anon key only; **never** `service_role` in the frontend |
| G3 | Decide the verification write path | ✅ done 2026-11-09 — Postgres function `bump_verified(spot_id)` (`security definer`), 1 bump/spot/hour; recorded in `SPEC-singgah.md` → Open Questions |
| G4 | Decide the desktop layout | ✅ done 2026-11-09 — keep the always-on two-pane map; SPEC decision 5 unchanged |
| G5 | Decide whether `prototype/index.html` is built before the real app | ✅ done 2026-11-09 — yes; Wave P runs before Wave 0 |

## F — Foundation / contract (1 agent, serial)

One agent owns `index.html`, `js/config.js`, `js/api.js`. Everything else reads this contract and
never edits it. **Freeze it before any parallel lane starts.**

| ID | Step | File | Needs | Done when |
|---|---|---|---|---|
| F1 | Add CDN tags: Bootstrap 5.3.3 CSS+JS, Bootstrap Icons 1.11.3, Leaflet 1.9.4, Plus Jakarta Sans (no supabase-js tag — OQ-2: plain fetch) | `index.html` | G1 | Page opens with zero console errors, no build step |
| F2 | Define and freeze the DOM mount IDs: `#map`, `#spot-list`, `#detail`, `#add-form`, `#search`, `#chips`, `#fab-add`, `#geo`, `#toast`, `#sheet` | `index.html` | F1 | Every lane can point to an ID without editing `index.html` |
| F3 | Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and **one** `TILE_URL` constant for OSM tiles | `js/config.js` | F1 | No tile URL appears in any other file |
| F4 | Add `supabaseHeaders()`, `loadApprovedSpots()`, `insertPendingSpot()`, `bumpVerified(spotId)` | `js/api.js` | F3 | Functions match the SPEC `spots` columns exactly |
| F5 | Document the frozen `SPOT` field contract + `isUnknown(value) → 'Belum ada info'` helper | `js/api.js` | F4 | Field list is identical to SPEC: id, name, type, lat, lng, water, hours, bike_parking, women_friendly, notes, status, source, last_verified_at, created_at |
| F6 | Add `data-bs-theme` dark-mode toggle persisted in `localStorage` | `index.html` | F1 | Toggle survives reload |

## A — Map lane (agent 1, batch 1)

Owns **only** `js/map.js`.

| ID | Step | Needs | Done when |
|---|---|---|---|
| A1 | Init Leaflet centred on Yogyakarta from `TILE_URL`, with OSM attribution | F3 | Map renders on a phone viewport |
| A2 | Add teardrop `divIcon` pins: one colour + one white glyph per type; legend once on desktop | A1 | Five types readable without colour |
| A3 | Render markers from the approved-only array | F4, A2 | `pending` spots never get a marker |
| A4 | Add `filterMarkers(query, type)` | A3 | Search and chips filter cards **and** markers |
| A5 | Add geolocate: pan via `navigator.geolocation`, toast `Lokasi tidak tersedia.` on failure | A1 | Failure leaves the app usable |
| A6 | Add `enterPinMode()` / `exitPinMode()` and `onPinPlaced(lat, lng)` | A1 | Tapping the map drops one teal pin; `Batal` exits |
| A7 | Marker tap calls `showDetail(spotId)` hook | A3, F2 | Detail opens without `map.js` writing outside its own DOM |

## B — List / detail / verify lane (agent 2, batch 1)

Owns **only** `js/spots.js` and `js/verify.js`.

| ID | Step | Needs | Done when |
|---|---|---|---|
| B1 | `renderList(spots)`: card skeleton with name, type badge, and verification pill | F5 | Cards match the phone mockup card shape |
| B9 | Add water / hours / bike-parking icons and computed distance text to each card | B1 | Icons present; distance reads e.g. `320 m` |
| B2 | Filter cards by search + chips, and call `filterMarkers()` | B9, A4 | Both list and map change together |
| B3 | `showDetail(spotId)`: Air / Jam / Parkir sepeda / Ramah perempuan / Catatan | F5 | Unknown values render `Belum ada info` |
| B4 | Amber etiquette note + verification line (`Diverifikasi …` / `Belum diverifikasi`) | B3 | No invented values |
| B5 | `Rute` opens `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>` | B3 | Link uses the row's coordinates |
| B6 | Separate muted `Tinjauan saya` section for the user's own pending spots | B1 | Pending spots never mix into the public list |
| B7 | `Masih ada ✓` → `bumpVerified()`, re-render line, toast `Terima kasih! Verifikasi tercatat.` | F4, B4 | Verification line updates |
| B8 | One-line comment: real build persists verification via the rate-limited write path | B7 | Comment present |

## C — Contribute lane (agent 1, batch 2)

Owns **only** `js/contribute.js`.

| ID | Step | Needs | Done when |
|---|---|---|---|
| C1 | Step 1 banner `Ketuk peta untuk menaruh pin` + cancel X, using `enterPinMode()` | A6, F2 | Add mode dims the UI |
| C2 | `Lanjut` disabled until a pin exists; opens Bootstrap offcanvas (bottom mobile / end desktop) | C1 | Disabled state is visible and honest |
| C3 | Form fields part 1: `Nama spot` (required text), type picker (5 radio chips), `Air` select, `Jam buka` text — each with a visible label | C2 | Type defaults empty so `Lanjut` stays honest until chosen |
| C8 | Form fields part 2: `Parkir sepeda` switch, `Ramah perempuan` 3-state (Ya / Tidak / Belum ada info), `Catatan` textarea | C3 | 3-state defaults to `Belum ada info`; all fields labelled |
| C4 | Bootstrap required validation on `Nama spot`; confirm every field has a visible label | C8 | Empty name blocks submit |
| C5 | Submit → `insertPendingSpot()` with `status:'pending'`, `source:'user'`, `last_verified_at:null` | F4, C8 | Row lands pending; `localStorage` fallback for prototype |
| C6 | Success state `Terima kasih! 🙏` / `Spot kamu menunggu persetujuan.` + reassurance line | C5 | `Spot baru diperiksa dulu sebelum tampil di peta.` visible |
| C7 | `Kembali ke peta` returns to list; new spot appears only in `Tinjauan saya` | C5, B6 | Public list stays clean after reload |

## D — Data + seed lane (agent 2, batch 2)

Owns **only** `data/playbook-spots.json` and `scripts/seed-spots.mjs`.

| ID | Step | Needs | Done when |
|---|---|---|---|
| D1 | Transcribe researched playbook spots (Masjid Jami Ni'matul Ittihad, Giwangan musala, rest areas, SPBU) | G1 | Owner approves — this is research data |
| D2 | Check every entry's water / hours / bike_parking / women_friendly / notes | D1 | Unknown stays `null`, never guessed |
| D3 | Read the playbook JSON in the seed script | D1 | Script prints the entry count |
| D4 | Query Overpass for mosques/musala in the Yogya bbox + corridor | G1 | Results are deduped by name + distance |
| D5 | Map OSM tags → SPEC `type` / `water`; set `source:'osm'`, `status:'approved'` | D4, F5 | No schema drift |
| D6 | Upsert to Supabase with a `--dry-run` flag | D5, E1 | Dry run shows 100+ approved spots |
| D7 | One-line comment: never pre-cache OSM tiles (tile usage policy) | D6 | Comment present |

## E — Backend lane (agent 1, batch 3)

Owns **only** `supabase/`.

| ID | Step | Needs | Done when |
|---|---|---|---|
| E1 | Create `spots` table exactly as SPEC, with check constraints and defaults | G2 | SQL runs on a clean project |
| E2 | Enable RLS; anon SELECT only where `status='approved'` | E1 | Pending rows are unreadable anonymously |
| E3 | anon INSERT forced to `status='pending'`, `source='user'` | E1 | Anon cannot publish directly |
| E4 | No anon UPDATE / DELETE policies | E1 | `grep` confirms none |
| E5 | Write `bump_verified(spot_id uuid)` as a `security definer` Postgres function: updates only `last_verified_at` on approved rows, rejects a bump if the last one is under 1 hour old (G3 decided) | E1 | `Masih ada ✓` can write via `/rpc/bump_verified`, nothing else can |
| E6 | Short guide: approve pending spots in the dashboard + weekly heartbeat for free-tier auto-pause | E2 | Owner can approve without an admin UI |

## T — Docs lane (agent 2, batch 3)

Owns **only** `docs/` and `README.md`.

| ID | Step | Needs | Done when |
|---|---|---|---|
| T1 | Manual checklist: the 7 checks from SPEC Testing Strategy | G1 | Checklist readable by a beginner |
| T2 | Add add-flow, dark mode, desktop ≥992px, zero-English-string checks | T1 | All hard rules covered |
| T3 | Guided tour: one plain-English paragraph per file, in reading order | F1 | Every planned file has a paragraph |
| T4 | README: `python3 -m http.server 8080`, `node scripts/seed-spots.mjs`, `npx vercel --prod` | G2 | Commands copy-paste correctly |

## I — Integration (1 agent, serial, after batches 1–3)

Owns **only** `index.html` from here on.

| ID | Step | Needs | Done when |
|---|---|---|---|
| I1 | Load all `js/*.js` in dependency order | A7, B7, C7, F4 | Zero console errors |
| I2 | Wire the state machine: map → list → detail → add pin → form → success; back works everywhere | I1 | Full flow reachable with a thumb |
| I3 | Mobile <992px bottom sheet; desktop ≥992px static left sidebar. Same DOM (G4 confirmed: always-on two-pane) | I2 | Both layouts pass the checklist |
| I4 | Dark mode contrast verified in both themes | F6, I3 | Text ≥4.5:1 |
| I5 | `grep` for `service_role`, photos, login, reviews; confirm none | I1 | Clean |
| I6 | Run the full manual checklist on a real phone over mobile data | T1, I5 | Owner signs off |

## P — Deploy + dogfood

| ID | Step | Needs | Done when |
|---|---|---|---|
| P1 | `npx vercel --prod` | I6 | Public URL loads on a phone |
| P2 | Approve one pending spot in the Supabase dashboard | E6, P1 | It appears on the map |
| P3 | Confirm `Masih ada ✓` writes `last_verified_at` | E5, P1 | Timestamp changes |
| P4 | Confirm 100+ approved spots and 100% Indonesian UI | D6, P1 | SPEC success criteria 2 and 7 |
| P5 | Owner uses the app on one real trip | P1 | The real acceptance test |

---

## Parallel safety rules (read before launching agents)

1. **One file, one owner.** No two agents ever write the same file. `index.html` belongs to the
   foundation agent until F6, then to the integrator alone.
2. **Contract is frozen after F6.** `js/config.js`, `js/api.js` and the DOM ID list are read-only
   for every other lane. If a lane needs a change, it reports back instead of editing.
3. **No dependencies between steps inside one batch.** That is why A and B can run together:
   A7 only needs a `showDetail` hook name, not B's finished code.
4. **Cap concurrency at 2** (from the handoff). Run batches 1, 2, 3 as three waves of two agents.
   If the cap is lifted later, the waves can overlap — the file-ownership rule still holds.
5. **Locked stack only:** plain HTML/JS, Bootstrap 5 + Icons, Leaflet 1.9, supabase-js v2, all via
   CDN. No npm project, no build step, no new dependency without asking the owner.
6. Every agent leaves UI text Indonesian and shows unknown data as `Belum ada info`.

## Batch schedule

| Wave | Agent 1 | Agent 2 | Starts after | Files touched |
|---|---|---|---|---|
| P | prototype (from `PROTOTYPE-PROMPT-singgah.md`) | — | G1 ✅ (G5 = yes) | `prototype/` only |
| 0 | F1–F6 contract | — | wave P, G2 | `index.html`, `js/config.js`, `js/api.js` |
| 1 | A1–A7 map | B1–B9 list/detail/verify | wave 0 | `js/map.js` / `js/spots.js`, `js/verify.js` |
| 2 | C1–C8 contribute | D1–D7 data + seed | wave 0 (D6 also needs E1) | `js/contribute.js` / `data/`, `scripts/` |
| 3 | E1–E6 backend | T1–T4 docs | wave 0 (E1 can run early: only needs G2) | `supabase/` / `docs/`, `README.md` |
| 4 | I1–I6 integration | — | waves 1–3 | `index.html` only |
| 5 | P1–P4 deploy | owner P5 | wave 4 | hosting + Supabase dashboard |

## Copy-paste agent prompts

Each prompt is self-contained. Paste one per agent, in the wave shown above.

**Wave P · Prototype (run first — gate G5 = yes)**
```
Read PROTOTYPE-PROMPT-singgah.md and follow it exactly. You own only files under prototype/.
Mock data only — no Supabase, no backend, no new dependencies beyond the locked CDN stack
(Bootstrap 5 + Icons, Leaflet 1.9, Plus Jakarta Sans). All UI text Indonesian; unknown data shows
"Belum ada info". Report when the clickable flow works end to end: list → detail → add pin →
form → success, on a phone viewport and on desktop.
```

**Wave 0 · Foundation / contract (the only serial agent — run this first)**
```
Read SPEC-singgah.md, AGENTS.md and tasks/todo.md. Implement ONLY steps F1–F6.
You own exactly three files: index.html, js/config.js, js/api.js. Do not create any other lane's file.
Load Bootstrap 5.3.3 + Bootstrap Icons 1.11.3 + Leaflet 1.9.4 + Plus Jakarta Sans from CDN.
Do NOT load supabase-js (OQ-2 decided: plain fetch wrapper to the REST API).
No build step, no npm project, no new dependency. Page must open with zero console errors.
Freeze and publish the contract at the end of your report: the DOM mount ID list, the config
constants, and the api.js function signatures (loadApprovedSpots, insertPendingSpot, bumpVerified).
Every later agent calls these by name and must never edit them. Report each F-step's done-when.
```

**Wave 1 · Agent 1 — map**
```
Read SPEC-singgah.md, AGENTS.md and tasks/todo.md. Implement ONLY steps A1–A7 in js/map.js.
The contract in js/config.js, js/api.js and the index.html DOM IDs is FROZEN — read it, never edit it.
Do not edit index.html or any other lane's file. No new dependencies, no build step.
All UI text Indonesian; unknown data shows "Belum ada info". Report each A-step's done-when.
```

**Wave 1 · Agent 2 — list/detail/verify**
```
Read SPEC-singgah.md, AGENTS.md and tasks/todo.md. Implement ONLY B1–B9 in js/spots.js and js/verify.js.
The contract in js/config.js, js/api.js and the index.html DOM IDs is FROZEN — read it, never edit it.
Call filterMarkers() and showDetail() by name; do not import or edit js/map.js.
All UI text Indonesian; unknown data shows "Belum ada info". Report each B-step's done-when.
```

**Wave 2 · Agent 1 — contribute**
```
Read SPEC-singgah.md, AGENTS.md and tasks/todo.md. Implement ONLY C1–C8 in js/contribute.js.
Use enterPinMode() / onPinPlaced() and insertPendingSpot() by name; do not edit their files.
New spots must land status='pending', source='user'. No accounts, no photos, no reviews.
All UI text Indonesian; unknown data shows "Belum ada info". Report each C-step's done-when.
```

**Wave 2 · Agent 2 — data + seed**
```
Read SPEC-singgah.md, AGENTS.md and tasks/todo.md. Implement ONLY D1–D7 in
data/playbook-spots.json and scripts/seed-spots.mjs. Do not rewrite research data
without owner approval: copy it accurately, keep unknown values null.
Field names must match the SPEC spots table exactly. No OSM tile pre-caching.
Report the dry-run spot count and each D-step's done-when.
```

**Wave 3 · Agent 1 — backend**
```
Read SPEC-singgah.md, AGENTS.md and tasks/todo.md. Implement ONLY E1–E6 under supabase/.
RLS: anon selects approved rows only, inserts forced pending, no anon update/delete.
Never put a service_role key in any frontend file (it belongs nowhere in this repo's frontend).
Verification writes use the `bump_verified(spot_id)` Postgres function (security definer),
rate-limited to 1 per spot per hour (gate G3, decided 2026-11-09).
Report each E-step's done-when.
```

**Wave 3 · Agent 2 — docs**
```
Read SPEC-singgah.md, AGENTS.md and tasks/todo.md. Implement ONLY T1–T4 under docs/ and README.md.
Write for a beginner coder: plain English, one job per paragraph, exact commands.
Do not edit any code file. Report each T-step's done-when.
```

**Wave 4 · integrator**
```
Read SPEC-singgah.md, AGENTS.md and tasks/todo.md. Implement I1–I6. You are the ONLY agent
allowed to edit index.html now. Wire the finished lanes together, run the manual checklist
in docs/, and report every console error and every failed check. Do not rewrite a lane's file:
report the problem back to that lane instead.
```

---

## Open questions before any agent starts

1. ✅ G3 — decided 2026-11-09: Postgres function `bump_verified`, 1 bump/spot/hour (SPEC Open
   Question 1, resolved).
2. ✅ G4 — decided 2026-11-09: keep the always-on desktop map (SPEC decision 5 unchanged).
3. ✅ G5 — decided 2026-11-09: prototype first (Wave P).
4. ✅ OQ-13 — adopted 2026-11-09: `main` for spec/docs, `build/mvp` for code, one tag per deploy
   (`docs/branching-strategy.md`). Baseline + approval edits committed on `main`.
5. ✅ OQ-2 — decided 2026-11-09: plain `fetch` wrapper; supabase-js allowed but not loaded.
   F4 freezes the contract in `docs/api-contract.md` §4.
6. **OQ-6** — copy the trip playbook source markdown into the repo. Blocks D1 only.
7. OQ-4 — who sets up the weekly heartbeat? Needed before deploy, not before Wave 0.
8. OQ-3 — tile style. Safe default: OSM per SPEC Open Question 3; Carto Voyager is a one-line
   swap later.

## Definition of done (from SPEC success criteria)

A public URL loads on a phone over mobile data · 100+ approved spots including the playbook spots
· detail shows type / water / hours / bike parking / women-friendly / last-verified with
`Belum ada info` where missing · anyone can add a spot that lands `pending` and is not public ·
owner approves in the Supabase dashboard and it appears · `Masih ada ✓` updates
`last_verified_at` · UI is 100% Indonesian · manual checklist passes on a real phone ·
**the owner completes one real-trip dogfood session**.
