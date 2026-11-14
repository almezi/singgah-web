<!-- src/components/MapPane.vue — peta Leaflet: pin per jenis spot, legenda desktop, tombol
     lokasi, dan mode pin-drop. Dimiliki lane A (langkah A1–A7). Kontrak beku (docs/api-contract.md
     §2): props { spots (approved + sudah difilter di upstream), pinMode } · emits
     { select(spotId), pin-placed(lat, lng) }. Props turun, event naik — tidak menyentuh
     komponen lain, tanpa panggilan Supabase langsung. -->

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster'; // ribuan pin: yang berdekatan digabung jadi gelembung berangka
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { TILE_URL } from '../lib/config';
import { useGeolocation } from '../composables/useGeolocation';

// ---- Props / emits (frozen contract, docs/api-contract.md §2) ----
const props = defineProps({
  spots: { type: Array, default: () => [] }, // approved-only + pre-filtered upstream (A3/A4)
  pinMode: { type: Boolean, default: false }, // true = tap the map to drop the add-spot pin (A6)
  selectedId: { type: String, default: null }, // id spot yang detailnya sedang terbuka (integrator)
});
const emit = defineEmits(['select', 'pin-placed']);

// ---- A2: one colour + one white glyph per type (docs/design-system.md §2) ----
// Bootstrap Icons 1.11.3 has no mosque-dome or tent glyph, so the closest distinct
// glyphs are used; the requirement is five different glyphs, readable without colour.
const TYPE_STYLE = {
  masjid_besar: { cls: 'sg-pin--masjid_besar', glyph: 'bi-bank' },
  musala: { cls: 'sg-pin--musala', glyph: 'bi-building-fill' },
  terminal: { cls: 'sg-pin--terminal', glyph: 'bi-bus-front-fill' },
  spbu: { cls: 'sg-pin--spbu', glyph: 'bi-droplet-fill' },
  rest_area: { cls: 'sg-pin--rest_area', glyph: 'bi-umbrella-fill' },
};
// Presentation fallback for an out-of-contract type — valid data never reaches it.
const FALLBACK_STYLE = { cls: 'sg-pin--unknown', glyph: 'bi-geo-alt-fill' };

// A2: legend, shown once on desktop (≥992px) — labels from docs/ui-copy.md §2
const LEGEND = [
  { cls: 'sg-pin--masjid_besar', glyph: 'bi-bank', label: 'Masjid Besar' },
  { cls: 'sg-pin--musala', glyph: 'bi-building-fill', label: 'Musala' },
  { cls: 'sg-pin--terminal', glyph: 'bi-bus-front-fill', label: 'Terminal' },
  { cls: 'sg-pin--spbu', glyph: 'bi-droplet-fill', label: 'SPBU' },
  { cls: 'sg-pin--rest_area', glyph: 'bi-umbrella-fill', label: 'Rest Area' },
];

// ---- Map state (plain lets — Leaflet objects are not reactive) ----
const mapEl = ref(null); // template ref → #map
let map = null;
let markerLayer = null;
let tempPin = null;
let resizeHandler = null;
let markersById = new Map(); // id → { marker, spot, style } — untuk sorotan pin terpilih
let prevSelectedId = null;

// Lane F infrastructure — imported, never edited (A5). The 'Lokasi tidak tersedia.'
// toast on failure is already handled inside locate().
const { locate, loading: geoLoading } = useGeolocation();

// ---- Pin factory: own L.divIcon only (sidesteps Leaflet's broken default-icon paths) ----
function makeIcon(style, selected = false) {
  return L.divIcon({
    className: 'sg-pin-wrap', // replaces Leaflet's default white icon box
    html: `<div class="sg-pin ${style.cls}${selected ? ' is-selected' : ''}"><i class="bi ${style.glyph}" aria-hidden="true"></i></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 41], // the teardrop tip (34px box rotated -45°)
  });
}

// ---- A3 + A4: draw markers ONLY from the spots prop; redraw whenever it changes ----
function redrawMarkers() {
  if (!map || !markerLayer) return;
  markerLayer.clearLayers();
  markersById = new Map();
  for (const spot of props.spots) {
    // Safety net for A3: pending spots never get a marker. Upstream already filters,
    // this only protects the map if the contract is ever broken.
    if (spot.status && spot.status !== 'approved') continue;
    const lat = Number(spot.lat);
    const lng = Number(spot.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue; // a bad row must not crash the map
    const style = TYPE_STYLE[spot.type] || FALLBACK_STYLE;
    const selected = spot.id === props.selectedId;
    const marker = L.marker([lat, lng], {
      icon: makeIcon(style, selected),
      title: spot.name || '',
      riseOnHover: true,
      zIndexOffset: selected ? 1000 : 0, // pin terpilih selalu di atas
    });
    marker.on('click', () => emit('select', spot.id)); // A7: props down, events up
    markerLayer.addLayer(marker);
    markersById.set(spot.id, { marker, spot, style });
  }
  prevSelectedId = props.selectedId;
}

// ---- A5: geolocate → fly (or jump, if reduced motion) the map to the fix ----
async function onGeolocate() {
  try {
    const pos = await locate();
    if (!map || !pos) return;
    const targetZoom = Math.max(map.getZoom(), 15);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      map.setView([pos.lat, pos.lng], targetZoom);
    } else {
      map.flyTo([pos.lat, pos.lng], targetZoom);
    }
  } catch {
    // rejection is expected after the toast; the app stays usable (A5 done-when)
  }
}

// ---- A6: pin-drop mode — exactly ONE teal pin; tapping again moves it ----
function onMapClickForPin(e) {
  if (tempPin) {
    tempPin.setLatLng(e.latlng); // replace: still exactly one pin
  } else {
    tempPin = L.marker(e.latlng, {
      icon: makeIcon({ cls: 'sg-pin--temp', glyph: 'bi-geo-alt-fill' }),
      interactive: false, // taps pass through so the pin can be re-placed
      keyboard: false,
    }).addTo(map); // kept OUTSIDE markerLayer so spot redraws never clear it
  }
  emit('pin-placed', e.latlng.lat, e.latlng.lng); // contract: pin-placed(lat, lng)
}

function enterPinMode() {
  if (!map) return;
  map.on('click', onMapClickForPin);
  mapEl.value.classList.add('sg-pinmode'); // crosshair cursor shows the pin-drop intent
}

function exitPinMode() {
  if (!map) return;
  map.off('click', onMapClickForPin);
  mapEl.value.classList.remove('sg-pinmode');
  if (tempPin) {
    map.removeLayer(tempPin); // pinMode false → the temporary pin is cleared
    tempPin = null;
  }
}

// A4: search/chips filtering happens upstream (filteredSpots) — we only redraw.
watch(() => props.spots, redrawMarkers);
// A6: toggling pinMode wires/unwires the tap handler; cancel stays AddSpotSheet's job.
watch(() => props.pinMode, (on) => (on ? enterPinMode() : exitPinMode()));

// Integrator (umpan balik owner, 2026-11-15): saat kartu/pin dipilih, SOROT pin-nya
// (ikon dibangun ulang dengan cincin + zIndex naik) dan TERBANG ke lokasinya.
// Zoom ≥16 = ambang clustering, jadi pin keluar dari gelembungnya dan tampil individual.
watch(
  () => props.selectedId,
  (id) => {
    for (const changed of [prevSelectedId, id]) {
      if (!changed) continue;
      const entry = markersById.get(changed);
      if (!entry) continue;
      const selected = changed === id;
      entry.marker.setIcon(makeIcon(entry.style, selected));
      entry.marker.setZIndexOffset(selected ? 1000 : 0);
    }
    prevSelectedId = id;
    if (!id || !map) return;
    const entry = markersById.get(id);
    if (!entry) return;
    const target = Math.max(map.getZoom(), 16);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileSheet = window.innerWidth < 992; // sheet detail menutup ±60% bawah layar
    const finishFly = () => {
      if (mobileSheet) {
        // angkat pin ke area peta yang tak tertutup sheet (sepertiga atas)
        map.panBy([0, Math.round(map.getSize().y * 0.28)]);
      }
    };
    if (reduceMotion) {
      map.setView([entry.spot.lat, entry.spot.lng], target);
      finishFly();
    } else {
      map.once('moveend', finishFly);
      map.flyTo([entry.spot.lat, entry.spot.lng], target);
    }
  },
);

onMounted(() => {
  // A1: init Leaflet centred on Yogyakarta; TILE_URL comes only from src/lib/config.js.
  map = L.map(mapEl.value, {
    center: [-7.7956, 110.3695],
    zoom: 12,
    zoomControl: false, // approved frames show no zoom buttons; pinch / wheel / keys still zoom
  });

  // OSM attribution is mandatory (docs/ui-copy.md §2 — the only English exception).
  L.tileLayer(TILE_URL, {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Cluster group (bukan layerGroup biasa): 7.173 divIcon pins akan menenggelamkan ponsel
  // dalam ribuan node DOM. Pin yang berdekatan digabung jadi gelembung teal berangka;
  // pada zoom ≥16 setiap pin tampil individual. API-nya kompatibel dengan layerGroup
  // (clearLayers/addLayer) — redrawMarkers tidak perlu berubah.
  markerLayer = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 55,
    disableClusteringAtZoom: 16,
    spiderfyOnMaxZoom: false,
    iconCreateFunction: (cluster) => {
      const n = cluster.getChildCount();
      const label = n >= 1000 ? `${(n / 1000).toFixed(1).replace('.', ',')} rb` : String(n);
      return L.divIcon({
        html: `<div class="sg-cluster"><span>${label}</span></div>`,
        className: 'sg-cluster-wrap',
        iconSize: [44, 44],
      });
    },
  }).addTo(map);

  // keep the canvas correct when the layout changes (rotate, desktop resize)
  resizeHandler = () => map && map.invalidateSize();
  window.addEventListener('resize', resizeHandler);

  redrawMarkers(); // initial draw with whatever the prop already holds
  if (props.pinMode) enterPinMode(); // A6: honour a pinMode that is already true at mount
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeHandler);
  if (map) {
    map.remove(); // clears panes, layers and listeners
    map = null;
  }
});
</script>

<template>
  <div id="map" ref="mapEl" class="map-pane">
    <!-- A2: legend, shown once on desktop only -->
    <div class="sg-legend">
      <div class="sg-legend__title">Legenda</div>
      <div v-for="item in LEGEND" :key="item.label" class="sg-legend__item">
        <span class="sg-pin sg-pin--mini" :class="item.cls">
          <i class="bi" :class="item.glyph" aria-hidden="true"></i>
        </span>
        <span>{{ item.label }}</span>
      </div>
    </div>

    <!-- A5: geolocate button (label per docs/ui-copy.md — Indonesian only) -->
    <button
      type="button"
      class="btn btn-light sg-geolocate"
      :disabled="geoLoading"
      aria-label="Lokasi saya"
      title="Lokasi saya"
      @click="onGeolocate"
    >
      <i
        class="bi"
        :class="geoLoading ? 'bi-arrow-repeat sg-spin' : 'bi-geo-alt'"
        aria-hidden="true"
      ></i>
    </button>
  </div>
</template>

<style>
/* Not scoped on purpose: L.divIcon HTML is created by Leaflet at runtime, so scoped
   data-attributes would never match it. Everything below is namespaced sg- . */

.map-pane {
  position: relative;
  width: 100%;
  height: 100%;
}

/* A6: pin-drop intent on the map cursor */
.map-pane.sg-pinmode {
  cursor: crosshair !important;
}

/* ---- A2: teardrop pin (approved mockup shape: white ring + white glyph) ---- */
.sg-pin-wrap {
  background: transparent;
  border: none;
}
.sg-pin {
  width: 34px;
  height: 34px;
  border: 2px solid #fff;
  border-radius: 50% 50% 50% 0; /* the sharp corner becomes the tip */
  transform: rotate(-45deg); /* ...pointing straight down */
  box-shadow: 0 3px 8px rgba(18, 51, 44, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}
.sg-pin .bi {
  transform: rotate(45deg); /* counter-rotate so the glyph sits upright */
  color: #fff;
  font-size: 15px;
  line-height: 1;
}
.sg-pin-wrap:focus-visible .sg-pin {
  outline: 3px solid var(--bs-focus-ring-color, #3dbfa3);
  outline-offset: 2px;
}

/* one colour per type — tokens live in src/assets/main.css (approved board palette) */
.sg-pin--masjid_besar {
  background: var(--singgah-teal);
}
.sg-pin--musala {
  background: var(--singgah-violet);
}
.sg-pin--terminal {
  background: var(--singgah-amber);
}
.sg-pin--spbu {
  background: var(--singgah-water);
}
.sg-pin--rest_area {
  background: var(--singgah-green);
}
/* presentation fallback for an out-of-contract type; muted ink, never used with valid data */
.sg-pin--unknown {
  background: #5a6e67;
}
/* A6: the temporary add-spot pin, primary teal */
.sg-pin--temp {
  background: var(--singgah-teal);
  box-shadow: 0 3px 10px rgba(18, 51, 44, 0.5);
}

/* Integrator: pin terpilih — cincin ganda + sedikit membesar, supaya terlihat jelas
   pin mana yang detailnya sedang terbuka (umpan balik owner, 2026-11-15) */
.sg-pin.is-selected {
  transform: rotate(-45deg) scale(1.2);
  border-width: 3px;
  box-shadow:
    0 0 0 4px rgba(14, 124, 102, 0.4),
    0 0 0 9px rgba(14, 124, 102, 0.15),
    0 6px 16px rgba(18, 51, 44, 0.45);
}

/* ---- A2: legend, desktop only (≥992px) ---- */
.sg-legend {
  display: none;
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  background: var(--bs-body-bg, #fff);
  border: 1px solid var(--bs-border-color, #e4dfd2);
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(18, 51, 44, 0.12);
  font-size: 12.5px;
  color: var(--bs-body-color, #12332c);
}
@media (min-width: 992px) {
  .sg-legend {
    display: flex;
  }
}
.sg-legend__title {
  font-weight: 700;
  margin-bottom: 2px;
}
.sg-legend__item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sg-pin--mini {
  width: 20px;
  height: 20px;
  border-width: 1.5px;
  box-shadow: none;
  flex: 0 0 auto;
}
.sg-pin--mini .bi {
  font-size: 9px;
}

/* ---- A5: geolocate button — ≥44px touch target (design-system §5) ---- */
.sg-geolocate {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 1000;
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 50%;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(18, 51, 44, 0.18);
}

/* locating spinner on the geolocate button (no English "Loading..." text allowed) */
.sg-spin {
  display: inline-block;
  animation: sg-spin 1s linear infinite;
}
@keyframes sg-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .sg-spin {
    animation: none;
  }
}
</style>
