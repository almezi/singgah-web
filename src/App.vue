<!--
  src/App.vue — kerangka aplikasi + integrasi (Wave 4, langkah I1–I3).
  Dua panel di desktop (G4), bottom sheet di ponsel. Memasang 5 components dan
  menyambungkan props turun / events naik sesuai kontrak (docs/api-contract.md §2).
  Alur tambah: FAB "+ Tambah" → ketuk peta (pin, lane A) → banner + offcanvas form
  (lane C) → sukses → kembali ke peta.
-->

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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

// ---- Sheet yang bisa ditarik ala Google Maps (ponsel, mode daftar) ----
// Tiga posisi snapp: peek (pegangan+header+kotak cari, DIUKUR dari DOM — bukan tebakan
// konstan, umpan balik owner: 180px terpotong di HP asli karena font/tinggi header
// berbeda-beda) · half 55dvh · full (layar − 96px).
// Tarik dari pegangan; FAB + tombol lokasi mengikuti lewat var --singgah-sheet-h.
const sheetEl = ref(null);
const sheetDragging = ref(false);
const PEEK_FALLBACK = 180; // jaring pengaman kalau elemen pengukuran tidak ada
let peekPx = PEEK_FALLBACK;
let dragStart = { y: 0, h: 0 };
let dragLast = { y: 0, t: 0, v: 0 };
let dragMoved = false;
let lastFocused = null;

// Tinggi peek = tepi bawah kotak cari + 8px napas. offsetTop relatif ke
// .app-pane__side (position: relative di ponsel) — mencakup pegangan + header
// + padding daftar, dan otomatis mengikuti font scale / font web / ukuran HP.
function computePeek() {
  const side = sheetEl.value;
  if (!side || isDesktop.value) return;
  const firstCard = side.querySelector('.spot-list .spot-card');
  const target = firstCard || side.querySelector('.spot-list .search-wrap');
  if (!target) {
    peekPx = PEEK_FALLBACK;
    return;
  }
  // Peek memperlihatkan kontrol + satu kartu tanpa menutupi lebih dari separuh peta.
  peekPx = Math.min(
    Math.round(target.offsetTop + target.offsetHeight + 12),
    Math.round(window.innerHeight * 0.48),
  );
}

function setSheetHeight(v) {
  document.documentElement.style.setProperty(
    '--singgah-sheet-h',
    typeof v === 'number' ? Math.round(v) + 'px' : v,
  );
}
function maxSheetPx() {
  return window.innerHeight - 96; /* sisakan strip peta + FAB di atas sheet penuh */
}
function onHandleDown(e) {
  // addActive TIDAK mengecualikan: saat mode pin (banner), sheet tetap boleh ditarik.
  // Offcanvas form yang terbuka menutupi handle secara alami, jadi tak ada konflik.
  if (isDesktop.value || selectedSpot.value) return;
  sheetDragging.value = true;
  dragMoved = false;
  dragStart = { y: e.clientY, h: sheetEl.value.getBoundingClientRect().height };
  dragLast = { y: e.clientY, t: performance.now(), v: 0 };
  window.addEventListener('pointermove', onHandleMove);
  window.addEventListener('pointerup', onHandleUp);
}
function onHandleMove(e) {
  if (!sheetDragging.value || !sheetEl.value) return;
  const now = performance.now();
  if (Math.abs(e.clientY - dragStart.y) > 6) dragMoved = true;
  const dt = Math.max(1, now - dragLast.t);
  dragLast.v = (dragLast.y - e.clientY) / dt; // px/ms, positif = ditarik ke atas
  dragLast.y = e.clientY;
  dragLast.t = now;
  const h = Math.min(Math.max(dragStart.h + (dragStart.y - e.clientY), peekPx), maxSheetPx());
  setSheetHeight(h);
}
function onHandleUp() {
  window.removeEventListener('pointermove', onHandleMove);
  window.removeEventListener('pointerup', onHandleUp);
  if (!sheetDragging.value || !sheetEl.value) return;
  sheetDragging.value = false;
  const h = sheetEl.value.getBoundingClientRect().height;
  const snaps = [peekPx, window.innerHeight * 0.55, maxSheetPx()];
  let target = snaps[0];
  let best = Infinity;
  for (const s of snaps) {
    const d = Math.abs(s - h);
    if (d < best) {
      best = d;
      target = s;
    }
  }
  // fling: gerakan cepat melompat ke posisi berikutnya (ala Google Maps)
  if (Math.abs(dragLast.v) > 0.6) {
    const above = snaps.filter((s) => s > h + 8);
    const below = snaps.filter((s) => s < h - 8);
    if (dragLast.v > 0 && above.length) target = Math.min(...above);
    if (dragLast.v < 0 && below.length) target = Math.max(...below);
  }
  setSheetHeight(Math.round(target));
}

// Alternatif aksesibel untuk drag: ketuk pegangan untuk berpindah peek → half → full.
function cycleSheet() {
  if (isDesktop.value || selectedSpot.value || !sheetEl.value) return;
  if (dragMoved) {
    dragMoved = false;
    return;
  }
  const h = sheetEl.value.getBoundingClientRect().height;
  const snaps = [peekPx, window.innerHeight * 0.55, maxSheetPx()];
  const next = snaps.find((s) => s > h + 12) ?? snaps[0];
  setSheetHeight(next);
}

function openDetail(spotId) {
  lastFocused = document.activeElement;
  selectedId.value = spotId;
  nextTick(() => document.querySelector('.spot-detail')?.focus());
}

// Responsif: satu kebenaran untuk mode desktop vs sheet (titik pecah 992px).
// Ponsel: detail MENGGANTIKAN isi sheet (tanpa tumpang tindih, umpan balik owner).
// Desktop: detail sebagai panel yang menggantikan sidebar (board frame 3).
const mqDesktop = window.matchMedia('(min-width: 992px)');
const isDesktop = ref(mqDesktop.matches);
function onMqChange(e) {
  isDesktop.value = e.matches;
  nextTick(computePeek); // kembali ke ponsel → ukur ulang tinggi peek
}

function closeDetail() {
  selectedId.value = null;
  setSheetHeight('55dvh'); // kembali ke posisi paruh setelah menutup detail
  nextTick(() => {
    computePeek(); // header muncul lagi → tinggi peek berubah
    if (lastFocused instanceof HTMLElement && lastFocused.isConnected) lastFocused.focus();
    lastFocused = null;
  });
}

// Mode detail di ponsel: sheet membesar ke 70dvh (cukup untuk seluruh rincian)
watch(
  () => [selectedSpot.value, isDesktop.value],
  ([spot, desktop]) => {
    if (spot && !desktop) setSheetHeight('min(70dvh, 590px)');
  },
);

// Umpan balik owner: "Lokasi saya" = aksi peta → sheet turun ke peek agar hasilnya
// terlihat. Mendengarkan state posisi bersama (bukan tombolnya) — apa pun yang
// memicu locate, sheet selalu menurun saat fix didapat.
watch(userPos, () => {
  if (!isDesktop.value) setSheetHeight(peekPx + 'px');
});

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
  // Umpan balik owner: menambah spot = aksi peta → sheet turun ke peek agar
  // peta bebas diketuk untuk menaruh pin (ala Google Maps)
  if (!isDesktop.value) setSheetHeight(peekPx + 'px');
}

function resetAddFlow() {
  addActive.value = false;
  pin.value = null;
  submitState.value = 'idle';
  if (!isDesktop.value) setSheetHeight('55dvh'); // alur selesai → kembali ke half
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
      // 23514 = constraint (panjang / koordinat), 42501 = ditolak RLS: masalah isian,
      // bukan koneksi — jangan suruh pengguna cek internet lalu kirim ulang percuma.
      const badData = err && (err.code === '23514' || err.code === '42501');
      showToast(
        badData
          ? 'Data spot tidak valid. Periksa isian lalu coba lagi.'
          : 'Gagal mengirim spot. Periksa koneksi lalu coba lagi.',
      );
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
  mqDesktop.addEventListener('change', onMqChange);
  load()
    .then(() => nextTick(computePeek))
    .catch((err) => console.error('Gagal memuat spot:', err));
  // Tinggi peek diukur ulang saat tinggi isinya bisa berubah: awal mount, setelah font
  // web selesai termuat (Plus Jakarta Sans mengubah tinggi header/kotak cari), dan saat
  // rotasi / ukuran jendela berubah. Tanpa ini peek 180px konstan terpotong di HP asli.
  nextTick(computePeek);
  if (document.fonts?.ready) document.fonts.ready.then(computePeek);
  window.addEventListener('resize', computePeek);
});

onBeforeUnmount(() => {
  mqDesktop.removeEventListener('change', onMqChange);
  window.removeEventListener('resize', computePeek);
  window.removeEventListener('pointermove', onHandleMove);
  window.removeEventListener('pointerup', onHandleUp);
});
</script>

<template>
  <div class="app-pane">
    <aside
      ref="sheetEl"
      class="app-pane__side d-flex flex-column"
      :class="{ 'has-detail': selectedSpot && !isDesktop, 'is-dragging': sheetDragging }"
      aria-label="Daftar dan rincian spot"
    >
      <!-- Zona tarik 44px + alternatif ketuk untuk peek/half/full. -->
      <button
        type="button"
        class="sheet-handle"
        aria-label="Ubah tinggi panel"
        @pointerdown="onHandleDown"
        @click="cycleSheet"
      ><span aria-hidden="true"></span></button>
      <header
        v-if="isDesktop || !selectedSpot"
        class="app-header d-flex align-items-center justify-content-between"
      >
        <h1 class="brand-lockup m-0 d-flex align-items-center gap-2">
          <span class="brand-badge"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i></span>
          <span>Singgah</span>
        </h1>
        <DarkModeToggle />
      </header>

      <!-- Detail menggantikan daftar, sehingga kontrol tersembunyi tidak tetap bisa ditab. -->
      <SpotDetail
        v-if="selectedSpot"
        :spot="selectedSpot"
        @close="closeDetail"
        @verify="onVerify"
      />
      <SpotList
        v-else
        :spots="filteredSpots"
        :query="query"
        :type="type"
        :pending-mine="pendingMine"
        :user-pos="userPos"
        @update:query="query = $event"
        @update:type="type = $event"
        @select="openDetail"
      />

      <p class="map-credit">Peta © OpenStreetMap contributors</p>
    </aside>

    <MapPane
      class="app-pane__map"
      :spots="filteredSpots"
      :pin-mode="addActive"
      :selected-id="selectedId"
      @select="openDetail"
      @pin-placed="onPinPlaced"
    />

    <!-- FAB "+ Tambah": hanya tampil saat alur tambah tidak aktif (I2) -->
    <button
      v-if="!addActive && (isDesktop || !selectedSpot)"
      type="button"
      class="fab-add btn shadow"
      aria-label="Tambah spot"
      @click="startAddFlow"
    >
      <i class="bi bi-plus-lg me-1"></i>Tambah
    </button>

    <AddSpotSheet
      class="add-sheet-host"
      :active="addActive"
      :pin="pin"
      :submit-state="submitState"
      @cancel="resetAddFlow"
      @submit="onSubmit"
    />
  </div>
</template>

<style scoped>
/* Pembungkus AddSpotSheet dikeluarkan dari alur flex (display: contents) — tanpa ini
   div kosongnya memakan satu slot gap 14px dan kartu peta jadi lebih sempit.
   Anak-anaknya semuanya position: fixed, jadi tetap tampil normal. */
.add-sheet-host {
  display: contents;
}

/* Detail mengalir sebagai isi sidebar/sheet, bukan overlay di atas daftar. */
.app-pane__side :deep(.spot-detail-wrap) {
  position: static !important;
  flex: 1 1 auto;
  padding: 0;
}
.app-pane__side :deep(.spot-detail) {
  max-width: none;
  max-height: none;
  min-height: 100%;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.app-pane__side.has-detail {
  max-height: 70dvh;
}
.map-credit {
  display: none;
  font-size: 0.72rem;
  color: var(--bs-secondary-color);
  text-align: center;
  padding: 0 12px 10px;
  margin: 0;
}
@media (max-width: 991.98px) {
  .map-credit {
    display: block;
  }
}

/* Lencana merek: kotak teal membulat dengan pin putih (board desktop) */
.brand-badge {
  width: 40px;
  height: 40px;
  border-radius: 13px;
  background: linear-gradient(145deg, #15987d, var(--singgah-teal));
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  box-shadow: 0 7px 18px rgba(14, 124, 102, 0.24);
}

/* FAB "+ Tambah" — 12px dari tepi KARTU PETA (seragam dengan legenda) dan DI ATAS garis
   atribusi Leaflet (17px) — atribusi © OpenStreetMap wajib selalu terlihat (ODbL).
   Desktop = jarak halaman + inset + tinggi atribusi; ponsel = inset langsung, naik di atas sheet */
.fab-add {
  position: fixed;
  right: calc(var(--singgah-page-pad) + var(--singgah-map-inset));
  bottom: calc(
    var(--singgah-page-pad) + var(--singgah-map-inset) + var(--singgah-attrib-h) + 6px +
      env(safe-area-inset-bottom)
  );
  z-index: 1030;
  min-height: 50px;
  background: var(--singgah-teal);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 999px;
  padding: 0.7rem 1.2rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  box-shadow: 0 10px 28px rgba(14, 124, 102, 0.3) !important;
}
.fab-add:hover {
  background: #0b6653;
  color: #fff;
  transform: translateY(-2px);
}
.fab-add:active {
  transform: translateY(0);
}

@media (max-width: 991.98px) {
  .fab-add {
    right: var(--singgah-map-inset);
    bottom: calc(var(--singgah-sheet-h, 55dvh) + var(--singgah-map-inset) + env(safe-area-inset-bottom));
  }
}
</style>
