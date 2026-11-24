// src/lib/spotView.js — satu sumber kebenaran untuk metadata tampilan spot (lane F).
// Dipakai SpotList + SpotDetail agar label, ikon, dan format waktu tidak pernah
// berbeda antar komponen (review 2026-11-15: temuan duplikasi → modul kanonik ini).
// Murni data + fungsi murni — tanpa Vue, tanpa Supabase, mudah dibaca dan diuji.

export const UNKNOWN_LABEL = 'Belum ada info';

// Jenis spot: label Indonesia + kelas tint warna (docs/design-system.md §2 — palet board)
export const SPOT_TYPES = {
  masjid_besar: { label: 'Masjid Besar', cls: 't-masjid' },
  musala: { label: 'Musala', cls: 't-musala' },
  terminal: { label: 'Terminal', cls: 't-terminal' },
  spbu: { label: 'SPBU', cls: 't-spbu' },
  rest_area: { label: 'Rest Area', cls: 't-rest' },
};

// Ikon SVG statis milik desain board (bukan data pengguna — aman untuk v-html)
export const TYPE_GLYPHS = {
  masjid_besar:
    '<path d="M12 3C7.6 3 4 6.8 4 11.5V20h16v-8.5C20 6.8 16.4 3 12 3z"/><rect x="2" y="20" width="20" height="2"/>',
  musala: '<path d="M4 21V5l8-3 8 3v16h-5v-6h-6v6H4z"/>',
  terminal:
    '<path fill-rule="evenodd" d="M4 4c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2v2h-2v-2H8v2H6v-2c-1.1 0-2-.9-2-2V4zm2 2v5h12V6H6zm1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm9 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>',
  spbu: '<path d="M12 2s6 6.6 6 11a6 6 0 1 1-12 0c0-4.4 6-11 6-11z"/>',
  rest_area: '<path d="M12 3L2 20h7l3-6 3 6h7L12 3z"/>',
};

// Label nilai kolom `water` (docs/ui-copy.md §3)
export const WATER_LABELS = {
  kran_mandi: 'Kran mandi',
  wudhu_only: 'Wudhu saja',
  air_isi: 'Air isi',
  tidak_ada: 'Tidak ada',
};

// Chip saringan: 'Semua' ('' = semua jenis) + lima jenis (docs/ui-copy.md §2)
export const TYPE_CHIPS = [
  { value: '', label: 'Semua' },
  ...Object.entries(SPOT_TYPES).map(([value, t]) => ({ value, label: t.label })),
];

// Nilai kosong SELALU 'Belum ada info' — tidak pernah dikarang (aturan keras proyek)
export function isUnknown(value) {
  return value === null || value === undefined || value === '' ? UNKNOWN_LABEL : value;
}

// Waktu relatif verifikasi: 'baru saja' · '2 jam lalu' · '3 hari lalu' (docs/ui-copy.md §1)
export function relTime(iso) {
  if (iso === null || iso === undefined || iso === '') return null;
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return 'baru saja';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + ' jam lalu';
  return Math.floor(hours / 24) + ' hari lalu';
}

// 'Diverifikasi …' saat ada tanggal, 'Belum diverifikasi' saat kosong
export function verifyText(iso) {
  const rel = relTime(iso);
  return rel ? 'Diverifikasi ' + rel : 'Belum diverifikasi';
}
