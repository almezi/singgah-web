# Local setup — Singgah

*What this doc does: the steps to run Singgah on your own computer, from zero to a working map.
Written for a beginner. No install step exists for the app itself — that is the point.*

**Status: Wave P prototype done (verified 2026-11-10); backend app code still planned.** You can
already run the clickable prototype with §4's server command — see
`docs/prototype-verification.md` for what was checked. In §1, step 1 is done (Supabase created,
2026-11-14), step 2 (Vercel) is deferred to before deploy (OQ-14), and step 6 (playbook file,
OQ-6) is still open; the decisions in steps 3–5 were made 2026-11-09 (gates G3–G5, after G1
approval).

---

## 0. What you need

| Thing | Used for | Cost |
|---|---|---|
| A browser (Chrome or Safari) | testing | free |
| Node ≥ 20.19 (or ≥ 22.12) | Vite dev server + build + the seed script | free |
| A Supabase account | database + approval dashboard | free tier |
| A Vercel account | hosting (only needed before deploy) | free tier |
| A text editor / AI coding tool | writing files | — |

One `npm install` after cloning (Vue, Vite, Bootstrap, Leaflet, supabase-js). No `.env` file is
required for the frontend — the anon key is public by design and lives in `src/lib/config.js`;
an optional `.env.local` (gitignored) can override it. `.gitignore` already ignores `.env` and
`*.local` for the seed script's private key.

## 1. Owner gates (do these first)

1. ✅ Done 2026-11-14 — Supabase project created; the owner pastes its **project URL** and
   **anon key** into `js/config.js` personally (Wave 0 step F2 migrates them into
   `src/lib/config.js` — OQ-15).
   Never copy the `service_role` key into any file under `index.html`, `css/`, `js/`, or `data/`.
2. **Open (deferred 2026-11-14, OQ-14)** — Vercel account; needed before deploy (P1) only. On
   signup, skip the "Import Git Repository" screen (we deploy via `npx vercel --prod`).
3. ✅ Done 2026-11-09 — gate G3: verification writes use the `bump_verified` Postgres function
   (`security definer`, 1 bump/spot/hour).
4. ✅ Done 2026-11-09 — gate G4: desktop keeps the always-on two-pane map.
5. ✅ Done 2026-11-09 (decision) / 2026-11-10 (built + verified) — gate G5: build
   `prototype/index.html` first (Wave P). All 8 "Done when" checks pass, zero console errors.
6. Copy the trip playbook source markdown into this repo (it is currently missing) so the seed
   data can be transcribed accurately.

## 2. Database setup (once)

1. In Supabase, open the SQL editor and run the `spots` table definition from
   `docs/data-model.md` §1.
2. Enable Row Level Security and add exactly the policies in `docs/data-model.md` §3.
3. Check: with the anon key, a `SELECT` returns **only** `approved` rows; an `INSERT` lands as
   `pending`; `UPDATE` and `DELETE` are refused.
4. Do **not** deploy until pending rows are confirmed invisible.

## 3. Put the keys in one place

`src/lib/config.js` will hold three constants and nothing else (created in Wave 0, F2, migrating
the owner's values from `js/config.js`):

```js
// src/lib/config.js — satu tempat untuk semua alamat dan kunci publik
const SUPABASE_URL = 'https://<project>.supabase.co';
const SUPABASE_ANON_KEY = '<public-anon-key>';
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
```

The tile URL appears **only** here. The anon key is safe to be public (it ships inside the Vite
bundle) because RLS enforces the rules. The `service_role` key belongs nowhere in the frontend,
ever.

## 4. Run it locally

From the project root:

```
npm install     # once
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`). The dev server hot-reloads:
editing a file and watching the browser update is the whole development loop. To open the plain
static prototype, serve the folder separately: `python3 -m http.server 8080`, then open
`http://localhost:8080/prototype/index.html`.

To check a phone layout, use your browser's device toolbar at 390 × 844. Note: headless Chrome
clamps its layout viewport to a 500px minimum, so a "375px" screenshot is a crop of a 500px
layout — test on a real phone for the final check.

## 5. Seed the database (after the schema exists)

```
node scripts/seed-spots.mjs --dry-run     # prints the count, writes nothing
node scripts/seed-spots.mjs               # upserts playbook + OSM spots
```

The script reads `data/playbook-spots.json` and queries the Overpass API. It needs a privileged
key from an environment variable for the upsert — set it in your shell, never in a committed file.
Always dry-run first. See `docs/data-model.md` §5 and `docs/research-osm-seeding.md`.

## 6. Quick sanity checks before you go further

- [ ] Page opens with **zero console errors**
- [ ] Map tiles load and `© OpenStreetMap contributors` is visible
- [ ] `Belum ada info` appears somewhere (unknown data is shown honestly)
- [ ] No English words are visible in the UI
- [ ] A newly added spot does **not** appear in the public list or map
- [ ] `grep -r service_role index.html src` returns nothing

Then run the full `docs/manual-test-checklist.md` on a real phone over mobile data.

## 7. Common problems

| Symptom | Likely cause |
|---|---|
| `npm run dev` fails | Node too old for Vite — use Node ≥ 20.19 (or ≥ 22.12) |
| Blank map | wrong `TILE_URL`, or offline; tiles are network-only by design |
| No spots | anon key wrong, RLS not enabled, or rows still `pending` |
| `401` / `403` on read | anon key missing from headers, or RLS policy too strict |
| Overpass 502 | server at capacity — the seed script retries with backoff |
| `Lokasi tidak tersedia.` | browser geolocation denied; the app must stay usable |

## 8. Related docs

- `docs/prototype-verification.md` — Wave P sign-off record
- `docs/architecture.md` — how the layers fit together
- `docs/api-contract.md` — frozen constants and function names
- `docs/deployment.md` — shipping to a public URL
- `docs/manual-test-checklist.md` — the pre-deploy checklist
