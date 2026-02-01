import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { cacheService } from '@/lib/services/cache.service';
import type { WasteCalendarResponse } from '@/lib/types/bav-api.types';

const mockWasteCalendarData: WasteCalendarResponse = {
  location: { id: 2813240, name: 'Wermelskirchen' },
  street: { id: 1, name: 'Elbringhausen' },
  houseNumbers: [],
  fractions: [],
  appointments: [],
};

vi.mock('@/lib/services/bav-api.service', () => {
  const mockData: WasteCalendarResponse = {
    location: { id: 2813240, name: 'Wermelskirchen' },
    street: { id: 1, name: 'Elbringhausen' },
    houseNumbers: [],
    fractions: [],
    appointments: [],
  };
  return {
    BAVApiService: class MockBAVApiService {
      getWasteCollectionData = () => Promise.resolve(mockData);
    },
  };
});

function createRequest(searchParams: string): NextRequest {
  return new NextRequest(`http://localhost/api/abfuhrkalender?${searchParams}`);
}

describe('GET /api/abfuhrkalender', () => {
  beforeEach(async () => {
    cacheService.clear();
  });

  it('returns 400 when location and street are missing', async () => {
    const { GET } = await import('./route');
    const request = createRequest('');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain('location');
    expect(json.error).toContain('street');
  });

  it('returns 400 when only location is provided', async () => {
    const { GET } = await import('./route');
    const request = createRequest('location=Wermelskirchen');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('returns 400 when only street is provided', async () => {
    const { GET } = await import('./route');
    const request = createRequest('street=Elbringhausen');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('first GET with location and street returns cached: false and fetches from API', async () => {
    const { GET } = await import('./route');
    const request = createRequest(
      'location=Wermelskirchen&street=Elbringhausen'
    );
    const response = await GET(request);
    const json = await response.json();

    expect(response.ok).toBe(true);
    expect(json.success).toBe(true);
    expect(json.cached).toBe(false);
    expect(json.data).toEqual(mockWasteCalendarData);
    expect(json.cacheExpiresAt).toBeDefined();
  });

  it('second GET with same params returns cached: true and uses in-memory cache', async () => {
    const { GET } = await import('./route');
    const request = createRequest(
      'location=Wermelskirchen&street=Elbringhausen'
    );
    await GET(request);
    const response = await GET(request);
    const json = await response.json();

    expect(response.ok).toBe(true);
    expect(json.success).toBe(true);
    expect(json.cached).toBe(true);
    expect(json.data).toEqual(mockWasteCalendarData);
    expect(json.cacheExpiresAt).toBeDefined();
    const expiresAt = new Date(json.cacheExpiresAt).getTime();
    expect(expiresAt).toBeGreaterThan(Date.now());
  });
});
