# Wave P prototype verification — Singgah

*What this doc does: records the end-to-end check of `prototype/index.html` against the
`PROTOTYPE-PROMPT-singgah.md` → "Done when" checklist. Wave P is the clickable mock-data
prototype; it has no backend. This is a verification record, not the pre-deploy checklist —
that one is `manual-test-checklist.md` and applies to the real Supabase-backed app.*

**Result: PASS — all 8 "Done when" items and all 9 hard rules.**
Verified 2026-11-10 on `build/mvp` at commit `6a32249` ("Add Wave P clickable prototype").
No defects found; `prototype/index.html` was **not modified**.

---

## 1. How it was verified

Static audit (Python/regex over the single 814-line file) plus **three headless-Chrome runs**
served from `python3 -m http.server 8099` at the project root. Bootstrap 5.3.3, Bootstrap Icons
1.11.3, Leaflet 1.9.4 and Plus Jakarta Sans all loaded from CDN; OSM tiles rendered.

A temporary self-test harness was injected into a **served copy** of the page (never into the
tracked file) and the results were read back from the dumped DOM. Three short-lived harness copies
were created under `prototype/` and deleted afterwards, so no test file remains in the repo.

| Run | Viewport | Purpose |
|---|---|---|
| 1 | 500×701 (mobile path) | data, filters, verify, unknown values, dark mode, add flow, English scan |
| 2 | 1440×757 (desktop path), **same browser profile** | sidebar layout + `localStorage` persistence after a real reload |
| 3 | 500×757 (mobile path) | `Rute` link, geolocate failure, pin gating, 44px targets, forbidden features |

> Headless Chrome clamps `--window-size` to a 500px minimum, so the "mobile" runs exercised the
> `<992px` layout at 500px, not a literal 390px. The `≥992px` breakpoint was checked directly at
> 1440px. **A real 390×844 phone check is still owed** — see §4.

---

## 2. "Done when" checklist

| # | Requirement | Result | Evidence |
|---|---|---|---|
| 1 | One file, opens with zero console errors | ✅ | 814 lines, single `prototype/index.html`; `window.onerror`, `unhandledrejection` and `console.error` captured **0 errors in all 3 runs**; `L` and `bootstrap` both loaded |
| 2 | Real Leaflet map on Yogyakarta, 8 approved + 1 pending | ✅ | 8 cards, 8 marker icons, list count `8 spot`; 1 seeded pending in `Tinjauan saya`; center `[-7.7956, 110.3695]`, zoom 13; 12 rendered `<img>` are all `tile.openstreetmap.org` tiles |
| 3 | Search filters cards **and** markers; chips by type; geolocate pans or toasts | ✅ | `Giwangan` → 1 card / 1 marker; `Masjid` chip → 4 cards / 4 markers; geolocate failure → toast `Lokasi tidak tersedia.` and all 8 cards still present |
| 4 | `Masih ada ✓` updates line + toast; `Rute` opens Google Maps | ✅ | toast `Terima kasih! Verifikasi tercatat.`, line → `Diverifikasi baru saja`; `Rute` href = `https://www.google.com/maps/dir/?api=1&destination=-7.8267,110.3757` |
| 5 | Full add flow → pending in `Tinjauan saya`, absent from public list, survives reload | ✅ | pin gating (hidden before pin, shown after, teal temp pin), required-name validation, success view, `status:'pending'`/`source:'user'`/`women_friendly:null`, all 14 `spots` fields present; run 2 (fresh load, same profile) still showed the spot under `Tinjauan saya` and nowhere public |
| 6 | SPBU Kaliurang shows `Belum ada info` twice | ✅ | detail of `s6`: `Ramah perempuan` + `Catatan` both render `Belum ada info` (count = 2), no guessed default |
| 7 | Dark mode toggles and persists; desktop ≥992px sidebar | ✅ | `data-bs-theme` light→dark→light, `localStorage.singgah_theme` written; at 1440px `#sheet` computed `position: static` with legend visible; at 500px `position: fixed` |
| 8 | All 9 hard rules hold | ✅ | see §3 |

## 3. Hard rules

| Rule | Result |
|---|---|
| All UI text Indonesian; zero English visible | ✅ blacklist scan over `body.innerText` returned **0 hits**; only allowed English is `© OpenStreetMap contributors`, which is present |
| Unknown data = `Belum ada info`, never a guess | ✅ `isUnknown()` helper + `UNKNOWN` constant; verified on `s6` and on the new-spot form default |
| No accounts / login / photos / reviews / ads | ✅ 0 password inputs, 0 email inputs, 0 authored `<img>`, no manifest, no service-worker registration, 0 forbidden UI words |
| Pending review communicated gently | ✅ `Tinjauan saya` + `Menunggu tinjauan` badge, dashed cards, reassurance line |
| Everything thumb-reachable, targets ≥44px | ✅ measured min-heights: chips 44, FAB 48, geo 44, theme 44, sheet handle 44, back 44, jenis 44, submit 44, pin-next 44 — **all ≥44** |
| Simple, commented code | ✅ every `<script>` section opens with a `// what this does` comment |
| Runs with `python3 -m http.server 8080` | ✅ static, no build step; verified via the equivalent on port 8099 |
| No npm / build tools / React / Vue / jQuery | ✅ CDN tags only, vanilla JS |
| No fetch to external APIs; no console errors | ✅ `fetch(` = 0, `XMLHttpRequest` = 0, `service_role` absent, `supabase` absent; 0 console errors |

Extra checks: no horizontal scroll at mobile width; `add-mode` exits cleanly; pending seed spot
`Musala Jami Al-Ikhlas` never appears in the public list; desktop legend renders 5 types; marker
pins use one colour **plus one white glyph** per type (not colour alone).

## 4. What this does NOT prove

- **Real 390×844 phone + real mobile data** — headless Chrome clamps to 500px. Still owed before
  calling the product done (SPEC success criterion 7, checklist item 7).
- **Any backend behaviour.** Wave P is mock data + `localStorage`. RLS, `bump_verified()`,
  Supabase reads/writes, the approve-in-dashboard flow and the 100+ spot target are all untested
  and belong to Wave 0–4. Checklist items 5, 6, 11, 12 cannot be ticked yet.
- **Tile usage at launch scale**, dark-mode visual polish by eye, and drag-to-expand the sheet on
  a touch device.

## 5. What it unblocks

Wave P is complete, so the dependency chain in `tasks/todo.md` moves to **Wave 0 (F1–F6)**.
Wave 0 is still **gated on G2** (owner creates the Supabase project + Vercel account). Nothing in
Wave 0 was started during verification, and no application code was written.

See `tasks/todo.md` (step list and agent prompts), `tasks/plan.md` (phase gates),
`manual-test-checklist.md` (the real pre-deploy checklist) and `decision-log.md` (OQ-6, the
missing playbook source file that still blocks D1).
