# Guided tour — reading order

*What this doc does: one plain-English paragraph per file, in the order a beginner should read
them. Written for the owner, who is learning while building. From `tasks/todo.md` step T3.*

No app code exists yet, so this tour describes **planned** files too. Files that exist today are
marked ✅; planned files are marked ⏳. **Revised 2026-11-14 (OQ-15):** the app stack is now
Vue 3 + Vite, so the planned-file list below changed; the earlier plain-JS plan lives in git
history.

---

## Start here (the rules)

1. ✅ **`docs/SPEC-singgah.md`** — the source of truth. Read this first. It says what the app is,
   what data it stores, what is locked, what is out of scope, and what "done" means. If any other
   file disagrees with the spec, the spec wins. **Update the spec first** whenever a decision
   changes.

2. ✅ **`AGENTS.md`** — the working rules for anyone (human or AI) touching this repo. It lists the
   locked decisions, the gated phases (Specify → Plan → Tasks → Implement), the hard boundaries,
   and the commands. Short and worth re-reading before each phase.

3. ✅ **`docs/HANDOFF-musafir-project.md`** — the backstory. A real Jakarta→Yogyakarta trip by bike,
   the researched rest/wash spots, and why this app exists. It also records that agent concurrency
   is capped at 2. Read it once to understand where the data comes from.

## The plan (what we will build, and in what order)

4. ✅ **`tasks/plan.md`** — the Plan-phase deliverable: goal, non-goals, phase gates, risks, and
   the definition of done. Approved 2026-11-09 (gate G1).

5. ✅ **`tasks/todo.md`** — the Tasks-phase deliverable: 58 small steps split into 9 lanes so two
   agents can work at once without touching the same file, plus the Wave P prototype prompt.
   Each step names one file and one checkable outcome. Approved 2026-11-09 (gate G1);
   **revised 2026-11-14 (OQ-15) for Vue — owner re-approval pending before Wave 0**.

6. ✅ **`docs/decision-log.md`** — locked decisions, open questions, and an honest list of places
   where the spec, prompts and design board disagree. Go here when something looks contradictory.

6b. ✅ **`docs/branching-strategy.md`** — the git workflow: one protected `main`, one
    short-lived `build/mvp` integration branch, and a tag for every deploy. Explains why branches
    follow *phases*, not *agents* — two agents share this one working directory, so a single
    `git switch` moves both of them. Adopted 2026-11-09 (OQ-13 closed).

## How the technology fits together

7. ✅ **`docs/architecture.md`** — the technology structure: layers, the three data flows, the
   security boundary, the screen state machine, and how Vue + Vite fit in. **This is the best
   one-page answer to "how is it built?"**

8. ✅ **`docs/api-contract.md`** — the frozen interface: component props/emits, config constants,
   function signatures, the `SPOT` field list, the `useSpots` state shape, and which lane owns
   which file. Read this before writing any component. Its whole purpose is to stop parallel
   agents from colliding.

9. ✅ **`docs/data-model.md`** — the `spots` table column by column, every allowed value, the RLS
   rules, and how OSM tags map into our columns.

10. ✅ **`docs/design-system.md`** — the approved colors, fonts, marker glyphs, breakpoints,
    accessibility rules, and the Bootstrap-first rule. Plus the button-sizing lesson.

11. ✅ **`docs/ui-copy.md`** — every Indonesian word a user sees. The rule is 100% Indonesian;
    missing data is always `Belum ada info`. Includes the conflicts still to confirm.

## Running it and shipping it

12. ✅ **`docs/setup.md`** — from zero to a working map on your own computer. Owner gates, database
    setup, the three config constants, the local server, and the seed script.

13. ✅ **`docs/deployment.md`** — the pre-deploy gate, `npx vercel --prod`, free-tier auto-pause,
    rollback, and what is deliberately not deployed.

14. ✅ **`docs/owner-guide.md`** — the small set of things only you do after launch: approve a
    pending spot in the Supabase dashboard, keep the free project awake, and never do these.

15. ✅ **`docs/manual-test-checklist.md`** — the only test runner in the MVP. 26 checks, run before
    every deploy, finishing on a real phone over mobile data.

## The research behind the decisions

16. ✅ **`docs/research-osm-seeding.md`** — a live-tested Overpass query (282 elements in central
    Yogya), which OSM tags are actually filled in (very few), why Kemenag data is not usable as
    open data, and the dedupe / retry rules. Explains why "Belum ada info" is so important.

17. ✅ **`docs/research-mobile-strategy.md`** — why PWA-first and TWA much later, the $0/month cost
    curve to 1,000 users, the OSM tile policy, and the top 3 risks. Mostly parked for post-MVP.

## The visual reference

18. ✅ **`design/singgah-mockup.html`** — the approved v0.1 look and the design tokens. Light-only.
    Treat it as the visual source of truth for colors and type.

19. ✅ **`design/singgah-mockup-board.html`** (+ `.png`) — 12 frames: 6 desktop 1440×900 and
    6 phone 390×844. The phone frames are labelled `Layar ponsel · rujukan`; they are the
    component reference. Desktop frames were built from the exact same components.

20. ✅ **`MOCKUP-PROMPT-singgah.md`** / ✅ **`PROTOTYPE-PROMPT-singgah.md`** — the self-contained
    prompts used to make the mockup and the planned clickable prototype. Useful as a detailed
    description of each screen. Note: they disagree with the approved board on a few colors and
    strings — see `docs/decision-log.md`.

## The application files (Vue 3 + Vite — ⏳ planned unless marked ✅)

Read these in this order once they exist:

21. ✅ **`js/config.js`** — the owner's file holding the real Supabase URL + anon key today.
    **Wave 0 step F2 migrates these two values into `src/lib/config.js`** (owner consents before
    the old file is deleted). Until then, this is where the keys live.

22. ⏳ **`index.html`** — the Vite entry: one root `<div id="app">` and one module script. Start
    here to see how the app is assembled.

23. ⏳ **`src/main.js`** — `createApp`, the Bootstrap CSS/Icons imports, and the theme bootstrap.
    The smallest file with the biggest job: starting the app.

24. ⏳ **`src/lib/config.js`** — three constants and nothing else: the project URL, the public
    anon key, and the one tile URL. Read it to see where secrets are (and are not).

25. ⏳ **`src/lib/supabase.js`** — the only file that talks to Supabase. The client plus
    `loadApprovedSpots()`, `insertPendingSpot()`, `bumpVerified()`, the `isUnknown()` helper and
    the frozen `SPOT` field list. The whole backend in one place.

26. ⏳ **`src/composables/useSpots.js`** — the single shared state: approved spots, search +
    type filters, the user's own pending spots. Read it to understand where data lives.

27. ⏳ **`src/composables/useGeolocation.js`** — the `navigator.geolocation` wrapper with the
    Indonesian failure toast. Small and self-contained.

28. ⏳ **`src/App.vue`** — the layout shell: two-pane desktop, bottom sheet on mobile. Mounts the
    five components and wires props down / events up. Owned by the integrator in Wave 4.

29. ⏳ **`src/components/MapPane.vue`** — Leaflet setup, colored pins, geolocate, and pin-drop
    mode.

30. ⏳ **`src/components/SpotList.vue`** and ⏳ **`SpotDetail.vue`** — the list cards, the detail
    card, and the `Masih ada ✓` button. Shows how unknown data becomes `Belum ada info`.

31. ⏳ **`src/components/AddSpotSheet.vue`** — the add-spot flow: banner → pin → form → success.
    Where `pending` is born.

32. ⏳ **`src/components/DarkModeToggle.vue`** — the `data-bs-theme` toggle persisted in
    `localStorage`.

33. ⏳ **`data/playbook-spots.json`** — the real researched spots. Research data: do not rewrite
    or delete casually.

34. ⏳ **`scripts/seed-spots.mjs`** — the offline Node script that fills the database from
    Overpass plus the playbook JSON. Never runs in the browser.

35. ⏳ **`supabase/`** — table SQL, RLS policies, and the verification write path. The database is
    the security boundary, not the browser.

36. ✅ **`prototype/index.html`** — clickable mock-data prototype with no backend
    (gate G5 = yes, decided 2026-11-09 — built first, in Wave P, verified 2026-11-10). Plain JS
    **on purpose**: since OQ-15 it is the frozen design reference, not the app's code style.

36b. ✅ **`docs/prototype-verification.md`** — the Wave P sign-off record: every "Done when" item
    checked in headless Chrome, plus an honest list of what a mock-data prototype cannot prove
    (real phone, RLS, the approve-in-dashboard flow).

---

**One-line version of the whole tour:** rules → plan → structure → data → look → words → run →
ship → test → research → build. And remember: **spec first, then docs, then code.**
