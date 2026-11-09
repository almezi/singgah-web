# Singgah

A mobile-first web app where traveling cyclists and backpackers in Indonesia find **free wash &
rest spots**: masjid besar, neighborhood musala, terminal, SPBU, and highway rest areas. It answers
one question: *"di mana saya bisa mandi dan istirahat gratis?"*

Launch area: **Yogyakarta city + the Jakarta→Yogya corridor**. UI language: **Indonesian only**.

---

## ⚠️ Status: pre-code — planning phase

No application code exists yet. This repo holds the spec, the plan, the task list, the approved
design, and the documentation. Work is gated:

**Specify → Plan → Tasks → Implement**, with owner review between phases.

`tasks/plan.md` and `tasks/todo.md` are **drafts awaiting your approval in a later turn**. No agent
should write code until they are approved. See `AGENTS.md`.

## The short version of the technology

A **static single-page site with no build step**. Plain HTML/JS + Bootstrap 5 + Bootstrap Icons,
Leaflet 1.9, and supabase-js v2 — all via CDN. The browser reads approved spots directly from
Supabase through Row Level Security. Vercel serves the files. A Node seed script (offline, never
shipped) fills the database from OSM/Overpass plus researched playbook data.

```
Browser (phone / laptop)
   ├── index.html + js/*.js + css/style.css      ← static files on Vercel
   ├── Bootstrap / Icons / Leaflet / fonts      ← CDN
   ├── Supabase REST (anon key, RLS)            ← approved spots only
   └── OSM tiles (network only)                 ← one TILE_URL constant
```

Three flows: **read** approved spots (RLS-enforced), **write** anonymous `pending` submissions,
**verify** `Masih ada ✓` through a rate-limited write path (still undecided). Full detail:
[`docs/architecture.md`](docs/architecture.md).

## Commands

```
python3 -m http.server 8080     # local dev → http://localhost:8080
node scripts/seed-spots.mjs     # Overpass + playbook JSON → Supabase (offline, after schema)
npx vercel --prod               # deploy a static site
```

No `npm install`, no build, no lint, no test runner. Verification is the
[manual checklist](docs/manual-test-checklist.md), run before every deploy.

## Documentation

**Start with [`docs/guided-tour.md`](docs/guided-tour.md)** — one plain-English paragraph about
every file, in reading order. Or use the [`docs/README.md`](docs/README.md) index.

| Topic | Doc |
|---|---|
| Technology structure, layers, data flows | [`docs/architecture.md`](docs/architecture.md) |
| Frozen API + file contract for parallel agents | [`docs/api-contract.md`](docs/api-contract.md) |
| `spots` table, values, RLS | [`docs/data-model.md`](docs/data-model.md) |
| Colors, type, pins, accessibility | [`docs/design-system.md`](docs/design-system.md) |
| Every Indonesian UI string | [`docs/ui-copy.md`](docs/ui-copy.md) |
| Local setup | [`docs/setup.md`](docs/setup.md) |
| Deployment + free tiers | [`docs/deployment.md`](docs/deployment.md) |
| Owner operations (approve spots) | [`docs/owner-guide.md`](docs/owner-guide.md) |
| Pre-deploy checklist | [`docs/manual-test-checklist.md`](docs/manual-test-checklist.md) |
| Locked decisions + open questions | [`docs/decision-log.md`](docs/decision-log.md) |
| Git branching strategy (proposal) | [`docs/branching-strategy.md`](docs/branching-strategy.md) |
| Plan / task list | [`tasks/plan.md`](tasks/plan.md) · [`tasks/todo.md`](tasks/todo.md) |
| OSM seeding research | [`docs/research-osm-seeding.md`](docs/research-osm-seeding.md) |
| Mobile strategy + cost research | [`docs/research-mobile-strategy.md`](docs/research-mobile-strategy.md) |

**Source of truth:** [`SPEC-singgah.md`](SPEC-singgah.md). **Working rules:**
[`AGENTS.md`](AGENTS.md). When a decision changes, update the spec **first**, then the docs, then
code.

## Hard boundaries

- Anon key only. **Never** put a Supabase `service_role` key in the frontend.
- RLS stays on: anon reads `approved` rows only, inserts forced to `pending`, no anon
  update/delete.
- Never deploy with pending spots publicly visible.
- No personal data (emails, phone numbers), no accounts, no photos, no reviews, no PWA/offline
  in MVP.
- Unknown data shows **`Belum ada info`** — never a guessed default.
- OSM tiles are network-only (no bulk/pre-emptive caching); `© OpenStreetMap contributors`
  attribution is mandatory.

Ask the owner before: schema changes, any dependency beyond Leaflet + supabase-js, auth, photos,
hosting switch, instant-publish.

## Design reference

[`design/singgah-mockup.html`](design/singgah-mockup.html) — approved v0.1 look and tokens.
[`design/singgah-mockup-board.html`](design/singgah-mockup-board.html) (+ `.png`) — 12 frames:
6 desktop 1440×900 + 6 phone 390×844. The phone frames are the component reference.

## Definition of done

A public URL loads on a phone over mobile data · 100+ approved spots including the playbook spots
· anyone can add a spot that lands `pending` and is not public · owner approves it in the Supabase
dashboard and it appears · `Masih ada ✓` updates `last_verified_at` · UI is 100% Indonesian ·
manual checklist passes on a real phone · **the owner completes one real-trip dogfood session**.
