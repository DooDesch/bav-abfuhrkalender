import WasteCollectionCalendar from '@/components/WasteCollectionCalendar';
import AddressSearchForm from '@/components/AddressSearchForm';
import { BAVApiService } from '@/lib/services/bav-api.service';
import { cacheService } from '@/lib/services/cache.service';
import type { WasteCalendarResponse } from '@/lib/types/bav-api.types';

function buildCacheKey(location: string, street: string): string {
  const normalizedLocation = location.trim().toLowerCase();
  const normalizedStreet = street.trim().toLowerCase();
  return `waste-collection:${normalizedLocation}:${normalizedStreet}`;
}

async function getWasteCollectionData(
  location: string,
  street: string
): Promise<WasteCalendarResponse> {
  const cacheKey = buildCacheKey(location, street);
  const cachedData = cacheService.get<WasteCalendarResponse>(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const apiService = new BAVApiService();
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

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col items-center justify-center py-16 px-8 sm:px-16">
        {!hasParams ? (
          <div className="flex w-full max-w-md flex-col items-center gap-6">
            <p className="text-center text-zinc-600 dark:text-zinc-400">
              Abfuhrtermine für Ihre Adresse im BAV-Gebiet. Wählen Sie Ort und
              Straße, um den Abfuhrkalender anzuzeigen.
            </p>
            <AddressSearchForm />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
            <h1 className="mb-2 text-2xl font-bold text-red-900 dark:text-red-400">
              Fehler beim Laden der Daten
            </h1>
            <p className="mb-4 text-red-700 dark:text-red-300">{error}</p>
            <AddressSearchForm
              defaultLocation={locationParam ?? ''}
              defaultStreet={streetParam ?? ''}
            />
          </div>
        ) : data && locationParam && streetParam ? (
          <WasteCollectionCalendar
            data={data}
            location={locationParam}
            street={streetParam}
          />
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
