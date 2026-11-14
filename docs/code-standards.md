# Code standards — Singgah (guardrails)

*What this doc does: the guardrails a senior review (2026-11-15) distilled from the first real
build. They exist so the app stays easy to maintain by the owner, by agents, and by any future
contributor. Sources: `code-review-and-quality` + `code-simplification` review pass over every
file in `src/`, `scripts/`, `supabase/`. Companion: `AGENTS.md` (project rules) and
`docs/api-contract.md` (frozen interface).*

**How to use:** before opening a change, walk the ten guardrails; before merging it, walk the
checklist at the bottom. When a guardrail and a deadline fight, the guardrail wins — every item
below exists because breaking it already caused a real bug in this project.

---

## The ten guardrails

### 1. One file, one owner — always

No two agents (or people) edit the same file. Cross-component work happens only through the
frozen contract: props down, events up (`docs/api-contract.md` §2). If a lane needs a change in
someone else's file, it reports back — it never edits.
**Check:** `git diff` touches only files you own.

### 2. The UI never lies

A success screen, toast, or message appears **only after the database confirms the write**.
Optimistic UI was tried and it burned us (2026-11-15: "Terima kasih! 🙏" shown while the insert
was failing). Pattern: component emits intent → parent writes via `useSpots` → parent flips a
state (`submitState: idle/pending/success/error`) → component renders the truth.
**Check:** trigger the failure path on purpose; the UI must say it failed.

### 3. Components never call Supabase directly

`src/lib/supabase.js` is the only door to the database. Components receive data via props and
report intent via events; `App.vue` owns `useSpots` and performs the writes. This keeps one place
to add error handling, logging, or caching later.
**Check:** `grep -rn "from '../lib/supabase'" src/components/` → only presentation helpers
(`spotView.js`) may be imported, never the client.

### 4. Unknown data is `Belum ada info` — never a guess

Every value that can be missing passes through `isUnknown()` (`src/lib/spotView.js`). Empty
strings become `null` at the payload boundary. If OSM/OSM-like sources don't prove a fact, the
field stays `null`.
**Check:** temporarily null a field in a query result → UI must show `Belum ada info`, never a
made-up default.

### 5. One canonical source per shared concept

Type labels, glyphs, water labels, chips, and time-formatting live **only** in
`src/lib/spotView.js`. A duplicated constant between two components is a bug incubator — the
review found this exact pattern and removed it.
**Check:** `grep -rn "Masjid Besar" src/components/` → zero literal label definitions (labels
come from `spotView.js`).

### 6. Toasts belong to the parent

A child component reports intent (emit); the parent performs the write and decides which toast
the user sees — success only on resolve, failure on catch. Two contradicting toasts
("Terima kasih" then "Gagal") are worse than no toast.
**Check:** `grep -rn "showToast" src/components/` → zero hits (toasts live in `App.vue`).

### 7. Performance budgets (they were all real bugs once)

- Lists render **≤ 50 cards** at once, with a "Tampilkan 50 lagi" button (7.173 cards ≈ 100k DOM
  nodes — phones choke).
- Map markers are **clustered** (`leaflet.markercluster`, individual at zoom ≥ 16).
- Marker redraws are **debounced ≥ 200 ms** (every search keystroke otherwise rebuilds thousands
  of markers).
- Every Supabase query is **paginated** (PostgREST caps ~1000 rows — a plain `.select('*')`
  silently drops the rest).
- Do not request the representation of a row the role cannot SELECT (`insert … .select()` on a
  `pending` row fails with 42501 — this exact bug shipped once).

### 8. Accessibility and language are not optional

Touch targets ≥ 44px · aria-labels on icon-only controls · `aria-live` for counts · Indonesian
UI text only · unknown data `Belum ada info` · `v-html` only for static module constants (never
user data).

### 9. Dependencies are locked — every addition is an owner decision

Locked stack: Vue 3 + Vite, Bootstrap 5 + Icons, Leaflet 1.9, leaflet.markercluster,
@supabase/supabase-js — all npm. No TypeScript, no router, no state library. Any new dependency
needs the owner's approval first (`AGENTS.md`) and must earn its bundle weight.

### 10. Secrets and safety are hard boundaries

`service_role` / `sb_secret_` keys never touch the frontend, the repo, or any log. The seed
script reads them from the environment only. RLS stays on; pending rows stay invisible to anon.
A review page for pending spots therefore requires login — scheduled for v0.2 (OQ-17), not
improvised.

---

## Quick review checklist (five axes)

```
Correctness    □ matches the contract □ error paths handled □ failure path shown honestly in UI
Readability    □ no duplicated constants (spotView.js owns them) □ names describe content
Architecture   □ props down / events up □ no feature logic in shared modules □ file < ~500 lines
Security       □ no secrets □ no new keys in logs □ user data never reaches v-html
Performance    □ list ≤ 50 cards □ query paginated □ map redraw debounced
```

## Definition of done for any change

1. `npm run build` succeeds.
2. Headless smoke check: page loads, zero console errors, the touched flow works.
3. The ten guardrails walked — each either respected or the deviation justified in the change
   description.
4. UI text Indonesian; unknown data `Belum ada info`.
5. The change description stands alone in git history (what + why, no "fix bug").

## What deliberately does NOT exist (yet)

No linter, no test runner, no CI in the MVP — this document **is** the quality gate, applied by
whoever touches the code (human or agent). Revisit after dogfooding: an ESLint flat config plus a
tiny smoke test would be the first two tools to add, in that order.
