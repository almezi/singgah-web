# Plan — Singgah web app (Phase 2: Plan)

*What this doc does: the Plan-phase deliverable that `AGENTS.md` and `tasks/todo.md` (gate G1)
ask for. It explains the approach, the phase gates, and the decisions still owned by you.*

**Status: APPROVED by the owner 2026-11-09 (gate G1), with the review fixes applied.** Gates
G3/G4/G5, OQ-2 (plain fetch) and OQ-13 (branching) were answered the same day. **Wave P
(prototype) is unblocked**; Wave 0+ waits on G2 (accounts) only. OQ-6 (playbook file) blocks
step D1 only. `AGENTS.md` gates the work: **Specify → Plan → Tasks → Implement**, with owner
review between phases.

---

## 1. Where we are

| Phase | Deliverable | Status |
|---|---|---|
| Specify | `SPEC-singgah.md`, `HANDOFF-musafir-project.md`, research notes | done |
| Plan | **this file** + `docs/architecture.md` + `docs/decision-log.md` | approved 2026-11-09 (G1) |
| Tasks | `tasks/todo.md` (63 steps + Wave P prototype, 9 agent prompts) | approved 2026-11-09 (G1) |
| Implement | `prototype/`, `index.html`, `js/`, `css/`, `data/`, `scripts/`, `supabase/` | **Wave P in progress on `build/mvp`; Wave 0+ waiting on G2** |

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

A **static single-page site** with no build step: plain HTML/JS + Bootstrap 5 + Bootstrap Icons
+ Leaflet 1.9 via CDN; Supabase is reached with a plain `fetch` wrapper (OQ-2, decided
2026-11-09 — supabase-js stays allowed but is not loaded). The browser reads approved spots
directly from Supabase
through Row Level Security. Vercel serves the files. A Node seed script (offline, never shipped)
fills the database from OSM/Overpass plus the researched playbook JSON.

Three data flows: **read** (approved only, RLS-enforced), **write** (anonymous insert forced to
`pending`), **verify** (rate-limited Postgres function `bump_verified`, decided at G3). Full detail:
`docs/architecture.md`. Frozen interface: `docs/api-contract.md`. Columns: `docs/data-model.md`.

**Why this shape:** the owner is learning while building, so every file must be readable top to
bottom. Zero build step means editing a file and refreshing the browser is the whole dev loop.
Everything runs on free tiers. See `docs/research-mobile-strategy.md` for the cost curve.

## 4. How the work is split (so more than one agent can run)

`tasks/todo.md` breaks the build into 63 one-agent-turn steps across 8 lanes. The safety rule is
**one file, one owner**: no two agents ever write the same file. `js/config.js`, `js/api.js` and
the `index.html` DOM IDs form a frozen contract; all other lanes call those by name.

```
Gates G1–G5 (owner)  →  Wave P prototype (mock data, G5 = yes)
   → Wave 0 contract (1 agent, serial)
   → Wave 1 map | list        (2 agents, parallel)
   → Wave 2 contribute | data (2 agents, parallel)
   → Wave 3 backend | docs    (2 agents, parallel)
   → Wave 4 integration (1 agent)
   → Wave 5 deploy + owner dogfood
```

**Sequencing note (from the approval review):** waves are dependency-ordered, not strictly
sequential. D6 (seed upsert) needs E1 (the `spots` table), and E1 only needs gate G2 — so the
backend table can be created early, alongside Wave 2. The `Needs` column in `tasks/todo.md` is
authoritative; the diagram shows the usual order.

Concurrency cap is **2 agents** (from `HANDOFF-musafir-project.md`). Waves 1–3 are three waves of
two. Data research (D1/D4) can overlap Wave 0 because it only needs owner approval.

## 5. Phase gates the owner owns

| Gate | Decision | Status |
|---|---|---|
| G1 | Approve this plan + `tasks/todo.md` | ✅ approved 2026-11-09, with the review fixes |
| G2 | Create Supabase project + Vercel account | **open** — blocks F3, E1, deploy |
| G3 | Verification write path | ✅ decided 2026-11-09: Postgres function `bump_verified`, 1 bump/spot/hour |
| G4 | Desktop layout | ✅ decided 2026-11-09: keep the always-on two-pane map |
| G5 | Prototype first? | ✅ decided 2026-11-09: yes — `prototype/index.html` before Wave 0 |

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

Recorded in `docs/decision-log.md`. Decided 2026-11-09: OQ-1 (Postgres function), OQ-2 (plain
fetch), OQ-5 (dark mode yes), OQ-10 (keep two-pane), OQ-11 (prototype first), OQ-13 (branching
adopted). Still open, the important ones: OQ-3 tile style (safe default: OSM per spec), OQ-4
heartbeat owner, OQ-6 missing playbook source markdown (blocks D1), OQ-7 where custom CSS lives,
OQ-8 UI copy conflicts, OQ-9 PWA manifest wording, OQ-12 tile guardrails.

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
