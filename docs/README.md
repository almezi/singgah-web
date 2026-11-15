# Docs index — Singgah

*What this doc does: tells you which doc to open for which question. Full reading order with a
one-paragraph description of every file lives in `docs/guided-tour.md`.*

| I want to… | Open |
|---|---|
| Read the source of truth, the backstory, or the build prompts | `SPEC-singgah.md` · `HANDOFF-musafir-project.md` · `MOCKUP-PROMPT-singgah.md` · `PROTOTYPE-PROMPT-singgah.md` |
| See what the app looks like (v0.1, real data) | `../docs/screenshots/` (15 tangkapan layar, 3 viewport) |
| Follow the code guardrails (senior review, 2026-11-15) | `code-standards.md` |
| Understand how the technology fits together | `architecture.md` |
| Know which function / DOM ID to call, and who owns which file | `api-contract.md` |
| See the `spots` table columns and allowed values | `data-model.md` |
| Check colors, fonts, pins, accessibility rules | `design-system.md` |
| Find the exact Indonesian wording | `ui-copy.md` |
| Start & stop the app on my own computer | `setup.md` |
| Ship it to a public URL | `deployment.md` |
| Approve a spot / keep the free tier awake | `owner-guide.md` |
| Run the pre-deploy checks | `manual-test-checklist.md` |
| See how Wave P was verified (prototype sign-off) | `prototype-verification.md` |
| See locked decisions, open questions, contradictions | `decision-log.md` |
| Why there is no React / React Native conversion | `decision-log.md` §F |
| Choose a git branching strategy | `branching-strategy.md` |
| Read one paragraph about every file | `guided-tour.md` |
| Understand where the seed data comes from | `research-osm-seeding.md` |
| Read the owner-researched trip playbook (source of the playbook spots) | `research-playbook-source.md` |
| Understand the PWA / cost / tile-policy research | `research-mobile-strategy.md` |

## Priority order

1. `SPEC-singgah.md` — **source of truth** (same folder since 2026-11-14)
2. `../AGENTS.md` — working rules and hard boundaries
3. `../tasks/plan.md`, `../tasks/todo.md` — what we will build and in what order
4. `architecture.md` → `api-contract.md` → `data-model.md` — the build contract
5. `design-system.md`, `ui-copy.md` — the look and the words
6. `setup.md`, `deployment.md`, `manual-test-checklist.md`, `owner-guide.md` — run and ship
7. `decision-log.md`, `guided-tour.md`, research notes — reference

## Status

**Planning approved / Wave P done.** `tasks/plan.md` and `tasks/todo.md` were **approved
2026-11-09 (gate G1)**; OQ-2 (plain fetch — amended 2026-11-14, OQ-15) and OQ-13 (branching) were
decided the same day.
`prototype/index.html` was built on `build/mvp` and **verified 2026-11-10** — all 8 "Done when"
items pass, zero console errors (`prototype-verification.md`). **Wave 0 (F1–F6) is unblocked
2026-11-14 (OQ-14)** — Supabase created, URL + anon key with the owner; the Vercel account is
deferred to before deploy. **Same day (OQ-15): the stack switched to Vue 3 + Vite** — the docs
describe the Vue architecture now. D1 also needs the playbook file (OQ-6).
The work is gated: Specify → Plan → Tasks → Implement.

When a decision changes: **`SPEC-singgah.md` first**, then the affected docs, then code.

UI text is Indonesian only. Unknown data is `Belum ada info`. The anon key is the only key that may
appear in the frontend.
