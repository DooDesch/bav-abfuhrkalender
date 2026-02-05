import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { handleApiError } from '@/lib/utils/error-handler';
import { CACHE_TTL } from '@/lib/config/constants';
import { getHouseNumbers } from '@/lib/services/provider-registry';

// Cache house numbers by location and street
const getCachedHouseNumbers = unstable_cache(
  async (locationName: string, streetName: string) => {
    return getHouseNumbers(locationName, streetName);
  },
  ['house-numbers-by-location-street'],
  { revalidate: CACHE_TTL, tags: ['house-numbers'] }
);

/**
 * GET /api/house-numbers?location=<Ort>&street=<Straße>
 * Returns list of available house numbers for the given location and street
 * Returns empty array if no house number selection is required
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationName = searchParams.get('location')?.trim();
    const streetName = searchParams.get('street')?.trim();

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

    if (!streetName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameter "street" is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const houseNumbers = await getCachedHouseNumbers(locationName, streetName);
    
    return NextResponse.json({
      success: true,
      data: houseNumbers,
      // Include a flag to help the frontend know if selection is required
      required: houseNumbers.length > 0,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch house numbers');
  }
}
