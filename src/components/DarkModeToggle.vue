<!-- src/components/DarkModeToggle.vue — tombol terang/gelap, tersimpan di localStorage (F5).
     Tema diterapkan ke <html data-bs-theme="..."> sehingga seluruh variabel Bootstrap ikut. -->

<script setup>
import { ref } from 'vue';

const KEY = 'singgah-theme';
const isDark = ref(document.documentElement.getAttribute('data-bs-theme') === 'dark');

function toggle() {
  isDark.value = !isDark.value;
  const theme = isDark.value ? 'dark' : 'light';
  document.documentElement.setAttribute('data-bs-theme', theme);
  localStorage.setItem(KEY, theme);
}
</script>

<template>
  <button
    type="button"
    class="btn btn-sm btn-outline-secondary"
    :aria-label="isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'"
    @click="toggle"
  >
    <i class="bi" :class="isDark ? 'bi-sun' : 'bi-moon-stars'"></i>
  </button>
</template>
