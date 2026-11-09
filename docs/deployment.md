# Deployment — Singgah

*What this doc does: how to put the app on a public URL, what to check first, and how to keep the
free tier alive. Written for a beginner.*

**Status: planned.** Do not deploy until gates G1–G5 and the manual checklist are done.
Sources: `SPEC-singgah.md`, `docs/research-mobile-strategy.md`, `tasks/todo.md` → P.

---

## 1. Shape of a deploy

Singgah is a **static site**: a folder of HTML, CSS, JS and JSON files. Vercel serves those files
as-is. There is no server to configure, no build command, no environment variable in the hosting
dashboard, and no compile step that can fail.

```
your computer ── npx vercel --prod ──> Vercel (static files) ──> public URL
                                              │
                                              └── browser calls Supabase + OSM tiles directly
```

## 2. Pre-deploy gate (all must be true)

From `docs/manual-test-checklist.md`, the non-negotiables:

- [ ] `grep -r service_role index.html css js data` returns nothing
- [ ] RLS is on; anon sees **only** `approved` rows; anon cannot `UPDATE`/`DELETE`
- [ ] No `pending` spot is visible on the public map or list
- [ ] ≥ 100 approved spots, including the playbook spots
- [ ] UI is 100% Indonesian; unknown values show `Belum ada info`
- [ ] Manual checklist passes **on a real phone over mobile data**
- [ ] `© OpenStreetMap contributors` attribution is visible on the map
- [ ] No photos, accounts, reviews, login screens, or personal-data fields

## 3. Deploy

From the project root:

```
npx vercel --prod
```

The first run links a free Vercel account and asks a few questions. Because there is no build
step, the defaults are fine — it is a static folder. Vercel gives you a public `*.vercel.app` URL.

Open that URL on a phone on mobile data (not Wi-Fi) and walk the checklist once more.

## 4. After deploy

| Step | Where | Done when |
|---|---|---|
| Approve one pending spot | Supabase dashboard | it appears on the map after reload |
| Confirm `Masih ada ✓` | the app | `last_verified_at` changes |
| Confirm 100+ spots + Indonesian UI | the app | SPEC success criteria 2 and 7 |
| Owner uses it on one real trip | real world | the real acceptance test |

See `docs/owner-guide.md` for the dashboard steps.

## 5. Keep the free tier awake

**Supabase free projects auto-pause after 7 days of inactivity.** A paused project makes the app
look dead to early users. Set up a weekly heartbeat: a scheduled job (e.g. GitHub Actions cron)
that runs a **real query** against the database once a week — a plain REST ping is not enough.
Gate: the owner decides who sets this up (`tasks/todo.md` → open question 4).

Other free-tier notes from `docs/research-mobile-strategy.md`:

- Vercel Hobby is **non-commercial only**; commercial use needs Pro.
- Supabase free tier limits: 500 MB DB, 5 GB egress, 1 GB storage, 2-project cap.
- OSM tiles are fine for light interactive use only. Tiles must stay **network-only** — the OSM
  tile policy bans bulk downloading and offline/pre-emptive caching. If traffic grows, switch to
  CARTO free basemaps or MapTiler behind the single `TILE_URL` constant.
- Realistic first costs: a domain (~$12/yr), then Supabase Pro ($25/mo) — not Vercel.
- $0/month from 0 → 1,000 users is realistic if queries stay small.

## 6. Rollback

There is no database migration to roll back in v0.1 — the schema is created once. To roll back the
site, redeploy the previous **tag** with `npx vercel --prod`, or use Vercel's dashboard to promote
an earlier deployment. Keep the last known-good commit tagged before each deploy
(`v0.1.0`, `v0.1.1`, …). If the merge itself is bad, `git revert -m 1 <merge-commit>` on `main`;
never rewrite `main` history.

Deploy only from a clean `main` — `npx vercel --prod` ships the current working tree regardless of
branch. See `docs/branching-strategy.md` §5–6 for the full branch and tag rules.

## 7. What is NOT deployed

`scripts/`, `supabase/`, `tasks/`, `docs/`, `design/`, and the research files are working files.
Only the static app files need to be served. In particular, `scripts/seed-spots.mjs` and any
privileged key must never be reachable from the public URL. If Vercel serves the whole repo by
default, add a `vercel.json` ignore or deploy only the app folder — decide with the owner before
adding config.

## 8. Parked for later (not MVP)

PWA manifest + icons, service worker app-shell cache, Add-to-Home-Screen hint, TWA / Play Store,
offline maps, a real domain for `assetlinks.json`. See `docs/research-mobile-strategy.md` for the
full PWA-first → TWA-later strategy and the 12-testers-for-14-days Play gate.

## 9. Related docs

- `docs/manual-test-checklist.md` — run before every deploy
- `docs/setup.md` — local setup
- `docs/owner-guide.md` — approving spots and the weekly heartbeat
