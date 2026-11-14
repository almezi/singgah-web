# TODO — Singgah web app (small steps, parallel agents)

**Status: APPROVED 2026-11-09 (gate G1) · REVISED for Vue 3 + Vite (OQ-15) — revision APPROVED
2026-11-14.**
The owner approved this list and `tasks/plan.md` with the review fixes, and answered G3, G4, G5,
OQ-2 and OQ-13 on 2026-11-09. On **2026-11-14 the owner decided (OQ-15) to switch the app stack
from plain HTML/JS to Vue 3 + Vite** (reason: learning Vue for their career; no app code existed,
so only documents changed) **and approved this revised list the same day — Wave 0 may launch.**

**Wave P — DONE and VERIFIED 2026-11-10.** `prototype/index.html` is committed on `build/mvp`
(`6a32249`) and passes all 8 "Done when" items with zero console errors. Record:
`docs/prototype-verification.md`. The prototype is **plain JS on purpose and stays untouched** —
it is the approved design reference. **Wave 0 (F1–F6) is the next step.** Supabase is created
(OQ-14); the Vercel account is deferred to before deploy. D1 additionally needs the playbook file
(OQ-6).

**Sources of truth:** `docs/SPEC-singgah.md` (decisions 6 + 8, Tech Stack) · `AGENTS.md` ·
`docs/PROTOTYPE-PROMPT-singgah.md` · `docs/MOCKUP-PROMPT-singgah.md` ·
`design/singgah-mockup-board.html` (12 frames; the six phone frames are the component reference).

**Goal:** a public URL that opens on a phone over mobile data, shows 100+ approved spots in Yogya
and the Jakarta→Yogya corridor, lets anyone add a `pending` spot, and lets anyone confirm a spot
still exists.

---

## Parallel launch playbook (how you run multiple agents)

This list is built so **two agents can work at the same time with zero file conflicts** — every
lane owns different files, and the shared contract (`src/lib/`, component props/emits, the
`useSpots` state shape) is frozen after Wave 0. You launch agents in waves of 2 using the
copy-paste prompts at the bottom.

1. **Gates first (you, not an agent).** G1, G3, G4, G5, OQ-2, OQ-13 and OQ-15 are done.
   G2 is half done (2026-11-14): Supabase created; **Vercel account deferred to before deploy**.
2. ✅ **Wave P — prototype (done 2026-11-10).** Plain-JS `prototype/index.html`, verified end to
   end (`docs/prototype-verification.md`). It owns only `prototype/`.
3. **Wave 0 — contract (1 agent, serial).** Run F1–F6: scaffold the Vue 3 + Vite app and freeze
   the contract (api module, props/emits, `useSpots` shape). Everything waits on this.
4. **Wave 1 — map + list (2 agents, parallel).** Agent 1 = A1–A7 (`MapPane.vue`); Agent 2 =
   B1–B9 (`SpotList.vue`, `SpotDetail.vue`). They only share the contract, never files.
5. **Wave 2 — contribute + data (2 agents, parallel).** Agent 1 = C1–C8 (`AddSpotSheet.vue`);
   Agent 2 = D1–D7 (`data/`, `scripts/`). D1/D4 (research) can start right after G1, overlapping
   Wave 0. D6 (upsert) needs E1.
6. **Wave 3 — backend + docs (2 agents, parallel).** Agent 1 = E1–E6 (`supabase/`); Agent 2 =
   T1–T4 (`docs/`, `README.md`). Docs touch no code.
7. **Wave 4 — integration (1 agent, serial).** Run I1–I6; this agent alone edits `src/App.vue`
   to wire the lanes and run the checklist.
8. **Deploy + dogfood (P1–P4 + your P5).** Vercel account first, then `npx vercel --prod`,
   approve a spot, verify on a real trip.

**Concurrency cap:** 2 agents at once (from `docs/HANDOFF-musafir-project.md`). If you raise the
cap, waves can overlap — the one-file/one-owner rule still prevents merge conflicts.

## How to read this

- One step = **one agent turn**: one file, one verifiable outcome. If a step takes more than
  about 15 minutes, split it into two rows.
- `Needs` = step IDs that must finish first. **Two steps in the same batch never depend on each
  other.**
- `Done when` is checkable by a human without running a test framework.
- Concurrency cap is **2 agents** (`docs/HANDOFF-musafir-project.md`). Every batch is sized for 2.
- All UI strings are Indonesian. Unknown data is `Belum ada info`, never a guess.

### Dependency shape

```
G1–G5  owner gates (manual; G2 half open — Vercel before deploy)
   |
Wave P  ✅ DONE + VERIFIED 2026-11-10 (plain-JS prototype, design reference)
   |
F1–F6  Vue scaffold + contract  (1 agent, SERIAL — blocks everything; Supabase ✅ 2026-11-14)
   |
   +-- batch 1 : A (MapPane)    | B (SpotList/SpotDetail)
   +-- batch 2 : C (AddSpotSheet) | D (data/seed)
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
| G2 | Create the Supabase project and the Vercel account | 🟡 **half done 2026-11-14** — Supabase created; URL + anon key with the owner (pasted into `js/config.js`, migrating into the Vue app in F2). **Vercel account open**, deferred to before deploy (OQ-14). Anon key only; **never** `service_role` in the frontend |
| G3 | Decide the verification write path | ✅ done 2026-11-09 — Postgres function `bump_verified(spot_id)` (`security definer`), 1 bump/spot/hour; recorded in `docs/SPEC-singgah.md` → Open Questions |
| G4 | Decide the desktop layout | ✅ done 2026-11-09 — keep the always-on two-pane map; SPEC decision 5 unchanged |
| G5 | Decide whether `prototype/index.html` is built before the real app | ✅ done 2026-11-09 — yes; Wave P runs before Wave 0 |
| — | **Approve this Vue revision (OQ-15)** | ✅ done 2026-11-14 — owner approved the rewritten lanes; Wave 0 may launch |

## F — Foundation / Vue scaffold + contract (1 agent, serial)

One agent owns `index.html` (Vite entry), `package.json`, `src/main.js`, `src/App.vue`,
`src/lib/*`. Everything else reads this contract and never edits it. **Freeze it before any
parallel lane starts.**

| ID | Step | File | Needs | Done when |
|---|---|---|---|---|
| F1 | Scaffold Vue 3 + Vite (JavaScript template, **no TypeScript**); `npm install` bootstrap, bootstrap-icons, leaflet, @supabase/supabase-js; keep the existing `prototype/`, `docs/`, `tasks/` untouched | repo root, `index.html` | OQ-15 | `npm run dev` serves the app with zero console errors; `npm run build` succeeds |
| F2 | Move the owner's Supabase URL + anon key from `js/config.js` into `src/lib/config.js` (owner consents; the old file is deleted only after the values work), plus the single `TILE_URL` constant; optional `.env.local` override (`VITE_*`, gitignored) | `src/lib/config.js` | F1 | No URL or key appears in any other file |
| F3 | `src/lib/supabase.js`: supabase-js client + `loadApprovedSpots()`, `insertPendingSpot()`, `bumpVerified(spotId)`; document the frozen `SPOT` field contract + `isUnknown(value) → 'Belum ada info'` helper | `src/lib/supabase.js` | F2 | Field list is identical to SPEC: id, name, type, lat, lng, water, hours, bike_parking, women_friendly, notes, status, source, last_verified_at, created_at |
| F4 | `src/main.js`: `createApp` + Bootstrap CSS/Icons imports + theme bootstrap; `App.vue` shell with the two-pane layout (desktop ≥992px static sidebar, mobile <992px bottom sheet) and placeholder mounts for the five components | `src/main.js`, `src/App.vue` | F1 | Shell renders in both viewports with placeholders |
| F5 | `DarkModeToggle.vue`: `data-bs-theme` toggle persisted in `localStorage` | `src/components/DarkModeToggle.vue` | F4 | Toggle survives reload |
| F6 | Freeze the contract and update `docs/api-contract.md`: api function signatures, SPOT fields, component props/emits list, `useSpots` state shape | `docs/api-contract.md` | F3, F4 | Every lane can build against the contract without editing shared files |

**Note (OQ-14):** the owner's `js/config.js` exists with the real values. The Wave 0 agent copies
them in F2, never invents values, and never deletes the old file without the owner's consent.

**✅ Wave 0 EXECUTED 2026-11-14 (F1–F6 done, contract frozen).** Scaffold: `package.json`,
`vite.config.js`, `index.html`, `src/main.js`, `src/App.vue` (shell), `src/lib/{config,supabase,toast}.js`,
`src/composables/{useSpots,useGeolocation}.js`, `src/assets/main.css`, `DarkModeToggle.vue` + 4
stubs. `npm install` OK (47 packages), `npm run build` OK (123 modules). **The two Supabase values
in `src/lib/config.js` are still placeholders — the owner must paste the real URL + anon key
(replacing the `GANTI-…` texts) before any database call can succeed.** `js/config.js` is kept
until the owner confirms.

## A — Map lane (agent 1, batch 1)

Owns **only** `src/components/MapPane.vue`.

| ID | Step | Needs | Done when |
|---|---|---|---|
| A1 | Init Leaflet centred on Yogyakarta from `TILE_URL` (leaflet via npm, CSS imported), OSM attribution | F6 | Map renders on a phone viewport |
| A2 | Teardrop `divIcon` pins: one colour + one white glyph per type; legend once on desktop | A1 | Five types readable without colour |
| A3 | Render markers from the approved-only array (prop `spots`) | A2, F6 | `pending` spots never get a marker |
| A4 | Watch the shared filter state → `filterMarkers(query, type)` | A3 | Search and chips filter cards **and** markers |
| A5 | Geolocate via `useGeolocation`: pan the map; toast `Lokasi tidak tersedia.` on failure | A1 | Failure leaves the app usable |
| A6 | Pin-drop mode: `enterPinMode` / `exitPinMode`, emit `pin-placed(lat, lng)`; tapping the map drops one teal pin; `Batal` exits | A1 | One teal pin; cancel works |
| A7 | Marker tap emits `select(spotId)`; `App.vue` opens the detail | A3, F6 | Detail opens without `MapPane` touching other components |

## B — List / detail / verify lane (agent 2, batch 1)

Owns **only** `src/components/SpotList.vue` and `src/components/SpotDetail.vue`.

| ID | Step | Needs | Done when |
|---|---|---|---|
| B1 | `SpotList.vue`: card skeleton with name, type badge, and verification pill | F6 | Cards match the phone mockup card shape |
| B9 | Water / hours / bike-parking icons and computed distance text on each card | B1 | Icons present; distance reads e.g. `320 m` |
| B2 | Search + type chips filter through the shared `useSpots` state (the map reacts via A4) | B9, F6 | Both list and map change together |
| B3 | `SpotDetail.vue`: Air / Jam / Parkir sepeda / Ramah perempuan / Catatan | F6 | Unknown values render `Belum ada info` |
| B4 | Amber etiquette note + verification line (`Diverifikasi …` / `Belum diverifikasi`) | B3 | No invented values |
| B5 | `Rute` opens `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>` | B3 | Link uses the row's coordinates |
| B6 | Separate muted `Tinjauan saya` section for the user's own pending spots | B1 | Pending spots never mix into the public list |
| B7 | `Masih ada ✓` → `bumpVerified()`, re-render line, toast `Terima kasih! Verifikasi tercatat.` | F6, B4 | Verification line updates |
| B8 | One-line comment: real build persists verification via the rate-limited write path | B7 | Comment present |

## C — Contribute lane (agent 1, batch 2)

Owns **only** `src/components/AddSpotSheet.vue`.

| ID | Step | Needs | Done when |
|---|---|---|---|
| C1 | Step 1 banner `Ketuk peta untuk menaruh pin` + cancel X, calling A6's pin mode | A6, F6 | Add mode dims the UI |
| C2 | `Lanjut` disabled until a pin exists; opens a Bootstrap offcanvas (bottom mobile / end desktop) | C1 | Disabled state is visible and honest |
| C3 | Form fields part 1: `Nama spot` (required text), type picker (5 radio chips), `Air` select, `Jam buka` text — each with a visible label | C2 | Type defaults empty so `Lanjut` stays honest until chosen |
| C8 | Form fields part 2: `Parkir sepeda` switch, `Ramah perempuan` 3-state (Ya / Tidak / Belum ada info), `Catatan` textarea | C3 | 3-state defaults to `Belum ada info`; all fields labelled |
| C4 | Bootstrap required validation on `Nama spot`; confirm every field has a visible label | C8 | Empty name blocks submit |
| C5 | Submit → `insertPendingSpot()` with `status:'pending'`, `source:'user'`, `last_verified_at:null` | F6, C8 | Row lands pending |
| C6 | Success state `Terima kasih! 🙏` / `Spot kamu menunggu persetujuan.` + reassurance line | C5 | `Spot baru diperiksa dulu sebelum tampil di peta.` visible |
| C7 | `Kembali ke peta` returns to list; new spot appears only in `Tinjauan saya` | C5, B6 | Public list stays clean after reload |

## D — Data + seed lane (agent 2, batch 2)

Owns **only** `data/playbook-spots.json` and `scripts/seed-spots.mjs`. Unchanged by OQ-15 — the
seed script is Node, outside the Vue app.

| ID | Step | Needs | Done when |
|---|---|---|---|
| D1 | Transcribe researched playbook spots (Masjid Jami Ni'matul Ittihad, Giwangan musala, rest areas, SPBU) | G1 | Owner approves — this is research data |
| D2 | Check every entry's water / hours / bike_parking / women_friendly / notes | D1 | Unknown stays `null`, never guessed |
| D3 | Read the playbook JSON in the seed script | D1 | Script prints the entry count |
| D4 | Query Overpass for mosques/musala in the Yogya bbox + corridor | G1 | Results are deduped by name + distance |
| D5 | Map OSM tags → SPEC `type` / `water`; set `source:'osm'`, `status:'approved'` | D4, F3 | No schema drift |
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
| T3 | Guided tour: one plain-English paragraph per file, in reading order (Vue files: `src/main.js`, `src/App.vue`, `src/lib/*`, `src/composables/*`, `src/components/*`) | F1 | Every planned file has a paragraph |
| T4 | README: `npm install`, `npm run dev`, `node scripts/seed-spots.mjs`, `npx vercel --prod` | G2 | Commands copy-paste correctly |

## I — Integration (1 agent, serial, after batches 1–3)

Owns **only** `src/App.vue` (and final `src/main.js` touch-ups) from here on.

| ID | Step | Needs | Done when |
|---|---|---|---|
| I1 | All five components mounted in `App.vue`; props/emits wired to the `useSpots` state | A7, B7, C7, F6 | Zero console errors |
| I2 | Wire the flow: map → list → detail → add pin → form → success; back works everywhere | I1 | Full flow reachable with a thumb |
| I3 | Mobile <992px bottom sheet; desktop ≥992px static two-pane (G4 confirmed: always-on map) | I2 | Both layouts pass the checklist |
| I4 | Dark mode contrast verified in both themes | F5, I3 | Text ≥4.5:1 |
| I5 | `grep` for `service_role`, photos, login, reviews; confirm none | I1 | Clean |
| I6 | Run the full manual checklist on a real phone over mobile data | T1, I5 | Owner signs off |

## P — Deploy + dogfood

| ID | Step | Needs | Done when |
|---|---|---|---|
| P0 | Finish the Vercel account (G2's open half; skip the "Import Git Repository" screen) | I6 | Dashboard reachable |
| P1 | `npx vercel --prod` (Vercel auto-detects Vite: `npm run build` → `dist/`) | I6, P0 | Public URL loads on a phone |
| P2 | Approve one pending spot in the Supabase dashboard | E6, P1 | It appears on the map |
| P3 | Confirm `Masih ada ✓` writes `last_verified_at` | E5, P1 | Timestamp changes |
| P4 | Confirm 100+ approved spots and 100% Indonesian UI | D6, P1 | SPEC success criteria 2 and 7 |
| P5 | Owner uses the app on one real trip | P1 | The real acceptance test |

---

## Parallel safety rules (read before launching agents)

1. **One file, one owner.** No two agents ever write the same file. `src/App.vue` belongs to the
   foundation agent until F4, then to the integrator alone.
2. **Contract is frozen after F6.** `src/lib/*`, the component props/emits list and the
   `useSpots` shape are read-only for every other lane. If a lane needs a change, it reports back
   instead of editing.
3. **No dependencies between steps inside one batch.** That is why A and B can run together:
   A7 only needs the `select` emit name from the contract, not B's finished code.
4. **Cap concurrency at 2** (from `docs/HANDOFF-musafir-project.md`). Run batches 1, 2, 3 as
   three waves of two agents. If the cap is lifted later, the waves can overlap — the
   file-ownership rule still holds.
5. **Locked stack only:** Vue 3 + Vite (JavaScript, no TypeScript), Bootstrap 5 + Icons, Leaflet
   1.9, supabase-js v2 — all npm. No new dependency without asking the owner.
6. Every agent leaves UI text Indonesian and shows unknown data as `Belum ada info`.

## Batch schedule

| Wave | Agent 1 | Agent 2 | Starts after | Files touched |
|---|---|---|---|---|
| P ✅ | prototype — **done + verified 2026-11-10** (`docs/prototype-verification.md`) | — | G1 ✅ (G5 = yes) | `prototype/` only |
| 0 | F1–F6 Vue scaffold + contract | — | wave P, OQ-15 approval | `index.html`, `package.json`, `src/main.js`, `src/App.vue`, `src/lib/*` |
| 1 | A1–A7 map | B1–B9 list/detail/verify | wave 0 | `src/components/MapPane.vue` / `SpotList.vue`, `SpotDetail.vue` |
| 2 | C1–C8 contribute | D1–D7 data + seed | wave 0 (D6 also needs E1) | `src/components/AddSpotSheet.vue` / `data/`, `scripts/` |
| 3 | E1–E6 backend | T1–T4 docs | wave 0 (E1 can run early: only needs Supabase ✅) | `supabase/` / `docs/`, `README.md` |
| 4 | I1–I6 integration | — | waves 1–3 | `src/App.vue` only |
| 5 | P0–P4 deploy | owner P5 | wave 4 | hosting + Supabase dashboard |

## Copy-paste agent prompts

Each prompt is self-contained. Paste one per agent, in the wave shown above.

**Wave P · Prototype — ✅ DONE 2026-11-10 (kept for the record; gate G5 = yes; now the design
reference — do not migrate it to Vue)**
```
Read docs/PROTOTYPE-PROMPT-singgah.md and follow it exactly. You own only files under prototype/.
Mock data only — no Supabase, no backend, no new dependencies beyond the locked CDN stack
(Bootstrap 5 + Icons, Leaflet 1.9, Plus Jakarta Sans). All UI text Indonesian; unknown data shows
"Belum ada info". Report when the clickable flow works end to end: list → detail → add pin →
form → success, on a phone viewport and on desktop.
```

**Wave 0 · Foundation / Vue scaffold (the only serial agent — run this first)**
```
Read docs/SPEC-singgah.md (decisions 6 + 8, Tech Stack), AGENTS.md and tasks/todo.md. Implement
ONLY steps F1–F6. You own: index.html (Vite entry), package.json, src/main.js, src/App.vue,
src/lib/*. Do not create any other lane's file. Scaffold Vue 3 + Vite with the JavaScript
template (no TypeScript); npm-install bootstrap, bootstrap-icons, leaflet, @supabase/supabase-js.
Move the owner's Supabase URL + anon key from js/config.js into src/lib/config.js (owner
consents; never delete the old file yourself). Freeze and publish the contract at the end of your
report: the api function signatures (loadApprovedSpots, insertPendingSpot, bumpVerified), the
SPOT field list, the component props/emits list and the useSpots state shape. Every later agent
calls these by name and must never edit them. Report each F-step's done-when.
```

**Wave 1 · Agent 1 — map**
```
Read docs/SPEC-singgah.md, AGENTS.md and tasks/todo.md. Implement ONLY steps A1–A7 in
src/components/MapPane.vue. The contract (src/lib/*, props/emits list, useSpots shape) is FROZEN
— read it, never edit it. Do not edit App.vue or any other lane's file. No new dependencies, no
TypeScript. All UI text Indonesian; unknown data shows "Belum ada info". Report each A-step's
done-when.
```

**Wave 1 · Agent 2 — list/detail/verify**
```
Read docs/SPEC-singgah.md, AGENTS.md and tasks/todo.md. Implement ONLY B1–B9 in
src/components/SpotList.vue and src/components/SpotDetail.vue. The contract (src/lib/*,
props/emits list, useSpots shape) is FROZEN — read it, never edit it. Use the shared useSpots
state so the map reacts to filters; do not import or edit MapPane.vue. All UI text Indonesian;
unknown data shows "Belum ada info". Report each B-step's done-when.
```

**Wave 2 · Agent 1 — contribute**
```
Read docs/SPEC-singgah.md, AGENTS.md and tasks/todo.md. Implement ONLY C1–C8 in
src/components/AddSpotSheet.vue. Use the frozen contract: MapPane's pin mode (enterPinMode /
exitPinMode / pin-placed emit) and insertPendingSpot(). New spots must land status='pending',
source='user'. No accounts, no photos, no reviews. All UI text Indonesian; unknown data shows
"Belum ada info". Report each C-step's done-when.
```

**Wave 2 · Agent 2 — data + seed**
```
Read docs/SPEC-singgah.md, AGENTS.md and tasks/todo.md. Implement ONLY D1–D7 in
data/playbook-spots.json and scripts/seed-spots.mjs. Do not rewrite research data
without owner approval: copy it accurately, keep unknown values null.
Field names must match the SPEC spots table exactly. No OSM tile pre-caching.
Report the dry-run spot count and each D-step's done-when.
```

**Wave 3 · Agent 1 — backend**
```
Read docs/SPEC-singgah.md, AGENTS.md and tasks/todo.md. Implement ONLY E1–E6 under supabase/.
RLS: anon selects approved rows only, inserts forced pending, no anon update/delete.
Never put a service_role key in any frontend file (it belongs nowhere in this repo's frontend).
Verification writes use the `bump_verified(spot_id)` Postgres function (security definer),
rate-limited to 1 per spot per hour (gate G3, decided 2026-11-09).
Report each E-step's done-when.
```

**Wave 3 · Agent 2 — docs**
```
Read docs/SPEC-singgah.md, AGENTS.md and tasks/todo.md. Implement ONLY T1–T4 under docs/ and
README.md. Write for a beginner coder: plain English, one job per paragraph, exact commands
(npm install, npm run dev, node scripts/seed-spots.mjs, npx vercel --prod).
Do not edit any code file. Report each T-step's done-when.
```

**Wave 4 · integrator**
```
Read docs/SPEC-singgah.md, AGENTS.md and tasks/todo.md. Implement I1–I6. You are the ONLY agent
allowed to edit src/App.vue now. Wire the finished components together (props/emits → useSpots
state), run the manual checklist in docs/, and report every console error and every failed check.
Do not rewrite a lane's component: report the problem back to that lane instead.
```

---

## Open questions before any agent starts

**0. 🟡 G2 — half done (OQ-14).** Supabase project created; URL + anon key with the owner.
   **Vercel account still open** — owner deferred it to before deploy (Wave 5 / P0), so Wave 0 is
   unblocked. Wave P is done (`docs/prototype-verification.md`).

1. ✅ G3 — decided 2026-11-09: Postgres function `bump_verified`, 1 bump/spot/hour (SPEC Open
   Question 1, resolved).
2. ✅ G4 — decided 2026-11-09: keep the always-on desktop map (SPEC decision 5 unchanged).
3. ✅ G5 — decided 2026-11-09: prototype first (Wave P).
4. ✅ OQ-13 — adopted 2026-11-09: `main` for spec/docs, `build/mvp` for code, one tag per deploy
   (`docs/branching-strategy.md`). Baseline + approval edits committed on `main`.
5. ✅ OQ-2 — decided 2026-11-09: plain `fetch` wrapper. **Amended 2026-11-14 (OQ-15):**
   supabase-js v2 via npm replaces the wrapper under the Vue stack.
6. **OQ-6** — copy the trip playbook source markdown into the repo. Blocks D1 only.
7. OQ-4 — who sets up the weekly heartbeat? Needed before deploy, not before Wave 0.
8. OQ-3 — tile style. Safe default: OSM per SPEC Open Question 3; Carto Voyager is a one-line
   swap later.
9. ✅ OQ-15 — decided 2026-11-14: the app stack is Vue 3 + Vite (amends L1); supabase-js via npm
   (amends OQ-2); the verified plain-JS prototype stays as the untouched design reference.

## Definition of done (from SPEC success criteria)

A public URL loads on a phone over mobile data · 100+ approved spots including the playbook spots
· detail shows type / water / hours / bike parking / women-friendly / last-verified with
`Belum ada info` where missing · anyone can add a spot that lands `pending` and is not public ·
owner approves in the Supabase dashboard and it appears · `Masih ada ✓` updates
`last_verified_at` · UI is 100% Indonesian · manual checklist passes on a real phone ·
**the owner completes one real-trip dogfood session**.
