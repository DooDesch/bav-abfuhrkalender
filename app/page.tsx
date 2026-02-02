import WasteCollectionCalendar from '@/components/WasteCollectionCalendar';
import AddressSearchForm from '@/components/AddressSearchForm';
import HomeWithoutParams from '@/components/HomeWithoutParams';
import { getBAVApiService } from '@/lib/services/bav-api.service';
import { cacheService } from '@/lib/services/cache.service';
import { buildWasteCollectionCacheKey } from '@/lib/utils/cache-keys';
import type { WasteCalendarResponse } from '@/lib/types/bav-api.types';

async function getWasteCollectionData(
  location: string,
  street: string
): Promise<WasteCalendarResponse> {
  const cacheKey = buildWasteCollectionCacheKey(location, street);
  const cachedData = cacheService.get<WasteCalendarResponse>(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const apiService = getBAVApiService();
  const data = await apiService.getWasteCollectionData(location, street);
  cacheService.set(cacheKey, data);
  return data;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ location?: string | string[]; street?: string | string[] }>;
}) {
  const params = await searchParams;
  const locationParam =
    typeof params.location === 'string' ? params.location : params.location?.[0];
  const streetParam =
    typeof params.street === 'string' ? params.street : params.street?.[0];
  const hasParams =
    locationParam?.trim() && streetParam?.trim();

  let data: WasteCalendarResponse | null = null;
  let error: string | null = null;

  if (hasParams && locationParam && streetParam) {
    try {
      data = await getWasteCollectionData(
        locationParam.trim(),
        streetParam.trim()
      );
    } catch (err) {
      error =
        err instanceof Error
          ? err.message
          : 'Failed to load waste collection data';
      console.error('Error fetching waste collection data:', err);
    }
  }

  const showCalendar = Boolean(hasParams && data && !error);

  return (
    <main
      className={`mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col items-center px-4 py-6 sm:px-8 sm:py-10 lg:px-16 ${showCalendar ? 'justify-start' : 'justify-center'}`}
    >
      {!hasParams ? (
        <HomeWithoutParams />
      ) : error ? (
        <div className="w-full max-w-md">
          <div className="glass-card p-6 text-center border-red-200/50 dark:border-red-800/50">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-xl font-bold text-red-900 dark:text-red-400">
              Fehler beim Laden
            </h1>
            <p className="mb-6 text-sm text-red-700 dark:text-red-300">{error}</p>
            <AddressSearchForm
              defaultLocation={locationParam ?? ''}
              defaultStreet={streetParam ?? ''}
            />
          </div>
        </div>
      ) : data && locationParam && streetParam ? (
        <WasteCollectionCalendar
          data={data}
          location={locationParam}
          street={streetParam}
        />
      ) : (
        <div className="glass-card p-8 text-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-zinc-600 dark:text-zinc-400">
              Lade Abfuhrkalender...
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
