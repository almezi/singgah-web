// src/lib/spotView.test.js — tes untuk helper tampilan spot (nilai kosong, waktu relatif, label).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TYPE_CHIPS, UNKNOWN_LABEL, isUnknown, relTime, verifyText } from './spotView';

describe('isUnknown', () => {
  it('mengembalikan "Belum ada info" untuk null, undefined, dan string kosong', () => {
    expect(isUnknown(null)).toBe(UNKNOWN_LABEL);
    expect(isUnknown(undefined)).toBe(UNKNOWN_LABEL);
    expect(isUnknown('')).toBe(UNKNOWN_LABEL);
  });

  it('mempertahankan nilai yang ada, termasuk false dan 0', () => {
    expect(isUnknown('24 jam')).toBe('24 jam');
    expect(isUnknown(false)).toBe(false);
    expect(isUnknown(0)).toBe(0);
  });
});

describe('relTime / verifyText', () => {
  const NOW = new Date('2026-11-24T12:00:00Z');
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  const ago = (ms) => new Date(NOW.getTime() - ms).toISOString();
  const HOUR = 3600 * 1000;

  it('null untuk tanggal kosong', () => {
    expect(relTime(null)).toBeNull();
    expect(relTime('')).toBeNull();
  });

  it('"baru saja" di bawah satu jam', () => {
    expect(relTime(ago(5 * 60 * 1000))).toBe('baru saja');
  });

  it('jam dan hari', () => {
    expect(relTime(ago(2 * HOUR))).toBe('2 jam lalu');
    expect(relTime(ago(3 * 24 * HOUR))).toBe('3 hari lalu');
  });

  it('tanggal di masa depan tidak negatif', () => {
    expect(relTime(ago(-HOUR))).toBe('baru saja');
  });

  it('verifyText', () => {
    expect(verifyText(null)).toBe('Belum diverifikasi');
    expect(verifyText(ago(2 * HOUR))).toBe('Diverifikasi 2 jam lalu');
  });
});

describe('TYPE_CHIPS', () => {
  it('"Semua" dulu, lalu lima jenis', () => {
    expect(TYPE_CHIPS).toHaveLength(6);
    expect(TYPE_CHIPS[0]).toEqual({ value: '', label: 'Semua' });
  });
});
