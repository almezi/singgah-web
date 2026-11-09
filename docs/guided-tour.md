# Guided tour — reading order

*What this doc does: one plain-English paragraph per file, in the order a beginner should read
them. Written for the owner, who is learning while building. From `tasks/todo.md` step T3.*

No code exists yet, so this tour describes **planned** files too. Files that exist today are
marked ✅; planned files are marked ⏳.

---

## Start here (the rules)

1. ✅ **`SPEC-singgah.md`** — the source of truth. Read this first. It says what the app is, what
   data it stores, what is locked, what is out of scope, and what "done" means. If any other file
   disagrees with the spec, the spec wins. **Update the spec first** whenever a decision changes.

2. ✅ **`AGENTS.md`** — the working rules for anyone (human or AI) touching this repo. It lists the
   locked decisions, the gated phases (Specify → Plan → Tasks → Implement), the hard boundaries,
   and the commands. Short and worth re-reading before each phase.

3. ✅ **`HANDOFF-musafir-project.md`** — the backstory. A real Jakarta→Yogyakarta trip by bike,
   the researched rest/wash spots, and why this app exists. It also records that agent concurrency
   is capped at 2. Read it once to understand where the data comes from.

## The plan (what we will build, and in what order)

4. ✅ **`tasks/plan.md`** — the Plan-phase deliverable: goal, non-goals, phase gates, risks, and
   the definition of done. Draft, awaiting your approval.

5. ✅ **`tasks/todo.md`** — the Tasks-phase deliverable: 63 small steps split into 8 lanes so two
   agents can work at once without touching the same file. Each step names one file and one
   checkable outcome. It ends with copy-paste prompts for each agent. Draft, awaiting approval.

6. ✅ **`docs/decision-log.md`** — locked decisions, open questions, and an honest list of places
   where the spec, prompts and design board disagree. Go here when something looks contradictory.

6b. ✅ **`docs/branching-strategy.md`** — the proposed git workflow: one protected `main`, one
    short-lived `build/mvp` integration branch, and a tag for every deploy. Explains why branches
    follow *phases*, not *agents* — two agents share this one working directory, so a single
    `git switch` moves both of them. Still awaiting your approval (OQ-13).

## How the technology fits together

7. ✅ **`docs/architecture.md`** — the technology structure: layers, the three data flows, the
   security boundary, the screen state machine, and why there is no build step. **This is the best
   one-page answer to "how is it built?"**

8. ✅ **`docs/api-contract.md`** — the frozen interface: DOM mount IDs, config constants, function
   signatures, the `SPOT` field list, and which lane owns which file. Read this before writing any
   JS. Its whole purpose is to stop parallel agents from colliding.

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

## Planned application files (⏳ not built yet)

Read these in this order once they exist:

21. ⏳ **`index.html`** — the single page. CDN tags, all DOM mount points, and the script load
    order. Start here to see how the app is assembled. Belongs to the foundation agent, then the
    integrator.

22. ⏳ **`js/config.js`** — three constants and nothing else: the project URL, the public anon key,
    and the one tile URL. The smallest file; read it to see where secrets are (and are not).

23. ⏳ **`js/api.js`** — the only file that talks to Supabase. Four functions plus the
    `isUnknown()` helper and the frozen `SPOT` field list. Read it to see the whole backend in one
    place.

24. ⏳ **`js/map.js`** — Leaflet setup, colored pins, geolocate, and pin-drop mode. Owns `#map`.

25. ⏳ **`js/spots.js`** — builds the list cards and the detail card. Shows how unknown data becomes
    `Belum ada info`.

26. ⏳ **`js/verify.js`** — the `Masih ada ✓` button. Small, but it is the one hard technical spot
    (rate-limited write path).

27. ⏳ **`js/contribute.js`** — the add-spot flow: pin → form → success. Where `pending` is born.

28. ⏳ **`css/style.css`** — if OQ-7 confirms it exists: token overrides, map pins, sheet mechanics.
    Bootstrap does the rest.

29. ⏳ **`data/playbook-spots.json`** — the real researched spots. Research data: do not rewrite or
    delete casually.

30. ⏳ **`scripts/seed-spots.mjs`** — the offline Node script that fills the database from Overpass
    plus the playbook JSON. Never runs in the browser.

31. ⏳ **`supabase/`** — table SQL, RLS policies, and the verification write path. The database is
    the security boundary, not the browser.

32. ⏳ **`prototype/index.html`** — optional clickable prototype with mock data and no backend
    (gate G5). A safe place to learn before the real thing.

---

**One-line version of the whole tour:** rules → plan → structure → data → look → words → run →
ship → test → research → build. And remember: **spec first, then docs, then code.**
