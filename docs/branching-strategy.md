# Branching strategy — recommendation

*What this doc does: recommends how to use git for Singgah. **This is a proposal, not an approved
decision** — see `docs/decision-log.md` OQ-13. Sources: `AGENTS.md` (gated phases),
`tasks/todo.md` (waves + one-file-one-owner), `docs/deployment.md` (CLI deploy), and the actual
git state of this repo.*

---

## 0. The recommendation in one line

**Use one protected `main` branch, one short-lived integration branch `build/mvp` for the whole
implementation phase, and tag every deploy. Branch by *phase*, never by *agent*.**

That is a simplified GitHub Flow with a staging branch. It is deliberately small: a solo beginner
owner, no CI, no build step, and a manual checklist do not need GitFlow.

---

## 1. Where the repo actually is (checked 2026-11-09)

| Fact | Value |
|---|---|
| Current branch | `main` |
| Other local branches | none |
| Remote | `origin` → `https://github.com/almezi/singgah-web.git`, tracks `origin/main` |
| Commits | **2** (`075c793` initial, `96190b3` mockup + AGENTS) |
| Tags | **none** |
| Uncommitted | `AGENTS.md`, `SPEC-singgah.md`, `MOCKUP-PROMPT-singgah.md` modified; `README.md`, `docs/`, `tasks/`, `design/`, `PROTOTYPE-PROMPT-singgah.md` untracked |
| `.gitignore` | `.DS_Store`, `.env`, `*.local` |

**Immediate consequence:** the entire spec/plan/docs/design baseline is uncommitted. That is the
first thing to fix — a branching strategy is useless if the baseline isn't saved.

---

## 2. The constraint that decides everything

`tasks/todo.md` runs **2 agents in parallel in this same working directory**, kept safe by
**one file = one owner** (lane A owns `js/map.js`, lane B owns `js/spots.js`, etc.).

A git branch is a property of the *whole working directory*, not of a file. So:

> If agent A is on `feat/map` and agent B is on `feat/list`, a single `git switch` moves **both**
> of them. They cannot be on different branches at the same time in one directory.

Therefore:

- ✅ **Branch by phase / state.** Both agents commit to the same branch, to different files.
  File ownership already gives the isolation; git branches add nothing here.
- ❌ **Do not create a branch per lane** (`wave1-map`, `wave1-list`, …). It breaks the shared
  working tree and creates merge work with zero benefit.
- ⚠️ If you ever *do* want true branch isolation, use `git worktree` to give each agent its own
  directory. That is an advanced technique — not for the MVP, and it changes the todo's
  file-ownership model. Park it.

This also means branch-level PR review is not the review mechanism. **The review gates are the
owner gates G1–G5 in `tasks/todo.md` plus `docs/manual-test-checklist.md`.**

---

## 3. The branch set

| Branch | Lifetime | Who commits | What lives here | Rule |
|---|---|---|---|---|
| `main` | permanent | owner only (merges) | approved spec, plan, docs, design, released code | **Always deployable. Always clean before `npx vercel --prod`.** |
| `build/mvp` | temporary, deleted after v0.1.0 | both agents + integrator | all implementation waves F → A/B → C/D → E/T → I | Half-finished states are OK here. Never deployed. |
| `fix/<short-name>` | hours/days, after launch | owner / 1 agent | one bug fix off `main` | Merge back, delete, tag a patch. |

Tags, not branches, mark releases: `v0.1.0`, `v0.1.1`, `v0.2.0`. Cheap rollback: redeploy a tag.

**Mapping to the gated phases:**

```
Specify ─ Plan ─ Tasks        → main        (docs, spec, design, todo)   [you are here]
Implement (waves 0–4)         → build/mvp   (all code)
Deploy + dogfood (P1–P5)      → main + tag v0.1.0
After launch                  → fix/* off main → tag v0.1.1
```

---

## 4. Step-by-step, starting today

**Step 1 — save the baseline (do this first, before any branch exists).**

```
git add AGENTS.md SPEC-singgah.md MOCKUP-PROMPT-singgah.md PROTOTYPE-PROMPT-singgah.md README.md docs/ tasks/ design/
git commit -m "docs: spec, plan, todo, architecture and design board"
git push origin main
```

Review `git status` before committing. Do **not** blindly `git add .`: `.workbuddy-ai/` is
project data (keep it, decide separately whether to track it), `.zcode/` and `.vercel/` are local
tooling. **Never** stage a key or a `.env`.

**Step 2 — owner approves gates G1–G5.** No code before that (`AGENTS.md`).

**Step 3 — create the integration branch.**

```
git switch -c build/mvp
```

**Step 4 — commit once per wave, not once per file.** Both agents commit to `build/mvp` as they
finish steps; never edit each other's files. Suggested messages:

```
wave 0: frozen contract (F1-F6)
wave 1: map lane A + list/detail lane B
wave 2: contribute lane C + seed lane D
wave 3: backend lane E + docs lane T
wave 4: integration I1-I6
```

A wave boundary is a natural "roll back to here" point. Keep commits small enough that one bad
wave is revertable.

**Step 5 — integration agent runs the full `docs/manual-test-checklist.md` on `build/mvp`.**

**Step 6 — merge to `main`, tag, deploy.** Only after the checklist passes and no pending spot
is publicly visible.

```
git switch main
git merge --no-ff build/mvp -m "release: v0.1.0"
git tag -a v0.1.0 -m "Singgah MVP v0.1.0"
git push origin main --tags
npx vercel --prod
```

`--no-ff` keeps the whole build as one visible merge, easy to revert in one command.

**Step 7 — after the release is confirmed live, delete the branch.**

```
git branch -d build/mvp
git push origin --delete build/mvp   # only if it was pushed
```

---

## 5. Hard rules

1. **Deploy only from a clean `main`.** `npx vercel --prod` ships whatever is in the current
   working tree — it does not care which branch you are on. Check `git status` and
   `git branch --show-current` first. Never deploy from `build/mvp`.
2. **Tag every production deploy.** No tag = no known-good rollback point. See
   `docs/deployment.md` §6.
3. **Never commit a `service_role` key, `.env`, or any privileged key.** The anon key in
   `js/config.js` is public by design and safe to commit; the seed script's key stays in an
   environment variable. If a key ever leaks, deleting the branch does **not** fix it — rotate the
   key in Supabase first.
4. **No `git push --force` to `main`.** No rebasing shared history. For a beginner, `merge` is
   safer than `rebase`.
5. **Never leave `main` with half-built code.** The whole reason `build/mvp` exists is that
   waves 1–3 are intentionally incomplete.
6. **`SPEC-singgah.md` changes land on `main` first**, then merge `main` into `build/mvp` so
   code never drifts from the source of truth (`AGENTS.md`: spec first, then code).
7. **Don't commit generated junk**: `.vercel/`, `.DS_Store`, screenshots in `/tmp`. Consider
   adding `.vercel/` and `.zcode/` to `.gitignore`. Keep `design/*.png` — it is an approved
   deliverable.

---

## 6. Why not the usual alternatives

| Option | Verdict | Why |
|---|---|---|
| **GitFlow** (`develop` + `release/*` + `hotfix/*`) | ❌ | 3+ long-lived branches, release trains, no CI, no versioned releases to coordinate. Way too much machinery for one beginner and one MVP. |
| **Branch per agent / per lane** | ❌ | Breaks the shared working directory (§2). Also duplicates the isolation that file ownership already provides. |
| **Everything straight on `main`** | ⚠️ possible but risky | Simplest of all, and fine once v0.1.0 is live. But during the first build, `main` would hold half-wired waves, and one careless `npx vercel --prod` ships them. The gated workflow wants a review point. |
| **GitHub Flow** (main + feature branches) | ⚠️ close | Good after launch for `fix/*`. During the initial build it would mean many short branches switching a shared directory many times. |
| **Trunk-based + `build/mvp`** | ✅ | Two branches, matches the phase gates, gives one clean review/merge point, trivial to learn. |

---

## 7. Two things git cannot isolate (important)

**Supabase is not versioned by git.** Free tier = one project, no preview database. A branch
cannot have its own schema or its own `spots` rows. Consequences:

- Schema / RLS changes in `supabase/` are applied manually by the owner to the one shared project.
  Never experiment with RLS on the live project — a mistake can expose `pending` rows.
- Test "add spot" submissions land in the **real** pending queue. Clean them up in the dashboard
  (`docs/owner-guide.md`).

**Vercel Git integration would bypass the manual gate.** If you later connect the GitHub repo so
pushes auto-deploy, every push to `main` (and optionally every branch preview) deploys. For the
MVP prefer the CLI `npx vercel --prod` from a clean tagged `main`; preview deployments also share
the one Supabase project, so their test writes pollute the real queue. If you do connect it later,
restrict production deploys to `main` and keep preview deployments off the prod Supabase project.

---

## 8. After v0.1.0 (post-launch)

```
main ── v0.1.0 ── fix/verification-toast ── merge ── v0.1.1
```

- Short `fix/<name>` branches off `main`, merged back within a day or two, deleted after merge.
- Tag a patch for every deploy: `v0.1.1`, `v0.1.2`.
- Bigger work (e.g. the parked PWA/TWA work, `docs/research-mobile-strategy.md`) gets its own
  integration branch the same way `build/mvp` did.
- If a deploy is bad: `git revert -m 1 <merge-commit>` or redeploy the previous tag; see
  `docs/deployment.md` §6. Never rewrite history on `main`.

---

## 9. Owner decision needed

This strategy is **OQ-13 in `docs/decision-log.md`**. To approve it, the owner needs to confirm:

- [ ] Adopt `main` + `build/mvp` + tags (rather than committing everything straight to `main`)
- [ ] Keep `npx vercel --prod` as the only deploy path for MVP (no Git auto-deploy yet)
- [ ] Protect `main` on GitHub (require a PR for merges; no direct push) — optional, recommended
      once the owner is comfortable
- [ ] Decide whether `.workbuddy-ai/` is committed as project history or left local — **do not
      delete it**

On approval, record the answer in `docs/decision-log.md` and add the branch rules to
`tasks/todo.md` (wave 0 setup) and `docs/deployment.md` (deploy gate).

---

## 10. Related docs

- `tasks/todo.md` — waves, lanes, one-file-one-owner, gates G1–G5
- `tasks/plan.md` — phase gates
- `docs/deployment.md` — deploy gate, tags, rollback
- `docs/decision-log.md` — OQ-13
- `docs/setup.md` — local commands
- `AGENTS.md` — spec-first rule and hard boundaries
