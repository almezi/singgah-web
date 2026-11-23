// vite.config.js — konfigurasi build: Vue plugin + opsi Sass.
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        // Pisahkan vendor besar jadi chunk sendiri: cache browser awet (kode app berubah
        // tapi leaflet/supabase/vue tidak), dan tiap chunk < 500 kB → tanpa warning.
        manualChunks: {
          'vendor-vue': ['vue'],
          'vendor-leaflet': ['leaflet', 'leaflet.markercluster'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3 masih memakai @import Sass (deprecated di dart-sass 1.80+).
        // Peringatannya dibungkam sampai Bootstrap sendiri beralih ke @use.
        silenceDeprecations: ['import', 'global-builtin', 'legacy-js-api', 'color-functions', 'slash-div', 'if-function'],
      },
    },
  },
});
