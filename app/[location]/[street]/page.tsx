import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Home, MapPin } from 'lucide-react';
import { getBAVApiService } from '@/lib/services/bav-api.service';
import { cacheService } from '@/lib/services/cache.service';
import { buildWasteCollectionCacheKey } from '@/lib/utils/cache-keys';
import {
  getLocationNameFromSlug,
  capitalizeLocation,
  decodeStreetSlug,
  getBaseUrl,
} from '@/lib/utils/seo';
import type { WasteCalendarResponse } from '@/lib/types/bav-api.types';
import WasteCollectionCalendar from '@/components/WasteCollectionCalendar';
import JsonLd from '@/components/JsonLd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StreetPageProps {
  params: Promise<{ location: string; street: string }>;
}

/**
 * Revalidate street pages every hour (ISR)
 * This keeps pages fresh while allowing static generation
 */
export const revalidate = 3600;

/**
 * Generate metadata for street pages
 */
export async function generateMetadata({
  params,
}: StreetPageProps): Promise<Metadata> {
  const { location: locationSlug, street: streetSlug } = await params;
  const locationName = capitalizeLocation(locationSlug);
  const streetName = decodeStreetSlug(streetSlug);
  const baseUrl = getBaseUrl();

  if (!getLocationNameFromSlug(locationSlug)) {
    return {
      title: 'Seite nicht gefunden',
    };
  }

  return {
    title: `${streetName}, ${locationName} - Abfuhrtermine`,
    description: `Müllabfuhr-Termine für ${streetName} in ${locationName}. Nächste Abholung für Restmüll, Gelber Sack, Papier, Bio und Glas. Kostenlos als ICS-Kalender exportieren.`,
    keywords: [
      `Müllabfuhr ${streetName} ${locationName}`,
      `Abfuhrkalender ${streetName}`,
      `Abfalltermine ${locationName}`,
      streetName,
      locationName,
      'BAV',
      'Restmüll',
      'Gelber Sack',
      'Papier',
      'Biomüll',
    ],
    alternates: {
      canonical: `/${locationSlug}/${streetSlug}`,
    },
    openGraph: {
      title: `Abfuhrkalender ${streetName}, ${locationName}`,
      description: `Alle Müllabfuhr-Termine für ${streetName} in ${locationName}. Restmüll, Gelber Sack, Papier, Bio und Glas.`,
      url: `${baseUrl}/${locationSlug}/${streetSlug}`,
      type: 'website',
    },
  };
}

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

export default async function StreetPage({ params }: StreetPageProps) {
  const { location: locationSlug, street: streetSlug } = await params;

  // Validate location
  const originalLocationName = getLocationNameFromSlug(locationSlug);
  if (!originalLocationName) {
    notFound();
  }

  const locationName = capitalizeLocation(locationSlug);
  const streetName = decodeStreetSlug(streetSlug);

  // Fetch waste collection data
  let data: WasteCalendarResponse | null = null;
  let error: string | null = null;

  try {
    data = await getWasteCollectionData(originalLocationName, streetName);
  } catch (err) {
    error =
      err instanceof Error ? err.message : 'Fehler beim Laden der Daten';
    console.error('Error fetching waste collection data:', err);
  }

  return (
    <>
      <JsonLd type="street" location={locationName} street={streetName} />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col px-4 py-6 sm:px-8 sm:py-10 lg:px-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-6 flex-wrap">
          <Link
            href="/"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            <span>Start</span>
          </Link>
          <span>/</span>
          <Link
            href={`/${locationSlug}`}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {locationName}
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate max-w-[200px]">
            {data?.street.name || streetName}
          </span>
        </nav>

        {/* Error State */}
        {error ? (
          <Card glass className="border-red-200/50 dark:border-red-800/50">
            <CardContent className="p-6 text-center">
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
                Straße nicht gefunden
              </h1>
              <p className="mb-6 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={`/${locationSlug}`}>
                  <Button variant="outline" className="gap-2">
                    <MapPin className="h-4 w-4" />
                    Alle Straßen in {locationName}
                  </Button>
                </Link>
                <Link href="/">
                  <Button className="gap-2">
                    <Home className="h-4 w-4" />
                    Zur Startseite
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : data ? (
          <WasteCollectionCalendar
            data={data}
            location={originalLocationName}
            street={data.street.name}
          />
        ) : (
          <Card glass>
            <CardContent className="p-8 text-center">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-zinc-600 dark:text-zinc-400">
                  Lade Abfuhrkalender...
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
