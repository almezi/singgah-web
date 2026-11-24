// src/composables/useSpots.test.js — tes filteredSpots (pencarian + chip jenis).
// Supabase tidak dipanggil: kita hanya mengisi state `spots` langsung.
import { beforeEach, describe, expect, it } from 'vitest';
import { useSpots } from './useSpots';

const { spots, query, type, filteredSpots } = useSpots();

beforeEach(() => {
  query.value = '';
  type.value = '';
  spots.value = [
    { id: '1', name: 'Masjid Jogokariyan', type: 'masjid_besar' },
    { id: '2', name: 'Terminal Giwangan', type: 'terminal' },
    { id: '3', name: 'Musala Al-Ikhlas', type: 'musala' },
    { id: '4', name: null, type: 'spbu' },
  ];
});

describe('filteredSpots', () => {
  it('tanpa filter: semua spot', () => {
    expect(filteredSpots.value).toHaveLength(4);
  });

  it('pencarian tidak peka huruf besar/kecil dan mengabaikan spasi tepi', () => {
    query.value = '  giwangan ';
    expect(filteredSpots.value.map((s) => s.id)).toEqual(['2']);
  });

  it('chip jenis menyaring', () => {
    type.value = 'musala';
    expect(filteredSpots.value.map((s) => s.id)).toEqual(['3']);
  });

  it('pencarian + jenis digabung', () => {
    type.value = 'terminal';
    query.value = 'masjid';
    expect(filteredSpots.value).toHaveLength(0);
  });

  it('nama null tidak membuat error', () => {
    query.value = 'x';
    expect(filteredSpots.value).toHaveLength(0);
  });
});
