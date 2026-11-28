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
    class="theme-toggle"
    :aria-label="isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'"
    :aria-pressed="isDark"
    @click="toggle"
  >
    <i class="bi" :class="isDark ? 'bi-sun' : 'bi-moon-stars'" aria-hidden="true"></i>
  </button>
</template>

<style scoped>
.theme-toggle {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 0;
  border: 1px solid var(--singgah-line);
  border-radius: 13px;
  color: var(--singgah-muted);
  background: var(--singgah-surface-2);
}
.theme-toggle:hover {
  color: var(--singgah-ink);
  border-color: rgba(14, 124, 102, 0.42);
  background: var(--singgah-card);
}
.theme-toggle:focus-visible {
  outline: 3px solid var(--bs-focus-ring-color);
  outline-offset: 2px;
}
</style>
