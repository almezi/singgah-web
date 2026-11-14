// vite.config.js — konfigurasi build: Vue plugin saja, tanpa konfigurasi tambahan.
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
});
