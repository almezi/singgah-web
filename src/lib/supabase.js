// src/lib/supabase.js — satu pintu untuk semua panggilan Supabase.
// Klien + fungsi API beku (kontrak: docs/api-contract.md §4, OQ-2 diamended OQ-15 →
// supabase-js via npm). Lane lain TIDAK pernah mengimpor file ini langsung — mereka
// memakai state dari useSpots lewat props/events dari App.vue.

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// createClient dibungkus try/catch: selama owner belum menempel URL asli di config.js,
// aplikasi tetap jalan (UI tampil normal) — panggilan database baru melempar pesan jelas.
export const supabase = (() => {
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch {
    return null;
  }
})();

function assertClient() {
  if (!supabase) {
    throw new Error('SUPABASE_URL / SUPABASE_ANON_KEY belum diisi di src/lib/config.js');
  }
}

/*
 * Kontrak kolom SPOT yang beku (docs/api-contract.md §5) — jangan ubah nama maupun daftar:
 * id, name, type, lat, lng, water, hours, bike_parking, women_friendly,
 * notes, status, source, last_verified_at, created_at
 */

// isUnknown(value) pindah ke src/lib/spotView.js (2026-11-15, review: ini helper
// tampilan, bukan urusan database) — impor dari situ bila diperlukan.

// loadApprovedSpots() — baca SEMUA spot approved; RLS membatasi baris di sisi database.
// PostgREST membatasi ±1000 baris per permintaan secara bawaan, jadi kita ambil
// halaman demi halaman (range) sampai habis.
export async function loadApprovedSpots() {
  assertClient();
  const PAGE = 1000;
  const all = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('spots')
      .select('*')
      .eq('status', 'approved')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < PAGE) return all; // halaman terakhir yang tidak penuh = selesai
    from += PAGE;
  }
}

// insertPendingSpot(payload) — spot baru; RLS memaksa status='pending', source='user'.
// PENTING — TANPA .select(): meminta balikan baris (return=representation) membuat
// PostgREST membaca ulang baris baru lewat SELECT policy (hanya 'approved'), dan baris
// pending tentu tak terlihat oleh anon → seluruh insert ditolak (42501). Pola yang
// benar: kirim minimal (return=minimal), lalu bangun baris lokal untuk 'Tinjauan saya'.
// id lokal dibuat di sini hanya untuk kunci tampilan — bukan id database.
export async function insertPendingSpot(payload) {
  assertClient();
  const row = { ...payload, status: 'pending', source: 'user', last_verified_at: null };
  const { error } = await supabase.from('spots').insert(row);
  if (error) throw error;
  return { ...row, id: crypto.randomUUID() };
}

// bumpVerified(spotId) — "Masih ada ✓": lewat fungsi Postgres bump_verified
// (security definer, batas 1 bump per spot per jam — keputusan G3, 2026-11-09)
export async function bumpVerified(spotId) {
  assertClient();
  const { data, error } = await supabase.rpc('bump_verified', { spot_id: spotId });
  if (error) throw error;
  return data;
}
