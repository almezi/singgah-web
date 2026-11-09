# Decision log — Singgah

*What this doc does: keeps locked decisions and open questions in one place, and honestly records
where the source documents disagree. A contradiction is listed as an open question, **not**
silently resolved — the owner decides, and `SPEC-singgah.md` is updated first.*

**Rule:** locked decisions come from `SPEC-singgah.md` and `AGENTS.md`. Nothing here overrides them.
When a decision changes: **spec → docs → code**.

---

## A. Locked decisions (do not relitigate silently)

| # | Decision | Source |
|---|---|---|
| L1 | Plain HTML/JS + Bootstrap 5 + Bootstrap Icons via CDN. No JS framework, no build step, no npm project. Leaflet 1.9 + supabase-js v2 via CDN only | `AGENTS.md`, SPEC decision 6 |
| L2 | Launch area: Yogya city + Jakarta→Yogya corridor only | SPEC decision 1, `AGENTS.md` |
| L3 | Open add, no login. Submissions land `pending`; only `approved` rows are public; owner approves in the Supabase dashboard (no admin UI) | SPEC decision 2, `AGENTS.md` |
| L4 | UI language: Indonesian only | SPEC decision 3, `AGENTS.md` |
| L5 | Web-first, runs at a URL on laptop or phone; mobile-first; desktop gets a widened two-pane version of the same screens | SPEC decision 5 |
| L6 | Approved look + design tokens live in `design/singgah-mockup.html`; Bootstrap 5 via CDN replaces hand-rolled CSS | SPEC decision 6 |
| L7 | No photos, no accounts, no reviews, no PWA/offline in MVP | `AGENTS.md`, SPEC Out of Scope |
| L8 | Unknown data shows `Belum ada info` — never invent defaults | `AGENTS.md`, SPEC |
| L9 | Anon key only; `service_role` never in the frontend; RLS on; no personal data | `AGENTS.md`, SPEC |
| L10 | Agent concurrency cap is 2 | `HANDOFF-musafir-project.md` |
| L11 | Verification bump rate-limited to 1 per spot per hour | SPEC Open Question 1 |

## B. Open questions the owner must answer

| ID | Question | Why it matters | Where to record the answer |
|---|---|---|---|
| **OQ-1** | Verification writes: Supabase **Edge Function** or **Postgres function**? | `Masih ada ✓` must `UPDATE` but anon cannot. Blocks E5 and B7 | SPEC Open Question 1 + gate G3 |
| **OQ-2** | Use the **supabase-js v2 client**, or a **plain `fetch` wrapper** to the REST API? | SPEC Tech Stack says supabase-js v2; SPEC's own code example uses `fetch` + `supabaseHeaders()`; `tasks/todo.md` F1/F4 mixes both | SPEC Tech Stack / Code Style, then `docs/api-contract.md` |
| **OQ-3** | Tile style: default **OSM** or **Carto Voyager**? | `MOCKUP-PROMPT-singgah.md` asks for "Carto Voyager vibe, NOT the busy default OSM style"; SPEC Open Question 3 says default OSM for MVP | SPEC Open Question 3 + `docs/architecture.md` |
| **OQ-4** | Who sets up the weekly DB heartbeat? | Free Supabase projects auto-pause after 7 days idle | SPEC Open Question 4 + `docs/deployment.md` |
| **OQ-5** | Is **dark mode** in v0.1? | `MOCKUP-PROMPT` says "Light mode only" and the approved board is light-only; `PROTOTYPE-PROMPT` and `tasks/todo.md` F6/F6/I4/T2 require a `data-bs-theme` toggle | SPEC decisions, then `docs/design-system.md` |
| **OQ-6** | Where is the **trip playbook source markdown**? | `HANDOFF-musafir-project.md` names `musafir-playbook-pondok-pinang-yogya.md`, but it is **not in this repo**. Step D1 cannot transcribe research data without it | copy the file into the repo; then `data/playbook-spots.json` |
| **OQ-7** | Where does custom CSS live? | SPEC decision 6 says Bootstrap "replaces hand-rolled CSS" and SPEC's project tree has no `css/` folder; `AGENTS.md` planned layout lists `css/style.css`; `PROTOTYPE-PROMPT` asks for a small `:root` override block | SPEC Project Structure, then `docs/architecture.md` |
| **OQ-8** | Which **UI copy** is canonical? | The mockup prompt, prototype prompt and approved board disagree on several strings (success text, search placeholder, water labels, chip labels) | `docs/ui-copy.md` → "Conflicts to confirm" |
| **OQ-9** | Do we ship a **PWA manifest + icons** in v0.1? | SPEC Out of Scope parks PWA/offline, but SPEC Open Question 5 says "manifest + icons prepared at real build" | SPEC Open Question 5 + `docs/deployment.md` §8 |
| **OQ-10** | Desktop: **always-on map** (current board) or the **three-mode** layout? | Owner asked why the map must appear in every activity. SPEC decision 5 locks the widened two-pane version | **SPEC decision 5 first**, then board, then `docs/architecture.md` |
| **OQ-11** | Is `prototype/index.html` built before the real app? | Gate G5. The prototype prompt is self-contained and currently no `prototype/` folder exists | `tasks/todo.md` G5 / `tasks/plan.md` |
| **OQ-12** | Exact tile usage guardrails at launch? | OSM policy bans bulk/pre-emptive caching; a static host may serve working files | `docs/deployment.md` §7 |
| **OQ-13** | Adopt the **branching strategy** in `docs/branching-strategy.md`? | `main` is the only branch, 2 commits, no tags, and all planning work is uncommitted. Need `main` + short-lived `build/mvp` + deploy tags | this table + §D step 4, then `tasks/todo.md` and `docs/deployment.md` |

## C. Known contradictions between source documents

These were found while writing the docs. They are **not resolved here** — the owner decides.

1. **Marker colors.** `MOCKUP-PROMPT-singgah.md`: masjid = emerald, musala = teal, terminal =
   blue, spbu = amber, rest_area = violet. `PROTOTYPE-PROMPT-singgah.md` and the **approved
   board**: masjid = teal `#0E7C66`, musala = violet `#9333EA`, terminal = amber `#B45309`,
   spbu = water blue `#0E7490`, rest_area = green `#15803D`. The approved board is the visual
   source of truth, so `docs/design-system.md` uses the board palette.
2. **supabase-js vs `fetch`.** See OQ-2. `docs/api-contract.md` documents the `fetch` +
   `supabaseHeaders()` shape from the SPEC code example, while noting the client library remains
   a locked CDN dependency.
3. **Dark mode.** See OQ-5. The design board is deliberately light-only; dark mode belongs to the
   clickable prototype, not the static design board.
4. **PWA.** See OQ-9. "Parked on purpose" vs "manifest prepared at real build" are not the same
   commitment.
5. **Custom CSS.** See OQ-7. `docs/architecture.md` lists `css/style.css` following
   `AGENTS.md`, but SPEC's tree omits it.
6. **Playbook file.** See OQ-6. Referenced but absent — a real blocker for the data lane.
7. **Desktop map.** See OQ-10. The board shows the map on every screen because SPEC decision 5
   locks the two-pane version; the three-mode idea is a proposal, not an approved change.
8. **String capitalization.** SPEC prose writes `belum ada info` (lowercase); the approved board
   and all UI prompts show **`Belum ada info`**. UI uses the capitalized form.

## D. How to close an open question

1. Owner states the answer.
2. If it changes a locked decision, edit **`SPEC-singgah.md` first** (decision or Open Questions).
3. Update `AGENTS.md` only if it changes a hard boundary.
4. Update the affected doc(s) in `docs/` and the relevant step in `tasks/todo.md`.
5. Only then let an agent touch code.

**Branching note:** spec/plan/docs changes belong on `main`, code on `build/mvp` (OQ-13). A
decision recorded here should be committed with the docs, not left uncommitted.

## E. Related docs

- `tasks/plan.md` — phase gates and risks
- `tasks/todo.md` — step-by-step build list
- `docs/architecture.md` — technology structure
- `docs/ui-copy.md` — Indonesian string catalog
- `docs/research-mobile-strategy.md` — why PWA-first, TWA later, Capacitor overkill

## F. Considered and rejected: React / React Native

**Question (2026-11-09):** does Singgah use React, so that later it can be "converted" into a
React Native mobile app?

**Answer: no to both parts.**

1. **Singgah does not use React.** L1 locks plain HTML/JS + Bootstrap 5 via CDN — no JS framework,
   no build step, no npm project. SPEC decision 5 says "mobile" means *viewed in a phone browser*,
   not a native app. React via CDN would still break "no JS framework / no build step" and would
   buy no React Native migration benefit.
2. **"Convert React web → React Native" is not a conversion, it is a rewrite.** React Native
   renders native views (`View`, `Text`), not HTML/DOM/CSS. There is no shared component code:
   Bootstrap, Bootstrap Icons, Leaflet, `css/style.css` and `index.html` cannot run in React
   Native. Even if this were a React *web* app, the entire UI and map layer would be new code.
   Only the shared JS *logic* (not JSX/components) and the mental model carry over.
3. **The chosen path needs no rewrite:** web-first → PWA (manifest + icons) → **TWA**, which wraps
   the *same* web app for the Play Store. Roughly 1–3 days of setup + the 14-day tester gate,
   $25 one-time. See `docs/research-mobile-strategy.md`. Parked from MVP by L7 / OQ-9.
4. **If a native app is ever needed**, what transfers is the **data layer**, not the UI: Supabase
   `spots` schema + RLS, `js/api.js` logic, `scripts/seed-spots.mjs`,
   `data/playbook-spots.json`, token values, UI copy, and business rules. All UI, map, navigation
   and dark-mode code would be rebuilt. Capacitor/TWA is the cheaper bridge first.

**Verdict: rejected for MVP.** Switching to React or React Native changes a locked decision →
`SPEC-singgah.md` **first**, then `AGENTS.md`, `tasks/plan.md`, `tasks/todo.md`, all docs, then
code. It needs owner approval: `AGENTS.md` says ask before any dependency beyond Leaflet +
supabase-js. Revisit only if a native-only feature appears (background geolocation, native push,
ride tracking) — and only after dogfooding.
