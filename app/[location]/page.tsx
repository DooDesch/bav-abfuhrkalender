import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPin, Home } from 'lucide-react';
import StartLink from '@/components/StartLink';
import { getStreets as getProviderStreets } from '@/lib/services/provider-registry';
import {
  getLocationSlugs,
  getLocationNameFromSlug,
  capitalizeLocation,
  getBaseUrl,
  generateLocationDescription,
  generateLocationKeywords,
  getCurrentYear,
} from '@/lib/utils/seo';
import { Button } from '@/components/ui/button';
import JsonLd from '@/components/JsonLd';
import StreetsList from '@/components/StreetsList';

interface LocationPageProps {
  params: Promise<{ location: string }>;
}

/**
 * Generate static params for all 13 BAV locations
 */
export async function generateStaticParams() {
  return getLocationSlugs().map((location) => ({
    location,
  }));
}

/**
 * Generate metadata for location pages
 */
export async function generateMetadata({
  params,
}: LocationPageProps): Promise<Metadata> {
  const { location: locationSlug } = await params;
  const locationName = capitalizeLocation(locationSlug);
  const baseUrl = getBaseUrl();
  const year = getCurrentYear();

  if (!getLocationNameFromSlug(locationSlug)) {
    return {
      title: 'Ort nicht gefunden',
    };
  }

  return {
    title: `Abfuhrkalender ${locationName} ${year}`,
    description: generateLocationDescription(locationName),
    keywords: generateLocationKeywords(locationName),
    alternates: {
      canonical: `/${locationSlug}`,
    },
    openGraph: {
      title: `Abfuhrkalender ${locationName} ${year}`,
      description: `Abfuhrkalender ${year}: Finde alle Müllabfuhr-Termine für ${locationName}. Wähle deine Straße und exportiere den Kalender.`,
      url: `${baseUrl}/${locationSlug}`,
      type: 'website',
    },
  };
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { location: locationSlug } = await params;

  // Validate location
  const originalLocationName = getLocationNameFromSlug(locationSlug);
  if (!originalLocationName) {
    notFound();
  }

  const locationName = capitalizeLocation(locationSlug);

  // Fetch streets for this location (provider-agnostic)
  let streets: { id: number | string; name: string }[] = [];

  try {
    streets = await getProviderStreets(originalLocationName);
  } catch (error) {
    console.error(`Failed to fetch streets for ${locationName}:`, error);
  }

  // Sort streets alphabetically for count display
  const sortedStreets = [...streets].sort((a, b) =>
    a.name.localeCompare(b.name, 'de')
  );

  return (
    <>
      <JsonLd type="location" location={locationName} />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col px-4 py-6 sm:px-8 sm:py-10 lg:px-16">
        {/* Header */}
        <div className="mb-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            <StartLink />
            <span>/</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">
              {locationName}
            </span>
          </nav>

          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                Abfuhrkalender {locationName}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                {sortedStreets.length} Straßen verfügbar
              </p>
            </div>
          </div>
        </div>

        {/* Search and Streets List */}
        <StreetsList
          streets={sortedStreets}
          locationSlug={locationSlug}
          locationName={locationName}
        />

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <StartLink unstyled>
            <Button variant="outline" className="gap-2">
              <Home className="h-4 w-4" />
              Zur Startseite
            </Button>
          </StartLink>
        </div>
      </main>
    </>
  );
}
