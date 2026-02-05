'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import Autocomplete from '@/components/Autocomplete';
import type { AutocompleteOption } from '@/components/Autocomplete';

interface StreetAutocompleteProps {
  location: string;
  /** Whether the location has been explicitly selected from the dropdown (not just typed) */
  locationSelected?: boolean;
  value: string;
  onChange: (value: string) => void;
  /** Called when user selects an option from the dropdown. Includes the street ID for API lookups. */
  onSelect?: (value: string, streetId?: string) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 300;

async function loadStreets(
  location: string,
  signal: AbortSignal
): Promise<AutocompleteOption[]> {
  const trimmed = location.trim();
  if (!trimmed) return [];
  const res = await fetch(`/api/streets?location=${encodeURIComponent(trimmed)}`, {
    signal,
  });
  const json = await res.json();
  return json.success && Array.isArray(json.data) ? json.data : [];
}

export default function StreetAutocomplete({
  location,
  locationSelected = false,
  value,
  onChange,
  onSelect,
  id,
  label = 'Straße',
  placeholder = 'z. B. Straße suchen',
  required = false,
}: StreetAutocompleteProps) {
  // Debounced location - only updates after user stops typing
  const [debouncedLocation, setDebouncedLocation] = useState(location);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the location prop
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to update debounced location
    timeoutRef.current = setTimeout(() => {
      setDebouncedLocation(location);
    }, DEBOUNCE_DELAY);

    // Cleanup on unmount or when location changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [location]);

  // Only load streets when location has been explicitly selected from dropdown
  // This prevents unnecessary API calls while user is still typing
  const loadOptions = useCallback(
    (signal: AbortSignal) => {
      if (!locationSelected) {
        return Promise.resolve([]);
      }
      return loadStreets(debouncedLocation, signal);
    },
    [debouncedLocation, locationSelected]
  );

  // Wrap onSelect to convert ID to string for consistency
  const handleSelect = useCallback(
    (value: string, id?: string | number) => {
      onSelect?.(value, id !== undefined ? String(id) : undefined);
    },
    [onSelect]
  );

  return (
    <Autocomplete
      value={value}
      onChange={onChange}
      onSelect={handleSelect}
      id={id}
      label={label}
      placeholder={placeholder}
      placeholderWhenDisabled="Zuerst Ort auswählen"
      loadingPlaceholder="Lade Straßen…"
      emptyMessage="Keine passenden Straßen gefunden"
      required={required}
      disabled={!location.trim()}
      loadOptions={loadOptions}
      loadOptionsDeps={[debouncedLocation]}
    />
  );
}
