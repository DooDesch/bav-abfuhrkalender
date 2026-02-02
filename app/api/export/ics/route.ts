import { NextRequest, NextResponse } from 'next/server';
import { getBAVApiService } from '@/lib/services/bav-api.service';
import { cacheService } from '@/lib/services/cache.service';
import { handleApiError } from '@/lib/utils/error-handler';
import { buildIcs } from '@/lib/utils/ics-generator';
import { buildWasteCollectionCacheKey } from '@/lib/utils/cache-keys';
import type { WasteCalendarResponse } from '@/lib/types/bav-api.types';

export const dynamic = 'force-dynamic';

function parseIsoDate(value: string | null): Date | null {
  if (!value?.trim()) return null;
  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * GET /api/export/ics?location=<Ort>&street=<Straße>&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&fractions=1,2,3
 * Returns waste collection appointments as iCalendar (.ics) for Google Calendar etc.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location')?.trim();
    const street = searchParams.get('street')?.trim();

    if (!location || !street) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameters "location" and "street" are required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const dateFrom = parseIsoDate(searchParams.get('dateFrom'));
    const dateTo = parseIsoDate(searchParams.get('dateTo'));
    const fractionsParam = searchParams.get('fractions')?.trim();
    const fractionIds =
      fractionsParam && fractionsParam.length > 0
        ? new Set(
            fractionsParam
              .split(',')
              .map((s) => parseInt(s.trim(), 10))
              .filter((n) => !Number.isNaN(n))
          )
        : null;

    const cacheKey = buildWasteCollectionCacheKey(location, street);
    let data: WasteCalendarResponse | undefined = cacheService.get<WasteCalendarResponse>(cacheKey);
    const expiryTimestamp = cacheService.getTtl(cacheKey);

    if (!data || expiryTimestamp == null || expiryTimestamp <= Date.now()) {
      const apiService = getBAVApiService();
      data = await apiService.getWasteCollectionData(location, street);
      cacheService.set(cacheKey, data);
    }

    let appointments = data.appointments;

    if (fractionIds !== null && fractionIds.size > 0) {
      appointments = appointments.filter((a) => fractionIds.has(a.fractionId));
    }

    if (dateFrom != null || dateTo != null) {
      appointments = appointments.filter((a) => {
        const d = new Date(a.date);
        d.setHours(0, 0, 0, 0);
        if (dateFrom != null && d < dateFrom) return false;
        if (dateTo != null) {
          const toEnd = new Date(dateTo);
          toEnd.setHours(23, 59, 59, 999);
          if (d > toEnd) return false;
        }
        return true;
      });
    }

    const ics = buildIcs(appointments, {
      locationName: data.location.name,
      streetName: data.street.name,
      calendarId: String(data.street.id),
    });

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="abfuhrkalender.ics"',
      },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to export waste collection calendar');
  }
}
