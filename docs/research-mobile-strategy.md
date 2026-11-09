# Research — Mobile Strategy & Costs (Singgah)

*Researched 2026-11-09 by research agent. Feeds the post-MVP "menuju mobile" chapter — and two
"prepare now" items already folded into SPEC-singgah.md Open Questions.*

## (a) Verdict: PWA-first, then TWA. Do NOT jump straight to TWA.

**Why PWA-first is right for Indonesia right now:**
- Android is ~72% of Indonesian mobile OS share (iOS ~28%) per
  [StatCounter 2025](https://gs.statcounter.com/os-market-share/mobile/indonesia) — a PWA on
  Chrome covers the majority well.
- Chrome Android install flow works but is **engagement-gated**: Chrome only fires
  `beforeinstallprompt` after the user shows interest (often 2nd–3rd visit); the install icon
  lives in the address bar / ⋮ menu, not a big popup
  ([web.dev](https://web.dev/articles/pwa-install-addressbar)). Build a small in-app
  "Add to Home Screen" hint that appears after a repeat visit.
- **iOS (Safari)** is usable but second-class in 2025–2026: Web Push only works **after** Add to
  Home Screen (iOS 16.4+), no background sync, and script storage in *Safari tabs* can be evicted
  after 7 days of non-use (installed home-screen web apps are exempt, per a
  [2026 iOS PWA analysis](https://synthetixis.com/writing/pwa-ios-2026) and
  [MagicBell's guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)).
  For a "look up a spot → go ride" app, that's tolerable for months.
- Going straight to TWA would **delay launch by weeks**: new personal Play accounts require
  **12 opted-in testers continuously for 14 days** before production access
  ([Google policy](https://support.google.com/googleplay/android-developer/answer/14151465)), and
  TWA wrappers are disproportionately hit by "minimum functionality" and "testers not engaged"
  rejections.

**TWA later** (~when there's traction + a community to recruit 12 testers): `npx @bubblewrap/cli
init` or PWABuilder → AAB, host `/.well-known/assetlinks.json`, fill Data Safety form + privacy
policy URL, pay **$25 one-time**. Extra work over a PWA with a manifest: roughly **1–3 days of
setup** *plus* the 14-day testing gate and review lottery. Capacitor is **overkill now** — it only
wins when you need native push (especially iOS), background geolocation, or geofencing. Revisit
only if we add ride-tracking or notification digests.

## (b) "Prepare now" checklist for web v0.1

**Manifest — do at real build:**
- `name`, `short_name`, `start_url`, `display: "standalone"`, `theme_color`,
  `background_color`, `lang: "id"`, `id`
- Icons: **192×192 PNG + 512×512 PNG + a 512×512 `purpose: "maskable"`** variant (logo inside
  inner 80% safe zone) ([MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons))
- `&lt;link rel="apple-touch-icon"&gt;` (180×180), `viewport` meta, theme-color meta — this is all
  iOS needs since it ignores the manifest for installation
- Optional but cheap: `screenshots` + `description` for Chrome's richer install sheet

**Service worker — minimal or defer.** Chrome no longer hard-requires a fetch-handler SW for
installability. Recommendation: a tiny app-shell cache (HTML/CSS/JS/Leaflet library,
network-first) helps on flaky Indonesian data, but **do not cache map tiles in the SW** (see
etiquette below). If time-pressed, ship v0.1 without SW and add the shell cache in v0.2.

**Other cheap future-proofing:**
- Put the tile URL in one config constant (easy swap to CARTO/MapTiler/self-host later)
- Custom in-page "Add to Home Screen" instructions (Android + Safari share-menu variant), shown
  on repeat visits
- Compress user photos client-side before upload (protects the 1 GB free storage) — when photos
  arrive post-MVP
- A weekly DB heartbeat (GitHub Actions cron is ~15 lines) to defeat Supabase auto-pause
- Buy a real domain early (~$10–15/yr) — needed later for `assetlinks.json` and trust

**Tile legality (important):** OSM's
[tile usage policy](https://operations.osmfoundation.org/policies/tiles/) bans bulk downloading
and offline/pre-emptive caching; guideline is ≤250 tiles (z13+) per session; heavy use requires
switching providers. Leaflet's default `tile.openstreetmap.org` is fine for light interactive use
only. **Never pre-fetch tiles for offline** — if offline maps become a feature, switch to
[CARTO basemaps (free ≤5M tile requests/mo for non-commercial use)](https://carto.com/legal/basemap-terms),
MapTiler free (~100k map views/mo), or self-hosted/Protomaps PMTiles.

## (c) Cost curve

| Service | 0 users | 100 users | 1,000 users | First paid trigger |
|---|---|---|---|---|
| Vercel Hobby ([docs](https://vercel.com/docs/plans/hobby)) | $0 | $0 | $0 (≈10–30 GB of 100 GB Fast Data Transfer) | &gt;100 GB transfer/mo; note Hobby is **non-commercial only** → Pro $20/user/mo |
| Supabase Free ([pause docs](https://supabase.com/docs/guides/platform/free-project-pausing)) | $0 — **but auto-pauses after 7 days of inactivity**; heartbeat required | $0 (heartbeat still wise) | $0 if JSON API is lean; photo uploads make 1 GB storage / 5 GB egress the pinch point | DB &gt;500 MB, egress &gt;5 GB/mo, storage &gt;1 GB, or 2-project cap → Pro $25/mo |
| OSM tiles | $0 | $0 | $0 but approaching "heavy use" territory; be ready to move to CARTO free | Policy violation (bulk/offline caching or sustained heavy load) → CARTO/MapTiler/self-host ($0–30/mo) |
| Play Store (TWA) | — | — | $25 one-time + 12-tester/14-day gate when we choose to ship | $25 one-time |
| Domain | ~$12/yr | ~$12/yr | ~$12/yr | — |

**Bottom line: $0/month from 0 → 1,000 users is realistic** if Supabase queries stay small and
photos are compressed; realistic first payments are the domain, then Supabase Pro $25/mo (egress/
storage or an unpausable project), not Vercel.

## (d) Top 3 risks + mitigations

1. **Supabase free project auto-pauses after 7 days of inactivity** — the app looks dead to early
   users. Mitigation: GitHub Actions heartbeat hitting the DB weekly; use real DB queries, not
   just REST pings.
2. **TWA/Play rejection wall later** — 12-testers-for-14-days rule + "minimum functionality"
   rejections specific to wrapper apps on new personal accounts. Mitigation: launch PWA first;
   before TWA, recruit 12+ real cyclist testers for 14+ days, host a correct privacy policy +
   `assetlinks.json`, declare Data Safety accurately, keep Bubblewrap/PWABuilder on current
   targetSdk (36).
3. **OSM tile policy violation / ban** if offline caching or traffic spikes hit the public tile
   server. Mitigation: keep tiles network-only and uncached in v0.1; put the tile provider behind
   one config constant; switch to CARTO free basemaps (non-commercial) or self-host/Protomaps
   before shipping any offline feature.

Honorable mention: iOS is ~28% of Indonesia — don't skip Safari testing; push and reliable
storage only work after Add to Home Screen, so design the onboarding hint accordingly.
