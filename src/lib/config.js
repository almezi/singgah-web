// src/lib/config.js — satu tempat untuk semua alamat dan kunci publik.
// Nilai asli sudah diisi owner (2026-11-14). Keduanya aman untuk publik — pelindung
// datanya adalah RLS (docs/data-model.md §3). URL peta hanya boleh ada di file ini
// (kontrak F2). File js/config.js yang lama sudah tidak dipakai lagi oleh aplikasi.

export const SUPABASE_URL = 'https://dixrnlberepuvgghnnkn.supabase.co'; // contoh: 'https://abcdefghij.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable_MDgiWnIPiCxWs-g446Tc5Q_4MbDbPlK'; // anon public (eyJ...) / publishable (sb_publishable_...)
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
