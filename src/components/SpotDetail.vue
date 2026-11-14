<!-- src/components/SpotDetail.vue — kartu rincian spot: atribut, catatan etiket, verifikasi, Rute.
     Lane B (langkah B3–B8). Kontrak beku (docs/api-contract.md §2):
     props { spot } · emits { close, verify(spotId) }.
     Tidak memanggil Supabase langsung: tulisan verifikasi lewat emit `verify` (parent yang
     menulis lewat useSpots.markVerified), lalu komponen dirender ulang dari prop. -->

<script setup>
import { computed } from 'vue';
import { isUnknown } from '../lib/supabase';
import { showToast } from '../lib/toast';

const props = defineProps({
  spot: { type: Object, default: null },
});
const emit = defineEmits(['close', 'verify']);

// B8: real build persists verification via the rate-limited write path — the bump_verified
// Postgres function (security definer, 1 bump per spot per hour, decided at G3, 2026-11-09).
// This component only emits verify(spot.id) and re-renders the line from the prop.
function onVerify() {
  emit('verify', props.spot.id);
  showToast('Terima kasih! Verifikasi tercatat.');
}

// Jenis spot: label + kelas tint warna (docs/design-system.md §2 — palet board disetujui)
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

// Label nilai kolom `water` (docs/ui-copy.md §3)
const WATER_LABELS = {
  kran_mandi: 'Kran mandi',
  wudhu_only: 'Wudhu saja',
  air_isi: 'Air isi',
  tidak_ada: 'Tidak ada',
};

// Cermin semantik isUnknown() untuk keputusan gaya (isBlank = null/undefined/'')
function isBlank(v) {
  return v === null || v === undefined || v === '';
}

const typeInfo = computed(() => TYPES[props.spot.type] || null);
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
const verifiedRel = computed(() => {
  const iso = props.spot.last_verified_at;
  if (isBlank(iso)) return null;
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return 'baru saja';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + ' jam lalu';
  return Math.floor(hours / 24) + ' hari lalu';
});
const verifyLine = computed(() =>
  verifiedRel.value ? 'Diverifikasi ' + verifiedRel.value : 'Belum diverifikasi',
);

// B5: Rute memakai koordinat milik baris ini sendiri (spot.lat / spot.lng)
const routeUrl = computed(
  () => 'https://www.google.com/maps/dir/?api=1&destination=' + props.spot.lat + ',' + props.spot.lng,
);
</script>

<template>
  <!-- Panel melayang di atas peta; posisi akhir per layar dirapikan integrator (Wave 4, I3) -->
  <div v-if="spot" class="spot-detail-wrap position-absolute bottom-0 start-0 end-0 px-3 pb-3">
    <article class="spot-detail" role="dialog" aria-label="Rincian spot">
      <button type="button" class="close-btn" aria-label="Tutup" @click="emit('close')">
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>

      <!-- Kepala: tile jenis berwarna + nama + label jenis teks (bukan isyarat warna saja) -->
      <div class="d-flex align-items-start gap-3 mb-2 me-5">
        <span class="type-tile" :class="typeInfo ? typeInfo.cls : ''">
          <svg viewBox="0 0 24 24" aria-hidden="true" v-html="glyph"></svg>
        </span>
        <div>
          <h2 class="spot-name fs-5">{{ spot.name }}</h2>
          <div class="spot-meta">{{ typeLabel }}</div>
        </div>
      </div>

      <!-- Badge atribut ringkas (bentuk kartu mockup telepon) -->
      <div class="d-flex flex-wrap gap-2 mb-2">
        <span class="attr-badge" :class="typeInfo ? typeInfo.cls : ''">
          <i class="bi bi-droplet" aria-hidden="true"></i>{{ waterValue }}
        </span>
        <span class="attr-badge" :class="typeInfo ? typeInfo.cls : ''">
          <i class="bi bi-clock" aria-hidden="true"></i>{{ hoursValue }}
        </span>
        <span class="attr-badge" :class="typeInfo ? typeInfo.cls : ''">
          <i class="bi bi-bicycle" aria-hidden="true"></i>{{ bikeValue }}
        </span>
      </div>

      <!-- B3: baris atribut (label: docs/ui-copy.md §2) — nilai kosong selalu 'Belum ada info' -->
      <div class="attr-row">
        <i class="bi bi-droplet" aria-hidden="true"></i>
        <span class="label">Air</span>
        <span :class="{ 'unknown-value': isBlank(spot.water) }">{{ waterValue }}</span>
      </div>
      <div class="attr-row">
        <i class="bi bi-clock" aria-hidden="true"></i>
        <span class="label">Jam</span>
        <span :class="{ 'unknown-value': isBlank(spot.hours) }">{{ hoursValue }}</span>
      </div>
      <div class="attr-row">
        <i class="bi bi-bicycle" aria-hidden="true"></i>
        <span class="label">Parkir sepeda</span>
        <span>{{ bikeValue }}</span>
      </div>
      <div class="attr-row">
        <i class="bi bi-gender-female" aria-hidden="true"></i>
        <span class="label">Ramah perempuan</span>
        <span :class="{ 'unknown-value': isBlank(spot.women_friendly) }">{{ womenValue }}</span>
      </div>

      <!-- B4: catatan etiket dalam kotak amber (docs/design-system.md token amber) -->
      <div v-if="hasNotes" class="note-box">
        <i class="bi bi-info-circle" aria-hidden="true"></i>
        <span>{{ notesValue }}</span>
      </div>
      <div v-else class="attr-row">
        <i class="bi bi-journal-text" aria-hidden="true"></i>
        <span class="label">Catatan</span>
        <span class="unknown-value">{{ notesValue }}</span>
      </div>

      <div class="verify-line">{{ verifyLine }}</div>

      <div class="d-flex flex-wrap gap-2">
        <!-- B7: hanya emit verify(spot.id) — parent yang menulis, komponen merender dari prop -->
        <button type="button" class="btn btn-outline-success" @click="onVerify">
          <i class="bi bi-shield-check" aria-hidden="true"></i> Masih ada ✓
        </button>
        <!-- B5: buka Google Maps direction pakai koordinat baris ini sendiri -->
        <a class="btn btn-primary" :href="routeUrl" target="_blank" rel="noopener">
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
</style>
