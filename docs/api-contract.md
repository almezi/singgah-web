# API & file contract — Singgah

*What this doc does: writes down the frozen interface so parallel agents never edit each other's
files. This is the companion to `tasks/todo.md` and `docs/architecture.md`.*

**Status: planned contract, not yet implemented.** It is derived from `SPEC-singgah.md` → Data
Model and `tasks/todo.md` → F (Foundation). Once F6 is done, this contract is **frozen**: lanes
read it, they do not change it. If a lane needs a change, it reports back to the owner instead of
editing.

---

## 1. Ownership (one file, one owner)

| File | Owner lane | Writes | Everyone else |
|---|---|---|---|
| `index.html` | F (wave 0), then I only (wave 4) | DOM IDs, CDN tags, script order | Read only |
| `js/config.js` | F | constants | Read only |
| `js/api.js` | F | Supabase calls + SPOT field list | Read only |
| `js/map.js` | A | map behaviour | Read only |
| `js/spots.js`, `js/verify.js` | B | list/detail/verify | Read only |
| `js/contribute.js` | C | add flow + form | Read only |
| `data/`, `scripts/` | D | seed data + script | Read only |
| `supabase/` | E | schema + RLS + verify write path | Read only |
| `docs/`, `README.md` | T | documentation | Read only |
| `css/style.css` | I | token overrides, pins, sheet | Read only |

Rule: **no two agents write the same file.** Cross-lane work happens through function names and
DOM IDs only.

## 2. DOM mount IDs (defined once in `index.html`, F2)

| ID | What mounts here | Used by |
|---|---|---|
| `#map` | Leaflet map container | A |
| `#spot-list` | approved spot cards | B |
| `#detail` | detail card | B |
| `#add-form` | add-spot offcanvas + success state | C |
| `#search` | search input | B |
| `#chips` | type filter chips | B |
| `#fab-add` | `+ Tambah` button | C |
| `#geo` | geolocate button | A |
| `#toast` | Bootstrap toast host | A, B, C |
| `#sheet` | bottom sheet / desktop sidebar container | I |

Every lane points at an ID; nobody adds a new ID without reporting back.

## 3. Config constants (`js/config.js`, F3)

| Constant | Value | Rule |
|---|---|---|
| `SUPABASE_URL` | project REST URL | anon project only |
| `SUPABASE_ANON_KEY` | public anon key | **never** `service_role` |
| `TILE_URL` | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | the **only** tile URL in the repo |

No tile URL, project URL, or key may appear in any other file. Seed credentials live in an
environment variable read by `scripts/seed-spots.mjs` and are never committed.

## 4. `js/api.js` function signatures (F4, F5)

| Function | Shape | Does |
|---|---|---|
| `supabaseHeaders()` | `() => object` | Returns `apikey` + `Authorization: Bearer <anon>` + `Content-Type` |
| `loadApprovedSpots()` | `async () => SPOT[]` | `GET /rest/v1/spots?status=eq.approved&select=*` |
| `insertPendingSpot(payload)` | `async (object) => void` | `POST` with `status:'pending'`, `source:'user'`, `last_verified_at:null` |
| `bumpVerified(spotId)` | `async (uuid) => void` | Calls the rate-limited verify write path (OQ-1 / G3) |
| `isUnknown(value)` | `(any) => string` | Returns `'Belum ada info'` for `null` / `undefined` / `''` |

Reference style from the spec (simple, explicit, one job):

```js
// js/api.js — ambil spot yang sudah approved untuk peta
async function loadApprovedSpots() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/spots?status=eq.approved&select=*`, {
    headers: supabaseHeaders(),
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json(); // array of SPOT objects
}
```

Code style: `camelCase` functions/variables, `kebab-case` file names, one job per file, every file
starts with a one-line comment saying what it does, code comments in simple English, UI strings in
Indonesian.

## 5. The frozen `SPOT` field contract

Field names are **exactly** the `spots` table columns. Do not rename, do not add, do not drop.
This is what makes the later prototype→Supabase swap mechanical.

```text
id, name, type, lat, lng, water, hours, bike_parking, women_friendly,
notes, status, source, last_verified_at, created_at
```

| Field | Type | Allowed values |
|---|---|---|
| `id` | uuid | generated |
| `name` | text | required |
| `type` | text | `masjid_besar` · `musala` · `terminal` · `spbu` · `rest_area` |
| `lat`, `lng` | double | required |
| `water` | text / null | `kran_mandi` · `wudhu_only` · `air_isi` · `tidak_ada` · `null` |
| `hours` | text / null | free text, e.g. `'24 jam'` |
| `bike_parking` | boolean | default `false` |
| `women_friendly` | boolean / null | `null` = **belum ada info**, never guessed |
| `notes` | text / null | etiquette notes |
| `status` | text | `approved` · `pending` (default `pending`) |
| `source` | text | `osm` · `playbook` · `user` (default `user`) |
| `last_verified_at` | timestamptz / null | `null` = belum diverifikasi |
| `created_at` | timestamptz | default `now()` |

Unknown data rule: `isUnknown(value)` returns `'Belum ada info'`. **Never invent a default.**

## 6. Cross-lane hooks (call by name, never import the file)

| Hook | Defined by | Called by | Shape |
|---|---|---|---|
| `filterMarkers(query, type)` | A (`js/map.js`) | B | filters pins |
| `showDetail(spotId)` | B (`js/spots.js`) | A, I | opens detail |
| `renderList(spots)` | B | I | draws cards |
| `enterPinMode()` / `exitPinMode()` | A | C | starts/stops pin-drop mode |
| `onPinPlaced(lat, lng)` | C | A | receives dropped pin |
| `bumpVerified(spotId)` | F (`js/api.js`) | B | verification write |
| `insertPendingSpot(payload)` | F | C | contribution write |
| `loadApprovedSpots()` | F | I | initial read |

Scripts load in dependency order in `index.html`:
`config.js` → `api.js` → `map.js` → `spots.js` → `verify.js` → `contribute.js`.
Plain `<script>` tags, no modules, no imports, no bundler.

## 7. Contract change process

1. A lane discovers it needs a new field, ID, or function.
2. It **reports back** to the owner. It does not edit `index.html`, `js/config.js`, or `js/api.js`.
3. Owner decides. If the `spots` table or stack changes, `SPEC-singgah.md` is updated **first**.
4. This doc is updated, then the F/I lane implements it.

Hard boundaries that never change: anon key only, RLS on, pending never public, no personal data,
no `service_role` in the frontend, UI 100% Indonesian.
