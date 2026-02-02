import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getBAVApiService } from '@/lib/services/bav-api.service';
import { handleApiError } from '@/lib/utils/error-handler';
import { CACHE_TTL } from '@/lib/config/constants';

// Cache streets by location ID
const getCachedStreets = unstable_cache(
  async (locationId: number) => {
    const apiService = getBAVApiService();
    return apiService.getStreets(locationId);
  },
  ['streets'],
  { revalidate: CACHE_TTL, tags: ['streets'] }
);

/**
 * GET /api/streets?location=<Ort>
 * Returns list of streets for the given location (Ort) for autocomplete
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

    const apiService = getBAVApiService();
    const location = await apiService.getLocationByName(locationName);
    const streets = await getCachedStreets(location.id);
    return NextResponse.json({ success: true, data: streets });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch streets');
  }
}
