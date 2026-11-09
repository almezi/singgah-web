# Research — OSM Seeding Strategy (Singgah)

*Researched 2026-11-09 by research agent (live-tested against the public Overpass API). Feeds the
`seed` module of the real build — not the prototype.*

## (a) Working, tested Overpass query — real result: 282 elements

Tested live against `https://overpass-api.de/api/interpreter` (bbox = central Yogya):

```overpassql
[out:json][timeout:90];
(
  node["amenity"="place_of_worship"]["religion"="muslim"](-7.82,110.33,-7.77,110.42);
  way["amenity"="place_of_worship"]["religion"="muslim"](-7.82,110.33,-7.77,110.42);
  relation["amenity"="place_of_worship"]["religion"="muslim"](-7.82,110.33,-7.77,110.42);
);
out count;
out tags center;
```

**Real count returned: 282** (65 nodes, 215 ways, 2 relations). `out tags center` gives id, type,
tags, and a center lat/lng for ways/relations (nodes get lat/lon directly) — exactly what a seed
script needs. Notes: `amenity=prayer_room` returned **0** in the bbox; musala are already
PoW-tagged (29 of the 282 have "Musala/Musholla" in their name). Operational notes: overpass-api.de
returned 502 "at capacity" twice before succeeding — build retry-with-backoff + a mirror fallback
into the seed job, and always send a User-Agent (no UA = 406).

Sample elements from the response:
1. `node 1707858091` (-7.8156, 110.3628) — `amenity=place_of_worship, religion=muslim,
   building=mosque, name=Masjid Ngadinegaran`
2. `way 120394106` center (-7.7775, 110.3540) — `name=Masjid As-shidiq, religion=muslim,
   building=yes, building:levels=2, building:structure=reinforced_masonry, ...`
3. `way 284371213` center (-7.7811, 110.4164) — `name=Masjid Al-Islam, building=mosque,
   denomination=sunni, toilets=yes, capacity:persons=50-100, addr:full=Jalan Tambak Bayan,
   check_date=2024-02-24, source=survey` (the best-tagged element found)

## (b) Tags worth importing, with measured fill rates (n=282, central Yogya)

| Tag | Fill in sample | Import? |
|---|---|---|
| `name` | 256/282 (91%) | yes — 9% unnamed, need "Musala (tanpa nama)" fallback |
| `building` (77%, mostly `mosque`) | 217/282 | yes — combined with `name~musal|musoll|mushol` heuristic for masjid-vs-musala typology |
| `denomination` | 24/282 (9%) | optional |
| `opening_hours` | 8/282 (3%) | import if present, but treat as "unknown" by default |
| `wheelchair` | 8/282 (3%) | import if present |
| `toilets` | 1/282 (0.4%) | import if present |
| `drinking_water` | 0/282 | effectively never populated |
| `fee`, `access` | 0/282 | effectively never populated |
| `website`, `phone` | 0/282 | no |

Also grab `addr:full`/`addr:street` when present and `check_date`/`source` for freshness.

Tagging landscape: base is `amenity=place_of_worship` + `religion=muslim`. `religion=moslem`
misspelling is now 0 in Indonesia. `amenity=prayer_room` has **0 uses in Indonesia** (2 globally)
— ignore it. `place_of_worship=musalla` (the wiki-blessed musala/surau/langgar subtag) has only
907 uses in Indonesia vs ~90,900 `amenity=place_of_worship` — too sparse to rely on; use name
heuristics instead. Indonesia-wide taginfo: `religion=muslim` 80,656 / `building=mosque` 26,033.

## (c) Kemenag data verdict: NOT usable as open data — use only as a coverage benchmark

- [SIMAS](https://simas.kemenag.go.id) (absorbs SIDATAKMAS registrations, ~242k masjid + ~269k
  musalla records) is **browse/search only** and currently showing a maintenance notice. Academic
  theses had to *scrape* it; a UN Statistics paper notes Kemenag applies anti-scraping measures.
  No bulk download, no API.
- [satudata.kemenag.go.id](https://satudata.kemenag.go.id/dataset?search=rumah+ibadah) serves no
  datasets without its JS app; only aggregates like "Jumlah Masjid Terdaftar menurut Tipologi"
  exist on [data.go.id](https://data.go.id/dataset/dataset/jumlah-masjid-terdaftar-menurut-tipologi).
- Best local artifact: [dataset.jogjakota.go.id](https://dataset.jogjakota.go.id) has downloadable
  XLSX **counts per kemantren** — Kota Yogya 2023: 542 masjid + 512 musholla — but no coordinates.

**Verdict:** OSM is the only viable point-level seed source. Use Kemenag/kemantren counts as a
completeness yardstick.

## (d) Cold-start tactics worth copying

**iOverlander** ([about](https://ioverlander.com/about)):
1. **Launch non-empty** — founders merged scattered blog/forum camp lists, emailing dozens of
   overlanders for permission; opened Aug 2014 with 1,900 places already in the DB (our analogue:
   the 282-spot OSM seed).
2. **Recruit where the community already is** — asked on an existing overlanding forum; growth was
   campfire-to-campfire; friends/family/volunteers did data cleaning and beta testing.
3. **Trust rules from day one** — only entries made by travelers physically on site, check-ins to
   keep data fresh, easy editing, no paid placements, dedicated moderators with road experience.

**WarmShowers** ([Wikipedia](https://en.wikipedia.org/wiki/Warm_Showers), [warmshowers.bike](https://warmshowers.bike)):
1. **Absorb an existing informal list** — started from the ~800-name Touring Cyclist Hospitality
   Directory rolodex (John Mosley, 1976); Randy Fay put the existing database online (2005)
   rather than recruiting hosts one by one. Our analogue: adopt existing touring-club
   spreadsheets / WhatsApp "titik istirahat" lists.
2. **Protect the gift-economy norm** — hosts may never charge; personalized (non copy-paste)
   request norms reinforced trust and retention.
3. **Donation-funded nonprofit + media** — grew 50k members (2014) to 144k in 161 countries
   (2019) largely via cycling press and forums.

Singgah mapping: OSM seed + cycling-community recruitment (touring clubs, Strava clubs,
Bike2Work groups), GPS-on-site check-ins, never paid listings.

## (e) Risks, rated for Yogya specifically

1. **Facility tags are effectively empty (HIGH — hits the core promise).** toilets 0.4%,
   drinking_water 0%, opening_hours 3%. We cannot promise "wudhu + toilet + air" from OSM alone;
   show "belum diverifikasi" states and make on-site verification check-ins the primary data loop.
2. **OSM coverage gap vs official counts (MEDIUM-HIGH).** Kemenag counts 542 masjid + 512 musalla
   in Kota Yogya (2023); OSM returned 282 in the partial-city bbox — OSM likely holds only ~half
   of Yogya's spots, biased toward big named masjid; small musholla underrepresented. Mitigate
   with the community "tambah spot" flow and a comparison against the kemantren XLSX.
3. **Musala tagging gap (MEDIUM).** No usable dedicated tag; typology must come from name regex
   (`musal|musoll|mushol|surau|langgar`), which fails for unnamed musala — 26/282 elements are
   unnamed, likely mostly musala.
4. **Node-on-building duplicates (MEDIUM).** The same mosque is often both a node inside its
   building outline. Dedupe by proximity + name similarity at import; prefer ways/relations with
   `out center`.
5. **Name variants (LOW-MEDIUM).** Spelling chaos ("As-shidiq", "Al Islam",
   Musala/Musholla/Musolla) will cause near-duplicates in search; normalize before matching.
6. **Infrastructure (LOW but real).** Overpass 502s; seed jobs need backoff, a mirror fallback, a
   UA header, and a scheduled refresh. Data is ODbL — attribution "© OpenStreetMap contributors"
   is mandatory in the app.
