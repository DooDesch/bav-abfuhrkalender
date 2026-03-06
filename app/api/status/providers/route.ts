import { NextResponse } from 'next/server';
import { BAV_API_BASE_URL, ABFALL_IO_BASE_URL, ABFALL_IO_ASO_KEY, ABFALL_IO_MODUS_KEY, RSAG_API_BASE_URL } from '@/lib/config/constants';
import { WasteProvider, PROVIDERS } from '@/lib/services/provider-registry';
import { cacheService } from '@/lib/services/cache.service';

export const dynamic = 'force-dynamic';

type ProviderStatus = 'ok' | 'down' | 'timeout';

export interface ProviderStatusResponse {
  providers: Record<string, { status: ProviderStatus; name: string }>;
  timestamp: string;
}

const CACHE_KEY = 'provider-status';
const STATUS_CACHE_TTL = 120; // 2 minutes
const PING_TIMEOUT = 5000;

async function ping(url: string): Promise<ProviderStatus> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(PING_TIMEOUT),
      cache: 'no-store',
    });
    return response.ok ? 'ok' : 'down';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return 'timeout';
    }
    return 'down';
  }
}

const PING_URLS: Record<WasteProvider, string> = {
  [WasteProvider.BAV]: `${BAV_API_BASE_URL}/orte`,
  [WasteProvider.ABFALL_IO_ASO]: `${ABFALL_IO_BASE_URL}/?key=${ABFALL_IO_ASO_KEY}&mession=${ABFALL_IO_MODUS_KEY}&wession=init`,
  [WasteProvider.RSAG]: `${RSAG_API_BASE_URL}/api/pickup/filter/7530/1,2,3,4,6,7,8/1`,
};

export async function GET() {
  const cached = cacheService.get<ProviderStatusResponse>(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached);
  }

  const entries = Object.values(WasteProvider);
  const statuses = await Promise.all(entries.map((p) => ping(PING_URLS[p])));

  const providers: ProviderStatusResponse['providers'] = {};
  entries.forEach((id, i) => {
    const status = statuses[i] ?? 'down';
    providers[id] = { status, name: PROVIDERS[id].name };
  });

  const result: ProviderStatusResponse = {
    providers,
    timestamp: new Date().toISOString(),
  };

  cacheService.set(CACHE_KEY, result, STATUS_CACHE_TTL);
  return NextResponse.json(result);
}
