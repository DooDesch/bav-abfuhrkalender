'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Navigation } from 'lucide-react';
import { useAddressStore } from '@/lib/stores/address.store';
import { createStreetSlug } from '@/lib/utils/seo';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import StreetAutocomplete from '@/components/StreetAutocomplete';
import HouseNumberSelect from '@/components/HouseNumberSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AddressSearchForm() {
  const router = useRouter();
  const location = useAddressStore((s) => s.location);
  const street = useAddressStore((s) => s.street);
  const streetId = useAddressStore((s) => s.streetId);
  const houseNumber = useAddressStore((s) => s.houseNumber);
  const houseNumberId = useAddressStore((s) => s.houseNumberId);
  const setLocation = useAddressStore((s) => s.setLocation);
  const setStreet = useAddressStore((s) => s.setStreet);
  const setHouseNumber = useAddressStore((s) => s.setHouseNumber);
  const setLastAddress = useAddressStore((s) => s.setLastAddress);
  const hasHydrated = useAddressStore((s) => s._hasHydrated);
  const getLastAddress = useAddressStore((s) => s.getLastAddress);
  const restoreAddress = useAddressStore((s) => s.restoreAddress);

  const [houseNumberRequired, setHouseNumberRequired] = useState(false);
  // Restore "selected" flags when store has full address (e.g. after navigation back or after hydration restore)
  const hasCompleteAddressInStore = () => {
    const s = useAddressStore.getState();
    return !!(s.streetId && s.location?.trim() && s.street?.trim());
  };
  const [streetSelected, setStreetSelected] = useState(hasCompleteAddressInStore);
  const [locationSelected, setLocationSelected] = useState(hasCompleteAddressInStore);

  // After hydration: if form is empty but we have a last address (e.g. after reload), restore it so form and HouseNumberSelect show correct state
  useEffect(() => {
    if (!hasHydrated) return;
    const last = getLastAddress();
    const hasLast = last.location?.trim() || last.street?.trim();
    const formEmpty = !location.trim() && !street.trim();
    if (formEmpty && hasLast) {
      restoreAddress(last);
    }
  }, [hasHydrated, getLastAddress, restoreAddress, location, street]);

  // When store has full address (after restore or navigation back), ensure HouseNumberSelect fetches house numbers
  useEffect(() => {
    if (streetId && location.trim() && street.trim()) {
      setStreetSelected(true);
      setLocationSelected(true);
    }
  }, [location, street, streetId]);

  // Handle location input change (typing)
  const handleLocationChange = useCallback(
    (value: string) => {
      setLocation(value);
      // Reset selections when user types (not selected from dropdown)
      setLocationSelected(false);
      setStreetSelected(false);
    },
    [setLocation]
  );

  // Handle location selection from dropdown
  const handleLocationSelect = useCallback(() => {
    // Mark location as explicitly selected
    setLocationSelected(true);
    // Clear street with empty ID when location changes
    setStreet('', '');
    setHouseNumber('', '');
    setHouseNumberRequired(false);
    setStreetSelected(false);
  }, [setStreet, setHouseNumber]);

  const handleStreetChange = useCallback(
    (value: string) => {
      setStreet(value);
      // Reset street selection when user types manually
      setStreetSelected(false);
    },
    [setStreet]
  );

  const handleStreetSelect = useCallback(
    (value: string, id?: string) => {
      // Store the street ID when selected from autocomplete
      if (id) {
        setStreet(value, id);
      }
      // Clear house number and mark street as selected from autocomplete
      setHouseNumber('', '');
      setStreetSelected(true);
    },
    [setStreet, setHouseNumber]
  );

  const handleHouseNumberChange = useCallback(
    (name: string, id: string) => {
      setHouseNumber(name, id);
    },
    [setHouseNumber]
  );

  // Update house number required state when house numbers load
  const handleHouseNumbersLoaded = useCallback((required: boolean) => {
    setHouseNumberRequired(required);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedLocation = location.trim();
      const trimmedStreet = street.trim();
      if (!trimmedLocation || !trimmedStreet) return;
      
      // Check if house number is required but not selected
      if (houseNumberRequired && !houseNumberId) return;
      
      // Save address with streetId for faster subsequent lookups
      setLastAddress(trimmedLocation, trimmedStreet, streetId || undefined, houseNumber, houseNumberId);
      const locationSlug = trimmedLocation.toLowerCase();
      const streetSlug = createStreetSlug(trimmedStreet);
      
      // Build URL with optional query params for streetId and houseNumberId
      let url = `/${locationSlug}/${streetSlug}`;
      const params = new URLSearchParams();
      if (streetId) {
        params.set('sid', streetId);
      }
      if (houseNumberId) {
        params.set('hn', houseNumberId);
      }
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      router.push(url);
    },
    [location, street, streetId, houseNumber, houseNumberId, houseNumberRequired, setLastAddress, router]
  );

  // Can submit if location and street are filled, and house number is filled if required
  const canSubmit = location.trim() && street.trim() && (!houseNumberRequired || houseNumberId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="w-full max-w-md mx-auto"
    >
      <Card glass>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Location Icon Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25">
                <Navigation className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Adresse eingeben
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Wähle deinen Ort und deine Straße
                </p>
              </div>
            </div>

            {/* Location Input */}
            <div className="space-y-2">
              <LocationAutocomplete
                value={location}
                onChange={handleLocationChange}
                onSelect={handleLocationSelect}
                id="location"
                label="Ort"
                placeholder="z. B. Wermelskirchen"
                required
              />
            </div>

            {/* Street Input */}
            <div className="space-y-2">
              <StreetAutocomplete
                location={location}
                locationSelected={locationSelected}
                value={street}
                onChange={handleStreetChange}
                onSelect={handleStreetSelect}
                id="street"
                label="Straße"
                placeholder="z. B. Hauptstraße"
                required
              />
            </div>

            {/* House Number Select - treat as "street selected" when we have full address (store restore or nav back) so it fetches immediately */}
            <HouseNumberSelect
              location={location}
              street={street}
              streetId={streetId || undefined}
              streetSelected={streetSelected || !!(streetId && location.trim() && street.trim())}
              value={houseNumber}
              valueId={houseNumberId}
              onChange={handleHouseNumberChange}
              onRequiredChange={handleHouseNumbersLoaded}
              id="houseNumber"
              required
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-12 text-base font-medium gap-2 group"
            >
              <MapPin className="h-5 w-5" />
              Abfuhrkalender anzeigen
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
