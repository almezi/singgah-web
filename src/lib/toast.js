// src/lib/toast.js — utilitas toast Bootstrap global (infrastruktur lane F).
// Dipakai lintas lane lewat kontrak: showToast('pesan') — teks selalu bahasa Indonesia.

import * as bootstrap from 'bootstrap';

export function showToast(message) {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    host.className = 'toast-container position-fixed start-50 translate-middle-x';
    host.style.bottom = 'var(--singgah-map-inset)';
    host.style.padding = '0';
    host.style.zIndex = '2000';
    document.body.appendChild(host);
  }

  const el = document.createElement('div');
  el.className = 'toast align-items-center text-bg-dark border-0';
  el.style.borderRadius = 'var(--singgah-overlay-radius)'; // seragam dengan legenda
  el.setAttribute('role', 'alert');
  el.innerHTML =
    '<div class="d-flex"><div class="toast-body"></div>' +
    '<button type="button" class="btn-close btn-close-white me-2 m-auto" ' +
    'data-bs-dismiss="toast" aria-label="Tutup"></button></div>';
  el.querySelector('.toast-body').textContent = message;

  host.appendChild(el);
  const toast = new bootstrap.Toast(el, { delay: 3000 });
  toast.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}
