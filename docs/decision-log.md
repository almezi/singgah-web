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
| L1 | ~~Plain HTML/JS + Bootstrap 5 + Bootstrap Icons via CDN. No JS framework, no build step, no npm project.~~ **Amended 2026-11-14 (OQ-15):** Vue 3 + Vite (JavaScript, no TypeScript), Bootstrap 5 + Bootstrap Icons + Leaflet 1.9 + supabase-js v2 all as npm dependencies. Original choice kept as history — it governed Wave P (the prototype) | `AGENTS.md`, SPEC decisions 6 + 8 |
| L2 | Launch area: Yogya city + Jakarta→Yogya corridor only | SPEC decision 1, `AGENTS.md` |
| L3 | Open add, no login. Submissions land `pending`; only `approved` rows are public; owner approves in the Supabase dashboard (no admin UI) | SPEC decision 2, `AGENTS.md` |
| L4 | UI language: Indonesian only | SPEC decision 3, `AGENTS.md` |
| L5 | Web-first, runs at a URL on laptop or phone; mobile-first; desktop gets a widened two-pane version of the same screens | SPEC decision 5 |
| L6 | Approved look + design tokens live in `design/singgah-mockup.html`; Bootstrap 5 replaces hand-rolled CSS (originally via CDN; npm since OQ-15, 2026-11-14) | SPEC decision 6 |
| L7 | No photos, no accounts, no reviews, no PWA/offline in MVP | `AGENTS.md`, SPEC Out of Scope |
| L8 | Unknown data shows `Belum ada info` — never invent defaults | `AGENTS.md`, SPEC |
| L9 | Anon key only; `service_role` never in the frontend; RLS on; no personal data | `AGENTS.md`, SPEC |
| L10 | Agent concurrency cap is 2. **Amended 2026-11-14 (OQ-16):** for the Vue build the cap is lifted — Wave 0 stays serial, then the independent build lanes (A, B, C, D, E) run in parallel; integration + deploy stay serial. The one-file-one-owner rule is unchanged | `docs/HANDOFF-musafir-project.md`, OQ-16 |
| L11 | Verification bump rate-limited to 1 per spot per hour | SPEC Open Question 1 |
| L12 | Verify writes go through `bump_verified(spot_id)` Postgres function (`security definer`): updates only `last_verified_at`, rate limit enforced in the database, no anon UPDATE/DELETE policies | SPEC Open Question 1 (resolved at G3, 2026-11-09) |
| L13 | Dark mode toggle ships in v0.1 (`data-bs-theme` + `localStorage`); the approved board stays the light-theme reference | SPEC decision 7 (G1, 2026-11-09) |

## B. Open questions the owner must answer

| ID | Question | Why it matters | Where to record the answer |
|---|---|---|---|
| ✅ **OQ-1** | **Decided 2026-11-09 (G3): Postgres function.** `bump_verified(spot_id)` (`security definer`) updates only `last_verified_at`; the 1 bump/spot/hour limit is enforced in the database. Edge Function rejected for MVP | Anon cannot UPDATE; this unblocked E5 and B7 | Recorded in SPEC Open Question 1 (resolved) |
| ✅ **OQ-2** | **Decided 2026-11-09: plain `fetch` wrapper.** **Amended 2026-11-14 (OQ-15): with the Vue switch, supabase-js v2 is now loaded via npm** — the standard client replaces the hand-written wrapper (less boilerplate, same REST endpoint underneath). The fetch-wrapper shape stays in git history | `src/lib/supabase.js` implements the client; `loadApprovedSpots` / `insertPendingSpot` / `bumpVerified` keep their names | Recorded in SPEC Tech Stack + `docs/api-contract.md` §4 |
| **OQ-3** | Tile style: default **OSM** or **Carto Voyager**? | `MOCKUP-PROMPT-singgah.md` asks for "Carto Voyager vibe, NOT the busy default OSM style"; SPEC Open Question 3 says default OSM for MVP | SPEC Open Question 3 + `docs/architecture.md` |
| **OQ-4** | Who sets up the weekly DB heartbeat? | Free Supabase projects auto-pause after 7 days idle | SPEC Open Question 4 + `docs/deployment.md` |
| ✅ **OQ-5** | **Decided 2026-11-09 (G1): yes, dark mode in v0.1.** Owner approved `tasks/todo.md` including F6/I4 with this conflict explicitly flagged; the board stays light-only as the light-theme reference | F6 builds the toggle, I4 checks contrast in both themes | Recorded in SPEC decision 7 + `docs/design-system.md` §6 |
| **OQ-6** | Where is the **trip playbook source markdown**? | `HANDOFF-musafir-project.md` names `musafir-playbook-pondok-pinang-yogya.md`, but it is **not in this repo**. Step D1 cannot transcribe research data without it | copy the file into the repo; then `data/playbook-spots.json` |
| **OQ-7** | Where does custom CSS live? | SPEC decision 6 says Bootstrap "replaces hand-rolled CSS" and SPEC's project tree has no `css/` folder; `AGENTS.md` planned layout lists `css/style.css`; `PROTOTYPE-PROMPT` asks for a small `:root` override block | SPEC Project Structure, then `docs/architecture.md` |
| **OQ-8** | Which **UI copy** is canonical? | The mockup prompt, prototype prompt and approved board disagree on several strings (success text, search placeholder, water labels, chip labels) | `docs/ui-copy.md` → "Conflicts to confirm" |
| **OQ-9** | Do we ship a **PWA manifest + icons** in v0.1? | SPEC Out of Scope parks PWA/offline, but SPEC Open Question 5 says "manifest + icons prepared at real build" | SPEC Open Question 5 + `docs/deployment.md` §8 |
| ✅ **OQ-10** | **Decided 2026-11-09 (G4): keep the always-on two-pane map** (current board). The three-mode layout is rejected for MVP | SPEC decision 5 unchanged — no spec edit needed | SPEC decision 5 (annotated with the G4 confirmation) |
| ✅ **OQ-11** | **Decided 2026-11-09 (G5): yes, prototype first.** `prototype/index.html` (mock data, no backend) is built before Wave 0, from `PROTOTYPE-PROMPT-singgah.md` | Adds Wave P before the contract wave | `tasks/plan.md` §5 + `tasks/todo.md` (Wave P) |
| **OQ-12** | Exact tile usage guardrails at launch? | OSM policy bans bulk/pre-emptive caching; a static host may serve working files | `docs/deployment.md` §7 |
| ✅ **OQ-13** | **Adopted 2026-11-09:** the branching strategy in `docs/branching-strategy.md` — protected `main` for spec/docs, short-lived `build/mvp` for all implementation waves, one tag per deploy | `main` holds the committed baseline + approval edits; `build/mvp` created for Wave P; no tags yet (none deployed) | this table + §D step 4; `tasks/todo.md` and `docs/deployment.md` follow it |
| ✅ **OQ-14** | **Decided 2026-11-14: G2 split, Vercel deferred.** Supabase project created; Project URL + anon key are with the owner, who pasted them into `js/config.js`. The **Vercel account** (the other half of G2) is deferred to before deploy (Wave 5 / P1) and does not block Wave 0–4. **OQ-15 note:** the Vue scaffold (Wave 0) migrates these two values into the new app config; the old `js/config.js` is only deleted with the owner's consent | Wave 0 is unblocked | this row + `AGENTS.md` intro + `tasks/todo.md` + `docs/setup.md` §1 |
| ✅ **OQ-15** | **Decided 2026-11-14: switch the app framework from plain HTML/JS to Vue 3 + Vite.** Owner's reason: learning Vue for their career. No app code existed yet (only the verified prototype + `js/config.js`), so the switch cost is documents only. supabase-js v2 via npm replaces the plain-fetch wrapper (OQ-2 amended); Bootstrap + Leaflet move from CDN to npm. The verified plain-JS prototype stays untouched as the design reference. Process followed: SPEC first, then decision log, AGENTS, plan, todo, then the affected docs. **Owner approved the revised `tasks/todo.md` the same day — Wave 0 may launch** | Wave 0 is rebuilt around Vue lanes: scaffold + `src/lib` + `src/composables` + components | this row + SPEC decisions 6/8 + Tech Stack + `AGENTS.md` + `tasks/plan.md` + `tasks/todo.md` + `docs/api-contract.md`, `architecture.md`, `setup.md`, `deployment.md`, `guided-tour.md` |
| ✅ **OQ-16** | **Decided 2026-11-14: concurrency cap lifted for the Vue build (owner request — "run everything possible in parallel").** Wave 0 (scaffold + contract) stays serial because every lane builds on it; after it, the five build lanes (A, B, C, D, E) run at once; integration (Wave 4) and deploy stay serial. T (docs) needed no agent — it was completed during the OQ-15 doc rewrite. Safety is unchanged: one-file-one-owner makes parallel lanes conflict-free by construction | Faster build with zero merge-conflict risk | this row + `AGENTS.md` L10 + `tasks/todo.md` playbook |
| ✅ **OQ-17** | **Decided 2026-11-15: pending-spot review stays in the Supabase dashboard for MVP (option A); an owner review page with Supabase Auth is scheduled for v0.2 (option C).** Owner request: "buat 1 halaman khusus untuk meninjau kiriman semua orang". The page requires login (pending rows must never be public — RLS) and auth is a parked decision that needs the full process (SPEC first) — so it is scheduled, not dropped. The dashboard already shows every submission from everyone; "Tinjauan saya" in the app is a per-device local echo only | MVP launches without new auth surface; v0.2 backlog gains the review page | this row + SPEC Out of Scope + `docs/owner-guide.md` (dashboard flow) |

## C. Known contradictions between source documents

These were found while writing the docs. They are **not resolved here** — the owner decides.

1. **Marker colors.** `MOCKUP-PROMPT-singgah.md`: masjid = emerald, musala = teal, terminal =
   blue, spbu = amber, rest_area = violet. `PROTOTYPE-PROMPT-singgah.md` and the **approved
   board**: masjid = teal `#0E7C66`, musala = violet `#9333EA`, terminal = amber `#B45309`,
   spbu = water blue `#0E7490`, rest_area = green `#15803D`. The approved board is the visual
   source of truth, so `docs/design-system.md` uses the board palette.
2. **supabase-js vs `fetch`.** See OQ-2. **Resolved 2026-11-09: plain `fetch` wrapper; amended
   2026-11-14 (OQ-15): supabase-js v2 via npm.** The
   `fetch` + `supabaseHeaders()` shape in `docs/api-contract.md` is canonical; supabase-js stays
   an allowed dependency but is not loaded.
3. **Dark mode.** See OQ-5. **Resolved 2026-11-09 (G1): the toggle ships in v0.1.** The design
   board stays light-only as the light-theme reference; dark tokens are in `docs/design-system.md` §6.
4. **PWA.** See OQ-9. "Parked on purpose" vs "manifest prepared at real build" are not the same
   commitment.
5. **Custom CSS.** See OQ-7. `docs/architecture.md` lists `css/style.css` following
   `AGENTS.md`, but SPEC's tree omits it.
6. **Playbook file.** See OQ-6. Referenced but absent — a real blocker for the data lane.
7. **Desktop map.** See OQ-10. **Resolved 2026-11-09 (G4): keep the board's always-on map.**
   SPEC decision 5 is unchanged; the three-mode idea is rejected for MVP.
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

> **Update 2026-11-14 (OQ-15):** L1 was amended — Singgah is now a **Vue 3 + Vite** app. The
> analysis below is kept as history. Its §F.2 logic (framework conversion = rewrite) now applies
> in our favour: the plain-JS lanes were never built, so nothing needs rewriting — Wave 0+
> simply starts native Vue.

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
