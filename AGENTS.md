# AGENTS.md — Singgah (musafir spot-finder)

## What this repo is

Singgah: a mobile-first web app where cyclists/backpackers in Indonesia find free wash & rest
spots (masjid besar, musala, terminal, SPBU, rest areas). **Currently early Implement**: the repo
holds the spec, handoff, approved design frames, the plan/task list (approved at gate G1,
2026-11-09), the full documentation set, and a **clickable mock-data prototype**
`prototype/index.html` — but no backend application code. **Wave P is done and verified
2026-11-10** (`docs/prototype-verification.md`: all 8 "Done when" items pass, zero console
errors). **Wave 0 (F1–F6) is unblocked as of 2026-11-14** (OQ-14): Supabase is created and the
owner holds the URL + anon key. The **Vercel account** is deferred to before deploy (Wave 5).
OQ-6 (playbook file) blocks D1 only. Do not write `supabase/` before Wave 3.

**Stack changed 2026-11-14 (OQ-15): the app is now Vue 3 + Vite** (JavaScript, no TypeScript),
with Bootstrap 5 + Icons, Leaflet 1.9 and supabase-js v2 as npm dependencies — amending the
original "plain JS, no build step" decision with the owner's consent. The verified plain-JS
prototype stays untouched as the design reference. `js/config.js` holds the owner-pasted Supabase
URL + anon key; the Wave 0 scaffold migrates those values into the Vue app config (the old file
is deleted only with the owner's consent). `tasks/todo.md` is rewritten around Vue lanes — read
the new version before coding.

## Read these first

- `docs/SPEC-singgah.md` — the source of truth. Scope, data model, boundaries, success criteria.
  Update the spec FIRST when a decision changes, then change code.
- `docs/HANDOFF-musafir-project.md` — project backstory and locked product decisions.
- `README.md` and `docs/README.md` — documentation index; `docs/guided-tour.md` explains every
  file in reading order.
- `docs/api-contract.md` — the frozen DOM IDs, config constants and function signatures. Parallel
  agents call these by name and never edit the owner lane's files.
- `docs/decision-log.md` — locked decisions, open questions, and known contradictions between
  the spec, the prompts and the approved design board. Do not resolve those silently.
- `docs/branching-strategy.md` — adopted git workflow (OQ-13, 2026-11-09): one protected `main`,
  one short-lived `build/mvp` for all waves, a tag per deploy. **Branch by phase, not by agent** —
  parallel agents share this working directory, so they commit to the same branch, different files.
- `docs/prototype-verification.md` — Wave P sign-off (verified 2026-11-10). Read it before
  changing `prototype/index.html`, so a verified flow is not silently regressed.

## Workflow rules (spec-driven development)

- Gated phases: Specify → Plan → Tasks → Implement, with owner review between phases.
  Never write code before the spec/plan is approved **in a later turn**.
- The owner is a beginner coder learning as we go: keep code explicit and simple, comment files
  with one-line "what this does" headers, and be ready to give a guided tour of any file.
- Communicate with the owner in simple English; UI text is Indonesian only.

## Locked decisions (from the spec — do not relitigate silently)

- **Vue 3 + Vite (JavaScript, no TypeScript)** with **Bootstrap 5 + Bootstrap Icons, Leaflet 1.9
  and supabase-js v2 as npm dependencies** (amended 2026-11-14, OQ-15 — was "plain HTML/JS via
  CDN, no build step"). No other dependencies without asking the owner.
- Launch area: Yogya city + Jakarta→Yogya corridor only.
- Open add-spot flow, no login. User submissions land `status='pending'`; only the owner
  approves, via the Supabase dashboard. Only `approved` rows are publicly readable.
- No photos, no accounts, no reviews, no PWA/offline in MVP — all parked on purpose.
- Unknown data shows as "belum ada info" — never invent defaults.

## Commands

```
Install (once):      npm install                     # Vue, Vite, Bootstrap, Leaflet, supabase-js
Dev (local server):  npm run dev                     # Vite dev server with hot reload
Stop (local server): Ctrl+C in the dev terminal      # kills the Vite dev server, nothing is lost
Seed database:       node scripts/seed-spots.mjs     # Overpass + playbook JSON → Supabase
Deploy:              npx vercel --prod               # auto-detects Vite: builds, serves dist/
```

No lint or automated test runner exists. Verification = manual checklist in
`docs/manual-test-checklist.md` (run before every deploy) + owner dogfooding on a real trip.

## Planned layout (from the spec)

```
index.html          Vite entry (one root div + module script)
src/main.js         createApp + Bootstrap imports + theme bootstrap
src/App.vue         layout shell: two-pane desktop, bottom sheet mobile
src/lib/            config.js (URL + anon key + TILE_URL) · supabase.js (client + 3 API functions)
src/composables/    useSpots.js · useGeolocation.js
src/components/     MapPane.vue · SpotList.vue · SpotDetail.vue · AddSpotSheet.vue · DarkModeToggle.vue
scripts/            seed-spots.mjs
data/               playbook-spots.json (real researched spots — research data, do not rewrite casually)
design/             singgah-mockup.html (UI mockup reference — approved look, tokens, palettes)
prototype/          index.html (verified plain-JS prototype — untouched design reference)
docs/               SPEC-singgah.md, HANDOFF-musafir-project.md, *_PROMPT-singgah.md,
                    manual-test-checklist.md + architecture.md, api-contract.md,
                    data-model.md, design-system.md, ui-copy.md, setup.md,
                    deployment.md, owner-guide.md, decision-log.md, guided-tour.md,
                    README.md, research-*.md
tasks/              plan.md, todo.md (created in planning phase)
README.md           project entry point + documentation index
```

## Hard boundaries

- **Never** put the Supabase `service_role` key anywhere in the frontend. Anon key only; RLS
  must stay enabled (anon: read approved + insert pending; no anon update/delete).
- **Never** collect personal data (emails, phone numbers).
- **Never** deploy with pending spots publicly visible.
- Ask the owner before: schema changes, any dependency beyond Leaflet + supabase-js, auth,
  photos, hosting switch, instant-publish.
- Verify write path (decided at G3, 2026-11-09): "Masih ada ✓" calls the `bump_verified(spot_id)`
  Postgres function (`security definer`) — updates only `last_verified_at`, rate-limited to one
  bump per spot per hour. No anon UPDATE/DELETE policies. See SPEC Open Question 1 (resolved).
