# HANDOFF — Musafir Project (take this to the new workspace)

*Compact context from the previous session. Everything below is self-contained — the new workspace session needs nothing else to continue.*

---

## 1. Who the user is

- Indonesian, budget musafir (traveler), relocating **Jakarta (Pondok Pinang) → Yogyakarta** one-way, staying in Yogya, bike as transport.
- **Beginner coder** (HTML/CSS/JS basics) who builds with AI tools (ZCode). Guides should stay simple, learn-while-building style.
- Communicates in simple English; likes: honest roasts, agent swarms (note: account **caps agent concurrency at 2** — launch research agents in batches of 2), deliverables as markdown guides in the workspace root.

## 2. Deliverable 1 — DONE: the trip playbook

**File:** `musafir-playbook-pondok-pinang-yogya.md` (in this workspace — copy it alongside this handoff, or find it at
`/Users/auliameiazizi/.zcode/workspace/1794149299794-51369c64-2f65-4c1e-83d0-4447af4c8090/musafir-playbook-pondok-pinang-yogya.md`)

Key facts (researched Nov 2026, 6-agent swarm):
- **Kramat Djati** exec ~17:00 from Terminal Pondok Pinang → **Terminal Giwangan** (Rp 204k) is the plan-keeper. Sumber Alam drops at **Sentolo** (20 km out ❌); J99 at a Tegalrejo agent office.
- **No shower anywhere on the journey.** Sequence: full wash at **Masjid Jami Ni'matul Ittihad** (Jl. Ciputat Raya No. 10, same street as terminal) → wudhu touch-ups at rest areas (Type A/B Trans-Java rest areas standardly have musala + MCK) → real recovery wash at **Giwangan musala (Blok C / Masjid Al-Hidayah)** at dawn.
- Bike box: free from **toko sepeda 2–3 days early** ("Permisi kak, ada kardus sepeda kosong?"). Bike fee on AKAP buses: **Rp 50–150k negotiated with the kernet/kondektur**, box optional in practice, avoid double-deckers.
- Giwangan → Malioboro **6.9 km**; don't ride Ring Road Selatan; stray dogs + patchy lighting at dawn; angkringan is **evening** food (bubur opens ~05:30).
- Mosque etiquette core: wudhu/prayer needs no permission; **resting/bathing/sleeping does** (ask marbot/takmir, say "saya musafir"); **never shampoo at wudhu taps**; contribute (kotak amal, sweep); rhythm follows prayers (sleep after Isya, up at Fajr).
- Yogya settling: kos Rp 300k–2.5 jt/mo (cheap areas: Gejayan, Kaliurang KM 5–6, Terban); laundry kiloan Rp 5–7k/kg; rainy season starts mid-Nov (fenders + poncho + weekly chain lube); bike shops on Jl. Katamso (Orion); community: **Jogja Gowes**.
- Backup options: train (full-size bikes only via **KAI Logistik/Kalog**, ~Rp 100–250k; folding bikes ride free in cabin), cargo (~Rp 170–400k), or ride the 560 km.

## 3. Deliverable 2 — IN PROGRESS: the app brainstorm

**Concept (confirmed by user):** the **musafir spot-finder** — a web app to find free bathing & rest spots for cyclists/backpackers in Indonesia (mosques/musala, terminals, SPBU, rest areas...), built **web-first, then moved to mobile later**. The trip playbook above is literally the app's seed data model (spot types: masjid besar / neighborhood musala / terminal musala / SPBU; attributes: water type, hours, cleanliness, women-friendly, bike parking).

**Pending research plan (parked — run it in the new workspace):** 6 agents, **batches of 2**:
1. Web-first → mobile strategy 2026: PWA vs wrapper vs Capacitor vs native rewrite; when web-first is wrong; PWA reality in Indonesia (iOS Safari quirks, Play Store trust).
2. Beginner-friendly stack for a map/POI app (learn-while-building): Leaflet + OSM tiles, free DB tiers (Supabase/Firebase), free hosting (Vercel/Netlify/Cloudflare Pages), honest cost curve.
3. MVP features + data model for the spot-finder (contribution flow, one-tap verification, moderation, offline/low-bandwidth, Indonesian UI).
4. Cold-start strategy: seed from **OpenStreetMap** (mosques already mapped — Overpass API), Kemenag mosque data, partner with gowes communities; how iOverlander/WarmShowers solved it.
5. Costs & mobile transition economics: monthly cost at 0/100/1000 users; Play Store $25 one-time vs Apple $99/yr; **TWA (Trusted Web Activity)** = ship the same web app to Play Store cheaply.
6. The roast: why most solo map apps die (12 users, stale data, Google Maps already has reviews) and what makes one survive.

**Synthesis target:** `spot-finder-web-to-mobile-brainstorm.md` — TL;DR verdict → roast → strategy → beginner stack → MVP + data model → cold-start playbook → cost curve → 30/90-day roadmap. Roast written by the main agent with all facts in hand (same pattern as Deliverable 1).

## 4. Recommended names

**User preference: universal/English-friendly name** (local Indonesian names still allowed as flavor).

| Name | Meaning | Note |
|---|---|---|
| **Oasis** ⭐ top pick | The one English word meaning water + rest for travelers; every spot on the map becomes "an oasis" | Crowded name space — own via niche tagline; check trademark/app stores. Domain ideas: `oasis.rest`, `findoasis.app`, `getoasis.app` |
| **Pitstop** | Quick stop to refuel & reset | Cycling-culture native; very crowded |
| **Waypoint** | A point along the route | Map/route-native; names the map, not the rest |
| **Stopover** | A rest break mid-journey | Real English journey word, cleaner legally |
| **Freshen** | "Freshen up" = wash + reset | Wash-first framing |
| **Salam** | The greeting that opens the mosque door | Warm, universal; faith-forward |
| **Musafir** | Already universal: Arabic/Turkish/Urdu/Swahili/Indonesian | But `musafir.com` (UAE travel brand) is contested |
| **Singgah** (local soul) | Indonesian "stop by and rest" | Keep as local flavor / bilingual second name if desired |

- **Tagline:** "Free wash & rest for every traveler."
- **Workspace/repo folder:** `oasis` (universal pick) or `singgah` (local-first); generic fallback `musafir-spot-finder`.

## 5. Suggested next steps in the new workspace

1. Copy `HANDOFF-musafir-project.md` + `musafir-playbook-pondok-pinang-yogya.md` into the new workspace.
2. Tell the session: *"Run the parked swarm from section 3 of the handoff — batches of 2 — then synthesize the brainstorm guide."*
3. After the guide: scaffold the MVP (plain HTML/CSS/JS + Leaflet + Supabase, deployed to a free host) with the name **Singgah**.
