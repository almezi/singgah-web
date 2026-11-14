<!--
  src/App.vue — kerangka aplikasi + integrasi (Wave 4, langkah I1–I3).
  Dua panel di desktop (G4), bottom sheet di ponsel. Memasang 5 components dan
  menyambungkan props turun / events naik sesuai kontrak (docs/api-contract.md §2).
  Alur tambah: FAB "+ Tambah" → ketuk peta (pin, lane A) → banner + offcanvas form
  (lane C) → sukses → kembali ke peta.
-->

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useSpots } from './composables/useSpots';
import { useGeolocation } from './composables/useGeolocation';
import { showToast } from './lib/toast';
import DarkModeToggle from './components/DarkModeToggle.vue';
import MapPane from './components/MapPane.vue';
import SpotList from './components/SpotList.vue';
import SpotDetail from './components/SpotDetail.vue';
import AddSpotSheet from './components/AddSpotSheet.vue';

// Satu sumber kebenaran state (kontrak: docs/api-contract.md §6)
const { spots, pendingMine, query, type, filteredSpots, load, addPending, markVerified } =
  useSpots();
const { position: userPos } = useGeolocation();

// Detail: spot yang sedang dibuka (dari kartu maupun penanda)
const selectedId = ref(null);
const selectedSpot = computed(() => spots.value.find((s) => s.id === selectedId.value) || null);

// Alur tambah spot (I2): FAB → pin → form → sukses → kembali
const addActive = ref(false);
const pin = ref(null);
// submitState: 'idle' | 'pending' | 'success' | 'error' — diteruskan ke AddSpotSheet
// agar layar sukses JUJUR: hanya tampil setelah database benar-benar berkata ya
// (umpan balik owner: sukses optimis pernah muncul duluan padahal kirim gagal).
const submitState = ref('idle');

function startAddFlow() {
  addActive.value = true;
  pin.value = null;
}

function resetAddFlow() {
  addActive.value = false;
  pin.value = null;
  submitState.value = 'idle';
}

// MapPane mengirim dua argumen terpisah sesuai kontrak (A6)
function onPinPlaced(lat, lng) {
  pin.value = { lat, lng };
}

// C5: payload siap → tulis ke Supabase (RLS memaksa status pending).
// addPending selesai dulu → BARU submitState 'success'; gagal → 'error' + spanduk
// merah di dalam form (form tetap terbuka, isinya tidak hilang, bisa dicoba lagi).
function onSubmit(payload) {
  submitState.value = 'pending';
  addPending(payload)
    .then(() => {
      submitState.value = 'success';
    })
    .catch((err) => {
      submitState.value = 'error';
      console.error('Gagal mengirim spot:', err);
      showToast('Gagal mengirim spot. Periksa koneksi lalu coba lagi.');
    });
}

// B7 versi jujur (review 2026-11-15): toast dimiliki PARENT — sukses hanya saat tulisan
// benar-benar berhasil, gagal diberitahu terpisah. Komponen hanya emit, tanpa toast.
function onVerify(spotId) {
  markVerified(spotId)
    .then(() => showToast('Terima kasih! Verifikasi tercatat.'))
    .catch((err) => {
      console.error('Gagal menyimpan verifikasi:', err);
      showToast('Gagal menyimpan verifikasi. Coba lagi nanti.');
    });
}

onMounted(() => {
  load().catch((err) => console.error('Gagal memuat spot:', err));
});
</script>

<template>
  <div class="app-pane">
    <aside class="app-pane__side d-flex flex-column">
      <header class="d-flex align-items-center justify-content-between p-3 border-bottom">
        <h1 class="h5 m-0 fw-bold d-flex align-items-center gap-2">
          <span class="brand-badge"><i class="bi bi-geo-alt-fill"></i></span>
          Singgah
        </h1>
        <DarkModeToggle />
      </header>

      <SpotList
        :spots="filteredSpots"
        :query="query"
        :type="type"
        :pending-mine="pendingMine"
        :user-pos="userPos"
        @update:query="query = $event"
        @update:type="type = $event"
        @select="selectedId = $event"
      />
    </aside>

    <MapPane
      class="app-pane__map"
      :spots="filteredSpots"
      :pin-mode="addActive"
      :selected-id="selectedId"
      @select="selectedId = $event"
      @pin-placed="onPinPlaced"
    />

    <!-- FAB "+ Tambah": hanya tampil saat alur tambah tidak aktif (I2) -->
    <button v-if="!addActive" type="button" class="fab-add btn shadow" @click="startAddFlow">
      <i class="bi bi-plus-lg me-1"></i>Tambah
    </button>

    <!-- Detail: ponsel = kartu sheet di bawah; desktop = menggantikan panel sidebar
         (board frame 3). Pembungkus ini yang menentukan posisi, isi tetap milik lane B. -->
    <div v-if="selectedSpot" class="detail-anchor">
      <SpotDetail :spot="selectedSpot" @close="selectedId = null" @verify="onVerify" />
    </div>

    <AddSpotSheet
      :active="addActive"
      :pin="pin"
      :submit-state="submitState"
      @cancel="resetAddFlow"
      @submit="onSubmit"
    />
  </div>
</template>

<style scoped>
/* Detail anchor (umpan balik owner): panel selalu menempel pada sisi objek aktif —
   ponsel: kartu sheet di bawah; desktop: menggantikan panel sidebar — dan dibatasi
   tingginya + bisa digulir, jadi isunya tidak pernah terpotong. */
.detail-anchor {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  /* tinggi PASTI — anak langsungnya elemen absolut (milik lane B), tanpa ini
     tinggi pembungkus runtuh ke 0 dan isinya tak terlihat di ponsel */
  height: min(60dvh, 520px);
  overflow-y: auto;
  z-index: 1200; /* di atas peta, di bawah offcanvas */
}

/* isi (root milik lane B) memenuhi pembungkus, bukan menggantung di bawah */
.detail-anchor :deep(.position-absolute) {
  inset: 0;
  padding: 12px;
}
.detail-anchor :deep(.card) {
  min-height: 100%;
  box-sizing: border-box;
}

@media (min-width: 992px) {
  .detail-anchor {
    left: 14px;
    top: 14px;
    bottom: 14px;
    right: auto;
    width: var(--singgah-sidebar-w);
    max-height: none;
    background: var(--singgah-card);
    border: 1px solid var(--singgah-line);
    border-radius: 16px;
    box-shadow: var(--singgah-shadow);
  }
}

/* Lencana merek: kotak teal membulat dengan pin putih (board desktop) */
.brand-badge {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--singgah-teal);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

/* FAB "+ Tambah" — melayang di atas peta; di ponsel naik di atas bottom sheet */
.fab-add {
  position: fixed;
  right: 1rem;
  bottom: calc(1rem + env(safe-area-inset-bottom));
  z-index: 1030;
  background: var(--singgah-teal);
  color: #fff;
  border: none;
  border-radius: 2rem;
  padding: 0.65rem 1.15rem;
  font-weight: 600;
}
.fab-add:hover {
  background: #0b6653;
  color: #fff;
}

@media (max-width: 991.98px) {
  .fab-add {
    bottom: calc(55dvh + 1rem + env(safe-area-inset-bottom));
  }
}
</style>
