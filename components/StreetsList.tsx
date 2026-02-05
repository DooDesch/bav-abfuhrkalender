'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { createStreetSlug } from '@/lib/utils/seo';

interface Street {
  id: number | string;
  name: string;
}

interface StreetsListProps {
  streets: Street[];
  locationSlug: string;
  locationName: string;
}

export default function StreetsList({
  streets,
  locationSlug,
  locationName,
}: StreetsListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and group streets based on search query
  const { filteredStreets, groupedStreets, letters } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // Filter streets
    const filtered = query
      ? streets.filter((street) =>
          street.name.toLowerCase().includes(query)
        )
      : streets;

    // Sort alphabetically
    const sorted = [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name, 'de')
    );

    // Group by first letter
    const grouped = sorted.reduce(
      (acc, street) => {
        const firstLetter = street.name.charAt(0).toUpperCase();
        if (!acc[firstLetter]) {
          acc[firstLetter] = [];
        }
        acc[firstLetter].push(street);
        return acc;
      },
      {} as Record<string, Street[]>
    );

    const sortedLetters = Object.keys(grouped).sort((a, b) =>
      a.localeCompare(b, 'de')
    );

    return {
      filteredStreets: sorted,
      groupedStreets: grouped,
      letters: sortedLetters,
    };
  }, [streets, searchQuery]);

  return (
    <>
      {/* Search Input */}
      <Card glass className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Straße suchen..."
              className="w-full h-11 pl-10 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm text-base placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200"
              autoComplete="off"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Suche löschen"
              >
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {filteredStreets.length} von {streets.length} Straßen gefunden
            </p>
          )}
        </CardContent>
      </Card>

      {/* Streets List */}
      {filteredStreets.length === 0 ? (
        <Card glass>
          <CardContent className="p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              {searchQuery
                ? `Keine Straßen für "${searchQuery}" in ${locationName} gefunden.`
                : `Keine Straßen für ${locationName} gefunden.`}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-primary hover:underline"
              >
                Suche zurücksetzen
              </button>
            )}
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
    </>
  );
}
