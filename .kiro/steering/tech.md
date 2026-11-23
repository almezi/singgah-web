# Tech stack and commands

- Vue 3 + Vite, JavaScript only (no TypeScript).
- Bootstrap 5 (SCSS, only the modules imported in `src/assets/bootstrap-custom.scss`) and
  Bootstrap Icons.
- Leaflet 1.9 with `leaflet.markercluster`. Raster tiles via the single `TILE_URL` constant.
- supabase-js v2 for the database. Anon key only.
- Ask the owner before adding any other dependency, changing the schema, adding auth or photos,
  switching hosting, or enabling instant-publish.

## Commands

```
npm install                       # once
npm run dev                       # dev server (run it in your own terminal, do not block on it)
npm test                          # Vitest, single run
npm run build                     # production build into dist/
node scripts/seed-spots.mjs       # seed Supabase (use --dry-run first)
npx vercel --prod                 # deploy
```

Vitest covers the pure helpers. CI (`.github/workflows/ci.yml`) runs tests and build. No linter.
Real verification is `docs/manual-test-checklist.md`.

## Hard rules

- Never put the Supabase `service_role` key in the frontend. RLS stays enabled.
- Never collect personal data (emails, phone numbers).
- Never deploy with pending spots publicly visible.
- "Masih ada ✓" calls the `bump_verified(spot_id)` Postgres function, rate-limited to one bump
  per spot per hour. No anon UPDATE or DELETE policies.
- Sass deprecation warnings from Bootstrap are silenced in `vite.config.js`.
