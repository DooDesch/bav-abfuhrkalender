import { NextRequest, NextResponse } from 'next/server';
import { cacheService } from '@/lib/services/cache.service';
import { CACHE_TTL, CACHE_REFRESH_COOLDOWN } from '@/lib/config/constants';
import { handleApiError, createSuccessResponse } from '@/lib/utils/error-handler';
import {
  buildWasteCollectionCacheKey,
  buildCacheRefreshCooldownKey,
} from '@/lib/utils/cache-keys';
import type { WasteCalendarResponse } from '@/lib/types/bav-api.types';
import { getWasteCollectionData } from '@/lib/services/provider-registry';

// Force handler to run on every request so in-memory cache can be used
export const dynamic = 'force-dynamic';

interface RequestParams {
  location: string;
  street: string;
  houseNumberId?: string;
}

function getRequestParams(request: NextRequest): RequestParams | null {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location')?.trim();
  const street = searchParams.get('street')?.trim();
  const houseNumberId = searchParams.get('houseNumberId')?.trim() || undefined;
  if (!location || !street) return null;
  return { location, street, houseNumberId };
}

/**
 * GET /api/abfuhrkalender?location=<Ort>&street=<Straße>&houseNumberId=<HausnummerID>
 * Returns waste collection calendar data for the given location and street
 * houseNumberId is optional - required for some ASO locations
 */
export async function GET(request: NextRequest) {
  try {
    const params = getRequestParams(request);
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

    const { location, street, houseNumberId } = params;
    // Include houseNumberId in cache key if provided
    const cacheKey = houseNumberId 
      ? `${buildWasteCollectionCacheKey(location, street)}:hnr:${houseNumberId}`
      : buildWasteCollectionCacheKey(location, street);

    // Check in-memory cache first
    const cachedData = cacheService.get<WasteCalendarResponse>(cacheKey);
    const expiryTimestamp = cacheService.getTtl(cacheKey);

    if (cachedData && expiryTimestamp != null && expiryTimestamp > Date.now()) {
      const cacheExpiresAt = new Date(expiryTimestamp).toISOString();
      return NextResponse.json(
        createSuccessResponse(cachedData, true, cacheExpiresAt)
      );
    }

    // Automatically resolves the correct provider (BAV or AbfallIO)
    const data = await getWasteCollectionData(location, street, houseNumberId);

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
 * POST /api/abfuhrkalender?location=<Ort>&street=<Straße>&houseNumberId=<HausnummerID>
 * Manually refresh the cache for the given location and street
 * Has a 10-minute cooldown to prevent spam and unnecessary API costs
 */
export async function POST(request: NextRequest) {
  try {
    const params = getRequestParams(request);
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

    const { location, street, houseNumberId } = params;
    const cooldownKey = houseNumberId
      ? `${buildCacheRefreshCooldownKey(location, street)}:hnr:${houseNumberId}`
      : buildCacheRefreshCooldownKey(location, street);

    // Check if cooldown is active
    const cooldownExpiry = cacheService.getTtl(cooldownKey);
    if (cooldownExpiry && cooldownExpiry > Date.now()) {
      const remainingSeconds = Math.ceil((cooldownExpiry - Date.now()) / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      return NextResponse.json(
        {
          success: false,
          error: `Cache refresh is on cooldown. Please wait ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''} before trying again.`,
          cooldownExpiresAt: new Date(cooldownExpiry).toISOString(),
          remainingSeconds,
          timestamp: new Date().toISOString(),
        },
        { status: 429 }
      );
    }

    const cacheKey = houseNumberId
      ? `${buildWasteCollectionCacheKey(location, street)}:hnr:${houseNumberId}`
      : buildWasteCollectionCacheKey(location, street);

    cacheService.delete(cacheKey);

    // Automatically resolves the correct provider (BAV or AbfallIO)
    const data = await getWasteCollectionData(location, street, houseNumberId);

    cacheService.set(cacheKey, data);

    // Set cooldown to prevent spam
    cacheService.set(cooldownKey, true, CACHE_REFRESH_COOLDOWN);

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
