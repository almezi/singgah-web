// scripts/seed-spots.mjs — fills the Supabase `spots` table from two sources:
//   1. data/playbook-spots.json — owner-researched trip playbook spots (source: 'playbook')
//   2. the Overpass API (OpenStreetMap) — muslim places of worship (source: 'osm')
// Plain Node >= 18 (built-in fetch). No dependencies, no build step, nothing to install.
//
// ── Playbook entry format (OQ-6: the source playbook markdown is NOT in this repo yet,
//    so data/playbook-spots.json stays an empty array until the owner supplies it) ─────
// Every entry must use EXACTLY the SPOT fields (docs/api-contract.md §5) — nothing more,
// nothing less. Unknown values stay null, never guessed:
//   name            string, required
//   type            string, required — masjid_besar | musala | terminal | spbu | rest_area
//   lat, lng        number, required
//   water           'kran_mandi' | 'wudhu_only' | 'air_isi' | 'tidak_ada' | null
//   hours           string | null   e.g. '24 jam'
//   bike_parking    boolean | null  (null falls back to the DB default false)
//   women_friendly  boolean | null  (null = belum ada info — never guessed)
//   notes           string | null
//   source          must be 'playbook'   status must be 'approved'
// A wrong or extra field fails loudly here, so research data can never drift from the
// SPEC schema. Unknown data stays null — never invented.
//
// Usage:
//   node scripts/seed-spots.mjs --dry-run   → counts only, writes NOTHING, needs no key
//   --playbook-only                          → skip Overpass: seed ONLY the owner-researched
//                                             playbook spots (a small curated first launch;
//                                             OSM rows have no water/hours info and ~7,000 of
//                                             them are heavy on mobile data). Combine with --dry-run.
//   node scripts/seed-spots.mjs             → upserts; needs SUPABASE_URL and
//                                             SUPABASE_SERVICE_KEY from the environment

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

if (typeof fetch !== 'function') {
  console.error('Node >= 18 is required (the script uses the built-in fetch).');
  process.exit(1);
}

const PLAYBOOK_PATH = fileURLToPath(new URL('../data/playbook-spots.json', import.meta.url));

const TYPES = ['masjid_besar', 'musala', 'terminal', 'spbu', 'rest_area'];
const WATER_VALUES = ['kran_mandi', 'wudhu_only', 'air_isi', 'tidak_ada'];
const PLAYBOOK_REQUIRED = ['name', 'type', 'lat', 'lng'];
const PLAYBOOK_OPTIONAL = ['water', 'hours', 'bike_parking', 'women_friendly', 'notes'];

// Descriptive User-Agent is required by the Overpass API (no UA = 406).
const USER_AGENT = 'SinggahSeed/0.1 (contact: owner)';
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',       // primary
  'https://overpass.kumi.systems/api/interpreter', // mirror fallback (overpass-api.de often 502s)
];

// Launch area: Yogyakarta city + the Jakarta→Yogya corridor (southern route,
// per SPEC). One giant rectangle over the whole corridor would swallow the Jakarta
// and Bandung megacities (tens of thousands of elements in one Overpass call), so the
// route is covered by smaller city-sized windows instead. Confirm/adjust these windows
// once the playbook markdown (OQ-6) fixes the exact route. Live-tested 2026-11-14:
// Yogyakarta city = 932 elements; Jakarta South window = 3239; others ~250–650.
const BBOXES = [
  { label: 'Yogyakarta city',                    coords: '-7.89,110.24,-7.72,110.50' },
  { label: 'Purworejo',                          coords: '-7.82,109.92,-7.62,110.15' },
  { label: 'Kebumen',                            coords: '-7.76,109.56,-7.60,109.90' },
  { label: 'Cilacap',                            coords: '-7.82,108.90,-7.62,109.15' },
  { label: 'Ciamis-Banjar',                      coords: '-7.50,108.32,-7.30,108.62' },
  { label: 'Tasikmalaya',                        coords: '-7.42,108.10,-7.26,108.32' },
  { label: 'Bandung',                            coords: '-7.02,107.46,-6.82,107.78' },
  { label: 'Cianjur',                            coords: '-6.90,107.04,-6.74,107.25' },
  { label: 'Sukabumi',                           coords: '-7.00,106.86,-6.82,107.02' },
  { label: 'Bogor',                              coords: '-6.72,106.72,-6.52,106.92' },
  { label: 'Jakarta South (Pondok Pinang-Depok)', coords: '-6.42,106.72,-6.18,106.92' },
];

// Never pre-cache OSM tiles (tile usage policy).
// Seed data comes from the Overpass API only; ODbL: attribution
// "© OpenStreetMap contributors" is mandatory in the app.

// Name regex that separates small musala from big masjid (docs/data-model.md §4).
const MUSALA_NAME_RE = /musal|musoll|mushol|surau|langgar/i;

// Dedupe thresholds: node-on-building duplicates sit on the same plot (< 60 m), and an
// unnamed entrance node pinned inside a named building is within ~30 m of its centre.
const DUP_DISTANCE_M = 60;
const DUP_UNNAMED_M = 30;

// Fixed namespace for deterministic spot ids (uuid v5, computed locally).
const UUID_NAMESPACE = '6f1f2f64-9e5f-4b3a-9f0e-2b6c1a5d7e88';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Playbook (D1–D3) ─────────────────────────────────────────────────────────────────

// Reads data/playbook-spots.json and validates every entry against the SPOT contract.
function readPlaybook() {
  let entries;
  try {
    entries = JSON.parse(readFileSync(PLAYBOOK_PATH, 'utf8'));
  } catch (err) {
    throw new Error(`cannot read ${PLAYBOOK_PATH}: ${err.message}`);
  }
  if (!Array.isArray(entries)) {
    throw new Error('data/playbook-spots.json must be a JSON array');
  }
  return entries.map((entry, index) => validatePlaybookEntry(entry, index));
}

function validatePlaybookEntry(entry, index) {
  const where = `playbook entry #${index + 1}`;
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new Error(`${where} is not an object`);
  }
  const allowed = [...PLAYBOOK_REQUIRED, ...PLAYBOOK_OPTIONAL, 'source', 'status'];
  for (const key of Object.keys(entry)) {
    if (!allowed.includes(key)) {
      throw new Error(
        `${where} has a field outside the SPEC ("${key}"). Allowed fields: ${allowed.join(', ')}`,
      );
    }
  }
  for (const key of PLAYBOOK_REQUIRED) {
    if (entry[key] === undefined) throw new Error(`${where} is missing "${key}"`);
  }
  if (typeof entry.name !== 'string' || entry.name.trim() === '') {
    throw new Error(`${where} needs a non-empty name`);
  }
  if (!TYPES.includes(entry.type)) {
    throw new Error(`${where} has type "${entry.type}" — must be one of: ${TYPES.join(', ')}`);
  }
  if (typeof entry.lat !== 'number' || typeof entry.lng !== 'number') {
    throw new Error(`${where} needs numeric lat/lng`);
  }
  if (entry.water !== undefined && entry.water !== null && !WATER_VALUES.includes(entry.water)) {
    throw new Error(
      `${where} has water "${entry.water}" — must be one of: ${WATER_VALUES.join(', ')}, or null`,
    );
  }
  if (entry.source !== undefined && entry.source !== 'playbook') {
    throw new Error(`${where} must use source:'playbook' (the seed sets it for you)`);
  }
  if (entry.status !== undefined && entry.status !== 'approved') {
    throw new Error(`${where} must use status:'approved' (the seed sets it for you)`);
  }
  return entry;
}

// Builds the Supabase row for a playbook entry: only fields we actually know are sent,
// so unknown values land as the DB default (null) and re-running the seed never wipes
// an owner correction in the dashboard.
function playbookPayload(entry) {
  const row = {
    id: stableSpotId('playbook', '-', entry.name.trim(), { lat: entry.lat, lng: entry.lng }),
    name: entry.name.trim(),
    type: entry.type,
    lat: entry.lat,
    lng: entry.lng,
    status: 'approved',
    source: 'playbook',
  };
  for (const key of PLAYBOOK_OPTIONAL) {
    if (entry[key] !== undefined && entry[key] !== null) row[key] = entry[key];
  }
  return row;
}

// ── Overpass (D4) ────────────────────────────────────────────────────────────────────

function overpassQuery(bbox) {
  return `[out:json][timeout:90];
(
  node["amenity"="place_of_worship"]["religion"="muslim"](${bbox.coords});
  way["amenity"="place_of_worship"]["religion"="muslim"](${bbox.coords});
  relation["amenity"="place_of_worship"]["religion"="muslim"](${bbox.coords});
);
out tags center;`;
}

// Queries one bbox with retry + exponential backoff, then falls back to the mirror.
// (Live-tested shape from docs/research-osm-seeding.md; overpass-api.de 502s when busy.)
async function fetchOverpass(bbox) {
  const attemptsPerEndpoint = 3;
  const backoffMs = [5000, 10000, 20000];
  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 1; attempt <= attemptsPerEndpoint; attempt++) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ data: overpassQuery(bbox) }),
          signal: AbortSignal.timeout(120000), // never hang forever on a stalled server
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!Array.isArray(json?.elements)) {
          throw new Error('unexpected Overpass response body');
        }
        return json.elements;
      } catch (err) {
        if (attempt === attemptsPerEndpoint) {
          console.warn(`    ${bbox.label}: giving up on ${endpoint} (${err.message})`);
          break; // try the next endpoint (mirror)
        }
        const wait = backoffMs[attempt - 1];
        console.warn(`    ${bbox.label}: ${err.message} — retry ${attempt} in ${wait / 1000}s`);
        await sleep(wait);
      }
    }
  }
  throw new Error(`Overpass failed for bbox "${bbox.label}" on every endpoint`);
}

// ── OSM → SPOT mapping (D5) ──────────────────────────────────────────────────────────

function elementCoords(el) {
  // Nodes carry lat/lon directly; ways/relations carry a computed center (out tags center).
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return { lat, lng };
}

function osmToSpot(el) {
  const coords = elementCoords(el);
  if (!coords) return null; // cannot place it on the map — skip
  const tags = el.tags ?? {};
  const rawName = typeof tags.name === 'string' ? tags.name.trim() : '';
  const named = rawName !== '';

  // type: building=mosque (77% of elements) is the base signal it is a mosque; the name
  // regex splits the small ones out as musala. Unnamed elements are most likely small
  // musala (research: 26/282 central-Yogya elements are unnamed) → 'Musala (tanpa nama)'.
  const name = named ? rawName : 'Musala (tanpa nama)';
  const type = !named || MUSALA_NAME_RE.test(name) ? 'musala' : 'masjid_besar';

  // water: no OSM tag can PROVE which water a spot has (drinking_water is populated on
  // 0% of Indonesian muslim places of worship, toilets 0.4%). Unknown stays null —
  // never guessed (docs/data-model.md §4 honesty limit). water is simply not sent, so
  // the row lands as null and the UI shows 'Belum ada info'.

  // hours: opening_hours is only 3% filled — import when present, else stay null.
  const hours = typeof tags.opening_hours === 'string' && tags.opening_hours.trim() !== ''
    ? tags.opening_hours.trim()
    : null;

  // notes: keep the OSM address hint when OSM has one, clearly labelled as its origin.
  const addr = tags['addr:full'] ?? tags['addr:street'];
  const notes = typeof addr === 'string' && addr.trim() !== ''
    ? `Alamat (OSM): ${addr.trim()}`
    : null;

  const spot = {
    id: stableSpotId('osm', el.type, name, coords),
    name,
    type,
    lat: coords.lat,
    lng: coords.lng,
    status: 'approved',
    source: 'osm',
    // bike_parking: OSM never tags it here → not sent, DB default false.
    // women_friendly: OSM never tags it → not sent, stays null ('belum ada info').
    // last_verified_at / created_at: never sent — re-seeding must not wipe a
    // verification timestamp or an owner correction on an existing row.
    _osmKind: el.type,
    _osmId: el.id,
    _unnamed: !named,
  };
  if (hours !== null) spot.hours = hours;
  if (notes !== null) spot.notes = notes;
  return spot;
}

// Deterministic uuid v5 so re-running the seed upserts the same row instead of
// duplicating it. Same source + element + name + coordinates ⇒ same id.
function stableSpotId(source, osmKind, name, { lat, lng }) {
  const nsBytes = Buffer.from(UUID_NAMESPACE.replace(/-/g, ''), 'hex');
  const key = `${source}:${osmKind}:${name}:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const hash = createHash('sha1').update(nsBytes).update(key, 'utf8').digest();
  hash[6] = (hash[6] & 0x0f) | 0x50; // uuid version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = hash.subarray(0, 16).toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

// ── Dedupe (D5) ──────────────────────────────────────────────────────────────────────

// Normalized-name comparison: lowercase, strip non-alphanumerics (spelling chaos:
// 'As-shidiq' vs 'As Shidiq', 'Musala' vs 'Musholla').
function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function similarNames(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // containment catches 'Masjid Al Islam' vs 'Masjid Al Islam 41'
  return na.length >= 5 && nb.length >= 5 && (na.includes(nb) || nb.includes(na));
}

function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLng = (b.lng - a.lng) * toRad;
  const midLat = ((a.lat + b.lat) / 2) * toRad;
  const x = dLng * Math.cos(midLat);
  return Math.sqrt(x * x + dLat * dLat) * R;
}

// Which duplicate wins: playbook research first, then named way/relation (out center
// is the building outline), then named node, then unnamed (likely the entrance pin).
function priority(spot) {
  if (spot.source === 'playbook') return 0;
  if (!spot._unnamed && spot._osmKind !== 'node') return 1;
  if (!spot._unnamed) return 2;
  return 3;
}

function dedupeSpots(spots) {
  const sorted = [...spots].sort(
    (a, b) => priority(a) - priority(b) || a.name.localeCompare(b.name) || (a._osmId ?? 0) - (b._osmId ?? 0),
  );
  const kept = [];
  let removed = 0;
  for (const spot of sorted) {
    const isDuplicate = kept.some((k) => {
      const d = distanceMeters(k, spot);
      // unnamed node very close to a named spot = the node-on-building duplicate
      if (k._unnamed !== spot._unnamed && d <= DUP_UNNAMED_M) return true;
      if (d <= DUP_DISTANCE_M && similarNames(k.name, spot.name)) return true;
      return false;
    });
    if (isDuplicate) removed++;
    else kept.push(spot);
  }
  return { kept, removed };
}

// ── Supabase upsert (D6) ─────────────────────────────────────────────────────────────

async function upsertToSupabase(rows, supabaseUrl, serviceKey) {
  // PostgREST rejects one request whose objects carry different key sets (PGRST102
  // "All object keys must match"). Our rows intentionally differ: a field is only sent
  // when we actually know it (so a re-seed never wipes a dashboard correction with a
  // guessed value). Fix: strip internal `_`-prefixed dedupe metadata (not table
  // columns), then group rows by their key signature and upsert each group separately.
  const groups = new Map();
  for (const spot of rows) {
    const clean = {};
    for (const [key, value] of Object.entries(spot)) {
      if (!key.startsWith('_')) clean[key] = value;
    }
    const signature = Object.keys(clean).sort().join(',');
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push(clean);
  }

  const BATCH = 200;
  let done = 0;
  for (const [signature, group] of groups) {
    for (let i = 0; i < group.length; i += BATCH) {
      const batch = group.slice(i, i + BATCH);
      const res = await fetch(`${supabaseUrl}/rest/v1/spots?on_conflict=id`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(batch),
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Supabase upsert failed (HTTP ${res.status}): ${text.slice(0, 300)}`);
      }
      done += batch.length;
      console.log(`    upserted ${done}/${rows.length}`);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────────────

const dryRun = process.argv.includes('--dry-run');
const playbookOnly = process.argv.includes('--playbook-only');

console.log(dryRun ? 'Singgah seed — DRY RUN (nothing will be written)' : 'Singgah seed — WRITE MODE');

// The privileged key comes from the environment ONLY — never hardcoded, never committed.
// Check it before any network work so a missing key fails fast. (The service key must
// never touch any frontend file either; this script is the only place it is allowed.)
let supabaseUrl = null;
let serviceKey = null;
if (!dryRun) {
  supabaseUrl = process.env.SUPABASE_URL;
  serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Mode tulis butuh environment variable:');
    if (!supabaseUrl) console.error('- SUPABASE_URL belum diset');
    if (!serviceKey) console.error('- SUPABASE_SERVICE_KEY belum diset');
    console.error('set SUPABASE_SERVICE_KEY di terminal, jangan pernah di file');
    process.exit(1);
  }
}

// D3: read the playbook JSON and print the entry count.
const playbook = readPlaybook();
console.log(`Playbook entries : ${playbook.length}`);
if (playbook.length === 0) {
  console.log('  (kosong — OQ-6: file playbook perjalanan belum ada di repo; D1/D2 menunggu owner)');
}

const playbookSpots = playbook.map(playbookPayload);

// D4: query every bbox.
const osmSpots = [];
const seenElements = new Set(); // the same element can appear in two overlapping windows
for (const bbox of playbookOnly ? [] : BBOXES) {
  process.stdout.write(`Overpass: ${bbox.label} (${bbox.coords}) ... `);
  const elements = await fetchOverpass(bbox);
  let added = 0;
  for (const el of elements) {
    const key = `${el.type}/${el.id}`;
    if (seenElements.has(key)) continue;
    seenElements.add(key);
    const spot = osmToSpot(el);
    if (spot) {
      osmSpots.push(spot);
      added++;
    }
  }
  console.log(`${elements.length} elements → ${added} mappable spots`);
  await sleep(2000); // be polite to the public Overpass API
}

// D5: dedupe by name similarity + proximity (node-on-building duplicates are common).
const { kept, removed } = dedupeSpots([...playbookSpots, ...osmSpots]);

const byType = {};
for (const spot of kept) byType[spot.type] = (byType[spot.type] ?? 0) + 1;
const typeSummary = TYPES.map((t) => `${t}: ${byType[t] ?? 0}`).join(', ');
const osmKept = kept.filter((spot) => spot.source === 'osm').length;
const playbookKept = kept.length - osmKept;

console.log(`OSM raw elements : ${seenElements.size} seen → ${osmSpots.length} mappable`);
console.log(`Dedupe           : removed ${removed} duplicates (name similarity + proximity)`);
console.log(`Type breakdown   : ${typeSummary}`);
console.log(`Total rows       : playbook ${playbookKept} + osm ${osmKept} = ${kept.length}`);

if (playbookOnly) {
  console.log('Mode --playbook-only: Overpass dilewati, hanya spot playbook yang diseed.');
} else if (kept.length < 100) {
  console.warn('Warning: fewer than 100 approved spots (target: >= 100, docs/data-model.md §5).');
}

if (dryRun) {
  console.log('DRY RUN selesai — tidak ada data yang ditulis ke Supabase.');
  process.exit(0);
}

// Real run: upsert with merge-duplicates — re-running the seed updates the same rows.
console.log(`Upserting ${kept.length} rows ke ${supabaseUrl} ...`);
await upsertToSupabase(kept, supabaseUrl, serviceKey);
console.log(`Selesai. ${kept.length} spot tersimpan (playbook ${playbookKept} + osm ${osmKept}).`);
