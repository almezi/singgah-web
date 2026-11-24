# Project structure

```
index.html            Vite entry
src/main.js           createApp, Bootstrap imports, theme bootstrap
src/App.vue           layout shell: two-pane desktop (>=992px), bottom sheet on mobile
src/lib/              config.js (Supabase URL, anon key, TILE_URL) · supabase.js · spotView.js · toast.js
src/composables/      useSpots.js · useGeolocation.js
src/components/       MapPane · SpotList · SpotDetail · AddSpotSheet · DarkModeToggle
src/assets/           bootstrap-custom.scss · main.css · icons.css
scripts/              seed-spots.mjs (Node, outside the Vue app)
supabase/             schema.sql · policies.sql · functions/bump_verified.sql · constraints.sql
data/                 playbook-spots.json (researched data, do not rewrite casually)
design/               mockups (approved look)
prototype/            verified plain-JS prototype, keep untouched as design reference
docs/                 spec, contract, design system, UI copy, checklists
tasks/                plan.md, todo.md
```

- `docs/api-contract.md` freezes function signatures, DOM IDs, component props/emits and the
  `useSpots` state shape. Do not change them without updating the contract.
- Spot fields: id, name, type, lat, lng, water, hours, bike_parking, women_friendly, notes,
  status, source, last_verified_at, created_at (see `docs/data-model.md`).
- Follow `docs/code-standards.md`, `docs/design-system.md` and `docs/ui-copy.md`.
