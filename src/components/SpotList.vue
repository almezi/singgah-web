<!-- src/components/SpotList.vue — daftar kartu spot + pencarian + chip jenis + "Tinjauan saya".
     Lane B (langkah B1–B9). Kontrak beku (docs/api-contract.md §2):
     props { spots (sudah terfilter), query, type, pendingMine, userPos }
     · emits { update:query, update:type, select(spotId) }.
     Komponen ini TIDAK memfilter sendiri — pemfilteran terjadi di useSpots.filteredSpots
     (App.vue), sehingga daftar dan peta selalu berubah bersamaan (B2 + A4). -->

<script setup>
import { isUnknown } from '../lib/supabase';

const props = defineProps({
  spots: { type: Array, default: () => [] },
  query: { type: String, default: '' },
  type: { type: String, default: '' },
  pendingMine: { type: Array, default: () => [] },
  userPos: { type: Object, default: null },
});
const emit = defineEmits(['update:query', 'update:type', 'select']);

// Jenis spot: label Indonesia + kelas tint warna (docs/design-system.md §2 — palet board disetujui)
const TYPES = {
  masjid_besar: { label: 'Masjid Besar', cls: 't-masjid' },
  musala: { label: 'Musala', cls: 't-musala' },
  terminal: { label: 'Terminal', cls: 't-terminal' },
  spbu: { label: 'SPBU', cls: 't-spbu' },
  rest_area: { label: 'Rest Area', cls: 't-rest' },
};

// Glyph per jenis — SVG statis milik desain board (bukan data pengguna; aman untuk v-html)
const TYPE_GLYPHS = {
  masjid_besar:
    '<path d="M12 3C7.6 3 4 6.8 4 11.5V20h16v-8.5C20 6.8 16.4 3 12 3z"/><rect x="2" y="20" width="20" height="2"/>',
  musala: '<path d="M4 21V5l8-3 8 3v16h-5v-6h-6v6H4z"/>',
  terminal:
    '<path fill-rule="evenodd" d="M4 4c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2v2h-2v-2H8v2H6v-2c-1.1 0-2-.9-2-2V4zm2 2v5h12V6H6zm1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm9 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>',
  spbu: '<path d="M12 2s6 6.6 6 11a6 6 0 1 1-12 0c0-4.4 6-11 6-11z"/>',
  rest_area: '<path d="M12 3L2 20h7l3-6 3 6h7L12 3z"/>',
};

// Chip saringan: 'Semua' ('' = semua jenis) + lima jenis (teks: docs/ui-copy.md §2)
const CHIPS = [
  { value: '', label: 'Semua' },
  { value: 'masjid_besar', label: 'Masjid Besar' },
  { value: 'musala', label: 'Musala' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'spbu', label: 'SPBU' },
  { value: 'rest_area', label: 'Rest Area' },
];

// Label nilai kolom `water` (docs/ui-copy.md §3)
const WATER_LABELS = {
  kran_mandi: 'Kran mandi',
  wudhu_only: 'Wudhu saja',
  air_isi: 'Air isi',
  tidak_ada: 'Tidak ada',
};

function typeInfo(spot) {
  return TYPES[spot.type] || null;
}
function typeLabel(spot) {
  const t = typeInfo(spot);
  return t ? t.label : spot.type; // jenis di luar daftar → tampilkan apa adanya, tidak dikarang
}
function typeCls(spot) {
  const t = typeInfo(spot);
  return t ? t.cls : '';
}
function glyph(spot) {
  return TYPE_GLYPHS[spot.type] || '';
}

// B2: chip hanya meng-emit update:type (klik chip aktif lagi → kembali ke Semua)
function pickType(value) {
  const next = value !== '' && props.type === value ? '' : value;
  emit('update:type', next);
}

// B9: jarak haversine dari posisi pengguna — tanpa userPos → kosong (tidak pernah dikarang).
// Format Indonesia: '320 m' atau '1,2 km' (koma desimal, docs/ui-copy.md §2)
function distanceText(spot) {
  if (!props.userPos) return '';
  const rad = Math.PI / 180;
  const dLat = (spot.lat - props.userPos.lat) * rad;
  const dLng = (spot.lng - props.userPos.lng) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(props.userPos.lat * rad) * Math.cos(spot.lat * rad) * Math.sin(dLng / 2) ** 2;
  const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  if (!Number.isFinite(km)) return '';
  return km < 1
    ? Math.round(km * 1000) + ' m'
    : km.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' km';
}

// Waktu relatif verifikasi: 'baru saja' · '2 jam lalu' · '3 hari lalu' (docs/ui-copy.md §1)
function relTime(iso) {
  if (iso === null || iso === undefined || iso === '') return null;
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return 'baru saja';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + ' jam lalu';
  return Math.floor(hours / 24) + ' hari lalu';
}

function hasVerification(spot) {
  return relTime(spot.last_verified_at) !== null;
}

// Pil verifikasi kartu (B1): hijau 'Diverifikasi …' saat ada tanggal, redup 'Belum diverifikasi'
function verifyText(spot) {
  const rel = relTime(spot.last_verified_at);
  return rel ? 'Diverifikasi ' + rel : 'Belum diverifikasi';
}

// Teks mini-chip kartu: nilai kosong SELALU 'Belum ada info' lewat isUnknown()
function waterText(water) {
  return isUnknown(WATER_LABELS[water] ?? water);
}
</script>

<template>
  <div class="spot-list px-3 pt-2 pb-3">
    <!-- Pencarian (B2): hanya emit update:query — pemfilteran terjadi di useSpots (App.vue) -->
    <div class="search-wrap">
      <i class="bi bi-search" aria-hidden="true"></i>
      <label for="spot-search" class="visually-hidden">Cari spot</label>
      <input
        id="spot-search"
        type="search"
        class="form-control"
        placeholder="Cari masjid, musala, SPBU…"
        autocomplete="off"
        :value="query"
        @input="emit('update:query', $event.target.value)"
      />
    </div>

    <!-- Chip jenis (B2): filter bersama dengan peta lewat state useSpots -->
    <div class="d-flex flex-wrap gap-2 mb-2" role="group" aria-label="Saring jenis spot">
      <button
        v-for="chip in CHIPS"
        :key="chip.value"
        type="button"
        class="chip"
        :class="{ active: type === chip.value }"
        :aria-pressed="type === chip.value"
        @click="pickType(chip.value)"
      >
        {{ chip.label }}
      </button>
    </div>

    <p class="list-count mb-2" aria-live="polite">{{ spots.length }} spot</p>

    <!-- Kartu spot (B1 + B9): bentuk kartu mockup telepon; ketuk → emit select(spot.id) -->
    <div class="d-grid gap-2">
      <button
        v-for="spot in spots"
        :key="spot.id"
        type="button"
        class="spot-card"
        @click="emit('select', spot.id)"
      >
        <span class="type-tile" :class="typeCls(spot)">
          <svg viewBox="0 0 24 24" aria-hidden="true" v-html="glyph(spot)"></svg>
        </span>
        <span class="flex-grow-1">
          <span class="spot-name d-block">{{ spot.name }}</span>
          <span class="spot-meta d-block">
            {{ typeLabel(spot) }}{{ distanceText(spot) ? ' · ' + distanceText(spot) : '' }}
          </span>
          <span class="mini-chip">
            <i class="bi bi-droplet" aria-hidden="true"></i>{{ waterText(spot.water) }}
          </span>
          <span class="mini-chip">
            <i class="bi bi-clock" aria-hidden="true"></i>{{ isUnknown(spot.hours) }}
          </span>
          <span class="mini-chip">
            <i class="bi bi-bicycle" aria-hidden="true"></i>{{ spot.bike_parking ? 'Ya' : 'Tidak' }}
          </span>
        </span>
        <span class="v-pill" :class="{ unknown: !hasVerification(spot) }">
          {{ verifyText(spot) }}
        </span>
      </button>

      <p v-if="!spots.length" class="empty-line py-3">
        Tidak ada spot yang cocok. Coba kata lain atau pilih Semua.
      </p>
    </div>

    <!-- B6: "Tinjauan saya" — spot PENDING milik pengguna, bagian terpisah (redup) dan
         TIDAK PERNAH bercampur dengan daftar publik di atas -->
    <section v-if="pendingMine.length" class="my-reviews" aria-label="Tinjauan saya">
      <h2>Tinjauan saya</h2>
      <p class="reviews-tagline">Spot ini menunggu tinjauan. Belum tampil di peta.</p>
      <div class="d-grid gap-2">
        <article v-for="spot in pendingMine" :key="spot.id" class="pending-card">
          <div class="d-flex align-items-start gap-2">
            <span class="type-tile" :class="typeCls(spot)">
              <svg viewBox="0 0 24 24" aria-hidden="true" v-html="glyph(spot)"></svg>
            </span>
            <div>
              <div class="spot-name">{{ spot.name }}</div>
              <div class="spot-meta mb-0">{{ typeLabel(spot) }}</div>
            </div>
            <span class="pending-badge ms-auto">Menunggu tinjauan</span>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Token tampilan komponen (docs/design-system.md §1 — palet board disetujui; gelap §6) */
.spot-list {
  --sg-line: #e4dfd2;
  --sg-surface: #ffffff;
  --sg-surface-2: #f1efe6;
  --sg-ink: #12332c;
  --sg-ink2: #5a6e67;
  --sg-primary: #0e7c66;
  --sg-on-primary: #ffffff;
  --sg-success-soft: #dcf3e2;
  --sg-success-ink: #166534;
  --sg-amber-soft: #fbeeda;
  --sg-amber-ink: #92400e;
}
[data-bs-theme='dark'] .spot-list {
  --sg-line: #2a3f36;
  --sg-surface: #16241f;
  --sg-surface-2: #1c2e27;
  --sg-ink: #e8f2ed;
  --sg-ink2: #9db5ab;
  --sg-primary: #3dbfa3;
  --sg-on-primary: #06231c;
  --sg-success-soft: #152e1e;
  --sg-success-ink: #7cc79b;
  --sg-amber-soft: #2e2410;
  --sg-amber-ink: #e3b566;
}

/* Tint per jenis spot (docs/design-system.md §2) — warna tidak pernah jadi satu-satunya isyarat */
.t-masjid { --t: #0e7c66; --ti: #0b5d4e; --ts: #ddeee8; }
.t-musala { --t: #9333ea; --ti: #7e22ce; --ts: #f1e6fb; }
.t-terminal { --t: #b45309; --ti: #92400e; --ts: #fbeeda; }
.t-spbu { --t: #0e7490; --ti: #0e7490; --ts: #dcf0f5; }
.t-rest { --t: #15803d; --ti: #166534; --ts: #dcf3e2; }
[data-bs-theme='dark'] .t-masjid { --ti: #5fd4bc; --ts: #17332b; }
[data-bs-theme='dark'] .t-musala { --ti: #c9a0f0; --ts: #2a1a3e; }
[data-bs-theme='dark'] .t-terminal { --ti: #e3b566; --ts: #2e2410; }
[data-bs-theme='dark'] .t-spbu { --ti: #6fc3d8; --ts: #12303a; }
[data-bs-theme='dark'] .t-rest { --ti: #7cc79b; --ts: #152e1e; }

/* Pencarian */
.search-wrap { position: relative; margin-top: 6px; margin-bottom: 10px; }
.search-wrap .bi-search {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: var(--sg-ink2);
}
.search-wrap .form-control {
  padding-left: 40px; min-height: 46px; border-radius: 999px;
  background: var(--sg-surface-2); border-color: var(--sg-line); color: var(--sg-ink);
}
.search-wrap .form-control::placeholder { color: var(--sg-ink2); }
.search-wrap .form-control:focus {
  background: var(--sg-surface-2); border-color: var(--sg-primary); color: var(--sg-ink);
  box-shadow: 0 0 0 0.2rem rgba(14, 124, 102, 0.25);
}

/* Chip jenis: target sentuh ≥ 44px (docs/design-system.md §5) */
.chip {
  border: 1px solid var(--sg-line); background: var(--sg-surface); color: var(--sg-ink2);
  border-radius: 999px; min-height: 44px; padding: 0 16px; font-size: 0.85rem; font-weight: 600;
}
.chip:hover { background: var(--sg-surface-2); color: var(--sg-ink); }
.chip.active { background: var(--sg-primary); border-color: var(--sg-primary); color: var(--sg-on-primary); }

.list-count { font-size: 0.78rem; color: var(--sg-ink2); }

/* Kartu spot */
.spot-card {
  width: 100%; text-align: start; background: var(--sg-surface); border: 1px solid var(--sg-line);
  border-radius: 16px; padding: 12px; display: flex; gap: 12px; align-items: flex-start;
  cursor: pointer; color: var(--sg-ink);
}
.spot-card:hover { background: var(--sg-surface-2); color: var(--sg-ink); }
.type-tile {
  flex: 0 0 auto; width: 42px; height: 42px; border-radius: 12px; background: var(--ts);
  color: var(--ti); display: flex; align-items: center; justify-content: center;
}
.type-tile svg { width: 22px; height: 22px; fill: currentColor; }
.spot-name { font-weight: 600; font-size: 0.95rem; margin: 0; }
.spot-meta { font-size: 0.78rem; color: var(--sg-ink2); margin: 2px 0 6px; }
.mini-chip {
  display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; font-weight: 600;
  background: var(--sg-surface-2); color: var(--sg-ink2); border-radius: 99px;
  padding: 3px 8px; margin-right: 4px;
}
.v-pill {
  flex: 0 0 auto; font-size: 0.72rem; font-weight: 700; border-radius: 99px; padding: 4px 10px;
  background: var(--sg-success-soft); color: var(--sg-success-ink); white-space: nowrap;
}
.v-pill.unknown { background: var(--sg-surface-2); color: var(--sg-ink2); }

.empty-line { font-size: 0.85rem; color: var(--sg-ink2); }

/* B6: "Tinjauan saya" — bagian redup, terpisah dari daftar publik */
.my-reviews { margin-top: 18px; }
.my-reviews h2 { font-size: 0.85rem; font-weight: 700; color: var(--sg-ink2); margin: 0 0 2px; }
.reviews-tagline { font-size: 0.78rem; color: var(--sg-ink2); margin-bottom: 8px; }
.pending-card {
  border: 1.5px dashed var(--sg-line); border-radius: 16px; padding: 12px;
  background: var(--sg-surface); opacity: 0.85; color: var(--sg-ink);
}
.pending-badge {
  font-size: 0.72rem; font-weight: 700; border-radius: 99px; padding: 4px 10px;
  background: var(--sg-amber-soft); color: var(--sg-amber-ink); white-space: nowrap;
}
</style>
