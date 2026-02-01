import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheService } from '@/lib/services/cache.service';
import type { AbfuhrkalenderResponse } from '@/lib/types/bav-api.types';

const mockAbfuhrkalenderData: AbfuhrkalenderResponse = {
  ort: { id: 2813240, name: 'Wermelskirchen' },
  strasse: { id: 1, name: 'Elbringhausen' },
  hausnummern: [],
  fraktionen: [],
  termine: [],
};

vi.mock('@/lib/services/bav-api.service', () => {
  const mockData: AbfuhrkalenderResponse = {
    ort: { id: 2813240, name: 'Wermelskirchen' },
    strasse: { id: 1, name: 'Elbringhausen' },
    hausnummern: [],
    fraktionen: [],
    termine: [],
  };
  return {
    BAVApiService: class MockBAVApiService {
      getWasteCollectionData = () => Promise.resolve(mockData);
    },
  };
});

describe('GET /api/abfuhrkalender', () => {
  beforeEach(async () => {
    cacheService.clear();
  });

  it('first GET returns cached: false and fetches from API', async () => {
    const { GET } = await import('./route');
    const response = await GET();
    const json = await response.json();

    expect(response.ok).toBe(true);
    expect(json.success).toBe(true);
    expect(json.cached).toBe(false);
    expect(json.data).toEqual(mockAbfuhrkalenderData);
    expect(json.cacheExpiresAt).toBeDefined();
  });

  it('second GET returns cached: true and uses in-memory cache', async () => {
    const { GET } = await import('./route');
    await GET();
    const response = await GET();
    const json = await response.json();

    expect(response.ok).toBe(true);
    expect(json.success).toBe(true);
    expect(json.cached).toBe(true);
    expect(json.data).toEqual(mockAbfuhrkalenderData);
    expect(json.cacheExpiresAt).toBeDefined();
    const expiresAt = new Date(json.cacheExpiresAt).getTime();
    expect(expiresAt).toBeGreaterThan(Date.now());
  });
});
