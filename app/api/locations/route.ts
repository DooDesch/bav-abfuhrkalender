import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getBAVApiService } from '@/lib/services/bav-api.service';
import { handleApiError } from '@/lib/utils/error-handler';
import { CACHE_TTL } from '@/lib/config/constants';

// Cache locations for the configured TTL
const getCachedLocations = unstable_cache(
  async () => {
    const apiService = getBAVApiService();
    return apiService.getLocations();
  },
  ['locations'],
  { revalidate: CACHE_TTL, tags: ['locations'] }
);

/**
 * GET /api/locations
 * Returns list of available locations (Orte) for autocomplete
 */
export async function GET() {
  try {
    const locations = await getCachedLocations();
    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch locations');
  }
}
