// src/composables/useGeolocation.js — pembungkus navigator.geolocation (infrastruktur F).
// locate() → resolve {lat,lng} saat berhasil; gagal → toast 'Lokasi tidak tersedia.'
// dan app tetap terpakai (langkah A5). `position` adalah state bersama: MapPane
// menggeser peta ke sana, SpotList memakainya untuk teks jarak via prop userPos.

import { ref } from 'vue';
import { showToast } from '../lib/toast';

const position = ref(null); // {lat, lng} atau null
const loading = ref(false);

function locate() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      showToast('Lokasi tidak tersedia.');
      reject(new Error('geolocation tidak tersedia'));
      return;
    }
    loading.value = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // accuracy (meter) ikut disimpan — dipakai lingkaran akurasi di peta
        position.value = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        loading.value = false;
        resolve(position.value);
      },
      () => {
        loading.value = false;
        showToast('Lokasi tidak tersedia.');
        reject(new Error('geolocation ditolak/gagal'));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  });
}

export function useGeolocation() {
  return { position, loading, locate };
}
