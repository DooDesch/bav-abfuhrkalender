'use client';

import { useCallback } from 'react';
import Autocomplete from '@/components/Autocomplete';
import type { AutocompleteOption } from '@/components/Autocomplete';

interface StreetAutocompleteProps {
  location: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

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
  value,
  onChange,
  id,
  label = 'Straße',
  placeholder = 'z. B. Straße suchen',
  required = false,
}: StreetAutocompleteProps) {
  const loadOptions = useCallback(
    (signal: AbortSignal) => loadStreets(location, signal),
    [location]
  );

  return (
    <Autocomplete
      value={value}
      onChange={onChange}
      id={id}
      label={label}
      placeholder={placeholder}
      placeholderWhenDisabled="Zuerst Ort auswählen"
      loadingPlaceholder="Lade Straßen…"
      emptyMessage="Keine passenden Straßen gefunden"
      required={required}
      disabled={!location.trim()}
      loadOptions={loadOptions}
      loadOptionsDeps={[location]}
    />
  );
}
