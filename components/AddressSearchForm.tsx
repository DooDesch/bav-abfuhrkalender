'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { useAddressStore } from '@/lib/stores/address.store';
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
  const location = useAddressStore((s) => s.location);
  const street = useAddressStore((s) => s.street);
  const setLocation = useAddressStore((s) => s.setLocation);
  const setStreet = useAddressStore((s) => s.setStreet);
  const setAddress = useAddressStore((s) => s.setAddress);
  const getLastAddress = useAddressStore((s) => s.getLastAddress);
  const setLastAddress = useAddressStore((s) => s.setLastAddress);

  // Hydrate store from URL when defaults are set; otherwise from last address (e.g. "Andere Adresse")
  useEffect(() => {
    if (defaultLocation !== '' || defaultStreet !== '') {
      setAddress(defaultLocation, defaultStreet);
    } else {
      const last = getLastAddress();
      if (last.location || last.street) {
        setAddress(last.location, last.street);
      }
    }
  }, [defaultLocation, defaultStreet, setAddress, getLastAddress]);

  const handleLocationSelect = useCallback(() => {
    setStreet('');
  }, [setStreet]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedLocation = location.trim();
      const trimmedStreet = street.trim();
      if (!trimmedLocation || !trimmedStreet) return;
      setLastAddress(trimmedLocation, trimmedStreet);
      const params = new URLSearchParams({
        location: trimmedLocation,
        street: trimmedStreet,
      });
      router.push(`/?${params.toString()}`);
    },
    [location, street, setLastAddress, router]
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
          className="min-h-[44px] w-full cursor-pointer rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Abfuhrkalender anzeigen
        </button>
      </div>
    </form>
  );
}
