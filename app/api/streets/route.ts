import { NextRequest, NextResponse } from 'next/server';
import { BAVApiService } from '@/lib/services/bav-api.service';
import { handleApiError } from '@/lib/utils/error-handler';

export const dynamic = 'force-dynamic';

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

    const apiService = new BAVApiService();
    const location = await apiService.getLocationByName(locationName);
    const streets = await apiService.getStreets(location.id);
    return NextResponse.json({ success: true, data: streets });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch streets');
  }
}
