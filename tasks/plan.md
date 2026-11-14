# Plan — Singgah web app (Phase 2: Plan)

*What this doc does: the Plan-phase deliverable that `AGENTS.md` and `tasks/todo.md` (gate G1)
ask for. It explains the approach, the phase gates, and the decisions still owned by you.*

**Status: APPROVED by the owner 2026-11-09 (gate G1), with the review fixes applied.** Gates
G3/G4/G5, OQ-2 (plain fetch) and OQ-13 (branching) were answered the same day. **Wave P
(prototype) was built and verified 2026-11-10** — see `docs/prototype-verification.md`; all 8
"Done when" items pass with zero console errors. **Wave 0 unblocked 2026-11-14 (OQ-14):** Supabase
done; the Vercel account is deferred to before deploy. **Same day (OQ-15): the owner switched the
stack to Vue 3 + Vite** — SPEC, AGENTS, plan, todo and the affected docs are rewritten; the owner
approved the revised `tasks/todo.md` the same day, so Wave 0 may launch.
OQ-6 (playbook file) blocks step D1 only. `AGENTS.md` gates the work:
**Specify → Plan → Tasks → Implement**, with owner review between phases.

---

## 1. Where we are

| Phase | Deliverable | Status |
|---|---|---|
| Specify | `docs/SPEC-singgah.md`, `docs/HANDOFF-musafir-project.md`, research notes | done |
| Plan | **this file** + `docs/architecture.md` + `docs/decision-log.md` | approved 2026-11-09 (G1) |
| Tasks | `tasks/todo.md` (58 steps, 9 agent prompts) | approved 2026-11-09 (G1); revised for Vue 2026-11-14 (OQ-15) — **revision approved same day** |
| Implement | `prototype/`, `index.html`, `src/`, `data/`, `scripts/`, `supabase/` | **Wave P done + verified 2026-11-10** (`docs/prototype-verification.md`); **Wave 0 unblocked 2026-11-14 (OQ-14 + OQ-15)** |

Also done but not code: `design/singgah-mockup.html` (approved tokens),
`design/singgah-mockup-board.html` (12 frames: 6 desktop + 6 phone; the phone frames are the
component reference), `docs/PROTOTYPE-PROMPT-singgah.md`, `docs/MOCKUP-PROMPT-singgah.md`.

## 2. Goal and non-goals

**Goal:** a public URL that opens on a phone over mobile data, shows 100+ approved spots in Yogya
and along the Jakarta→Yogya corridor, lets anyone add a `pending` spot, and lets anyone confirm a
spot still exists. The owner uses it on one real trip — that is the real acceptance test.

**Non-goals for v0.1:** accounts/login, photos, reviews, ratings, admin UI, instant publish,
offline/PWA, Play Store/TWA, turn-by-turn navigation, cities outside the launch area. All parked
on purpose, not forgotten.

## 3. Approach (the technology structure)

A **Vue 3 single-page app built with Vite** (OQ-15, 2026-11-14 — amends the original plain-JS
choice; JavaScript, no TypeScript). Bootstrap 5 + Bootstrap Icons, Leaflet 1.9 and supabase-js v2
are npm dependencies (OQ-2 amended: supabase-js replaces the plain-`fetch` wrapper). The browser
reads approved spots directly from Supabase
through Row Level Security. Vercel auto-detects Vite (`npm run build` → `dist/`). A Node seed
script (offline, never shipped, outside the Vue app) fills the database from OSM/Overpass plus
the researched playbook JSON.

Three data flows: **read** (approved only, RLS-enforced), **write** (anonymous insert forced to
`pending`), **verify** (rate-limited Postgres function `bump_verified`, decided at G3). Full detail:
`docs/architecture.md`. Frozen interface: `docs/api-contract.md`. Columns: `docs/data-model.md`.

**Why this shape:** the owner is learning while building, so every file must be readable top to
bottom. Vite's dev server (`npm run dev`) hot-reloads on save — editing a file and seeing the
browser update is the whole dev loop. The owner's goal (OQ-15) is to learn Vue for their career,
so the MVP doubles as their Vue learning project. Everything runs on free tiers. See
`docs/research-mobile-strategy.md` for the cost curve.

## 4. How the work is split (so more than one agent can run)

`tasks/todo.md` breaks the build into 58 one-agent-turn steps across 9 lanes. The safety rule is
**one file, one owner**: no two agents ever write the same file. `src/lib/*`, the component
props/emits list and the `useSpots` state shape form a frozen contract; all other lanes call
those by name.

```
Gates G1–G5 (owner)  →  ✅ Wave P prototype (done + verified 2026-11-10)
   → Wave 0 contract (1 agent, serial; Supabase ✅ 2026-11-14)
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

Concurrency cap is **2 agents** (from `docs/HANDOFF-musafir-project.md`). Waves 1–3 are three waves of
two. Data research (D1/D4) can overlap Wave 0 because it only needs owner approval.

## 5. Phase gates the owner owns

| Gate | Decision | Status |
|---|---|---|
| G1 | Approve this plan + `tasks/todo.md` | ✅ approved 2026-11-09, with the review fixes |
| G2 | Create Supabase project + Vercel account | 🟡 **half done 2026-11-14 (OQ-14)** — Supabase created; URL + anon key pasted into `js/config.js`. **Vercel deferred** to before deploy |
| G3 | Verification write path | ✅ decided 2026-11-09: Postgres function `bump_verified`, 1 bump/spot/hour |
| G4 | Desktop layout | ✅ decided 2026-11-09: keep the always-on two-pane map |
| G5 | Prototype first? | ✅ decided 2026-11-09: yes — `prototype/index.html` before Wave 0 |

G4 note: `docs/SPEC-singgah.md` decision 5 locks "a widened two-pane version of the same screens".
If the desktop mode changes, **update the spec first**, then the board, then the code.

## 6. Verification strategy

No automated test framework in MVP — adding one before there is anything to test is process
theater. Verification = `docs/manual-test-checklist.md`, run before **every** deploy, plus owner
dogfooding on a real trip. The checklist covers the 7 checks in `docs/SPEC-singgah.md` → Testing
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
fetch — **amended 2026-11-14 to supabase-js via npm**), OQ-5 (dark mode yes), OQ-10 (keep
two-pane), OQ-11 (prototype first), OQ-13 (branching adopted). Decided 2026-11-14: OQ-14 (Vercel
deferred to deploy), **OQ-15 (Vue 3 + Vite stack — amends L1)**. Still open, the important ones:
OQ-3 tile style (safe default: OSM per spec), OQ-4 heartbeat owner, OQ-6 missing playbook source
markdown (blocks D1), OQ-7 where custom CSS lives, OQ-8 UI copy conflicts, OQ-9 PWA manifest
wording, OQ-12 tile guardrails.

## 9. Definition of done (from SPEC success criteria)

A public URL loads on a phone over mobile data · 100+ approved spots including the playbook spots
· detail shows type / water / hours / bike parking / women-friendly / last-verified with
`Belum ada info` where missing · anyone can add a spot that lands `pending` and is not public ·
owner approves in the Supabase dashboard and it appears · `Masih ada ✓` updates
`last_verified_at` · UI is 100% Indonesian · manual checklist passes on a real phone · **the owner
completes one real-trip dogfood session**.

## 10. Change process

Update `docs/SPEC-singgah.md` **first** when a decision changes, then the affected docs, then code.
Ask the owner before: schema changes, any dependency beyond Leaflet + supabase-js, auth, photos,
hosting switch, instant-publish.
