# Owner guide — daily operations

*What this doc does: the small set of things only you (the owner) do after the app is live. There
is no admin UI in the MVP on purpose — you use the Supabase dashboard.*

---

## 1. Approve a new spot (the main recurring job)

Anyone can add a spot. It lands with `status = 'pending'` and is invisible to the public until you
approve it.

1. Open the Supabase dashboard → **Table Editor** → `spots`.
2. Filter where `status = 'pending'`.
3. Read the row: `name`, `type`, `lat`, `lng`, `water`, `hours`, `bike_parking`,
   `women_friendly`, `notes`, `source`.
4. Sanity-check the coordinates on a map and the values for obvious mistakes. If a value is
   unknown, **leave it `null`** — do not guess.
5. Set `status` to `approved` and save.
6. Reload the public app. The spot now appears on the map and in the list.

There is no bulk-approve in v0.1 and no reject flow. If a row is bad, set it aside and decide with
the developer; do not expose pending rows publicly to work around it.

## 2. Keep the free project awake

Supabase pauses free projects after **7 days of inactivity**. Set a weekly reminder or a scheduled
job (GitHub Actions cron, ~15 lines) that runs a real query against `spots` once a week. A plain
REST ping does not count as activity. This is gate/open question 4 in `tasks/todo.md`.

## 3. Check the health of the data

Roughly once a week:

- Compare the count of `approved` rows with the target (≥ 100).
- Look at `last_verified_at` — old spots are candidates for a on-site check.
- Remember the honesty limit: OSM facility tags are nearly empty (toilets 0.4%, drinking water
  0%, opening hours 3%). `Belum ada info` is correct, not a bug to fill in by guessing.

## 4. The real acceptance test

Use the app on **one real trip**, on a phone, on mobile data. That is success criterion 8 and it
matters more than any checklist. Note what was confusing and bring it back as a spec change —
update `SPEC-singgah.md` first, then the code.

## 5. Never do these

- Never put the `service_role` key in `index.html`, `css/`, `js/`, `data/`, or in git.
- Never disable RLS to "make something work".
- Never approve a spot by making it publicly visible while still `pending`.
- Never add login, photos, reviews, or personal-data fields without asking first.
- Never delete or rewrite `data/playbook-spots.json` without asking — it is research data.
- Never pre-cache OSM tiles for offline use (tile usage policy).

## 6. When something looks broken

| Symptom | First check |
|---|---|
| No spots at all | is the Supabase project paused? (7-day auto-pause) |
| A new spot never appears | is its `status` still `pending`? |
| Map is blank | tile URL / network; tiles are network-only |
| Verification does nothing | the rate-limited verify write path (gate G3) |
| App suddenly shows English | a UI string regressed — run the checklist |

## 7. Related docs

- `docs/setup.md` — first-time setup
- `docs/deployment.md` — deploy and free-tier notes
- `docs/manual-test-checklist.md` — run before every deploy
- `docs/data-model.md` — what each column means
