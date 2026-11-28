<!-- src/components/SpotList.vue — daftar kartu spot + pencarian + chip jenis + "Tinjauan saya".
     Lane B (langkah B1–B9). Kontrak beku (docs/api-contract.md §2):
     props { spots (sudah terfilter), query, type, pendingMine, userPos }
     · emits { update:query, update:type, select(spotId) }.
     Komponen ini TIDAK memfilter sendiri — pemfilteran terjadi di useSpots.filteredSpots
     (App.vue), sehingga daftar dan peta selalu berubah bersamaan (B2 + A4). -->

<script setup>
import { computed, ref, watch } from 'vue';
import {
  SPOT_TYPES,
  TYPE_CHIPS,
  TYPE_GLYPHS,
  WATER_LABELS,
  isUnknown,
  relTime,
  verifyText as verifyTextIso,
} from '../lib/spotView';

const props = defineProps({
  spots: { type: Array, default: () => [] },
  query: { type: String, default: '' },
  type: { type: String, default: '' },
  pendingMine: { type: Array, default: () => [] },
  userPos: { type: Object, default: null },
});
const emit = defineEmits(['update:query', 'update:type', 'select']);

// Chip saringan dari modul kanonik: 'Semua' ('' = semua jenis) + lima jenis (spotView.js)
const CHIPS = TYPE_CHIPS;

function typeInfo(spot) {
  return SPOT_TYPES[spot.type] || null;
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

// Waktu relatif verifikasi ('baru saja' · '2 jam lalu' · '3 hari lalu') hidup di
// modul bersama src/lib/spotView.js — komponen ini hanya membungkusnya per spot.
function hasVerification(spot) {
  return relTime(spot.last_verified_at) !== null;
}

// Pil verifikasi kartu (B1): hijau 'Diverifikasi …' saat ada tanggal, redup 'Belum diverifikasi'
function verifyText(spot) {
  return verifyTextIso(spot.last_verified_at);
}

// Teks mini-chip kartu: nilai kosong SELALU 'Belum ada info' lewat isUnknown()
function waterText(water) {
  return isUnknown(WATER_LABELS[water] ?? water);
}

// Review 2026-11-15: 7.173 kartu ≈ 100k node DOM terlalu berat untuk ponsel — render bertahap.
// Mulai 50 kartu; tombol 'Tampilkan 50 lagi' memunculkan 50 berikutnya sampai semua tampil.
// Baris hitungan di atas tetap menampilkan jumlah LENGKAP (spots.length), bukan yang tampil.
const shownCount = ref(50);
const visibleSpots = computed(() => props.spots.slice(0, shownCount.value));
function showMore() {
  shownCount.value += 50;
}
// Daftar/pencarian/jenis berubah → kembali ke 50 kartu pertama
watch([() => props.spots, () => props.query, () => props.type], () => {
  shownCount.value = 50;
});
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

    <div class="list-summary">
      <p class="list-count" aria-live="polite">{{ spots.length.toLocaleString('id-ID') }} spot</p>
      <span class="list-summary__line" aria-hidden="true"></span>
    </div>

    <!-- Kartu spot (B1 + B9): bentuk kartu mockup telepon; ketuk → emit select(spot.id).
         Render bertahap: hanya visibleSpots (50 pertama, +50 per klik) yang dirender. -->
    <div class="d-grid gap-2">
      <button
        v-for="spot in visibleSpots"
        :key="spot.id"
        type="button"
        class="spot-card"
        @click="emit('select', spot.id)"
      >
        <span class="type-tile" :class="typeCls(spot)">
          <svg viewBox="0 0 24 24" aria-hidden="true" v-html="glyph(spot)"></svg>
        </span>
        <span class="spot-card__body">
          <span class="spot-card__title-row">
            <span class="spot-name">{{ spot.name }}</span>
            <span v-if="distanceText(spot)" class="spot-distance">{{ distanceText(spot) }}</span>
          </span>
          <span class="spot-meta">{{ typeLabel(spot) }}</span>
          <span class="spot-facts">
            <span class="spot-fact">
              <i class="bi bi-droplet" aria-hidden="true"></i>{{ waterText(spot.water) }}
            </span>
            <span class="spot-fact">
              <i class="bi bi-clock" aria-hidden="true"></i>{{ isUnknown(spot.hours) }}
            </span>
            <span class="spot-fact">
              <i class="bi bi-bicycle" aria-hidden="true"></i>{{ spot.bike_parking ? 'Ya' : 'Tidak' }}
            </span>
          </span>
          <span class="v-pill" :class="{ unknown: !hasVerification(spot) }">
            <i
              class="bi"
              :class="hasVerification(spot) ? 'bi-shield-check' : 'bi-clock'"
              aria-hidden="true"
            ></i>
            {{ verifyText(spot) }}
          </span>
        </span>
        <span class="spot-card__chevron" aria-hidden="true">›</span>
      </button>

      <!-- Review 2026-11-15: render bertahap — muncul hanya saat masih ada kartu tersembunyi -->
      <button
        v-if="shownCount < spots.length"
        type="button"
        class="chip"
        @click="showMore"
      >
        Tampilkan 50 lagi
      </button>

      <p v-if="!spots.length" class="empty-line py-3">
        <i class="bi bi-map" aria-hidden="true"></i>
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

/* Modern retouch: calmer controls, clearer card hierarchy, and one shared token source. */
.spot-list {
  --sg-line: var(--singgah-line);
  --sg-surface: var(--singgah-card);
  --sg-surface-2: var(--singgah-surface-2);
  --sg-ink: var(--singgah-ink);
  --sg-ink2: var(--singgah-muted);
  --sg-primary: var(--singgah-teal);
  padding: 12px 16px 24px !important;
}

.search-wrap {
  margin: 0 0 12px;
}
.search-wrap .bi-search {
  left: 16px;
  font-size: 1rem;
}
.search-wrap .form-control {
  min-height: 50px;
  padding-left: 46px;
  padding-right: 16px;
  border-radius: 15px;
  border-color: transparent;
  background: var(--sg-surface-2);
  font-size: 0.9rem;
}
.search-wrap .form-control:hover {
  border-color: var(--sg-line);
}
.search-wrap .form-control:focus {
  background: var(--sg-surface);
}

.chip {
  min-height: 42px;
  padding: 0 15px;
  border-color: var(--sg-line);
  font-size: 0.8rem;
  letter-spacing: -0.01em;
}
.chip.active {
  box-shadow: 0 7px 18px rgba(14, 124, 102, 0.2);
}
.chip:focus-visible,
.spot-card:focus-visible {
  outline: 3px solid var(--bs-focus-ring-color);
  outline-offset: 2px;
}

.list-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0 10px;
}
.list-count {
  margin: 0;
  color: var(--sg-ink2);
  font-size: 0.76rem;
  font-weight: 650;
  white-space: nowrap;
}
.list-summary__line {
  height: 1px;
  flex: 1;
  background: var(--sg-line);
}

.spot-card {
  position: relative;
  min-height: 132px;
  padding: 14px;
  gap: 12px;
  overflow: hidden;
  border-color: var(--sg-line);
  border-radius: 18px;
  background: var(--sg-surface);
  box-shadow: 0 3px 14px rgba(18, 51, 44, 0.045);
}
.spot-card:hover {
  background: var(--sg-surface);
  border-color: rgba(14, 124, 102, 0.4);
  box-shadow: var(--singgah-shadow-soft);
  transform: translateY(-1px);
}
.spot-card:active {
  transform: translateY(0);
}
.type-tile {
  width: 46px;
  height: 46px;
  border-radius: 14px;
}
.type-tile svg {
  width: 23px;
  height: 23px;
}
.spot-card__body {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.spot-card__title-row {
  width: 100%;
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-right: 22px;
}
.spot-name {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 0.95rem;
  font-weight: 750;
  line-height: 1.3;
  letter-spacing: -0.02em;
}
.spot-distance {
  margin-left: auto;
  color: var(--sg-ink2);
  font-size: 0.72rem;
  font-weight: 650;
  white-space: nowrap;
}
.spot-meta {
  margin: 3px 0 10px;
  font-size: 0.75rem;
}
.spot-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 12px;
  margin-bottom: 10px;
}
.spot-fact {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--sg-ink2);
  font-size: 0.7rem;
  line-height: 1.3;
}
.spot-fact .bi {
  color: var(--sg-primary);
}
.v-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  font-size: 0.68rem;
}
.spot-card__chevron {
  position: absolute;
  top: 11px;
  right: 14px;
  color: var(--sg-ink2);
  font-size: 1.35rem;
  font-weight: 400;
  line-height: 1;
}
.empty-line {
  margin: 0;
  padding: 24px 16px !important;
  text-align: center;
  border: 1px dashed var(--sg-line);
  border-radius: 18px;
  background: var(--sg-surface-2);
}
.my-reviews {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--sg-line);
}
.pending-card {
  padding: 14px;
  border-radius: 18px;
  opacity: 1;
}

@media (max-width: 575.98px) {
  .spot-list > [role='group'] {
    flex-wrap: nowrap !important;
    overflow-x: auto;
    margin-left: -16px;
    margin-right: -16px;
    padding: 0 16px 5px;
    scrollbar-width: none;
  }
  .spot-list > [role='group']::-webkit-scrollbar {
    display: none;
  }
  .chip {
    flex: 0 0 auto;
  }
}
</style>
