// src/main.js — memulai aplikasi: createApp + impor CSS Bootstrap + tema awal.
// Dimiliki lane F (Wave 0), lalu integrator (Wave 4).

import { createApp } from 'vue';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap'; // JS bundle: offcanvas, toast, collapse, dll.
import './assets/main.css';
import App from './App.vue';

// Tema awal sebelum DarkModeToggle membaca localStorage (hindari kedipan terang/gelap)
const savedTheme = localStorage.getItem('singgah-theme');
if (savedTheme === 'dark' || savedTheme === 'light') {
  document.documentElement.setAttribute('data-bs-theme', savedTheme);
}

createApp(App).mount('#app');
