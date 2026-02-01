import WasteCollectionCalendar from '@/components/WasteCollectionCalendar';
import { BAVApiService } from '@/lib/services/bav-api.service';
import { cacheService } from '@/lib/services/cache.service';
import {
  ORT_ID_WERMELSKIRCHEN,
  STRASSE_NAME_ELBRINGHAUSEN,
} from '@/lib/config/constants';
import type { WasteCalendarResponse } from '@/lib/types/bav-api.types';

const CACHE_KEY = 'waste-collection:elbringhausen';

async function getWasteCollectionData(): Promise<WasteCalendarResponse> {
  // Check in-memory cache first
  const cachedData = cacheService.get<WasteCalendarResponse>(CACHE_KEY);

  if (cachedData) {
    return cachedData;
  }

  // Fetch from BAV API
  const apiService = new BAVApiService();
  const data = await apiService.getWasteCollectionData(
    ORT_ID_WERMELSKIRCHEN,
    STRASSE_NAME_ELBRINGHAUSEN
  );

  // Store in cache
  cacheService.set(CACHE_KEY, data);

  return data;
}

export default async function Home() {
  let data: WasteCalendarResponse | null = null;
  let error: string | null = null;

  try {
    data = await getWasteCollectionData();
  } catch (err) {
    error =
      err instanceof Error ? err.message : 'Failed to load waste collection data';
    console.error('Error fetching waste collection data:', err);
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col items-center justify-center py-16 px-8 sm:px-16">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
            <h1 className="mb-2 text-2xl font-bold text-red-900 dark:text-red-400">
              Fehler beim Laden der Daten
            </h1>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        ) : data ? (
          <WasteCollectionCalendar data={data} />
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-zinc-600 dark:text-zinc-400">
              Lade Abfuhrkalender...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
