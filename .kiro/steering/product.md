# Product — Singgah

Singgah is a mobile-first web app where cyclists and backpackers in Indonesia find free wash and
rest spots: masjid besar, musala, terminal, SPBU and rest areas.

- Launch area: Yogya city and the Jakarta→Yogya corridor only.
- Open add-spot flow, no login. User submissions land `status='pending'`. Only the owner approves
  them, in the Supabase dashboard. Only `approved` rows are publicly readable.
- Parked on purpose for the MVP: photos, accounts, reviews, PWA/offline.
- UI text is Indonesian only. Unknown data shows as `Belum ada info`. Never invent defaults.
- The owner is a beginner coder. Keep code explicit and simple, start each file with a one-line
  "what this does" comment, and explain in simple English.

Source of truth: `docs/SPEC-singgah.md`. Update the spec first when a decision changes, then
the docs, then code. Do not silently resolve items in `docs/decision-log.md`.

#[[file:AGENTS.md]]
