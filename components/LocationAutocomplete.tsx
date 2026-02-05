'use client';

import { useCallback } from 'react';
import Autocomplete from '@/components/Autocomplete';
import type { AutocompleteOption } from '@/components/Autocomplete';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  /** Called when user selects an option from the dropdown (e.g. to clear dependent street field) */
  onSelect?: (value: string) => void;
  /** Called when the input gains focus (e.g. to request geolocation) */
  onFocus?: () => void;
  id?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

async function loadLocations(signal: AbortSignal): Promise<AutocompleteOption[]> {
  const res = await fetch('/api/locations', { signal });
  const json = await res.json();
  return json.success && Array.isArray(json.data) ? json.data : [];
}

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  onFocus,
  id,
  label = 'Ort',
  placeholder = 'z. B. Ort suchen',
  required = false,
  disabled = false,
}: LocationAutocompleteProps) {
  // Wrap onSelect to only pass the value (location ID is not needed)
  const handleSelect = useCallback(
    (selectedValue: string) => {
      onSelect?.(selectedValue);
    },
    [onSelect]
  );

  return (
    <Autocomplete
      value={value}
      onChange={onChange}
      onSelect={handleSelect}
      onFocus={onFocus}
      id={id}
      label={label}
      placeholder={placeholder}
      loadingPlaceholder="Lade Orte…"
      emptyMessage="Keine passenden Orte gefunden"
      required={required}
      disabled={disabled}
      loadOptions={loadLocations}
      loadOptionsDeps={[]}
    />
  );
}
