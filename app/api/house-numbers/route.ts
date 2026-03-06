import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { handleApiError } from '@/lib/utils/error-handler';
import { CACHE_TTL } from '@/lib/config/constants';
import { getHouseNumbers, resolveProvider, WasteProvider } from '@/lib/services/provider-registry';

/**
 * GET /api/house-numbers?location=<Ort>&street=<Straße>&sid=<StraßenID>
 * Returns list of available house numbers for the given location and street
 * Returns empty array if no house number selection is required
 * sid (streetId) is optional - if provided, skips expensive street lookup for ASO
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationName = searchParams.get('location')?.trim();
    const streetName = searchParams.get('street')?.trim();
    const streetId = searchParams.get('sid')?.trim() || undefined;

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

    // Cache per location+street+streetId so ASO and BAV don't share a result
    const houseNumbers = await unstable_cache(
      () => getHouseNumbers(locationName, streetName, streetId),
      ['house-numbers', locationName, streetName, streetId ?? ''],
      { revalidate: CACHE_TTL, tags: ['house-numbers'] }
    )();

    // Non-BAV providers (e.g. ASO) always require a house number; BAV only when the API returns a list
    const provider = resolveProvider(locationName);
    const required =
      provider !== WasteProvider.BAV || houseNumbers.length > 0;

    return NextResponse.json({
      success: true,
      data: houseNumbers,
      required,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch house numbers');
  }
}
