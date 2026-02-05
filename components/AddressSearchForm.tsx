'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Navigation, Locate } from 'lucide-react';
import { useAddressStore } from '@/lib/stores/address.store';
import { useLocationsWithProximity } from '@/lib/hooks/useLocationsWithProximity';
import { createStreetSlug } from '@/lib/utils/seo';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import StreetAutocomplete from '@/components/StreetAutocomplete';
import HouseNumberSelect from '@/components/HouseNumberSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
  const houseNumber = useAddressStore((s) => s.houseNumber);
  const houseNumberId = useAddressStore((s) => s.houseNumberId);
  const setLocation = useAddressStore((s) => s.setLocation);
  const setStreet = useAddressStore((s) => s.setStreet);
  const setHouseNumber = useAddressStore((s) => s.setHouseNumber);
  const setAddress = useAddressStore((s) => s.setAddress);
  const getLastAddress = useAddressStore((s) => s.getLastAddress);
  const setLastAddress = useAddressStore((s) => s.setLastAddress);
  const restoreAddress = useAddressStore((s) => s.restoreAddress);
  const hasHydrated = useAddressStore((s) => s._hasHydrated);
  
  // Track if we've already auto-filled from geolocation
  const autoFilledRef = useRef(false);
  const [wasAutoFilled, setWasAutoFilled] = useState(false);
  
  // Track if house number selection is required
  const [houseNumberRequired, setHouseNumberRequired] = useState(false);
  
  // Track if a street was explicitly selected from autocomplete
  const [streetSelected, setStreetSelected] = useState(false);
  
  // Track if we've already initialized from localStorage
  const initializedRef = useRef(false);
  
  // Get nearest location from geolocation (lazy - triggered on location input focus)
  const { nearestLocation, isGeolocating, requestGeolocation } = useLocationsWithProximity();

  // Initialize with defaults or last address (wait for hydration)
  useEffect(() => {
    // Wait for store to hydrate from localStorage
    if (!hasHydrated) return;
    
    // Only initialize once
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    if (defaultLocation !== '' || defaultStreet !== '') {
      setAddress(defaultLocation, defaultStreet);
      // If we have a default street, consider it as selected
      if (defaultStreet) {
        setStreetSelected(true);
      }
    } else {
      const last = getLastAddress();
      if (last.location || last.street) {
        // Restore all address fields in one atomic update (prevents flicker)
        restoreAddress(last);
        // If we have a saved street, consider it as selected
        if (last.street) {
          setStreetSelected(true);
        }
      }
    }
  }, [hasHydrated, defaultLocation, defaultStreet, setAddress, restoreAddress, getLastAddress]);

  // Auto-fill location from geolocation if no location is set
  useEffect(() => {
    // Only auto-fill once, and only if:
    // - We haven't auto-filled yet
    // - There's no default location
    // - There's no current location in the store
    // - We have a nearest location with valid distance (coordinates loaded)
    // - Geolocation check is complete
    if (
      !autoFilledRef.current &&
      !defaultLocation &&
      !location &&
      nearestLocation &&
      nearestLocation.distance !== undefined && // Ensure coordinates are loaded
      !isGeolocating
    ) {
      autoFilledRef.current = true;
      setLocation(nearestLocation.name);
      setWasAutoFilled(true);
    }
  }, [nearestLocation, isGeolocating, defaultLocation, location, setLocation]);

  // Handle location input change (typing)
  const handleLocationChange = useCallback(
    (value: string) => {
      setLocation(value);
      // Reset street selection when location changes
      setStreetSelected(false);
    },
    [setLocation]
  );

  // Handle location selection from dropdown
  const handleLocationSelect = useCallback(() => {
    setStreet('');
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

  const handleStreetSelect = useCallback(() => {
    // Clear house number and mark street as selected from autocomplete
    setHouseNumber('', '');
    setStreetSelected(true);
  }, [setHouseNumber]);

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
      
      setLastAddress(trimmedLocation, trimmedStreet, houseNumber, houseNumberId);
      const locationSlug = trimmedLocation.toLowerCase();
      const streetSlug = createStreetSlug(trimmedStreet);
      
      // Add house number as query param if selected
      let url = `/${locationSlug}/${streetSlug}`;
      if (houseNumberId) {
        url += `?hn=${encodeURIComponent(houseNumberId)}`;
      }
      router.push(url);
    },
    [location, street, houseNumber, houseNumberId, houseNumberRequired, setLastAddress, router]
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
                  {wasAutoFilled ? (
                    <span className="inline-flex items-center gap-1">
                      <Locate className="h-3 w-3 text-green-500" />
                      Ort automatisch erkannt
                    </span>
                  ) : (
                    'Wähle deinen Ort und deine Straße'
                  )}
                </p>
              </div>
            </div>

            {/* Location Input */}
            <div className="space-y-2">
              <LocationAutocomplete
                value={location}
                onChange={handleLocationChange}
                onSelect={handleLocationSelect}
                onFocus={requestGeolocation}
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
                value={street}
                onChange={handleStreetChange}
                onSelect={handleStreetSelect}
                id="street"
                label="Straße"
                placeholder="z. B. Hauptstraße"
                required
              />
            </div>

            {/* House Number Select (only shown when required) */}
            <HouseNumberSelect
              location={location}
              street={street}
              streetSelected={streetSelected}
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
