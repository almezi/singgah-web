# Plan — Singgah web app (Phase 2: Plan)

*What this doc does: the Plan-phase deliverable that `AGENTS.md` and `tasks/todo.md` (gate G1)
ask for. It explains the approach, the phase gates, and the decisions still owned by you.*

**Status: DRAFT — awaiting owner approval in a later turn.** No agent should write code until this
plan and `tasks/todo.md` are approved. `AGENTS.md` gates the work:
**Specify → Plan → Tasks → Implement**, with owner review between phases.

---

## 1. Where we are

| Phase | Deliverable | Status |
|---|---|---|
| Specify | `SPEC-singgah.md`, `HANDOFF-musafir-project.md`, research notes | done |
| Plan | **this file** + `docs/architecture.md` + `docs/decision-log.md` | draft, needs approval |
| Tasks | `tasks/todo.md` (63 steps, 8 agent prompts) | draft, needs approval |
| Implement | `index.html`, `js/`, `css/`, `data/`, `scripts/`, `supabase/` | **not started, gated** |

Also done but not code: `design/singgah-mockup.html` (approved tokens),
`design/singgah-mockup-board.html` (12 frames: 6 desktop + 6 phone; the phone frames are the
component reference), `PROTOTYPE-PROMPT-singgah.md`, `MOCKUP-PROMPT-singgah.md`.

## 2. Goal and non-goals

**Goal:** a public URL that opens on a phone over mobile data, shows 100+ approved spots in Yogya
and along the Jakarta→Yogya corridor, lets anyone add a `pending` spot, and lets anyone confirm a
spot still exists. The owner uses it on one real trip — that is the real acceptance test.

**Non-goals for v0.1:** accounts/login, photos, reviews, ratings, admin UI, instant publish,
offline/PWA, Play Store/TWA, turn-by-turn navigation, cities outside the launch area. All parked
on purpose, not forgotten.

## 3. Approach (the technology structure)

A **static single-page site** with no build step: plain HTML/JS + Bootstrap 5 + Bootstrap Icons,
Leaflet 1.9, supabase-js v2, all via CDN. The browser reads approved spots directly from Supabase
through Row Level Security. Vercel serves the files. A Node seed script (offline, never shipped)
fills the database from OSM/Overpass plus the researched playbook JSON.

Three data flows: **read** (approved only, RLS-enforced), **write** (anonymous insert forced to
`pending`), **verify** (rate-limited write path, still undecided — OQ-1). Full detail:
`docs/architecture.md`. Frozen interface: `docs/api-contract.md`. Columns: `docs/data-model.md`.

**Why this shape:** the owner is learning while building, so every file must be readable top to
bottom. Zero build step means editing a file and refreshing the browser is the whole dev loop.
Everything runs on free tiers. See `docs/research-mobile-strategy.md` for the cost curve.

## 4. How the work is split (so more than one agent can run)

`tasks/todo.md` breaks the build into 63 one-agent-turn steps across 8 lanes. The safety rule is
**one file, one owner**: no two agents ever write the same file. `js/config.js`, `js/api.js` and
the `index.html` DOM IDs form a frozen contract; all other lanes call those by name.

```
Gates G1–G5 (owner)  →  Wave 0 contract (1 agent, serial)
   → Wave 1 map | list        (2 agents, parallel)
   → Wave 2 contribute | data (2 agents, parallel)
   → Wave 3 backend | docs    (2 agents, parallel)
   → Wave 4 integration (1 agent)
   → Wave 5 deploy + owner dogfood
```

Concurrency cap is **2 agents** (from `HANDOFF-musafir-project.md`). Waves 1–3 are three waves of
two. Data research (D1/D4) can overlap Wave 0 because it only needs owner approval.

## 5. Phase gates the owner owns

| Gate | Decision needed | Blocks |
|---|---|---|
| G1 | Approve this plan + `tasks/todo.md` in a later turn | all agent work |
| G2 | Create Supabase project + Vercel account | F3, E1, deploy |
| G3 | Verification write path: Edge Function vs Postgres function | E5, B7 |
| G4 | Desktop layout: always-on map (current board) or three modes | I3 |
| G5 | Build `prototype/index.html` first, or go straight to Supabase | wave order |

G4 note: `SPEC-singgah.md` decision 5 locks "a widened two-pane version of the same screens".
If the desktop mode changes, **update the spec first**, then the board, then the code.

## 6. Verification strategy

No automated test framework in MVP — adding one before there is anything to test is process
theater. Verification = `docs/manual-test-checklist.md`, run before **every** deploy, plus owner
dogfooding on a real trip. The checklist covers the 7 checks in `SPEC-singgah.md` → Testing
Strategy plus add-flow, dark mode, desktop ≥992px, zero-English-string, contrast and RLS checks.

## 7. Risks (from the research notes)

| Risk | Mitigation |
|---|---|
| Supabase free project auto-pauses after 7 days idle | weekly heartbeat with a real DB query |
| OSM facility tags are nearly empty (toilets 0.4%) | show `Belum ada info`; on-site verification is the data loop |
| OSM covers only ~half of Yogya's spots | community "tambah spot" flow; Kemenag counts as yardstick |
| OSM tile policy bans bulk/offline caching | tiles network-only, one `TILE_URL` constant |
| Overpass 502s | retry with backoff + mirror fallback + User-Agent header |
| Node-on-building duplicates in OSM | dedupe by proximity + name similarity |
| Vercel Hobby is non-commercial only | note it; revisit if the app becomes commercial |
| TWA/Play Store 12-tester/14-day gate | PWA first, TWA much later (out of MVP) |

## 8. Open decisions (do not resolve silently)

Recorded in `docs/decision-log.md`. The important ones: OQ-1 verification write path, OQ-2
supabase-js client vs plain REST `fetch`, OQ-3 tile style (OSM vs Carto Voyager), OQ-4 heartbeat
owner, OQ-5 dark mode scope, OQ-6 missing playbook source markdown, OQ-7 where custom CSS lives,
OQ-8 UI copy conflicts, OQ-9 PWA manifest wording, OQ-10 desktop map mode, OQ-13 branching
strategy (`docs/branching-strategy.md`).

## 9. Definition of done (from SPEC success criteria)

A public URL loads on a phone over mobile data · 100+ approved spots including the playbook spots
· detail shows type / water / hours / bike parking / women-friendly / last-verified with
`Belum ada info` where missing · anyone can add a spot that lands `pending` and is not public ·
owner approves in the Supabase dashboard and it appears · `Masih ada ✓` updates
`last_verified_at` · UI is 100% Indonesian · manual checklist passes on a real phone · **the owner
completes one real-trip dogfood session**.

## 10. Change process

Update `SPEC-singgah.md` **first** when a decision changes, then the affected docs, then code.
Ask the owner before: schema changes, any dependency beyond Leaflet + supabase-js, auth, photos,
hosting switch, instant-publish.
