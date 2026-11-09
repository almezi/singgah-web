# Local setup — Singgah

*What this doc does: the steps to run Singgah on your own computer, from zero to a working map.
Written for a beginner. No install step exists for the app itself — that is the point.*

**Status: planned.** The app code does not exist yet. Steps 1–3 below are things the owner must do
before any agent writes code (gates G1–G5 in `tasks/todo.md`).

---

## 0. What you need

| Thing | Used for | Cost |
|---|---|---|
| A browser (Chrome or Safari) | testing | free |
| Python 3 | local static server | already on macOS |
| Node ≥ 18 | only for the seed script | free |
| A Supabase account | database + approval dashboard | free tier |
| A Vercel account | hosting | free tier |
| A text editor / AI coding tool | writing files | — |

No `npm install`. No build command. No `.env` file for the frontend (the anon key is public by
design). `.gitignore` already ignores `.env` and `*.local` for the seed script's private key.

## 1. Owner gates (do these first)

1. Create the Supabase project. Copy its **project URL** and **anon key**.
   Never copy the `service_role` key into any file under `index.html`, `css/`, `js/`, or `data/`.
2. Create the Vercel account (or an approved free alternative).
3. Decide the verification write path (Edge Function vs Postgres function) — gate G3.
4. Decide the desktop layout — gate G4. If it changes, `SPEC-singgah.md` is updated first.
5. Decide whether `prototype/index.html` is built before the real app — gate G5.
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

`js/config.js` holds three constants and nothing else:

```js
// js/config.js — satu tempat untuk semua alamat dan kunci publik
const SUPABASE_URL = 'https://<project>.supabase.co';
const SUPABASE_ANON_KEY = '<public-anon-key>';
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
```

The tile URL appears **only** here. The anon key is safe to be public because RLS enforces the
rules. The `service_role` key belongs nowhere in the frontend, ever.

## 4. Run it locally

From the project root:

```
python3 -m http.server 8080
```

Then open `http://localhost:8080` (or `http://localhost:8080/prototype/index.html` for the
prototype). Because there is no build step, editing a file and refreshing the browser is the whole
development loop.

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
- [ ] `grep -r service_role index.html css js` returns nothing

Then run the full `docs/manual-test-checklist.md` on a real phone over mobile data.

## 7. Common problems

| Symptom | Likely cause |
|---|---|
| Blank map | wrong `TILE_URL`, or offline; tiles are network-only by design |
| No spots | anon key wrong, RLS not enabled, or rows still `pending` |
| `401` / `403` on read | anon key missing from headers, or RLS policy too strict |
| Overpass 502 | server at capacity — the seed script retries with backoff |
| `Lokasi tidak tersedia.` | browser geolocation denied; the app must stay usable |

## 8. Related docs

- `docs/architecture.md` — how the layers fit together
- `docs/api-contract.md` — frozen constants and function names
- `docs/deployment.md` — shipping to a public URL
- `docs/manual-test-checklist.md` — the pre-deploy checklist
