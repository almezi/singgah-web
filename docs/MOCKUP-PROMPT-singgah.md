# Mockup Prompt — Singgah (musafir spot-finder)

**How to use:** once the FigCraft MCP server shows as connected (ZCode → Settings → MCP),
paste this into ZCode:

> Read `MOCKUP-PROMPT-singgah.md` in this workspace and follow it exactly, using the
> FigCraft MCP tools to build the mockup. Start with the desktop frame at 1440×900,
> then do the mobile frames at 390×844.

The prompt below is self-contained — the design agent needs no other files.

---

## THE PROMPT

Design a high-fidelity UI mockup for **Singgah** — a mobile-first web app where traveling
cyclists and backpackers in Indonesia find **free wash & rest spots**: masjid besar,
neighborhood musala, terminal musala, SPBU, and highway rest areas. The core question it
answers: *"di mana saya bisa mandi dan istirahat gratis?"*

### Frame setup
- **Desktop first:** one browser frame at **1440×900** — this is the web-first launch product.
- **Then mobile:** the same app at **390×844** — this is how it is really used on a trip.
  These phone frames are also the future "mobile app": the plan is to wrap the same web app
  (PWA/TWA) later, so there is no separate native design to invent.
- Single-page app concept: map is the home; list, detail, and add-form are layers over it.
- Light mode only. Clean, airy, friendly — this is a tool used at roadside rest stops, on
  mobile data, often at night. Legibility beats decoration.

### Look & feel
- Palette: water/teal + leaf green accents on a warm white background; soft shadows,
  rounded corners 12–16px. Suggest a friendly readable font (e.g. Inter or system sans).
- Map style: light and uncluttered (Carto Voyager vibe), NOT the busy default OSM style.
- Marker colors by spot type (legend must be visible once):
  masjid_besar = emerald · musala = teal · terminal = blue · spbu = amber · rest_area = violet.
- Type badges and small icons for water availability. Icons over photos everywhere —
  **the app has no photos**.

### Screens to design (in this order)

**0. Desktop — web home (the launch product)**
A browser window at 1440×900 showing the same single-page app on a bigger canvas —
not a separate desktop product. Light map fills the screen; search bar and filter chips
centered on top; FAB `+ Tambah`; the spot list as a slim left sidebar panel using the
exact same cards as the mobile list (grab-handle omitted). Keep whitespace generous and
the map the hero.

**1. Home — map view**
Full-screen map with scattered markers around Yogyakarta. Overlaid, top to bottom:
- Search bar: placeholder `Cari spot…`
- Horizontal filter chips: `Semua` `Masjid Besar` `Musala` `Terminal` `SPBU` `Rest Area`
- Floating geolocate button (crosshair icon)
- FAB labeled `+ Tambah`
- Bottom sheet peeking up ~160px, titled `Terdekat dari saya`, showing 2 spot cards
  (see card spec below) and a grab-handle implying drag for full list.

**2. List view** (bottom sheet fully expanded)
Scrollable spot cards. Each card: name, colored type badge, icon row for
water · hours · bike parking, and a verification line: `Diverifikasi 3 hari lalu` or
`Belum diverifikasi`. Include a distance like `1,2 km`.

**3. Detail card** (bottom sheet opened from a marker or list card)
- Name + type badge, e.g. `Musala Terminal Giwangan (Blok C)`
- Attribute rows with icons:
  - `Air:` one of `Kran mandi` / `Wudhu saja` / `Air isi` / `Tidak ada`
  - `Jam:` e.g. `24 jam`
  - `Parkir sepeda:` ✓ or ✗
  - `Ramah perempuan:` `Ya` / `Tidak` / **`Belum ada info`**
  - `Catatan:` short etiquette note, e.g. `Izin dulu ke marbot kalau mau tidur`
- Verification line + primary button **`Masih ada ✓`** (this confirms the spot still exists)
- At least ONE field in this card must visibly show **`Belum ada info`** — the app never
  invents data, and the mockup must show what that honestly looks like.

**4. Add-spot — step 1: pick location**
Map with a large crosshair/pin in the center, helper text `Ketuk peta untuk menaruh pin`,
button `Lanjut` (disabled-looking until a pin is placed) and `Batal`.

**5. Add-spot — form**
Fields: `Nama spot` (text, required) · `Jenis` (segmented control, 5 types) ·
`Air` (select) · `Jam buka` (text, placeholder `24 jam`) · `Parkir sepeda` (toggle) ·
`Ramah perempuan` (three-state: `Ya` / `Tidak` / `Belum ada info`) ·
`Catatan` (textarea, placeholder about mosque etiquette, e.g. asking the marbot).
Submit button: `Kirim untuk ditinjau`, with the reassurance line below it:
`Spot baru diperiksa dulu sebelum tampil di peta.`

**6. Success state**
Simple centered confirmation: `Terima kasih! 🙏` + `Spot kamu menunggu persetujuan.`
No login prompt, no email field, nothing else.

### Realistic sample content (use these, they are real researched spots)
- `Masjid Jami Ni'matul Ittihad` — masjid_besar, Kran mandi, 24 jam, parkir ✓, verified
- `Musala Terminal Giwangan (Blok C)` — musala, Wudhu saja, 24 jam, parkir ✓
- `SPBU Rest Area Km 419` — spbu, Air isi, parkir ✓, `Belum ada info` on Ramah perempuan
- One terminal and one rest_area card of your invention, clearly plausible

### Hard rules (the design must obey these)
1. **All UI text in Indonesian.** No English words in the UI.
2. Show unknown data as **`Belum ada info`** — never as a guessed default.
3. No accounts, no login/signup screens, no photos, no reviews/ratings/comments, no ads.
4. New submissions are **pending review** — the UI must communicate this without scolding.
5. Mobile-first on the phone frames: everything reachable with a thumb; bottom sheets
   over modals. On the desktop frame, the same components, just arranged on a bigger canvas.

### Done when
- 1 desktop frame + 6 phone frames exist, and they read as one and the same app.
- Every string is Indonesian; `Belum ada info` appears at least once.
- The `Masih ada ✓` verify button is present on the detail card.
- The add-spot flow makes the pending-review step obvious.
- A stranger could look at it and understand the app's purpose in 10 seconds.
