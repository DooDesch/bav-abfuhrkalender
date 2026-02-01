import { NextResponse } from 'next/server';
import { BAVApiService } from '@/lib/services/bav-api.service';
import { handleApiError } from '@/lib/utils/error-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/locations
 * Returns list of available locations (Orte) for autocomplete
 */
export async function GET() {
  try {
    const apiService = new BAVApiService();
    const locations = await apiService.getLocations();
    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch locations');
  }
}
