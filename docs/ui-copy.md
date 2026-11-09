# UI copy catalog — Singgah

*What this doc does: the single place to check every word a user sees. UI text is **Indonesian
only**. Sources: `SPEC-singgah.md`, `PROTOTYPE-PROMPT-singgah.md`, `MOCKUP-PROMPT-singgah.md`,
and the approved `design/singgah-mockup-board.html` (12 frames).*

**Rule:** zero English words visible in the UI. The only allowed exception is the mandatory OSM
attribution line `© OpenStreetMap contributors`. Code comments stay in simple English.

---

## 1. The non-negotiable string

| Context | Exact text |
|---|---|
| Any unknown / missing value | **`Belum ada info`** |

Capital `B`, exactly as above. SPEC prose sometimes writes `belum ada info` lowercase, but the
approved board and both UI prompts use the capitalized form — the UI uses **`Belum ada info`**.
Never replace it with a guess, a dash, `–`, `N/A`, `Tidak diketahui`, or an empty space.

Related honesty strings:

| Context | Exact text |
|---|---|
| Never verified | `Belum diverifikasi` |
| Verified some time ago | `Diverifikasi 3 hari lalu` / `Diverifikasi …` |
| Recently verified pill | `✓ 2 jam lalu` |

## 2. Screen-by-screen catalog

### Home / list
| Element | Text |
|---|---|
| Search placeholder | `Cari masjid, musala, SPBU…` (see Conflicts §4) |
| Bottom sheet title | `Terdekat dari saya` |
| Filter chips | `Semua` · `Masjid` · `Masjid Besar` · `Musala` · `Terminal` · `SPBU` · `Rest Area` |
| Add FAB | `+ Tambah` |
| Type badges | `Masjid Besar` · `Musala` · `Terminal` · `SPBU` · `Rest Area` |
| Distance | `1,2 km` (Indonesian decimal comma) |
| User's own pending section | `Tinjauan saya` |
| Pending badge | `Menunggu tinjauan` |

### Detail card
| Element | Text |
|---|---|
| Attribute labels | `Air` · `Jam` · `Parkir sepeda` · `Ramah perempuan` · `Catatan` |
| Verify button | `Masih ada ✓` |
| Route button | `Rute` |
| Back button | icon only (`bi-arrow-left`) |
| Etiquette note example | `Izin dulu ke marbot kalau mau tidur` |
| Yes / No | `Ya` · `Tidak` |

### Add-spot flow
| Element | Text |
|---|---|
| Step 1 banner | `Ketuk peta untuk menaruh pin` |
| Step 1 confirm | `Pin di titik ini?` |
| Continue | `Lanjut` / `Lanjut isi info` (see Conflicts §4) |
| Cancel | `Batal` |
| Field: name | `Nama spot` · `Nama spot · wajib` |
| Field: type | `Jenis` |
| Field: water | `Air` |
| Field: hours | `Jam buka` (placeholder `24 jam`) |
| Field: bike | `Parkir sepeda` |
| Field: women | `Ramah perempuan` (3-state `Ya` / `Tidak` / `Belum ada info`) |
| Field: notes | `Catatan` |
| Submit | `Kirim untuk ditinjau` |
| Reassurance line | `Spot baru diperiksa dulu sebelum tampil di peta.` |

### Success, toasts, attribution
| Element | Text |
|---|---|
| Success heading | `Terima kasih!` / `Terima kasih! 🙏` |
| Success body | `Spot kamu menunggu persetujuan.` (see Conflicts §4) |
| Back to map | `Kembali ke peta` |
| Verify toast | `Terima kasih! Verifikasi tercatat.` |
| Geolocate failure toast | `Lokasi tidak tersedia.` |
| Map attribution | `© OpenStreetMap contributors` (mandatory, the only English exception) |

## 3. Value labels (from `data/playbook-spots.json` values)

| `water` value | Detail label | Form option label (prototype prompt) |
|---|---|---|
| `kran_mandi` | `Kran mandi` | `Kran mandi terang` |
| `wudhu_only` | `Wudhu saja` | `Hanya air wudhu` |
| `air_isi` | `Air isi` | `Air isi ulang` |
| `tidak_ada` | `Tidak ada` | `Tidak ada air` |
| `null` | `Belum ada info` | `Belum tahu` |

`hours` examples: `24 jam`, `04.00–21.00`. A missing `hours` shows `Belum ada info`.

## 4. Conflicts to confirm (OQ-8 in `docs/decision-log.md`)

The three source documents disagree on these. **The approved board wins until the owner decides.**
Do not mix variants inside one screen.

| Item | `MOCKUP-PROMPT-singgah.md` | `PROTOTYPE-PROMPT-singgah.md` / board |
|---|---|---|
| Search placeholder | `Cari spot…` | `Cari masjid, musala, SPBU…` |
| Filter chip for mosques | `Masjid Besar` | `Masjid` |
| Continue button | `Lanjut` | `Lanjut isi info` |
| Success heading | `Terima kasih! 🙏` | `Terima kasih!` |
| Success body | `Spot kamu menunggu persetujuan.` | `Spot kamu sedang ditinjau. Kalau disetujui, langsung muncul di peta.` |
| Water labels | short (`Wudhu saja`) | longer form options (`Hanya air wudhu`) |

Also: the mockup prompt asks for a "Carto Voyager vibe" map while SPEC Open Question 3 says
default OSM tiles for MVP — see OQ-3.

## 5. Words that must NEVER appear in the UI

`Login` · `Sign up` · `Daftar` (as an account action — `Daftar` as a screen caption on the design
board is internal chrome, not app UI) · `Review` · `Rating` · `Foto` · `Upload` · `Email` ·
`Password` · `Akun` · `Profil` · `N/A` · `Unknown` · `Tidak diketahui` · `Submit` · `Search` ·
`Map` · `Close` · `Cancel` · `Loading...` · any English error message.

Also never: a guessed value where data is missing, or any wording that scolds the user about
pending review. The pending state is gentle: `Spot baru diperiksa dulu sebelum tampil di peta.`

## 6. How to check (before every deploy)

1. Open every one of the 6 screens on a phone viewport and read every visible word aloud.
2. Search the code for the forbidden words in §5.
3. Confirm `Belum ada info` appears at least once (the SPBU Kaliurang / SPBU Rest Area example).
4. Confirm the `© OpenStreetMap contributors` attribution is present.
5. Record the result in `docs/manual-test-checklist.md`.

## 7. Related docs

- `docs/design-system.md` — where the strings sit visually
- `docs/data-model.md` — the values behind the labels
- `docs/decision-log.md` — OQ-8
