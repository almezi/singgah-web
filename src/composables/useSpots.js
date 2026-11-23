// src/composables/useSpots.js — satu sumber kebenaran untuk state spot & filter.
// Dimiliki lane F (kontrak beku: docs/api-contract.md §6). HANYA App.vue yang memakai
// composable ini; components menerima data lewat props dan mengirim event ke atas.

import { computed, ref } from 'vue';
import { bumpVerified, insertPendingSpot, loadApprovedSpots } from '../lib/supabase';

// Jenis spot yang sah (kolom `type`, docs/data-model.md)
const TYPES = ['masjid_besar', 'musala', 'terminal', 'spbu', 'rest_area'];

// State bersama (singleton modul): satu daftar untuk peta + daftar kartu
const spots = ref([]); // hanya spot approved (dari database)
const pendingMine = ref([]); // spot pending milik pengguna ini (disimpan lokal)
const query = ref(''); // teks pencarian
const type = ref(''); // chip jenis terpilih ('' = semua)

function loadPendingMine() {
  try {
    pendingMine.value = JSON.parse(localStorage.getItem('singgah-pending-mine') || '[]');
  } catch {
    pendingMine.value = [];
  }
}

function savePendingMine() {
  localStorage.setItem('singgah-pending-mine', JSON.stringify(pendingMine.value));
}

// Hasil filter bersama — dipakai SpotList (kartu) dan MapPane (penanda) sekaligus,
// sehingga keduanya selalu berubah bersamaan (langkah B2 + A4)
const filteredSpots = computed(() => {
  const q = query.value.trim().toLowerCase();
  return spots.value.filter((s) => {
    const matchType = !type.value || s.type === type.value;
    const matchQuery = !q || (s.name || '').toLowerCase().includes(q);
    return matchType && matchQuery;
  });
});

// load() — pembacaan awal: spot approved dari database + tinjauan lokal
async function load() {
  spots.value = await loadApprovedSpots();
  loadPendingMine();
  dropApprovedFromPending();
}

// dropApprovedFromPending() — spot yang sudah disetujui owner muncul di daftar publik;
// salinan lokalnya di "Tinjauan saya" dibuang agar tidak tampil dobel. Dianggap sama bila
// nama sama (tanpa beda huruf besar/kecil) dan jaraknya < ±50 m (0,0005° ≈ 55 m).
function dropApprovedFromPending() {
  const before = pendingMine.value.length;
  pendingMine.value = pendingMine.value.filter(
    (p) =>
      !spots.value.some(
        (s) =>
          (s.name || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase() &&
          Math.abs(s.lat - p.lat) < 0.0005 &&
          Math.abs(s.lng - p.lng) < 0.0005,
      ),
  );
  if (pendingMine.value.length !== before) savePendingMine();
}

// addPending(payload) — kirim spot baru (insertPendingSpot memaksa pending/user)
// lalu simpan salinannya ke "Tinjauan saya" (langkah C7 / B6)
async function addPending(payload) {
  const row = await insertPendingSpot(payload);
  pendingMine.value = [...pendingMine.value, row];
  savePendingMine();
  return row;
}

// markVerified(spotId) — "Masih ada ✓": tulis lewat fungsi Postgres berbatas waktu,
// lalu perbarui baris lokal agar garis verifikasi langsung berubah (langkah B7).
// bump_verified mengembalikan false saat kuota 1×/jam habis — itu kegagalan, bukan sukses:
// kita lempar error agar App.vue bisa memberi tahu pengguna (tidak pernah mengarang sukses).
async function markVerified(spotId) {
  const ok = await bumpVerified(spotId);
  if (ok === false) {
    throw new Error('Verifikasi dibatasi: satu spot maksimal sekali per jam.');
  }
  const spot = spots.value.find((s) => s.id === spotId);
  if (spot) spot.last_verified_at = new Date().toISOString();
}

export function useSpots() {
  return {
    spots,
    pendingMine,
    query,
    type,
    filteredSpots,
    TYPES,
    load,
    addPending,
    markVerified,
  };
}
