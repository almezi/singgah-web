# AGENTS.md — Singgah (musafir spot-finder)

## What this repo is

Singgah: a mobile-first web app where cyclists/backpackers in Indonesia find free wash & rest
spots (masjid besar, musala, terminal, SPBU, rest areas). **Currently pre-code**: the repo holds
only the spec and handoff docs. Do not start writing code unless the plan/task phase has been
approved by the owner.

## Read these first

- `SPEC-singgah.md` — the source of truth. Scope, data model, boundaries, success criteria.
  Update the spec FIRST when a decision changes, then change code.
- `HANDOFF-musafir-project.md` — project backstory and locked product decisions.

## Workflow rules (spec-driven development)

- Gated phases: Specify → Plan → Tasks → Implement, with owner review between phases.
  Never write code before the spec/plan is approved **in a later turn**.
- The owner is a beginner coder learning as we go: keep code explicit and simple, comment files
  with one-line "what this does" headers, and be ready to give a guided tour of any file.
- Communicate with the owner in simple English; UI text is Indonesian only.

## Locked decisions (from the spec — do not relitigate silently)

- Plain HTML/CSS/JS, **no framework, no build step, no npm project**. Leaflet 1.9 and
  supabase-js v2 via CDN only.
- Launch area: Yogya city + Jakarta→Yogya corridor only.
- Open add-spot flow, no login. User submissions land `status='pending'`; only the owner
  approves, via the Supabase dashboard. Only `approved` rows are publicly readable.
- No photos, no accounts, no reviews, no PWA/offline in MVP — all parked on purpose.
- Unknown data shows as "belum ada info" — never invent defaults.

## Commands

```
Dev (local server):  python3 -m http.server 8080     # http://localhost:8080
Seed database:       node scripts/seed-spots.mjs     # Overpass + playbook JSON → Supabase
Deploy:              npx vercel --prod
```

No build, lint, or automated test runner exists. Verification = manual checklist in
`docs/manual-test-checklist.md` (run before every deploy) + owner dogfooding on a real trip.

## Planned layout (from the spec)

```
index.html          single page: map + list + detail + add form
css/style.css       mobile-first styles
js/                 config.js · api.js · map.js · spots.js · contribute.js · verify.js
scripts/            seed-spots.mjs
data/               playbook-spots.json (real researched spots — research data, do not rewrite casually)
design/             singgah-mockup.html (UI mockup reference — approved look, tokens, palettes)
docs/               manual-test-checklist.md
tasks/              plan.md, todo.md (created in planning phase)
```

## Hard boundaries

- **Never** put the Supabase `service_role` key anywhere in the frontend. Anon key only; RLS
  must stay enabled (anon: read approved + insert pending; no anon update/delete).
- **Never** collect personal data (emails, phone numbers).
- **Never** deploy with pending spots publicly visible.
- Ask the owner before: schema changes, any dependency beyond Leaflet + supabase-js, auth,
  photos, hosting switch, instant-publish.
- Known open technical spot: the "Masih ada ✓" verify button needs a rate-limited write path
  (Edge Function vs Postgres function) — see Open Questions in the spec; decide in plan phase.
