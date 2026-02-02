'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Navigation, Locate } from 'lucide-react';
import { useAddressStore } from '@/lib/stores/address.store';
import { useLocationsWithProximity } from '@/lib/hooks/useLocationsWithProximity';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import StreetAutocomplete from '@/components/StreetAutocomplete';
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
  const setLocation = useAddressStore((s) => s.setLocation);
  const setStreet = useAddressStore((s) => s.setStreet);
  const setAddress = useAddressStore((s) => s.setAddress);
  const getLastAddress = useAddressStore((s) => s.getLastAddress);
  const setLastAddress = useAddressStore((s) => s.setLastAddress);
  
  // Track if we've already auto-filled from geolocation
  const autoFilledRef = useRef(false);
  const [wasAutoFilled, setWasAutoFilled] = useState(false);
  
  // Get nearest location from geolocation
  const { nearestLocation, isGeolocating } = useLocationsWithProximity();

  // Initialize with defaults or last address
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

  const canSubmit = location.trim() && street.trim();

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
                onChange={setLocation}
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
                value={street}
                onChange={setStreet}
                id="street"
                label="Straße"
                placeholder="z. B. Hauptstraße"
                required
              />
            </div>

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
