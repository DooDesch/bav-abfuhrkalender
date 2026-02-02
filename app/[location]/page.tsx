import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Search, ArrowRight, Home } from 'lucide-react';
import StartLink from '@/components/StartLink';
import { getBAVApiService } from '@/lib/services/bav-api.service';
import {
  getLocationSlugs,
  getLocationNameFromSlug,
  capitalizeLocation,
  createStreetSlug,
  getBaseUrl,
} from '@/lib/utils/seo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import JsonLd from '@/components/JsonLd';

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

  if (!getLocationNameFromSlug(locationSlug)) {
    return {
      title: 'Ort nicht gefunden',
    };
  }

  return {
    title: `Abfuhrkalender ${locationName}`,
    description: `Alle Müllabfuhr-Termine für ${locationName}. Wähle deine Straße für Restmüll, Gelber Sack, Papier, Bio und Glas. Kostenlos als ICS-Kalender exportieren.`,
    keywords: [
      `Abfuhrkalender ${locationName}`,
      `Müllabfuhr ${locationName}`,
      `Müllkalender ${locationName}`,
      `Abfallkalender ${locationName}`,
      'BAV',
      'Bergischer Abfallwirtschaftsverband',
      locationName,
      'Restmüll',
      'Gelber Sack',
      'Papier',
      'Biomüll',
    ],
    alternates: {
      canonical: `/${locationSlug}`,
    },
    openGraph: {
      title: `Abfuhrkalender ${locationName} | Dein Abfuhrkalender`,
      description: `Finde alle Müllabfuhr-Termine für ${locationName}. Wähle deine Straße und exportiere den Kalender.`,
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

  // Fetch streets for this location
  const apiService = getBAVApiService();
  let streets: { id: number; name: string }[] = [];

  try {
    const location = await apiService.getLocationByName(originalLocationName);
    streets = await apiService.getStreets(location.id);
  } catch (error) {
    console.error(`Failed to fetch streets for ${locationName}:`, error);
  }

  // Sort streets alphabetically
  const sortedStreets = [...streets].sort((a, b) =>
    a.name.localeCompare(b.name, 'de')
  );

  // Group streets by first letter
  const groupedStreets = sortedStreets.reduce(
    (acc, street) => {
      const firstLetter = street.name.charAt(0).toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(street);
      return acc;
    },
    {} as Record<string, typeof streets>
  );

  const letters = Object.keys(groupedStreets).sort((a, b) =>
    a.localeCompare(b, 'de')
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

        {/* Quick Search Hint */}
        <Card glass className="mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <Search className="h-5 w-5 text-zinc-400" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Wähle deine Straße aus der Liste oder nutze{' '}
              <StartLink showIcon={false} className="text-primary hover:underline inline">
                die Suche
              </StartLink>{' '}
              für schnelleren Zugriff.
            </p>
          </CardContent>
        </Card>

        {/* Streets List */}
        {sortedStreets.length === 0 ? (
          <Card glass>
            <CardContent className="p-8 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                Keine Straßen für {locationName} gefunden.
              </p>
              <StartLink unstyled className="mt-4 inline-block">
                <Button>Zurück zur Startseite</Button>
              </StartLink>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {letters.map((letter) => (
              <section key={letter}>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3 sticky top-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md py-2 px-3 -mx-3 z-10 rounded-lg">
                  {letter}
                </h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(groupedStreets[letter] ?? []).map((street) => (
                    <Link
                      key={street.id}
                      href={`/${locationSlug}/${createStreetSlug(street.name)}`}
                      className="group"
                    >
                      <Card
                        glass
                        className="transition-all duration-200 hover:shadow-md hover:border-green-500/30 dark:hover:border-green-500/20"
                      >
                        <CardContent className="p-3 flex items-center justify-between">
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors truncate">
                            {street.name}
                          </span>
                          <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-green-500 transition-all group-hover:translate-x-1 shrink-0" />
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

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
