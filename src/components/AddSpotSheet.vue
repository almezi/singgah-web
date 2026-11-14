<!--
  src/components/AddSpotSheet.vue — alur tambah spot: banner pin → form (offcanvas) → sukses.
  Lane C (langkah C1–C8). Kontrak beku (docs/api-contract.md §2):
  props { active (alur tambah dimulai), pin ({lat,lng} atau null) } · emits { cancel, submit(payload) }.
  Komponen ini TIDAK memanggil Supabase: payload dikirim lewat emit `submit`, parent (App.vue,
  Wave 4) yang menulis lewat useSpots.addPending → insertPendingSpot — jadi baris baru otomatis
  berstatus 'pending', source 'user', last_verified_at null (C5). Tombol FAB "+ Tambah" milik
  App.vue; perilaku pin-drop milik MapPane (lane A) — di sini hanya banner + form + sukses.
  Catatan OQ-8 (docs/decision-log.md): varian teks sukses mengikuti instruksi owner
  ('Terima kasih! 🙏' / 'Spot kamu menunggu persetujuan.') — keduanya terdaftar di
  docs/ui-copy.md §2; jangan campur varian lain di layar ini.
-->

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { Offcanvas } from 'bootstrap';

const props = defineProps({
  active: { type: Boolean, default: false },
  pin: { type: Object, default: null },
  submitState: { type: String, default: 'idle' }, // 'idle' | 'pending' | 'success' | 'error'
});
const emit = defineEmits(['cancel', 'submit']);

// Pilihan jenis: nilai = nilai kolom `type` yang diizinkan (docs/api-contract.md §5)
const TYPE_OPTIONS = [
  { value: 'masjid_besar', label: 'Masjid Besar' },
  { value: 'musala', label: 'Musala' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'spbu', label: 'SPBU' },
  { value: 'rest_area', label: 'Rest Area' },
];

// Label pendek sesuai instruksi owner (= label detail di docs/ui-copy.md §3).
// Opsi kosong 'Belum tahu' = null → di kartu detail tampil sebagai 'Belum ada info'.
const WATER_OPTIONS = [
  { value: 'kran_mandi', label: 'Kran mandi' },
  { value: 'wudhu_only', label: 'Wudhu saja' },
  { value: 'air_isi', label: 'Air isi' },
  { value: 'tidak_ada', label: 'Tidak ada' },
];

// C3 + C8: state form. `type` mulai KOSONG (tidak pernah dikarang); `women` null =
// 'Belum ada info' (default); `bike` false (default kontrak).
const form = reactive({
  name: '',
  type: '',
  water: '',
  hours: '',
  bike: false,
  women: null,
  notes: '',
});

const offcanvasEl = ref(null);
const formEl = ref(null);
const successBackBtn = ref(null);

const formOpen = ref(false); // offcanvas form sedang terbuka
// submitState (prop dari parent): 'idle' | 'pending' | 'success' | 'error'.
// Sumber kebenaran yang JUJUR (umpan balik owner): layar sukses hanya tampil setelah
// database benar-benar berkata ya — bukan segera setelah tombol ditekan.
const formShown = computed(() => props.submitState !== 'success');
const submitted = computed(() => props.submitState === 'success');

let offcanvas = null;

// C1/C2: banner memakai props apa adanya — pin belum ada → 'Lanjut' disabled (jujur),
// pin sudah ada → teks konfirmasi 'Pin di titik ini?' dan tombol aktif.

function resetForm() {
  form.name = '';
  form.type = '';
  form.water = '';
  form.hours = '';
  form.bike = false;
  form.women = null; // kembali ke 'Belum ada info'
  form.notes = '';
  formOpen.value = false;
  // form dirender ulang lewat v-if, tapi bersihkan kelas validasi bila elemennya masih ada
  if (formEl.value) formEl.value.classList.remove('was-validated');
}

// C2: 'Lanjut' hanya membuka panel bila pin benar-benar ada
function openForm() {
  if (!props.pin || !offcanvas) return;
  formOpen.value = true;
  offcanvas.show();
}

// C4 + C5: validasi Bootstrap (required) lalu kirim payload — TANPA memanggil Supabase
function onSubmit() {
  const el = formEl.value;
  if (!el || !el.checkValidity()) {
    // nama kosong (atau jenis belum dipilih) memblokir submit; Bootstrap menandai merah
    if (el) el.classList.add('was-validated');
    return;
  }
  emit('submit', {
    name: form.name.trim(),
    type: form.type,
    lat: props.pin.lat,
    lng: props.pin.lng,
    water: form.water || null, // 'Belum tahu' → null (tidak pernah nilai karangan)
    hours: form.hours.trim() || null,
    bike_parking: form.bike,
    women_friendly: form.women, // Ya / Tidak / Belum ada info → true / false / null
    notes: form.notes.trim() || null,
  });
  // C6 versi jujur: parent yang menulis ke database dan mengubah submitState —
  // 'success' baru menampilkan layar sukses; 'error' kembali ke form + spanduk merah.
}

// C7: 'Kembali ke peta' → tutup panel; event hidden di bawah yang emit cancel
function backToMap() {
  if (offcanvas) offcanvas.hide();
}

// Panel ditutup (tombol X, backdrop, atau Esc):
// - setelah sukses / error → akhiri alur (emit cancel; parent menutup + mereset, C7)
// - sebelum submit → kembali ke mode pin: banner tampil lagi, pin milik parent tetap ada
function onOffcanvasHidden() {
  formOpen.value = false;
  if (props.submitState === 'success' || props.submitState === 'error') {
    emit('cancel');
  }
}

// C6: fokus tombol kembali begitu layar sukses benar-benar tampil
watch(
  () => props.submitState,
  (state) => {
    if (state === 'success') {
      nextTick(() => {
        if (successBackBtn.value) successBackBtn.value.focus();
      });
    }
  },
);

// C1: X pada banner membatalkan seluruh alur tambah
function onCancel() {
  emit('cancel');
}

watch(
  () => props.active,
  (isActive) => {
    if (isActive) {
      if (formOpen.value && offcanvas) offcanvas.hide(); // alur diulang: tutup panel lama
      resetForm();
    } else if (formOpen.value && offcanvas) {
      offcanvas.hide(); // parent menutup alur
    }
  },
);

onMounted(() => {
  offcanvas = new Offcanvas(offcanvasEl.value);
  offcanvasEl.value.addEventListener('hidden.bs.offcanvas', onOffcanvasHidden);
});

onBeforeUnmount(() => {
  if (offcanvasEl.value) {
    offcanvasEl.value.removeEventListener('hidden.bs.offcanvas', onOffcanvasHidden);
  }
  if (offcanvas) {
    offcanvas.dispose();
    offcanvas = null;
  }
});
</script>

<template>
  <div>
    <!-- C1: selubung redup saat alur aktif — pointer-events none, peta tetap bisa diketuk (lane A) -->
    <div v-if="active" class="add-veil" aria-hidden="true"></div>

    <!-- C1 + C2: banner langkah 1 — teks status, 'Lanjut' (disabled sampai ada pin), X batal -->
    <div v-if="active && !formOpen" class="add-banner" role="status">
      <div class="d-flex align-items-start gap-2">
        <i class="bi bi-pin-map mt-1" aria-hidden="true"></i>
        <div class="flex-grow-1">
          <template v-if="pin">
            <div>Pin di titik ini?</div>
            <div class="add-coords">{{ pin.lat.toFixed(5) }}, {{ pin.lng.toFixed(5) }}</div>
          </template>
          <template v-else>Ketuk peta untuk menaruh pin</template>
        </div>
        <button type="button" class="add-close" aria-label="Batal" @click="onCancel">
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </div>
      <!-- C2: disabled terlihat jelas sampai pin ada (juga terbaca oleh screen reader) -->
      <button type="button" class="btn btn-primary w-100 mt-2" :disabled="!pin" @click="openForm">
        Lanjut
      </button>
    </div>

    <!-- C2: offcanvas form — bottom di ponsel (<992px), panel kanan (end) di desktop (≥992px) -->
    <div
      ref="offcanvasEl"
      class="offcanvas offcanvas-bottom add-offcanvas"
      tabindex="-1"
      aria-labelledby="add-offcanvas-title"
    >
      <div class="offcanvas-header">
        <h2 class="offcanvas-title fs-5 fw-bold" id="add-offcanvas-title">Tambah spot</h2>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Batal"></button>
      </div>
      <div class="offcanvas-body">
        <!-- Umpan balik owner: spanduk error yang jujur — form tetap terbuka agar bisa dicoba lagi -->
        <div v-if="submitState === 'error'" class="alert alert-danger py-2 mb-3" role="alert">
          Gagal mengirim. Periksa koneksi internet lalu coba lagi.
        </div>
        <!-- C4: pola validasi Bootstrap — novalidate + was-validated saat submit -->
        <form
          v-if="formShown"
          ref="formEl"
          class="needs-validation"
          novalidate
          @submit.prevent="onSubmit"
        >
          <!-- C3: Nama spot — wajib -->
          <div class="mb-3">
            <label class="form-label" for="add-name">Nama spot</label>
            <input
              id="add-name"
              v-model="form.name"
              type="text"
              class="form-control"
              required
              maxlength="120"
              placeholder="Nama masjid, musala, atau tempatnya"
            />
            <div class="invalid-feedback">Nama spot wajib diisi.</div>
          </div>

          <!-- C3: pilihan jenis — 5 radio chip, mulai kosong (tidak ada nilai bawaan) -->
          <fieldset class="mb-3">
            <legend class="form-label fs-6 mb-2">Jenis</legend>
            <div class="d-flex flex-wrap gap-2 type-row">
              <template v-for="opt in TYPE_OPTIONS" :key="opt.value">
                <input
                  type="radio"
                  class="btn-check"
                  name="add-type"
                  :id="'add-type-' + opt.value"
                  :value="opt.value"
                  v-model="form.type"
                  required
                />
                <label class="chip-btn" :for="'add-type-' + opt.value">{{ opt.label }}</label>
              </template>
              <div class="invalid-feedback">Pilih jenis spot.</div>
            </div>
          </fieldset>

          <!-- C3: Air — kosong 'Belum tahu' terkirim sebagai null -->
          <div class="mb-3">
            <label class="form-label" for="add-water">Air</label>
            <select id="add-water" v-model="form.water" class="form-select">
              <option value="">Belum tahu</option>
              <option v-for="opt in WATER_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- C3: Jam buka — teks bebas, boleh kosong -->
          <div class="mb-3">
            <label class="form-label" for="add-hours">Jam buka</label>
            <input
              id="add-hours"
              v-model="form.hours"
              type="text"
              class="form-control"
              maxlength="60"
              placeholder="24 jam"
            />
          </div>

          <!-- C8: Parkir sepeda — switch, default false -->
          <div class="form-check form-switch mb-3 add-switch">
            <input class="form-check-input" type="checkbox" id="add-bike" v-model="form.bike" />
            <label class="form-check-label" for="add-bike">Parkir sepeda</label>
          </div>

          <!-- C8: Ramah perempuan — 3 status, default 'Belum ada info' (= null) -->
          <fieldset class="mb-3">
            <legend class="form-label fs-6 mb-2">Ramah perempuan</legend>
            <div class="d-flex flex-wrap gap-2">
              <input
                type="radio"
                class="btn-check"
                name="add-women"
                id="add-women-yes"
                :value="true"
                v-model="form.women"
              />
              <label class="chip-btn" for="add-women-yes">Ya</label>
              <input
                type="radio"
                class="btn-check"
                name="add-women"
                id="add-women-no"
                :value="false"
                v-model="form.women"
              />
              <label class="chip-btn" for="add-women-no">Tidak</label>
              <input
                type="radio"
                class="btn-check"
                name="add-women"
                id="add-women-unknown"
                :value="null"
                v-model="form.women"
              />
              <label class="chip-btn" for="add-women-unknown">Belum ada info</label>
            </div>
          </fieldset>

          <!-- C8: Catatan — teks etiket, boleh kosong -->
          <div class="mb-3">
            <label class="form-label" for="add-notes">Catatan</label>
            <textarea
              id="add-notes"
              v-model="form.notes"
              class="form-control"
              rows="2"
              maxlength="300"
              placeholder="Contoh: izin dulu ke marbot sebelum istirahat"
            ></textarea>
          </div>

          <div class="text-center">
            <button
              type="submit"
              class="btn btn-primary add-submit"
              aria-describedby="add-reassurance"
              :disabled="submitState === 'pending'"
            >
              {{ submitState === 'pending' ? 'Mengirim…' : 'Kirim untuk ditinjau' }}
            </button>
            <p id="add-reassurance" class="add-reassurance mt-2 mb-0">
              Spot baru diperiksa dulu sebelum tampil di peta.
            </p>
          </div>
        </form>

        <!-- C6 + C7: layar sukses — HANYA setelah database mengonfirmasi (submitState) -->
        <div v-else class="text-center py-2">
          <div class="success-circle"><i class="bi bi-check2-circle" aria-hidden="true"></i></div>
          <h2 class="fw-bold fs-4">Terima kasih! 🙏</h2>
          <p class="mb-1">Spot kamu menunggu persetujuan.</p>
          <p class="add-reassurance mb-3">Spot baru diperiksa dulu sebelum tampil di peta.</p>
          <button
            ref="successBackBtn"
            type="button"
            class="btn btn-primary add-submit"
            @click="backToMap"
          >
            Kembali ke peta
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* C1: selubung redup — hanya menggelapkan UI di belakang banner; peta tetap bisa diketuk */
.add-veil {
  position: fixed;
  inset: 0;
  z-index: 1040;
  background: rgba(10, 25, 20, 0.3);
  pointer-events: none;
}

/* C1/C2: banner langkah 1 (gaya kartu banner board disetujui) */
.add-banner {
  position: fixed;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1041;
  width: min(92vw, 440px);
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(18, 51, 44, 0.14);
  padding: 12px 14px;
  color: var(--bs-body-color);
  font-weight: 600;
  font-size: 0.9rem;
}
.add-banner .bi-pin-map {
  color: var(--bs-secondary-color);
}
.add-coords {
  font-size: 0.78rem;
  font-weight: 400;
  color: var(--bs-secondary-color);
  margin-top: 2px;
}
.add-close {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  margin: -10px -10px -10px 0;
  border: 0;
  background: transparent;
  border-radius: 10px;
  color: var(--bs-secondary-color);
  display: flex;
  align-items: center;
  justify-content: center;
}
.add-close:hover {
  background: var(--bs-tertiary-bg);
  color: var(--bs-body-color);
}
.add-banner .btn {
  min-height: 44px;
  font-weight: 600;
}

/* C2: offcanvas form — bottom di ponsel (<992px, bawaan Bootstrap), end/kanan di desktop */
.add-offcanvas .form-label {
  font-weight: 600;
  font-size: 0.88rem;
}
.add-offcanvas .btn-close {
  min-width: 44px;
  min-height: 44px;
}
.add-offcanvas .btn {
  min-height: 44px;
  font-weight: 600;
}
.add-submit {
  min-width: 200px;
}
.add-reassurance {
  font-size: 0.82rem;
  color: var(--bs-secondary-color);
}

/* Baris switch: seluruh baris jadi target sentuh 44px (bukan hanya sakelarnya) */
.add-switch {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding-left: 0;
}
.add-switch .form-check-input {
  float: none;
  margin: 0;
  flex: 0 0 auto;
  width: 2.6em;
  height: 1.4em;
}
.add-switch .form-check-label {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  padding-left: 10px;
  min-height: 44px;
}

/* Chip pilihan (Jenis + Ramah perempuan): btn-check + label, gaya board disetujui */
.chip-btn {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--bs-border-color);
  background: var(--bs-body-bg);
  color: var(--bs-secondary-color);
  border-radius: 12px;
  padding: 9px 13px;
  font-size: 0.83rem;
  font-weight: 600;
  min-height: 44px;
  cursor: pointer;
}
.chip-btn:hover {
  background: var(--bs-tertiary-bg);
  color: var(--bs-body-color);
}
.btn-check:checked + .chip-btn {
  background: var(--bs-primary-bg-subtle);
  border-color: var(--bs-primary);
  color: var(--bs-primary-text-emphasis);
}
.btn-check:focus-visible + .chip-btn {
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(var(--bs-primary-rgb), 0.25);
}
/* C3/C4: jenis wajib dipilih — chip + saran invalid muncul setelah form divalidasi */
.was-validated input.btn-check:invalid + .chip-btn {
  border-color: var(--bs-form-invalid-color);
}
.was-validated .type-row:has(input.btn-check:invalid) .invalid-feedback {
  display: block;
}

/* C6: lingkaran sukses (gaya board disetujui) */
.success-circle {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: var(--bs-success-bg-subtle);
  color: var(--bs-success-text-emphasis);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  margin: 24px auto 16px;
}

/* Penempatan offcanvas: bottom di ponsel <992px (bawaan), panel kanan di desktop ≥992px */
@media (min-width: 992px) {
  .add-offcanvas.offcanvas-bottom {
    top: 0;
    right: 0;
    bottom: auto;
    left: auto;
    width: 430px;
    height: 100dvh;
    max-height: none;
    border-top: 0;
    border-left: 1px solid var(--bs-border-color);
    transform: translateX(100%);
  }
  .add-offcanvas.offcanvas-bottom.showing,
  .add-offcanvas.offcanvas-bottom.show,
  .add-offcanvas.offcanvas-bottom.show.hiding {
    transform: none;
  }
}
@media (max-width: 991.98px) {
  .add-offcanvas.offcanvas-bottom {
    height: auto;
    max-height: 88dvh;
    border-radius: 18px 18px 0 0;
  }
}
</style>
