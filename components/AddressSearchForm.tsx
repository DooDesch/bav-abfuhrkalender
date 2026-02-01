'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { LAST_ADDRESS_STORAGE_KEY } from '@/lib/config/constants';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import StreetAutocomplete from '@/components/StreetAutocomplete';

interface AddressSearchFormProps {
  defaultLocation?: string;
  defaultStreet?: string;
}

export default function AddressSearchForm({
  defaultLocation = '',
  defaultStreet = '',
}: AddressSearchFormProps) {
  const router = useRouter();
  const [location, setLocation] = useState(defaultLocation);
  const [street, setStreet] = useState(defaultStreet);

  // Load last address from localStorage when no defaults (e.g. "Andere Adresse")
  useEffect(() => {
    if (defaultLocation !== '' || defaultStreet !== '') return;
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(LAST_ADDRESS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { location?: string; street?: string };
      const loc = parsed?.location?.trim();
      const str = parsed?.street?.trim();
      if (loc && str) {
        setLocation(loc);
        setStreet(str);
      }
    } catch {
      // Ignore parse/storage errors
    }
  }, [defaultLocation, defaultStreet]);

  // Sync default values when they change (e.g. from URL or error page). Skip when both empty so localStorage-loaded values are not overwritten (e.g. after navigating from Playground to Kalender).
  useEffect(() => {
    if (defaultLocation !== '' || defaultStreet !== '') {
      setLocation(defaultLocation);
      setStreet(defaultStreet);
    }
  }, [defaultLocation, defaultStreet]);

  const handleLocationSelect = useCallback(() => {
    setStreet('');
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedLocation = location.trim();
      const trimmedStreet = street.trim();
      if (!trimmedLocation || !trimmedStreet) return;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            LAST_ADDRESS_STORAGE_KEY,
            JSON.stringify({
              location: trimmedLocation,
              street: trimmedStreet,
            })
          );
        }
      } catch {
        // Ignore storage errors
      }
      const params = new URLSearchParams({
        location: trimmedLocation,
        street: trimmedStreet,
      });
      router.push(`/?${params.toString()}`);
    },
    [location, street, router]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Ort und Straße eingeben
      </h2>
      <div className="space-y-4">
        <LocationAutocomplete
          value={location}
          onChange={setLocation}
          onSelect={handleLocationSelect}
          id="location"
          label="Ort"
          placeholder="z. B. Ort suchen"
          required
        />
        <StreetAutocomplete
          location={location}
          value={street}
          onChange={setStreet}
          id="street"
          label="Straße"
          placeholder="z. B. Straße suchen"
          required
        />
        <button
          type="submit"
          className="w-full cursor-pointer rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Abfuhrkalender anzeigen
        </button>
      </div>
    </form>
  );
}
