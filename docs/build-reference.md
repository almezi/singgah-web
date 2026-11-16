# Build reference — Singgah

*What this doc does: one go-to reference for building or changing the app. It condenses the
frozen contract, the data model, the design tokens, the UI words, the code guardrails and the
pre-deploy checks into a single document — so you do not have to open six files to remember one
rule. Each section names its canonical doc.*

**Status: app v0.1 built and reviewed (2026-11-15). Deploy pending (P0–P4).**

**This is a digest, not a source of truth.** If anything here disagrees with a canonical doc,
the canonical doc wins — and `docs/SPEC-singgah.md` wins over everything. When a decision
changes: update the SPEC **first**, then the canonical doc, then this digest.

---

## 1. The app in one paragraph

Singgah is a mobile-first web app where cyclists and backpackers in Indonesia find free wash &
rest spots — masjid besar, musala, terminal, SPBU, rest area — in Yogyakarta city and along the
Jakarta→Yogya corridor. It is a Vue 3 single-page app built by Vite that talks directly to a
Supabase Postgres table protected by Row Level Security; there is no backend code of our own.
Phones get a full-screen map with a draggable bottom sheet; desktops (≥992px) get the same DOM
as a static sidebar plus map. Anyone can add a spot (it lands `pending`); only the owner approves
it, in the Supabase dashboard. The UI is 100% Indonesian and unknown data always reads
`Belum ada info` — never a guess.

## 2. Where the build stands (2026-11-15)

**Done:** Wave P prototype (verified 2026-11-10, `prototype-verification.md`) · Wave 0 Vue
scaffold + frozen contract (F1–F6) · Wave 1 map + list/detail · Wave 2 add flow + seed script ·
Wave 3 backend (`supabase/`) + docs · Wave 4 integration (I1–I3, `src/App.vue`) · senior code
review distilled into `code-standards.md` · 15 v0.1 screenshots in `docs/screenshots/`.

**Still open (owner actions):** approve the full seed run (D1 — dry run passed: playbook 11 +
OSM ≈ 7168) · create the Vercel account (P0) and deploy (P1) · approve-one-spot test (P2) ·
verify-write test (P3) · 100+ spots check (P4) · real-trip dogfood (P5) · OQ-4 weekly heartbeat ·
OQ-3 tile style choice (default OSM for now).

## 3. Locked stack & commands

| Dependency | Version | Note |
|---|---|---|
| Vue | 3.5 | JavaScript only — **no TypeScript** |
| Vite | 7 | build tool + dev server |
| Bootstrap | 5.3.3 | imported as **modular SCSS** (see §8) |
| Bootstrap Icons | 1.11.3 | shipped as **CSS masks**, no icon font (see §8) |
| Leaflet | 1.9.4 | map + pins |
| leaflet.markercluster | 1.5.3 | clustered markers (review addition) |
| @supabase/supabase-js | 2.49.4 | the only door to the database |
| sass (dev) | 1.108 | compiles `bootstrap-custom.scss` |

**No new dependency without asking the owner** (`AGENTS.md`). No router, no state library, no
test runner — deliberate absences, see `docs/architecture.md` §6.

```
Install (once):      npm install
Dev (local server):  npm run dev          # Ctrl+C stops it, nothing is lost
Build check:         npm run build        # must succeed before any merge
Seed database:       node scripts/seed-spots.mjs --dry-run   # always dry-run first
Deploy:              npx vercel --prod    # Vercel auto-detects Vite → dist/
```

## 4. How data moves

**Read (public, every load):** `App.vue` mounts → `useSpots.load()` → `loadApprovedSpots()` →
supabase-js `from('spots').select('*').eq('status','approved')` (paginated) → RLS returns
approved rows only → the same filtered array drives **both** `SpotList` (cards) and `MapPane`
(markers). Pending rows are filtered **by the database**, never by JavaScript.

**Write (contribute, anonymous):** `AddSpotSheet` emits `submit(payload)` → `App.vue` calls
`useSpots.addPending()` → `insertPendingSpot()` inserts with `status:'pending'`,
`source:'user'`, `last_verified_at:null` → RLS forces pending → invisible to everyone until the
owner approves it in the dashboard.

**Verify (the one anon write):** `Masih ada ✓` → `App.vue` calls `markVerified()` →
`bumpVerified()` → `supabase.rpc('bump_verified')` → a `security definer` Postgres function
updates **only** `last_verified_at`, max 1 bump per spot per hour (G3, 2026-11-09). Rate-limited
`false` is treated as **failure**, not success — the UI never lies.

**Seed (offline, one-off):** Node script reads `data/playbook-spots.json` + Overpass → dedupes →
upserts `approved` rows. Uses a privileged key from the **environment**, never a file. Never
runs in the browser.

## 5. File map (what every file does)

| File | One line |
|---|---|
| `index.html` | Vite entry: one `#app` div + module script, fonts, Indonesian `<title>` |
| `vite.config.js` | Vite + Vue plugin config |
| `src/main.js` | `createApp`, imports the three CSS files, sets saved theme **before** mount (no light/dark flash) |
| `src/App.vue` | layout shell + integrator: two-pane/sheet, draggable sheet, add flow, honest submit state, all toasts |
| `src/lib/config.js` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `TILE_URL` — **the only file** allowed to hold them |
| `src/lib/supabase.js` | client + the 3 API functions — components never import it directly |
| `src/lib/spotView.js` | canonical presentation metadata: labels, glyphs, chips, `isUnknown`, relative time |
| `src/lib/toast.js` | `showToast(message)` — global Bootstrap toast |
| `src/composables/useSpots.js` | shared state singleton: spots, filters, pendingMine, load/add/mark |
| `src/composables/useGeolocation.js` | `locate()` → `{lat,lng}` or failure toast; app stays usable |
| `src/components/MapPane.vue` | Leaflet map, clustered teardrop pins, geolocate button, pin-drop mode |
| `src/components/SpotList.vue` | cards, search box, type chips, `Tinjauan saya` (own pending) |
| `src/components/SpotDetail.vue` | detail fields, `Masih ada ✓`, `Rute` |
| `src/components/AddSpotSheet.vue` | add banner → offcanvas form → honest success state |
| `src/components/DarkModeToggle.vue` | `data-bs-theme` switch persisted in `localStorage` |
| `src/assets/bootstrap-custom.scss` | only the Bootstrap SCSS modules the app uses (grid **not** imported) |
| `src/assets/icons.css` | 24 Bootstrap Icons as inline SVG CSS masks — same `.bi` class names, no font |
| `src/assets/main.css` | brand tokens, sheet/map layout, custom overrides |
| `scripts/seed-spots.mjs` | Node seeder: playbook JSON + Overpass → Supabase (offline only) |
| `data/playbook-spots.json` | 11 real researched spots — research data, do not rewrite casually |
| `supabase/schema.sql`, `policies.sql`, `functions/` | table, RLS policies, `bump_verified` function |
| `prototype/index.html` | verified plain-JS prototype — **frozen design reference, do not migrate or edit** |
| `design/singgah-mockup-board.html` | approved 12-frame board — the visual source of truth |

## 6. The frozen contract

*Canonical: `docs/api-contract.md`. Frozen after Wave 0 — read-only for every lane. To change
it: report to the owner → owner decides → SPEC first → then this contract → then code.*

### 6.1 The `SPOT` field contract

Field names are **exactly** the `spots` columns. Do not rename, add, or drop.

| Field | Type | Allowed values |
|---|---|---|
| `id` | uuid | generated |
| `name` | text | required |
| `type` | text | `masjid_besar` · `musala` · `terminal` · `spbu` · `rest_area` |
| `lat`, `lng` | double | required |
| `water` | text / null | `kran_mandi` · `wudhu_only` · `air_isi` · `tidak_ada` · `null` |
| `hours` | text / null | free text, e.g. `24 jam` |
| `bike_parking` | boolean | default `false` |
| `women_friendly` | boolean / null | `null` = **belum ada info**, never guessed |
| `notes` | text / null | etiquette notes |
| `status` | text | `approved` · `pending` (default `pending`) |
| `source` | text | `osm` · `playbook` · `user` (default `user`) |
| `last_verified_at` | timestamptz / null | `null` = belum diverifikasi |
| `created_at` | timestamptz | default `now()` |

### 6.2 `src/lib/supabase.js` — the three functions (and three hard-won gotchas)

| Export | Shape | Job |
|---|---|---|
| `supabase` | client | `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`, wrapped in try/catch so a missing key does not blank the app |
| `loadApprovedSpots()` | `async () => SPOT[]` | approved rows, **paginated 1000 at a time** (PostgREST silently caps ~1000 rows — a plain `.select('*')` drops the rest) |
| `insertPendingSpot(payload)` | `async (object) => SPOT` | insert pending/user — **never add `.select()`**: reading back a pending row via the anon SELECT policy fails the whole insert with 42501. Returns a locally built row (`crypto.randomUUID()` display key, not a database id) |
| `bumpVerified(spotId)` | `async (uuid) => any` | `rpc('bump_verified', { spot_id })` — returns `false` when the 1-per-hour quota is spent; callers must treat `false` as failure |

### 6.3 Shared state — `useSpots()` / `useGeolocation()`

`App.vue` owns both and passes data down as props. Components never touch the database.

| Member | Shape | Job |
|---|---|---|
| `spots` | `ref<SPOT[]>` | approved spots only |
| `pendingMine` | `ref<SPOT[]>` | the user's own pending spots (`localStorage` key `singgah-pending-mine`) |
| `query`, `type` | `ref<string>` | search text + selected chip (`''` = all) |
| `filteredSpots` | `computed` | applies query + type — drives list **and** map so they always move together |
| `TYPES` | `string[]` | the five legal types |
| `load()` / `addPending(payload)` / `markVerified(spotId)` | async | initial read · submit + record locally · bump + refresh row (throws on rate limit) |

`useGeolocation()` → `{ position, loading, locate() }`; on failure `locate()` shows the
`Lokasi tidak tersedia.` toast and the app stays usable.

### 6.4 Component props / emits (props down, events up)

| Component | Props (in) | Emits (out) |
|---|---|---|
| `MapPane.vue` | `spots` (filtered), `pinMode`, `selectedId` | `select(spotId)` · `pin-placed(lat, lng)` |
| `SpotList.vue` | `spots`, `query`, `type`, `pendingMine`, `userPos` | `update:query` · `update:type` · `select(spotId)` |
| `SpotDetail.vue` | `spot` | `close` · `verify(spotId)` |
| `AddSpotSheet.vue` | `active`, `pin` (`{lat,lng}\|null`), `submitState` (`idle/pending/success/error`) | `cancel` · `submit(payload)` |
| `DarkModeToggle.vue` | — | — |

The `+ Tambah` FAB belongs to `App.vue`; it starts the add flow (`active` + `pinMode`).
Toasts belong to `App.vue` too — child components emit intent, the parent writes and toasts the
truth (`grep -rn "showToast" src/components/` must stay empty).

### 6.5 `src/lib/spotView.js` — one canonical source per shared concept

Labels, glyphs, chips and time formatting live **only** here. A duplicated constant in a
component is a bug incubator (the 2026-11-15 review removed exactly this).

- `UNKNOWN_LABEL` = `'Belum ada info'` · `isUnknown(value)` → the label for `null/undefined/''`
- `SPOT_TYPES` → `{ label, cls }` per type (cls = tint class `t-masjid` … `t-rest`)
- `TYPE_GLYPHS` → static SVG paths (safe for `v-html`; never put user data through `v-html`)
- `WATER_LABELS` → `kran_mandi: 'Kran mandi'` … `tidak_ada: 'Tidak ada'`
- `TYPE_CHIPS` → `Semua` + the five types
- `relTime(iso)` → `'baru saja'` · `'2 jam lalu'` · `'3 hari lalu'` · `verifyText(iso)` →
  `'Diverifikasi …'` / `'Belum diverifikasi'`

## 7. Database & RLS digest

*Canonical: `docs/data-model.md`.*

| Who | Action | Rule |
|---|---|---|
| anon | `SELECT` | only `status = 'approved'` |
| anon | `INSERT` | allowed, forced to `status='pending'`, `source='user'` |
| anon | `UPDATE` / `DELETE` | **forbidden — no policy exists** |
| anon | `EXECUTE bump_verified(spot_id)` | allowed — only touches `last_verified_at`, 1/spot/hour |
| owner (dashboard) | all | approving pending rows is manual, there is no admin UI |

Rows come from three sources: `playbook` (seed, approved) · `osm` (seed, approved) · `user`
(form, pending). Seed target: **≥ 100 approved spots** across Yogya + the corridor. Honesty
limits: OSM facility tags are effectively empty (toilets 0.4%, water 0%, hours 3%) — unknown
stays `null`; Terminal Pondok Pinang and any SPBU are skipped on purpose (no mappable point).
Attribution `© OpenStreetMap contributors` is mandatory (ODbL) and must stay visible on the map.

## 8. Design system digest

*Canonical: `docs/design-system.md`; visual source of truth: `design/singgah-mockup-board.html`.*

**Tokens** (warm sand + teal; the full `:root` lives in `main.css` and the canonical doc):

| Token | Value | Used for |
|---|---|---|
| `--bg` / `--surface` / `--surface-2` | `#F6F4EE` / `#FFFFFF` / `#F1EFE6` | page / cards / tinted panels |
| `--ink` / `--ink2` | `#12332C` / `#5A6E67` | text / muted text |
| `--primary` / `--primary-deep` / `--primary-soft` | `#0E7C66` / `#0B5D4E` / `#DDEEE8` | brand teal |
| `--amber` / `--amber-soft` | `#B45309` / `#FBEEDA` | etiquette note, terminal |
| `--water` / `--violet` | `#0E7490` / `#9333EA` | SPBU / musala |
| `--success` | `#15803D` | rest area, confirmations |

Font: **Plus Jakarta Sans** 400–800 (Google Fonts, loaded in `index.html`). Card/button radius
**14–16px**. Every soft-tinted text uses its darker `--*-ink` partner — all pairs ≥ 4.5:1.

**Markers:** one color + one white glyph per type, never color alone: masjid `#0E7C66` (dome) ·
musala `#9333EA` (building) · terminal `#B45309` (bus) · spbu `#0E7490` (droplet) · rest area
`#15803D` (tent). Legend appears once on desktop.

**Layout:** one DOM, two arrangements — mobile `<992px` full-screen map + draggable bottom sheet
(peek shows search + chips + 1 card; ~75vh max), desktop `≥992px` static left sidebar + map.
Reference frames: phone 390×844, desktop 1440×900.

**Dark mode** (OQ-5 = yes): Bootstrap native `data-bs-theme="dark"`, persisted in
`localStorage` key `singgah-theme`, applied in `main.js` before mount. Dark tokens: background
`#101B17`, surface `#16241F`, primary `#3DBFA3`, text on it `#06231C`, focus outline `#3DBFA3`.
Contrast must hold in **both** themes.

**Bootstrap-first rules:**
- Use built-in Bootstrap components before custom CSS (offcanvas, toast, badge, forms, switch).
  Custom CSS is limited to: token overrides, map pins, sheet mechanics.
- `bootstrap-custom.scss` imports **only used modules** (grid is not imported — layout is custom).
  If a component starts using a new Bootstrap feature, `@import` that module; never go back to
  the full CSS. Keep the mandatory import order (functions → variables → maps → mixins first).
- Icons: add a new icon by regenerating `icons.css` from `node_modules/bootstrap-icons/icons/*.svg`
  (pattern: `.bi-<name> { --bi-icon: url("data:image/svg+xml,…") }`) — do not re-add the icon font.
- Bootstrap blue `#0d6efd` must never reach the screen — `.btn-primary`, focus rings and links
  read the brand tokens; if you see blue, fix the token, not the component.

**Accessibility (non-negotiable):** contrast ≥ 4.5:1 in both themes · touch targets ≥ 44px ·
no label under 11px · no color-only encoding · visible labels on every form field ·
`:focus-visible` outline · `prefers-reduced-motion` guard · tap alternative to dragging the
sheet · no horizontal page scroll.

**Button sizing lesson (owner feedback):** never reuse a `flex:1` button class outside a flex
**row** — the submit CTA must stay `flex:0 0 auto` (~190×44, compact). Check 25 in the checklist
guards this.

## 9. UI copy digest

*Canonical: `docs/ui-copy.md`. Zero English in the UI — the only exception is
`© OpenStreetMap contributors`.*

**The non-negotiable string:** any missing value renders exactly **`Belum ada info`** — never a
dash, `N/A`, `Tidak diketahui`, or a guess. Related: `Belum diverifikasi` / `Diverifikasi 3 hari
lalu` / `✓ 2 jam lalu`.

| Element | Exact text |
|---|---|
| Search placeholder | `Cari masjid, musala, SPBU…` |
| Sheet title | `Terdekat dari saya` |
| Chips | `Semua` · `Masjid Besar` · `Musala` · `Terminal` · `SPBU` · `Rest Area` |
| Add FAB | `+ Tambah` |
| Own-pending section | `Tinjauan saya` (badge: `Menunggu tinjauan`) |
| Detail labels | `Air` · `Jam` · `Parkir sepeda` · `Ramah perempuan` · `Catatan` |
| Detail buttons | `Masih ada ✓` · `Rute` |
| Add banner | `Ketuk peta untuk menaruh pin` |
| Add submit | `Kirim untuk ditinjau` + reassurance `Spot baru diperiksa dulu sebelum tampil di peta.` |
| Success | `Terima kasih!` · `Spot kamu menunggu persetujuan.` · `Kembali ke peta` |
| Toasts (in code) | `Terima kasih! Verifikasi tercatat.` · `Lokasi tidak tersedia.` · `Gagal mengirim spot. Periksa koneksi lalu coba lagi.` · `Gagal menyimpan verifikasi. Coba lagi nanti.` |

Six strings still have two variants across the old prompts (search placeholder, mosque chip,
continue button, success heading/body, water labels) — **the approved board wins until the owner
decides** (OQ-8, see `ui-copy.md` §4). Never mix variants on one screen.

**Forbidden in the UI:** `Login` · `Sign up` · `Review` · `Rating` · `Foto` · `Upload` · `Email`
· `Akun` · `Profil` · `N/A` · `Unknown` · `Submit` · `Search` · `Map` · `Close` · `Cancel` ·
`Loading...` · any English error message · any guessed value · any scolding about pending review.

## 10. The ten code guardrails

*Canonical: `docs/code-standards.md` — each exists because breaking it caused a real bug.*

1. **One file, one owner** — cross-component work only via the frozen contract.
2. **The UI never lies** — success only after the database confirms (`submitState` machine).
3. **Components never call Supabase** — only `App.vue` (via `useSpots`) writes; props down,
   events up.
4. **Unknown data is `Belum ada info`** — every nullable value passes `isUnknown()`; empty
   strings become `null` at the payload boundary.
5. **One canonical source per shared concept** — labels/glyphs live only in `spotView.js`.
6. **Toasts belong to the parent** — child emits, parent writes and toasts.
7. **Performance budgets** — ≤ 50 cards + `Tampilkan 50 lagi` · clustered markers · ≥ 200 ms
   debounce on marker redraws · paginated queries · no `.select()` on the pending insert.
8. **Accessibility and Indonesian are not optional** — ≥ 44px targets, aria-labels, `aria-live`
   counts, `v-html` only for static module constants.
9. **Dependencies are locked** — every addition is an owner decision and must earn its bundle
   weight.
10. **Secrets and safety** — `service_role`/`sb_secret_` keys never touch the frontend, repo, or
    logs; RLS stays on; a pending-review page needs login (v0.2, OQ-17 — not improvised).

**Definition of done for any change:** `npm run build` succeeds · headless smoke check (loads,
zero console errors, touched flow works) · ten guardrails walked · Indonesian UI / `Belum ada
info` · change description stands alone in git history. No linter/CI exists — this document and
`code-standards.md` **are** the quality gate.

## 11. Screen flow & mobile mechanics

```
map + list ──tap card/marker──> detail ──Rute──> Google Maps (external link)
    │                             │
    │ + Tambah                    └─ Masih ada ✓ ─> bumpVerified() ─> line re-renders
    ▼
pin-drop mode ──pin placed──> Lanjut ──> add form (offcanvas)
                                            │ Kirim untuk ditinjau
                                            ▼
                                     success state ──> back to list
```

No router: `App.vue` decides what is visible with plain refs. Mechanics actually built (owner
feedback baked in — do not regress):

- **Sheet snaps:** peek (measured from the DOM: bottom of the search box + 8px — never a constant,
  fallback 180px) · half `55dvh` · full `innerHeight − 96px`. Drag from the handle; a fast fling
  (> 0.6 px/ms) jumps to the next snap, Google-Maps style. Peek is re-measured on mount, after
  web-font load, and on resize/rotation.
- **Detail on phone replaces the sheet content** (no overlay) and the sheet grows to
  `min(70dvh, 590px)`; on desktop detail is a floating panel that replaces the sidebar.
- **Map actions lower the sheet:** starting the add flow or getting a location fix drops the
  sheet to peek so the map is free to tap.
- **FAB `+ Tambah` hides** while the add flow is active or a detail is open (phone); it always
  sits above the Leaflet attribution line.
- **Pinning is honest:** `Lanjut` stays disabled until a pin exists; success screens appear only
  after the write resolves; failure keeps the form open with its content intact.

## 12. Verify before you ship

*Canonical: `docs/manual-test-checklist.md` — 26 checks, the only test runner. Write date +
device at the top of each run.*

The 7 SPEC checks: map + geolocate (denied permission still leaves the app usable) · approved
markers only, pending invisible everywhere except `Tinjauan saya` · detail shows every field or
`Belum ada info` · add flow lands a `pending`/`user` row in Supabase · dashboard approval makes
it appear · `Masih ada ✓` writes `last_verified_at` (rate limit holds) · the whole flow works on
a real phone over mobile data.

Deploy gate: sections A + B pass · blocking open questions answered · SPEC up to date ·
**no pending spot publicly visible** · no privileged key in anything served publicly.

## 13. Hard boundaries (never cross)

- **Never** the `service_role`/`sb_secret_` key in any frontend file, git, or log. Anon key only;
  RLS stays on.
- **Never** collect personal data — no emails, phones, accounts, photos, reviews.
- **Never** deploy with pending spots publicly visible.
- **Never** pre-cache OSM tiles (tile usage policy); tiles stay network-only behind the one
  `TILE_URL` constant.
- **Never** show a guessed value — `Belum ada info` always.
- Ask the owner before: schema changes, any new dependency, auth, photos, hosting switch,
  instant-publish.
- "Mobile" means a phone browser. The future native path is PWA → TWA wrapping this same app —
  never a React Native conversion (`decision-log.md` §F; research: `research-mobile-strategy.md`).

## 14. Where to go deeper

| Question | Open |
|---|---|
| What is the app and what is decided? | `SPEC-singgah.md` · `HANDOFF-musafir-project.md` |
| How do the pieces fit? | `architecture.md` |
| Exact function/prop/state contract | `api-contract.md` |
| Column values, RLS, seed sources | `data-model.md` |
| Colors, fonts, accessibility rules | `design-system.md` |
| Every Indonesian word | `ui-copy.md` |
| Guardrails + review checklist | `code-standards.md` |
| Run it on my computer / ship it | `setup.md` · `deployment.md` |
| Approve spots, keep the free tier awake | `owner-guide.md` |
| Full pre-deploy checklist | `manual-test-checklist.md` |
| Why decisions are what they are | `decision-log.md` |
| One paragraph per file, in order | `guided-tour.md` |
| PWA/TWA and cost research | `research-mobile-strategy.md` |
| Where seed data comes from | `research-osm-seeding.md` · `research-playbook-source.md` |
