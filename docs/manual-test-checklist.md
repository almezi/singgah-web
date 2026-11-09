# Manual test checklist — Singgah

*What this doc does: the only test runner in the MVP. Run it before **every** deploy, and finally
on a real phone over mobile data. No automated test framework exists — adding one before there is
anything to test is process theater (`SPEC-singgah.md` → Testing Strategy).*

Write the date and device at the top of each run. Tick a box only after you actually did it.

```
Run date: ____________   Device / browser: ______________________   Network: ____________
Build / commit: ____________________________   Tester: ______________________
```

---

## A. The 7 checks from the SPEC

- [ ] **1. Map loads on a mobile viewport; geolocate button works.**
      Open at 390×844. Tiles render. Tap the crosshair: map pans to your location. Deny
      permission: toast `Lokasi tidak tersedia.` appears and the app stays usable.

- [ ] **2. Markers appear for approved spots; pending spots are NOT visible anywhere.**
      Count markers vs approved rows. Add a test spot, then confirm it is absent from the map,
      the public list, and search results. It may appear only under `Tinjauan saya`.

- [ ] **3. Detail card shows type, water, hours, bike parking, women-friendly, last-verified.**
      Open a marker. Every row has a value or the exact string `Belum ada info`. Check the
      verification line reads `Diverifikasi …` or `Belum diverifikasi`. No invented defaults.

- [ ] **4. Add-spot flow: tap map → form → submit → row appears in Supabase as `pending`.**
      Pin drop works, `Lanjut` stays disabled until a pin exists, `Nama spot` is required,
      `Ramah perempuan` defaults to `Belum ada info`. Check the row in the Supabase Table Editor:
      `status = pending`, `source = user`, `last_verified_at = null`.

- [ ] **5. Approve one spot in the Supabase dashboard → it appears on the map.**
      Change `status` to `approved`, reload the app, find the new marker and card.

- [ ] **6. Verify button updates `last_verified_at`.**
      Tap `Masih ada ✓`. Toast `Terima kasih! Verifikasi tercatat.` appears, the line re-renders,
      and the timestamp in Supabase changes. Tap again within the hour: the rate limit holds
      (1 bump per spot per hour).

- [ ] **7. Whole page works on a real phone, real mobile data, before calling anything done.**
      Turn off Wi-Fi. Load the public URL. Walk the whole flow with one thumb.

## B. Extra checks (hard rules from `AGENTS.md` + the UI/UX audit)

- [ ] **8. Zero English UI strings.** Read every visible word on all 6 screens. Only allowed
      English is `© OpenStreetMap contributors`. Use `docs/ui-copy.md` §5 as the forbidden list.

- [ ] **9. `Belum ada info` is visible somewhere.** At least one field on a detail card shows the
      unknown state. Never a dash, `N/A`, or a guessed value.

- [ ] **10. `© OpenStreetMap contributors` attribution is on the map** (ODbL, mandatory).

- [ ] **11. No `service_role` key anywhere in the frontend.**
      `grep -r service_role index.html css js data` returns nothing. Only the anon key is present.

- [ ] **12. RLS is on and correct.** With the anon key: `SELECT` returns approved rows only;
      `INSERT` is forced to pending/user; `UPDATE` and `DELETE` are refused. No anon policy for
      update/delete exists (`grep` the policies).

- [ ] **13. No personal data collected.** No email, phone, name-of-person, or account fields.
      No login/signup screen, no photos, no reviews/ratings/comments, no ads.

- [ ] **14. Desktop ≥992px.** The bottom sheet becomes a static left sidebar, map fills the rest.
      Same DOM, no separate desktop code path. If gate G4 changed the mode, test the approved
      three-mode layout instead.

- [ ] **15. Dark mode (only if OQ-5 says yes).** Toggle survives reload; text contrast ≥4.5:1 in
      both themes; focus outline visible.

- [ ] **16. Contrast ≥4.5:1 for all text** in light mode. Check the semantic `--*-ink` tokens on
      soft tints; worst known pair is 4.55:1. Placeholders and map labels were the earlier failures.

- [ ] **17. Touch targets ≥44px.** Chips, buttons, sheet handle, toggle switch, segmented and
      tri-state controls. Include the tap-to-expand alternative to dragging the sheet.

- [ ] **18. Color is not the only signal.** Each pin has a white glyph; badges have text. Legend
      visible once on desktop. Legible at a glance without distinguishing hues.

- [ ] **19. No horizontal page scroll** at 390px; desktop frames scroll inside their own container.
      No clipped cards, no double `+` on the FAB, no pin hidden behind a button.

- [ ] **20. Zero console errors.** Open DevTools, reload, walk the whole flow.

- [ ] **21. ≥100 approved spots** across Yogya + the Jakarta→Yogya corridor, including the
      playbook spots (Giwangan musala, Masjid Jami Ni'matul Ittihad). Check the dry-run count.

- [ ] **22. Search and chips filter cards AND markers together.** Both change at the same time.

- [ ] **23. `Rute` opens the right place.**
      `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>` uses the row's coordinates.

- [ ] **24. Back works everywhere.** map → list → detail → add pin → form → success → list, and
      `Batal` / `Kembali ke peta` all return sensibly.

- [ ] **25. Submit CTA is compact.** `Kirim untuk ditinjau` is ~200×44 on phone with side margins,
      right-aligned ~189×44 on desktop. No button taller than 60px (see `docs/design-system.md` §7).

- [ ] **26. Pending review is gentle.** `Spot baru diperiksa dulu sebelum tampil di peta.` and
      `Spot kamu menunggu persetujuan.` — no scolding, no login prompt, no email field.

## C. Deploy gate (all of these before `npx vercel --prod`)

- [ ] All of section A and B pass
- [ ] `docs/decision-log.md` open questions that block launch are answered
- [ ] `SPEC-singgah.md` is up to date with any changed decision
- [ ] No pending spot is publicly visible
- [ ] Working files (`scripts/`, `supabase/`, `tasks/`, `docs/`) are not served publicly with a
      privileged key

## D. Final acceptance

- [ ] **Owner uses the app on one real trip.** This is success criterion 8 and the real test.
      Note confusing moments and bring them back as a spec change (spec first, then code).

```
Sign-off: ______________________   Date: ____________
```

---

## Related docs

- `docs/deployment.md` — deploy steps and free-tier notes
- `docs/ui-copy.md` — the exact strings to look for
- `docs/design-system.md` — contrast, touch targets, layout rules
- `docs/owner-guide.md` — approving spots in the dashboard
