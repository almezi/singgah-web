// src/main.js — memulai aplikasi: createApp + impor CSS Bootstrap + tema awal.
// Dimiliki lane F (Wave 0), lalu integrator (Wave 4).

import { createApp } from 'vue';
import './assets/bootstrap-custom.scss'; // Bootstrap SCSS — hanya modul yang dipakai (lihat header file)
import './assets/icons.css';             // 24 ikon Bootstrap Icons sebagai CSS mask — tanpa font
import './assets/main.css';
import App from './App.vue';

// Tema awal sebelum DarkModeToggle membaca localStorage (hindari kedipan terang/gelap)
const savedTheme = localStorage.getItem('singgah-theme');
if (savedTheme === 'dark' || savedTheme === 'light') {
  document.documentElement.setAttribute('data-bs-theme', savedTheme);
}

createApp(App).mount('#app');
