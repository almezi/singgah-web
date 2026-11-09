# Docs index — Singgah

*What this doc does: tells you which doc to open for which question. Full reading order with a
one-paragraph description of every file lives in `docs/guided-tour.md`.*

| I want to… | Open |
|---|---|
| Understand how the technology fits together | `architecture.md` |
| Know which function / DOM ID to call, and who owns which file | `api-contract.md` |
| See the `spots` table columns and allowed values | `data-model.md` |
| Check colors, fonts, pins, accessibility rules | `design-system.md` |
| Find the exact Indonesian wording | `ui-copy.md` |
| Run it on my own computer | `setup.md` |
| Ship it to a public URL | `deployment.md` |
| Approve a spot / keep the free tier awake | `owner-guide.md` |
| Run the pre-deploy checks | `manual-test-checklist.md` |
| See locked decisions, open questions, contradictions | `decision-log.md` |
| Why there is no React / React Native conversion | `decision-log.md` §F |
| Choose a git branching strategy | `branching-strategy.md` |
| Read one paragraph about every file | `guided-tour.md` |
| Understand where the seed data comes from | `research-osm-seeding.md` |
| Understand the PWA / cost / tile-policy research | `research-mobile-strategy.md` |

## Priority order

1. `../SPEC-singgah.md` — **source of truth**
2. `../AGENTS.md` — working rules and hard boundaries
3. `../tasks/plan.md`, `../tasks/todo.md` — what we will build and in what order
4. `architecture.md` → `api-contract.md` → `data-model.md` — the build contract
5. `design-system.md`, `ui-copy.md` — the look and the words
6. `setup.md`, `deployment.md`, `manual-test-checklist.md`, `owner-guide.md` — run and ship
7. `decision-log.md`, `guided-tour.md`, research notes — reference

## Status

**Pre-code / planning.** Every doc here describes the planned system; no application code exists
yet. Docs marked as drafts (`tasks/plan.md`, `tasks/todo.md`) await owner approval in a later turn.
The work is gated: Specify → Plan → Tasks → Implement.

When a decision changes: **`SPEC-singgah.md` first**, then the affected docs, then code.

UI text is Indonesian only. Unknown data is `Belum ada info`. The anon key is the only key that may
appear in the frontend.
