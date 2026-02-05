import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { handleApiError } from '@/lib/utils/error-handler';
import { STREETS_CACHE_TTL } from '@/lib/config/constants';
import { getStreets } from '@/lib/services/provider-registry';

// Cache version - increment when street loading logic changes
const CACHE_VERSION = 'v2';

// Cache streets by location name for 24 hours (streets rarely change)
const getCachedStreets = unstable_cache(
  async (locationName: string) => {
    // Automatically resolves the correct provider
    return getStreets(locationName);
  },
  [`streets-by-location-${CACHE_VERSION}`],
  { revalidate: STREETS_CACHE_TTL, tags: ['streets'] }
);

/**
 * GET /api/streets?location=<Ort>
 * Returns list of streets for the given location (Ort) for autocomplete
 * Automatically resolves the correct provider (BAV or AbfallIO)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationName = searchParams.get('location')?.trim();
    if (!locationName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameter "location" is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const streets = await getCachedStreets(locationName);
    return NextResponse.json({ success: true, data: streets });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch streets');
  }
}
