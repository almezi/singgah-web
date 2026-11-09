# Design system — Singgah

*What this doc does: writes down the approved look so no agent invents new colors or sizes.
Visual source of truth: `design/singgah-mockup.html` (approved v0.1 tokens) and
`design/singgah-mockup-board.html` (12 frames — 6 desktop 1440×900, 6 phone 390×844; the phone
frames are the component reference).*

**Status:** the board is light-only on purpose. Dark mode is a prototype concern, not a board
concern — see OQ-5 in `docs/decision-log.md`.

---

## 1. Tokens (from the approved board `:root`)

```css
:root{
  --bg:#F6F4EE; --surface:#FFFFFF; --surface-2:#F1EFE6; --line:#E4DFD2;
  --ink:#12332C; --ink2:#5A6E67;
  --primary:#0E7C66; --primary-deep:#0B5D4E; --primary-soft:#DDEEE8;
  --success:#15803D; --success-soft:#DCF3E2;
  --amber:#B45309; --amber-soft:#FBEEDA;
  --water:#0E7490; --water-soft:#DCF0F5;
  --violet:#9333EA; --violet-soft:#F1E6FB;
  /* darker ink variants for TEXT on soft tints — every pair >= 4.5:1 (WCAG AA) */
  --teal-ink:#0B5D4E; --success-ink:#166534; --amber-ink:#92400E;
  --water-ink:#0E7490; --violet-ink:#7E22CE;
  --placeholder:#5A6E67; --map-label:#5A6E67;
  --shadow:0 10px 30px rgba(18,51,44,.14);
  /* marker colours by spot type */
  --c-masjid:#0E7C66; --c-musala:#9333EA; --c-terminal:#B45309;
  --c-spbu:#0E7490; --c-rest:#15803D;
}
```

Font: **Plus Jakarta Sans** (400–800) via Google Fonts. Body ink `#12332C`, muted `#5A6E67`,
warm sand background `#F6F4EE`. Card / button radius **14–16px**.

## 2. Marker colors and glyphs

| Type | Color | Soft tint | Text ink | White glyph |
|---|---|---|---|---|
| `masjid_besar` | `#0E7C66` teal | `#DDEEE8` | `#0B5D4E` | dome |
| `musala` | `#9333EA` violet | `#F1E6FB` | `#7E22CE` | building |
| `terminal` | `#B45309` amber | `#FBEEDA` | `#92400E` | bus |
| `spbu` | `#0E7490` water blue | `#DCF0F5` | `#0E7490` | droplet |
| `rest_area` | `#15803D` green | `#DCF3E2` | `#166534` | tent |

```css
.t-masjid{--t:#0E7C66;--ti:#0B5D4E;--ts:#DDEEE8}
.t-musala{--t:#9333EA;--ti:#7E22CE;--ts:#F1E6FB}
.t-terminal{--t:#B45309;--ti:#92400E;--ts:#FBEEDA}
.t-spbu{--t:#0E7490;--ti:#0E7490;--ts:#DCF0F5}
.t-rest{--t:#15803D;--ti:#166534;--ts:#DCF3E2}
```

**Color is never the only signal.** Every pin carries a white glyph (dome / building / bus /
droplet / tent) and a visible text badge, so the five types are readable without color. A legend
appears once on desktop.

**Conflict note:** `MOCKUP-PROMPT-singgah.md` assigns different colors (emerald / teal / blue /
amber / violet). The approved board palette above wins. See `docs/decision-log.md` → C.1.

## 3. Layout

| Breakpoint | Layout |
|---|---|
| `< 992px` (mobile-first) | full-screen Leaflet map + draggable bottom sheet over it; peek shows search + chips + 1 card; expanded ~75vh scrollable. FAB `+ Tambah` bottom-right above the sheet, geolocate bottom-left |
| `≥ 992px` (desktop) | **same DOM**: sheet becomes a static left sidebar (`col-lg-4`, full height, scrollable), map fills `col-lg-8`. No separate desktop code path |

Frames: desktop **1440×900**, phone **390×844**. The 6 desktop screens were generated from the
exact same components as the 6 phone frames — mobile is the source, desktop is the wider arrangement.

Six screens, one flow: `Beranda / daftar` → `Rincian` → `Tambah · pin` → `Tambah · isi info` →
`Sukses` (plus desktop `Beranda komputer`). Map is the hero on the board because `SPEC-singgah.md`
decision 5 locks the two-pane version — see OQ-10.

## 4. Bootstrap-first rule

Use built-in Bootstrap 5.3 components and utilities **before** writing custom CSS: `offcanvas`
(add form), `toast`, `badge`, `btn`, `btn-group` pills, form validation, `data-bs-theme`.
Custom CSS is limited to three things: the `:root` token override block, map pins, and bottom-sheet
mechanics. See OQ-7 — SPEC's project tree omits `css/` while `AGENTS.md` lists `css/style.css`.

CDN versions (locked):

| Library | Version |
|---|---|
| Bootstrap CSS + JS bundle | 5.3.3 |
| Bootstrap Icons | 1.11.3 |
| Leaflet | 1.9.4 |
| supabase-js | v2 |
| Plus Jakarta Sans | 400–800 |

## 5. Accessibility rules (from the UI/UX audit already applied to the board)

- **Contrast ≥ 4.5:1** for all text. An audit found 8 failing pairs; they were fixed with the
  semantic `--*-ink` tokens above (worst measured pair now 4.55:1). Placeholder and map labels were
  the worst offenders (2.67:1 / 2.65:1 before the fix).
- **Touch targets ≥ 44px**: chips, buttons, sheet handle, toggle switch, segmented/tri-state
  controls. Invisible 44px hit areas where the visual is smaller.
- **No sub-11px labels.** Chips and attribute labels were raised from 10.5px to 11.5px.
- **No color-only encoding** (see §2).
- **Visible labels** on every form field; `required` on `Nama spot`; `aria-describedby` links the
  reassurance line to submit; radiogroups have `aria-checked`.
- **Keyboard / reduced motion**: `:focus-visible` outline, `prefers-reduced-motion` guard, a tap
  alternative to dragging the bottom sheet (up-chevron).
- **No horizontal page scroll**: `body{overflow-x:hidden}`; desktop frames scroll inside their
  own container.
- Static board frames use `role="img"` + `aria-label`, with inner content `inert` so there are no
  focusable dead controls. (The real app uses real, focusable controls.)

## 6. Dark mode (if OQ-5 says yes)

Bootstrap 5.3 native `data-bs-theme="dark"`, toggled by a labelled switch, persisted in
`localStorage`: background `#101B17`, surface `#16241F`, primary `#3DBFA3` with dark text
`#06231C`. Focus outline `#3DBFA3`. Contrast must be re-checked in both themes (step I4).

## 7. Button sizing lesson (from owner feedback)

The `Kirim untuk ditinjau` CTA was too big because `.btn{flex:1}` is correct inside a flex **row**
but the submit is a direct child of a flex **column**, so it grew to fill leftover height.
Fix: `.submit{flex:0 0 auto;width:auto;min-width:190px;min-height:44px;padding:0 26px}` —
centered on phone (`min-width:200px`, 65px side margins), right-aligned on desktop (~189×44).
**Never reuse a `flex:1` button class outside a row container.** Keep ≥44px touch target.

## 8. Related docs

- `docs/ui-copy.md` — every Indonesian string
- `docs/architecture.md` — file responsibilities
- `docs/manual-test-checklist.md` — contrast / touch / layout checks
- `docs/decision-log.md` — OQ-3, OQ-5, OQ-7, OQ-10
