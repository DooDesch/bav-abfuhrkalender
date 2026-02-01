import { NextRequest, NextResponse } from 'next/server';
import { BAVApiService } from '@/lib/services/bav-api.service';
import { cacheService } from '@/lib/services/cache.service';
import { CACHE_TTL } from '@/lib/config/constants';
import { handleApiError, createSuccessResponse } from '@/lib/utils/error-handler';
import type { WasteCalendarResponse } from '@/lib/types/bav-api.types';

// Force handler to run on every request so in-memory cache can be used
export const dynamic = 'force-dynamic';

function buildCacheKey(location: string, street: string): string {
  const normalizedLocation = location.trim().toLowerCase();
  const normalizedStreet = street.trim().toLowerCase();
  return `waste-collection:${normalizedLocation}:${normalizedStreet}`;
}

function getLocationAndStreet(request: NextRequest): { location: string; street: string } | null {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location')?.trim();
  const street = searchParams.get('street')?.trim();
  if (!location || !street) return null;
  return { location, street };
}

/**
 * GET /api/abfuhrkalender?location=<Ort>&street=<Straße>
 * Returns waste collection calendar data for the given location and street
 */
export async function GET(request: NextRequest) {
  try {
    const params = getLocationAndStreet(request);
    if (!params) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameters "location" and "street" are required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const { location, street } = params;
    const cacheKey = buildCacheKey(location, street);

    // Check in-memory cache first
    const cachedData = cacheService.get<WasteCalendarResponse>(cacheKey);
    const expiryTimestamp = cacheService.getTtl(cacheKey);

    if (cachedData && expiryTimestamp != null && expiryTimestamp > Date.now()) {
      const cacheExpiresAt = new Date(expiryTimestamp).toISOString();
      return NextResponse.json(
        createSuccessResponse(cachedData, true, cacheExpiresAt)
      );
    }

    const apiService = new BAVApiService();
    const data = await apiService.getWasteCollectionData(location, street);

    cacheService.set(cacheKey, data);
    const cacheExpiresAt = new Date(
      Date.now() + CACHE_TTL * 1000
    ).toISOString();

    return NextResponse.json(
      createSuccessResponse(data, false, cacheExpiresAt)
    );
  } catch (error) {
    return handleApiError(error, 'Failed to fetch waste collection data');
  }
}

/**
 * POST /api/abfuhrkalender?location=<Ort>&street=<Straße>
 * Manually refresh the cache for the given location and street
 */
export async function POST(request: NextRequest) {
  try {
    const params = getLocationAndStreet(request);
    if (!params) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameters "location" and "street" are required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const { location, street } = params;
    const cacheKey = buildCacheKey(location, street);

    cacheService.delete(cacheKey);

    const apiService = new BAVApiService();
    const data = await apiService.getWasteCollectionData(location, street);

    cacheService.set(cacheKey, data);
    const cacheExpiresAt = new Date(
      Date.now() + CACHE_TTL * 1000
    ).toISOString();

    return NextResponse.json(
      createSuccessResponse(data, false, cacheExpiresAt)
    );
  } catch (error) {
    return handleApiError(error, 'Failed to refresh waste collection data');
  }
}
