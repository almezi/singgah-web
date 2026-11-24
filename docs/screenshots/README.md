# Screenshots — Singgah v0.1 (pra-deploy)

*What this folder does: bukti visual tampilan aplikasi yang **berjalan dengan data asli
(7.173 spot dari Supabase)** — diambil 2026-11-15 lewat browser headless (Playwright) pada
tiga viewport. Dipakai sebagai: (1) dokumentasi tampilan v0.1, (2) pembanding saat review
visual ke depan, (3) bahan checklist manual `docs/manual-test-checklist.md`.*

## Daftar file

| File | Apa yang ditunjukkan |
|---|---|
| `desktop-list-light.png` | Desktop 1440×900, mode terang: dua panel (daftar + peta), 7.173 spot |
| `desktop-detail-light.png` | Desktop: panel detail menggantikan sidebar (board frame 3), pin tersorot |
| `desktop-form-light.png` | Desktop: form "Tambah spot" (offcanvas kanan), chip terpilih teal |
| `desktop-list-dark.png` | Desktop mode gelap: kanvas hijau-hitam, kartu ikut gelap |
| `desktop-detail-dark.png` | Desktop gelap dengan panel detail |
| `tablet-list-light.png` | Tablet 768×1024: mode sheet (peta atas, panel bawah) |
| `tablet-detail-light.png` | Tablet: detail di dalam sheet |
| `phone-list-light.png` | Ponsel 390×844: sheet half + daftar kartu |
| `phone-detail-light.png` | Ponsel: detail menggantikan isi sheet, pin terlihat di atas |
| `phone-form-light.png` | Ponsel: form tambah spot (offcanvas bawah), kolom on-brand |
| `phone-sheet-peek-light.png` | Ponsel: sheet posisi peek (180px) — peta maksimal |
| `phone-sheet-full-light.png` | Ponsel: sheet posisi full (748px) — daftar penuh |
| `phone-locate-dot-light.png` | Ponsel: indikator lokasi (titik biru + lingkaran akurasi) |
| `phone-locate-dot-dark.png` | Indikator lokasi dalam mode gelap |
| `phone-list-dark.png` | Ponsel mode gelap: daftar + FAB |

## Cara mereproduksi

```bash
npm run build && npm run preview   # lalu buka URL preview di browser
```

State diatur lewat interaksi: klik kartu (detail), FAB + pin + Lanjut (form),
tarik pegangan sheet (peek/half/full), tombol "Lokasi saya" (titik lokasi),
tombol bulan (mode gelap). Lokasi disimulasikan lewat patch
`navigator.geolocation` di konsol browser.
