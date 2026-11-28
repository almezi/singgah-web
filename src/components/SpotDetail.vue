<!-- src/components/SpotDetail.vue — kartu rincian spot: atribut, catatan etiket, verifikasi, Rute.
     Lane B (langkah B3–B8). Kontrak beku (docs/api-contract.md §2):
     props { spot } · emits { close, verify(spotId) }.
     Tidak memanggil Supabase langsung: tulisan verifikasi lewat emit `verify` (parent yang
     menulis lewat useSpots.markVerified), lalu komponen dirender ulang dari prop. -->

<script setup>
import { computed } from 'vue';
import { SPOT_TYPES, TYPE_GLYPHS, WATER_LABELS, isUnknown, verifyText } from '../lib/spotView';

const props = defineProps({
  spot: { type: Object, default: null },
});
const emit = defineEmits(['close', 'verify']);

// B8: real build persists verification via the rate-limited write path — the bump_verified
// Postgres function (security definer, 1 bump per spot per hour, decided at G3, 2026-11-09).
// This component only emits verify(spot.id) and re-renders the line from the prop.
// Toast dimiliki App.vue (review 2026-11-15): sukses saat resolve, gagal saat catch.
function onVerify() {
  emit('verify', props.spot.id);
}

// Cermin semantik isUnknown() untuk keputusan gaya (isBlank = null/undefined/'')
function isBlank(v) {
  return v === null || v === undefined || v === '';
}

const typeInfo = computed(() => SPOT_TYPES[props.spot.type] || null);
const typeLabel = computed(() => (typeInfo.value ? typeInfo.value.label : props.spot.type));
const glyph = computed(() => TYPE_GLYPHS[props.spot.type] || '');

// B3: setiap nilai lewat isUnknown() — kosong SELALU 'Belum ada info', tidak pernah dikarang
const waterValue = computed(() => isUnknown(WATER_LABELS[props.spot.water] ?? props.spot.water));
const hoursValue = computed(() => isUnknown(props.spot.hours));
// bike_parking boolean: true → 'Ya', false → 'Tidak' (kontrak: tidak pernah null)
const bikeValue = computed(() => (props.spot.bike_parking ? 'Ya' : 'Tidak'));
// women_friendly: true → 'Ya', false → 'Tidak', null → 'Belum ada info'
const womenValue = computed(() =>
  props.spot.women_friendly === true
    ? 'Ya'
    : props.spot.women_friendly === false
      ? 'Tidak'
      : isUnknown(props.spot.women_friendly),
);
// B4: catatan terisi → kotak amber; kosong → baris 'Catatan' + 'Belum ada info'
const hasNotes = computed(() => !isBlank(props.spot.notes));
const notesValue = computed(() => isUnknown(props.spot.notes));

// B4: garis verifikasi — 'Diverifikasi …' saat ada tanggal, 'Belum diverifikasi' saat kosong
// (logika waktu relatif hidup di modul bersama src/lib/spotView.js)
const verifyLine = computed(() => verifyText(props.spot.last_verified_at));

// B5: Rute memakai koordinat milik baris ini sendiri (spot.lat / spot.lng)
const routeUrl = computed(
  () => 'https://www.google.com/maps/dir/?api=1&destination=' + props.spot.lat + ',' + props.spot.lng,
);
</script>

<template>
  <div v-if="spot" class="spot-detail-wrap position-absolute bottom-0 start-0 end-0 px-3 pb-3">
    <article
      class="spot-detail"
      role="dialog"
      aria-labelledby="spot-detail-title"
      tabindex="-1"
    >
      <button type="button" class="close-btn" aria-label="Tutup" @click="emit('close')">
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>

      <header class="detail-header">
        <span class="type-tile" :class="typeInfo ? typeInfo.cls : ''">
          <svg viewBox="0 0 24 24" aria-hidden="true" v-html="glyph"></svg>
        </span>
        <div class="detail-heading">
          <span class="spot-type">{{ typeLabel }}</span>
          <h2 id="spot-detail-title" class="spot-name">{{ spot.name }}</h2>
        </div>
      </header>

      <section class="detail-grid" aria-label="Informasi spot">
        <div class="detail-item">
          <span class="detail-item__icon"><i class="bi bi-droplet" aria-hidden="true"></i></span>
          <span class="detail-item__copy">
            <span class="detail-label">Air</span>
            <span :class="{ 'unknown-value': isBlank(spot.water) }">{{ waterValue }}</span>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-item__icon"><i class="bi bi-clock" aria-hidden="true"></i></span>
          <span class="detail-item__copy">
            <span class="detail-label">Jam</span>
            <span :class="{ 'unknown-value': isBlank(spot.hours) }">{{ hoursValue }}</span>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-item__icon"><i class="bi bi-bicycle" aria-hidden="true"></i></span>
          <span class="detail-item__copy">
            <span class="detail-label">Parkir sepeda</span>
            <span>{{ bikeValue }}</span>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-item__icon"><i class="bi bi-gender-female" aria-hidden="true"></i></span>
          <span class="detail-item__copy">
            <span class="detail-label">Ramah perempuan</span>
            <span :class="{ 'unknown-value': isBlank(spot.women_friendly) }">{{ womenValue }}</span>
          </span>
        </div>
      </section>

      <div class="note-box" :class="{ 'is-empty': !hasNotes }">
        <i :class="hasNotes ? 'bi bi-info-circle' : 'bi bi-journal-text'" aria-hidden="true"></i>
        <span class="detail-item__copy">
          <span class="detail-label">Catatan</span>
          <span>{{ notesValue }}</span>
        </span>
      </div>

      <div class="verify-panel">
        <span class="verify-panel__icon"><i class="bi bi-shield-check" aria-hidden="true"></i></span>
        <span>
          <span class="detail-label">Status spot</span>
          <span class="verify-line">{{ verifyLine }}</span>
        </span>
      </div>

      <div class="detail-actions">
        <button type="button" class="btn btn-outline-success" @click="onVerify">
          <i class="bi bi-shield-check" aria-hidden="true"></i> Masih ada ✓
        </button>
        <a
          class="btn btn-primary"
          :href="routeUrl"
          target="_blank"
          rel="noopener"
          aria-label="Buka rute di tab baru"
        >
          <i class="bi bi-signpost-split" aria-hidden="true"></i> Rute
        </a>
      </div>
    </article>
  </div>
</template>

<style scoped>
/* Token tampilan komponen (docs/design-system.md §1 — palet board disetujui; gelap §6) */
.spot-detail {
  --sg-line: #e4dfd2;
  --sg-surface: #ffffff;
  --sg-surface-2: #f1efe6;
  --sg-ink: #12332c;
  --sg-ink2: #5a6e67;
  --sg-amber-soft: #fbeeda;
  --sg-amber-ink: #92400e;
}
[data-bs-theme='dark'] .spot-detail {
  --sg-line: #2a3f36;
  --sg-surface: #16241f;
  --sg-surface-2: #1c2e27;
  --sg-ink: #e8f2ed;
  --sg-ink2: #9db5ab;
  --sg-amber-soft: #2e2410;
  --sg-amber-ink: #e3b566;
}

/* Tint per jenis spot (docs/design-system.md §2) */
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

/* Pembungkus: klik tembus di area kosong agar peta tetap terpakai */
.spot-detail-wrap { z-index: 1000; pointer-events: none; }

/* Kartu rincian */
.spot-detail {
  pointer-events: auto;
  position: relative;
  max-width: 480px;
  margin: 0 auto;
  max-height: 75dvh;
  overflow-y: auto;
  background: var(--sg-surface);
  border: 1px solid var(--sg-line);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(18, 51, 44, 0.14);
  color: var(--sg-ink);
}

/* Tombol tutup (X): target sentuh ≥ 44px */
.close-btn {
  position: absolute; top: 8px; right: 8px;
  width: 44px; height: 44px;
  border: 0; background: transparent; border-radius: 12px;
  color: var(--sg-ink2); display: flex; align-items: center; justify-content: center;
}
.close-btn:hover { background: var(--sg-surface-2); color: var(--sg-ink); }

.type-tile {
  flex: 0 0 auto; width: 42px; height: 42px; border-radius: 12px; background: var(--ts);
  color: var(--ti); display: flex; align-items: center; justify-content: center;
}
.type-tile svg { width: 22px; height: 22px; fill: currentColor; }
.spot-name { font-weight: 600; margin: 0; }
.spot-meta { font-size: 0.78rem; color: var(--sg-ink2); margin: 2px 0 6px; }

.attr-badge {
  display: inline-flex; align-items: center; gap: 5px; background: var(--ts); color: var(--ti);
  border-radius: 99px; padding: 6px 12px; font-size: 0.78rem; font-weight: 700;
}

/* Baris atribut: label kiri, nilai kanan */
.attr-row {
  display: flex; align-items: flex-start; gap: 10px; padding: 10px 0;
  border-bottom: 1px solid var(--sg-line); font-size: 0.9rem;
}
.attr-row .bi { color: var(--sg-ink2); margin-top: 2px; }
.attr-row .label { flex: 0 0 132px; color: var(--sg-ink2); }
.unknown-value { color: var(--sg-ink2); }

/* B4: kotak catatan etiket amber */
.note-box {
  background: var(--sg-amber-soft); color: var(--sg-amber-ink); border-radius: 12px;
  padding: 12px; display: flex; gap: 8px; font-size: 0.88rem; margin-top: 12px;
}
.note-box .bi { flex: 0 0 auto; margin-top: 2px; }

.verify-line { font-size: 0.82rem; color: var(--sg-ink2); margin: 12px 0; }

/* Target sentuh tombol ≥ 44px (docs/design-system.md §5) */
.spot-detail .btn { min-height: 44px; font-weight: 600; }

/* Modern retouch: integrated detail panel with concise, non-duplicated information. */
.spot-detail {
  --sg-line: var(--singgah-line);
  --sg-surface: var(--singgah-card);
  --sg-surface-2: var(--singgah-surface-2);
  --sg-ink: var(--singgah-ink);
  --sg-ink2: var(--singgah-muted);
  padding: 20px;
  overflow-y: auto;
  color: var(--sg-ink);
}
.spot-detail:focus {
  outline: none;
}
.detail-header {
  display: flex;
  align-items: center;
  gap: 13px;
  min-height: 58px;
  margin: 0 48px 20px 0;
}
.detail-heading {
  min-width: 0;
}
.spot-detail .type-tile {
  width: 50px;
  height: 50px;
  border-radius: 15px;
}
.spot-detail .type-tile svg {
  width: 25px;
  height: 25px;
}
.spot-type {
  display: block;
  margin-bottom: 3px;
  color: var(--sg-ink2);
  font-size: 0.72rem;
  font-weight: 700;
}
.spot-detail .spot-name {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.035em;
}
.close-btn {
  top: 14px;
  right: 14px;
  border: 1px solid transparent;
  border-radius: 13px;
}
.close-btn:hover {
  border-color: var(--sg-line);
}
.close-btn:focus-visible {
  outline: 3px solid var(--bs-focus-ring-color);
  outline-offset: 2px;
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.detail-item {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 72px;
  padding: 12px;
  border: 1px solid var(--sg-line);
  border-radius: 15px;
  background: var(--sg-surface-2);
}
.detail-item__icon,
.verify-panel__icon {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  color: var(--singgah-teal);
  background: var(--singgah-primary-soft);
}
.detail-item__copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.82rem;
  font-weight: 650;
  overflow-wrap: anywhere;
}
.detail-label {
  display: block;
  color: var(--sg-ink2);
  font-size: 0.69rem;
  font-weight: 650;
  line-height: 1.35;
}
.unknown-value {
  color: var(--sg-ink2);
  font-weight: 550;
}
.note-box {
  min-height: 66px;
  margin: 0 0 12px;
  padding: 13px 14px;
  border: 1px solid rgba(146, 64, 14, 0.22);
  border-radius: 15px;
  align-items: flex-start;
}
.note-box.is-empty {
  color: var(--sg-ink2);
  background: var(--sg-surface-2);
  border-color: var(--sg-line);
}
.verify-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 10px 12px;
  margin-bottom: 14px;
  border: 1px solid var(--sg-line);
  border-radius: 15px;
  background: var(--sg-surface);
}
.verify-line {
  display: block;
  margin: 2px 0 0;
  color: var(--sg-ink);
  font-size: 0.8rem;
  font-weight: 650;
}
.detail-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.detail-actions .btn {
  min-width: 0;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-radius: 13px;
  font-size: 0.84rem;
}

@media (max-width: 359.98px) {
  .detail-grid,
  .detail-actions {
    grid-template-columns: 1fr;
  }
}
</style>
