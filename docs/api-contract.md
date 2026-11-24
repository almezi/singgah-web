# API & file contract — Singgah

*What this doc does: writes down the frozen interface so parallel agents never edit each other's
files. This is the companion to `tasks/todo.md` and `docs/architecture.md`.*

**Status: FROZEN 2026-11-14 — Wave 0 (F1–F6) executed; contract is now read-only for all lanes.**
Revised 2026-11-14 for the Vue 3 + Vite stack (OQ-15). It is derived from `docs/SPEC-singgah.md` →
Data Model and `tasks/todo.md` → F (Foundation). If a lane needs a change, it reports back to the
owner instead of editing.

---

## 1. Ownership (one file, one owner)

| File | Owner lane | Writes | Everyone else |
|---|---|---|---|
| `index.html` (Vite entry) | F (wave 0) | root div + module script | Read only |
| `package.json`, `vite.config.js` | F | dependencies + build config | Read only |
| `src/main.js` | F (wave 0), then I only (wave 4) | createApp, CSS imports, theme bootstrap | Read only |
| `src/App.vue` | F (wave 0), then I only (wave 4) | layout shell, component wiring | Read only |
| `src/lib/config.js` | F | constants | Read only |
| `src/lib/supabase.js` | F | Supabase calls + SPOT field list | Read only |
| `src/composables/useSpots.js` | F | shared spots state | Read only |
| `src/composables/useGeolocation.js` | F | geolocation wrapper | Read only |
| `src/lib/toast.js` | F | `showToast(message)` global Bootstrap toast | Read only |
| `src/components/MapPane.vue` | A | map behaviour | Read only |
| `src/components/SpotList.vue`, `SpotDetail.vue` | B | list/detail/verify | Read only |
| `src/components/AddSpotSheet.vue` | C | add flow + form | Read only |
| `src/components/DarkModeToggle.vue` | F | theme toggle | Read only |
| `data/`, `scripts/` | D | seed data + script | Read only |
| `supabase/` | E | schema + RLS + verify write path | Read only |
| `docs/`, `README.md` | T | documentation | Read only |

Rule: **no two agents write the same file.** Cross-lane work happens through the frozen contract
below (api functions, props/emits, `useSpots` state) only.

## 2. Component contract (props down, events up; `App.vue` wires everything)

| Component | Props (in) | Emits (out) | Job |
|---|---|---|---|
| `MapPane.vue` | `spots` (already filtered), `pinMode`, `selectedId` | `select(spotId)`, `pin-placed(lat, lng)` | Leaflet map, pins (selected pin is highlighted + map flies to it), geolocate button, pin-drop mode |
| `SpotList.vue` | `spots` (filtered), `query`, `type`, `pendingMine`, `userPos` | `update:query`, `update:type`, `select(spotId)` | cards, search, chips, `Tinjauan saya` |
| `SpotDetail.vue` | `spot` | `close`, `verify(spotId)` | detail fields, `Masih ada ✓`, `Rute` |
| `AddSpotSheet.vue` | `active` (flow started), `pin` (`{lat,lng}` or `null`), `submitState` (`idle/pending/success/error`) | `cancel`, `submit(payload)` | banner, form, honest success state (success only after the write resolves) |
| `DarkModeToggle.vue` | — | — | `data-bs-theme` + `localStorage` |

The "+ Tambah" FAB is rendered by `App.vue` (integrator, Wave 4); it starts the add flow
(`active` + `pinMode`) and consumes `submit(payload)` via `useSpots().addPending`.

Element IDs (`#map`, `#spot-list`, …) live **inside** each component's own template and are not
reached across components — a lane touches only its own template.

## 3. Config constants (`src/lib/config.js`, F2)

| Constant | Value | Rule |
|---|---|---|
| `SUPABASE_URL` | project REST URL | anon project only |
| `SUPABASE_ANON_KEY` | public anon key | **never** `service_role` |
| `TILE_URL` | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | the **only** tile URL in the repo |

Values migrate from the owner's `js/config.js` in F2 (OQ-14: owner consents before the old file
is deleted). A `.env.local` with `VITE_*` names may override them; `.env.local` is gitignored.
No tile URL, project URL, or key may appear in any other file. Seed credentials live in an
environment variable read by `scripts/seed-spots.mjs` and are never committed.

## 4. `src/lib/supabase.js` function signatures (F3)

Access style decided at OQ-2 (2026-11-09, plain fetch) and **amended 2026-11-14 (OQ-15):
supabase-js v2 via npm** — the standard client, same REST endpoint underneath.

| Export | Shape | Does |
|---|---|---|
| `supabase` | client instance | `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)` |
| `loadApprovedSpots()` | `async () => SPOT[]` | `from('spots').select('*').eq('status','approved')` |
| `insertPendingSpot(payload)` | `async (object) => void` | insert with `status:'pending'`, `source:'user'`, `last_verified_at:null` |
| `bumpVerified(spotId)` | `async (uuid) => void` | `rpc('bump_verified')` — `security definer` Postgres function, 1 bump/spot/hour (G3, decided 2026-11-09) |

`isUnknown(value)` moved to `src/lib/spotView.js` on 2026-11-15 (review: it is a presentation
helper, not a database concern) — together with the shared type metadata (SPOT_TYPES,
TYPE_GLYPHS, WATER_LABELS, TYPE_CHIPS, relTime, verifyText) that SpotList and SpotDetail both use.

Reference style from the spec (simple, explicit, one job):

```js
// src/lib/supabase.js — satu pintu untuk semua panggilan Supabase
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function loadApprovedSpots() {
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .eq('status', 'approved');
  if (error) throw error;
  return data; // array of SPOT objects
}
```

Code style: `camelCase` functions/variables, `PascalCase.vue` components, one job per file, every
file starts with a one-line comment saying what it does, code comments in simple English, UI
strings in Indonesian. No TypeScript in v0.1.

## 5. The frozen `SPOT` field contract

Field names are **exactly** the `spots` table columns. Do not rename, do not add, do not drop.

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

## 6. Shared state (`src/composables/useSpots.js`, F6)

One composable holds all list/map state; `App.vue` owns it and passes it down as props.

| Member | Shape | Job |
|---|---|---|
| `spots` | `ref<SPOT[]>` | approved spots only (from `loadApprovedSpots()`) |
| `pendingMine` | `ref<SPOT[]>` | the user's own pending spots (`localStorage` of submitted ids) |
| `query`, `type` | `ref<string>` | search text + selected type chip |
| `filteredSpots` | `computed<SPOT[]>` | applies `query` + `type` (drives both list and map) |
| `TYPES` | `string[]` | `masjid_besar · musala · terminal · spbu · rest_area` |
| `load()` | `async () => void` | initial read |
| `addPending(payload)` | `async () => void` | submit + record in `pendingMine` |
| `markVerified(spotId)` | `async () => void` | `bumpVerified` + refresh the row |

`src/composables/useGeolocation.js` (owned by F): `useGeolocation()` →
`{ position: ref<{lat,lng}|null>, loading, locate() }`. `locate()` resolves `{lat,lng}` or shows
the `Lokasi tidak tersedia.` toast and rejects — the app stays usable (A5). MapPane owns the
geolocate button; `App.vue` passes `position` to `SpotList` as the `userPos` prop (distance text).

## 7. Contract change process

1. A lane discovers it needs a new field, prop, emit, or function.
2. It **reports back** to the owner. It does not edit `src/lib/*`, `src/composables/useSpots.js`,
   or another lane's component.
3. Owner decides. If the `spots` table or stack changes, `docs/SPEC-singgah.md` is updated
   **first**.
4. This doc is updated, then the F/I lane implements it.

Hard boundaries that never change: anon key only, RLS on, pending never public, no personal data,
no `service_role` in the frontend, UI 100% Indonesian.
