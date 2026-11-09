# Prototype Prompt — Singgah (musafir spot-finder, Bootstrap)

**How to use:** paste everything below the line into a fresh ZCode session (or any capable AI
coding tool) in this workspace. It is self-contained — the agent needs no other files. Output is
ONE file: `prototype/index.html`. No accounts, no npm, no build step.

> Read this prompt and follow it exactly. Build the file `prototype/index.html`.

---

## THE PROMPT

Build a **clickable web-app prototype** of **Singgah** — a mobile-first web app where traveling
cyclists and backpackers in Indonesia find **free wash & rest spots** (masjid besar, musala,
terminal, SPBU, rest area). It answers one question: *"di mana saya bisa mandi dan istirahat
gratis?"* This is a **prototype**: all data is mock data inside the file, there is **no backend**.

### Stack (exact — do not substitute)

| Piece | Version | Source |
|---|---|---|
| Bootstrap CSS + JS bundle | 5.3.3 | `https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css` and `.../js/bootstrap.bundle.min.js` |
| Bootstrap Icons | 1.11.x | `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css` |
| Leaflet | 1.9.4 | `https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css` and `.../leaflet.min.js` |
| Font | Plus Jakarta Sans 400–800 | Google Fonts |
| Map tiles | OSM standard | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` — put this URL in ONE `CONFIG` constant; never pre-cache tiles (OSM usage policy) |

Vanilla JS only. **Forbidden:** npm, build tools, React/Vue/jQuery, any fetch to external APIs
(map tiles excepted), console errors.

### Theme — make Bootstrap look like Singgah

Override Bootstrap CSS variables in a small `:root` block (custom CSS stays limited to tokens +
map pins + sheet mechanics; everything else uses Bootstrap components/utilities):

- Primary (oasis teal) `#0E7C66`, hover `#0B5D4E`, soft tint `#DDEEE8`
- Body background warm sand `#F6F4EE`, ink `#12332C`, muted `#5A6E67`
- Radius 14–16px on cards/buttons, font-family Plus Jakarta Sans everywhere
- Success `#15803D`, amber `#B45309`, water blue `#0E7490`, violet `#9333EA`
- **Dark mode** via Bootstrap 5.3 native `data-bs-theme="dark"` (toggle button, persisted in
  `localStorage`) with dark overrides: bg `#101B17`, surface `#16241F`, primary `#3DBFA3` with
  dark text `#06231C`

Marker color by type: masjid_besar = teal `#0E7C66` · musala = violet `#9333EA` ·
terminal = amber `#B45309` · spbu = water `#0E7490` · rest_area = green `#15803D`.

### Data — mock, but shaped like the real database

One inline JS array `SPOTS`. Field names must **exactly match** the spec's `spots` table so the
later Supabase swap is mechanical: `id, name, type, lat, lng, water, hours, bike_parking,
women_friendly (true | false | null), notes, status ('approved'|'pending'), source
('playbook'|'user'), last_verified_at (ISO string or null), created_at`.

Include these 9 (real spots — coordinates are prototype-grade, ±100 m is fine):

1. Musala Terminal Giwangan (Blok C) — terminal — −7.8267, 110.3757 — kran_mandi, "24 jam",
   bike ✓, verified 2h ago
2. Masjid Jogokariyan — masjid_besar — −7.8155, 110.3675 — kran_mandi, "24 jam", bike ✓,
   women_friendly true, verified 1 day ago
3. Masjid Gede Kauman — masjid_besar — −7.8070, 110.3630 — kran_mandi, "04.00–21.00", bike ✓
4. Masjid Kampus UGM — masjid_besar — −7.7660, 110.3780 — kran_mandi, "24 jam", bike ✓,
   women_friendly true
5. Musala Stasiun Tugu — terminal — −7.7828, 110.3649 — wudhu_only, "04.00–22.00", bike ✓,
   women_friendly **null**
6. SPBU Jl. Kaliurang KM 5 — spbu — −7.7520, 110.3730 — air_isi, "24 jam", bike ✓,
   women_friendly **null** ← this one MUST visibly show "Belum ada info"
7. Musala Rest Area Trans-Java KM 207 (Batang) — rest_area — −6.9667, 109.6833 — kran_mandi,
   "24 jam", bike ✓ (corridor data)
8. Masjid Jami Ni'matul Ittihad (Pondok Pinang, Jakarta) — masjid_besar — −6.2680, 106.7990 —
   kran_mandi, "24 jam", bike ✓ (corridor data)
9. Musala Jami Al-Ikhlas — musala — −7.7710, 110.4110 — wudhu_only, "Belum tahu", bike ✗,
   **status: 'pending', source: 'user', last_verified_at: null** (the pending-queue demo)

User-added spots persist to `localStorage` (`singgah_user_spots`). Seed data edits (e.g.
verification taps) live in memory only — put a one-line comment saying the real build persists
them to Supabase.

### Layout

- **Mobile (<992px):** full-screen Leaflet map; a bottom sheet fixed over it — peek state shows
  search + filter chips + 1 card, grab-handle expands it (~75vh, scrollable). FAB "+ Tambah"
  bottom-right above the sheet; geolocate button (bi-geo-alt) bottom-left.
- **Desktop (≥992px, Bootstrap grid):** same DOM — the sheet becomes a static left sidebar
  (col-lg-4, full height, scrollable) and the map fills col-lg-8. No separate desktop code path.

### Screens

1. **Beranda / list** (in the sheet): search input (bi-search, placeholder `Cari masjid, musala,
   SPBU…`), filter chips (btn-group pills: `Semua` `Masjid` `Musala` `Terminal` `SPBU`
   `Rest Area`), then spot cards. Card: colored type icon tile, name (600), meta line `type ·
   distance-ish label`, mini chips for water/hours/bike (bi-droplet, bi-clock, bi-bicycle),
   verification pill right (`✓ 2 jam lalu` green, or muted `Belum diverifikasi`). If any
   user-added pending spots exist, show a separate muted section **"Tinjauan saya"** below the
   approved list with dashed borders and a `Menunggu tinjauan` badge — pending spots NEVER mix
   into the public list. Map markers: Leaflet `divIcon` teardrop pin colored by type; tap = open
   detail.
2. **Detail** (replaces list inside the sheet, back button bi-arrow-left): name + type badge +
   meta, soft badges row (water/hours/bike), attribute rows (Air / Jam / Parkir sepeda / Ramah
   perempuan / Catatan) with icons — **unknown values render as muted `Belum ada info`, never a
   guess**; amber etiquette note box (bi-info-circle) when notes exist; verification line;
   actions: outline-success **`Masih ada ✓`** (bi-shield-check → sets `last_verified_at = now`,
   re-renders, Bootstrap toast `Terima kasih! Verifikasi tercatat.`) + primary **`Rute`**
   (opens `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>`).
3. **Tambah — step 1:** entering add mode dims the UI, shows banner `Ketuk peta untuk menaruh
   pin` + cancel (bi-x-lg); tapping the map drops a teal pin; bottom card shows `Pin di titik
   ini?` + button `Lanjut isi info`.
4. **Tambah — form** (Bootstrap offcanvas, bottom on mobile / end on desktop): fields `Nama
   spot` (required — use Bootstrap validation), `Jenis` (5 segmented radios, icons), `Air`
   (select: Kran mandi terang / Hanya air wudhu / Air isi ulang / Tidak ada air / Belum tahu),
   `Jam buka` (text, placeholder `24 jam`), switches `Parkir sepeda` + **`Ramah perempuan` as a
   3-state radio group: `Ya` / `Tidak` / `Belum ada info` (default)**, `Catatan` textarea
   (placeholder about asking the marbot). Submit `Kirim untuk ditinjau` + reassurance line:
   `Spot baru diperiksa dulu sebelum tampil di peta.`
5. **Sukses:** centered check (bi-check2-circle in soft green circle), `Terima kasih!`,
   `Spot kamu sedang ditinjau. Kalau disetujui, langsung muncul di peta.`, button `Kembali ke
   peta` → back to list (pending spot now visible in "Tinjauan saya").
6. **Geolocate:** pans to `navigator.geolocation`; on failure a toast `Lokasi tidak tersedia.`
   Nothing else breaks.

### Hard rules

1. **All UI text Indonesian.** Zero English words visible in the UI (attribution line excepted).
2. Unknown data = **`Belum ada info`** — never a guessed default. At least one spot must show it.
3. No accounts, no login/signup, no photos, no reviews/ratings/comments, no ads.
4. Pending review communicated gently — never scolding.
5. Everything thumb-reachable; interactive targets ≥44px on mobile.
6. Simple, commented code: every `<script>` section starts with a one-line `// what this does`
   comment (simple English). Explicit over clever — the owner is a beginner reading this code.
7. Run with `python3 -m http.server 8080` from the project root → `prototype/index.html`.

### Done when

- [ ] One file `prototype/index.html`, opens with zero console errors
- [ ] Real Leaflet map centered on Yogyakarta with 8 approved + 1 pending spot
- [ ] Search filters cards AND markers; chips filter by type; geolocate pans or toasts
- [ ] Detail: `Masih ada ✓` updates the verification line + toast; `Rute` opens Google Maps
- [ ] Full add flow: pin → form (required validation works) → success → pending spot in
      "Tinjauan saya", absent from public list, survives reload (localStorage)
- [ ] SPBU Kaliurang shows `Belum ada info` twice (ramah perempuan + notes)
- [ ] Dark mode toggles and persists; desktop ≥992px shows sidebar layout
- [ ] All 9 hard rules hold
