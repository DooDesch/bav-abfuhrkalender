import { NextResponse } from 'next/server';
import { BAVApiService } from '@/lib/services/bav-api.service';
import { cacheService } from '@/lib/services/cache.service';
import {
  ORT_ID_WERMELSKIRCHEN,
  STRASSE_NAME_ELBRINGHAUSEN,
  CACHE_TTL,
} from '@/lib/config/constants';
import { handleApiError, createSuccessResponse } from '@/lib/utils/error-handler';
import type { WasteCalendarResponse } from '@/lib/types/bav-api.types';

// Force handler to run on every request so in-memory cache can be used
export const dynamic = 'force-dynamic';

const CACHE_KEY = 'waste-collection:elbringhausen';

/**
 * GET /api/abfuhrkalender
 * Returns waste collection calendar data for Elbringhausen street in Wermelskirchen
 */
export async function GET() {
  try {
    // Check in-memory cache first
    const cachedData = cacheService.get<WasteCalendarResponse>(CACHE_KEY);
    // getTtl() returns absolute expiry timestamp in ms (or undefined if missing, 0 if no TTL)
    const expiryTimestamp = cacheService.getTtl(CACHE_KEY);

    if (cachedData && expiryTimestamp != null && expiryTimestamp > Date.now()) {
      // Use absolute expiry timestamp from node-cache for correct cacheExpiresAt
      const cacheExpiresAt = new Date(expiryTimestamp).toISOString();

      return NextResponse.json(
        createSuccessResponse(cachedData, true, cacheExpiresAt)
      );
    }

    // Fetch from BAV API
    const apiService = new BAVApiService();
    const data = await apiService.getWasteCollectionData(
      ORT_ID_WERMELSKIRCHEN,
      STRASSE_NAME_ELBRINGHAUSEN
    );

    // Store in cache
    cacheService.set(CACHE_KEY, data);

    // Calculate expiration time: CACHE_TTL is in seconds, convert to milliseconds
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
 * POST /api/abfuhrkalender
 * Manually refresh the cache
 */
export async function POST() {
  try {
    // Clear cache
    cacheService.delete(CACHE_KEY);

    // Fetch fresh data
    const apiService = new BAVApiService();
    const data = await apiService.getWasteCollectionData(
      ORT_ID_WERMELSKIRCHEN,
      STRASSE_NAME_ELBRINGHAUSEN
    );

    // Store in cache
    cacheService.set(CACHE_KEY, data);

    // Calculate expiration time: CACHE_TTL is in seconds, convert to milliseconds
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
