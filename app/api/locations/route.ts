import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { handleApiError } from '@/lib/utils/error-handler';
import { CACHE_TTL } from '@/lib/config/constants';
import { getAllLocations } from '@/lib/services/provider-registry';

// Cache all locations (from all providers) for the configured TTL
// Uses Promise.all internally for parallel fetching - no performance penalty
const getCachedLocations = unstable_cache(
  async () => {
    return getAllLocations();
  },
  ['locations-all-providers'],
  { revalidate: CACHE_TTL, tags: ['locations'] }
);

/**
 * GET /api/locations
 * Returns list of available locations (Orte) from all providers for autocomplete
 * Each location includes a `provider` field indicating which service it belongs to
 */
export async function GET() {
  try {
    const locations = await getCachedLocations();
    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch locations');
  }
}
